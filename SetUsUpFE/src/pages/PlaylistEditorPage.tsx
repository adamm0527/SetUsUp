import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Container, Paper, Skeleton, Stack, Typography } from '@mui/material';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import QueueMusicRoundedIcon from '@mui/icons-material/QueueMusicRounded';
import LibraryMusicRoundedIcon from '@mui/icons-material/LibraryMusicRounded';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent, } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { useEndpointMutation, useEndpointQuery } from '#root/api/queryHooks';
import { api_PlaylistGet, api_PlaylistEntriesGetAll, api_PlaylistEntriesBulkReorder,
  api_TagsGetAll, api_UserProfileGet } from '#root/api/endpoints';
import { useUserSelectionStore } from '#root/clientdata/stores';
import { useAppSnackbar } from '#root/providers';
import { useQueryClient } from '@tanstack/react-query';
import type { PlaylistEntryInfo, TagCategoryList } from '#root/lib/types';
import PlaylistEntryCluster, { type ClusterModel } from '#root/components/playlist/PlaylistEntryCluster';
import PlaylistDetailsModal from '#root/components/playlist/PlaylistDetailsModal';
import CreatePlaylistModal from '#root/components/playlist/CreatePlaylistModal';
import useCoverUrls from '#root/components/song/useCoverUrls';


/*  PlaylistEditor page
    Single-column, cluster-grouped list of entries in the user's currently selected playlist.

    DnD is nested:
     - Outer DndContext (this page) reorders WHOLE CLUSTERS. Dragging a master carries its followers along.
     - Each cluster mounts an INNER DndContext over its followers so the user can reorder
       followers within their cluster only. A follower can never leave its cluster.
 
    Both drag paths compute the new FLAT entry ordering and dispatch a single bulk-reorder BE call.
    Optimistic: the local order updates immediately; a BE error reverts and snackbars. */
export default function PlaylistEditorPage() {
  const { selPlaylist } = useUserSelectionStore();
  const playlistId = selPlaylist?.id ?? null;
  const snackbar = useAppSnackbar();
  const queryClient = useQueryClient();

  const playlistQuery = useEndpointQuery(
    ['playlist', playlistId ?? '_none_'],
    api_PlaylistGet,
    { playlistId: playlistId ?? '' },
    { enabled: !!playlistId }
  );
  const playlist = playlistQuery.data?.success ? playlistQuery.data.data : null;

  const entriesQuery = useEndpointQuery(
    ['playlistEntries', playlistId ?? '_none_'],
    api_PlaylistEntriesGetAll,
    undefined,
    { enabled: !!playlistId }
  );

  /* BE returns 204 -> data:null when the playlist is empty; coalesce to [] for downstream safety */
  const entries: PlaylistEntryInfo[] = useMemo(
    () => (entriesQuery.data?.success ? (entriesQuery.data.data ?? []) : []),
    [entriesQuery.data]
  );

  /* tag hierarchy -- cached for the session and forwarded to every PlaylistEntryRow so each
     row's SongCard can render its tag chip strip. */
  const tagsQuery = useEndpointQuery(['tags'], api_TagsGetAll, undefined, { staleTime: Infinity });
  const tagHierarchy: TagCategoryList | null =
    tagsQuery.data && tagsQuery.data.success ? (tagsQuery.data.data ?? null) : null;

  /* for tag chip strip on the SongCard */
  const profileQuery = useEndpointQuery(['user', 'profile'], api_UserProfileGet);
  const profile = profileQuery.data?.success ? profileQuery.data.data : null;
  const displayedTagGroupIds = profile?.displayedTagGroupIds?.length
    ? profile.displayedTagGroupIds
    : undefined;

  /* Local-only flat entry ordering for optimistic reorders. Synced from server data on every load. */
  const [localOrder, setLocalOrder] = useState<string[]>([]);
  useEffect(() => {
    setLocalOrder(entries.map((e) => e.id));
  }, [entries]);

  const entriesById = useMemo(() => {
    const m = new Map<string, PlaylistEntryInfo>();
    for (const e of entries) m.set(e.id, e);
    return m;
  }, [entries]);

  const orderedEntries: PlaylistEntryInfo[] = useMemo(() => {
    const out: PlaylistEntryInfo[] = [];
    for (const id of localOrder) {
      const e = entriesById.get(id);
      if (e) out.push(e);
    }
    return out;
  }, [localOrder, entriesById]);

  const songsForCover = useMemo(
    () => orderedEntries.map((e) => ({ id: e.song.id, spotifySongId: e.song.spotifySongId })),
    [orderedEntries]
  );
  const { coverUrlBySongId } = useCoverUrls(songsForCover);


  /* Group consecutive entries into clusters. A cluster starts at every master (withPrev=false)
     and absorbs any subsequent withPrev followers. Defensive: if the very first entry is
     withPrev=true (invariant violation from the BE), we promote it to master so the FE doesn't
     break -- the next master-level edit will correct the BE state. */
  const clusters: ClusterModel[] = useMemo(() => {
    const out: ClusterModel[] = [];
    for (const entry of orderedEntries) {
      if (!entry.withPrev || out.length === 0) {
        out.push({ master: entry, followers: [] });
      } else {
        out[out.length - 1].followers.push(entry);
      }
    }
    return out;
  }, [orderedEntries]);

  /* expand state: at most one row open at a time (across master + follower rows in the entire
     playlist). Clicking the open row's chevron collapses it. */
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  /* details + create modals */
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  /* dnd-kit sensors for the OUTER (cluster-level) sortable. The inner follower contexts have
     their own sensors set up inside PlaylistEntryCluster. */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const bulkReorderMutation = useEndpointMutation(api_PlaylistEntriesBulkReorder);

  /* Helper: dispatch a new flat order to the BE + revert on failure */
  const dispatchNewOrder = async (newFlatOrder: string[], previousOrder: string[]) => {
    setLocalOrder(newFlatOrder);
    const res = await bulkReorderMutation.mutateAsync({
      body: { orderedEntryIds: newFlatOrder },
    });
    if (res.success) {
      /* Invalidate so the BE's recomputed Nr + TransitionToNext arrive on the next render. */
      await queryClient.invalidateQueries({ queryKey: ['playlistEntries'], exact: false });
    } else {
      const msg = res.errorBody && 'message' in res.errorBody
        ? (res.errorBody as { message?: string }).message ?? 'Could not reorder. Reverted.'
        : 'Could not reorder. Reverted.';
      snackbar.error(msg);
      setLocalOrder(previousOrder); // revert
    }
  };

  /* Cluster-level (outer) drag end -- moves a whole cluster */
  const handleClusterDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const clusterIds = clusters.map((c) => c.master.id);
    const oldIndex = clusterIds.indexOf(active.id as string);
    const newIndex = clusterIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    /* Reorder the cluster list, then flatten to a new entry-id sequence (master, ...followers,
       master, ...followers, ...). */
    const newClusterOrder = arrayMove(clusters, oldIndex, newIndex);
    const newFlatOrder: string[] = [];
    for (const c of newClusterOrder) {
      newFlatOrder.push(c.master.id);
      for (const f of c.followers) newFlatOrder.push(f.id);
    }

    void dispatchNewOrder(newFlatOrder, localOrder);
  };

  /* Follower-level (inner, per-cluster) drag end -- called by PlaylistEntryCluster */
  const handleFollowerReorder = (masterId: string, newFollowerOrder: string[]) => {
    /* Rebuild the flat order: keep each cluster's master in place, but for the targeted
       cluster, swap in the new follower order. */
    const newFlatOrder: string[] = [];
    for (const c of clusters) {
      newFlatOrder.push(c.master.id);
      if (c.master.id === masterId) {
        for (const fid of newFollowerOrder) newFlatOrder.push(fid);
      } else {
        for (const f of c.followers) newFlatOrder.push(f.id);
      }
    }

    void dispatchNewOrder(newFlatOrder, localOrder);
  };

  /* --- render --- */

  if (!playlistId)
    return (
      <>
        <NoPlaylistSelectedState onCreate={() => setCreateOpen(true)} />
        <CreatePlaylistModal open={createOpen} onClose={() => setCreateOpen(false)} />
      </>
    );

  if (playlistQuery.isLoading || entriesQuery.isLoading)
    return <LoadingState />;

  if (!playlist)
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Could not load the selected playlist.</Alert>
      </Container>
    );

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      {/* header */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
              {playlist.name}
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <QueueMusicRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  <b>{playlist.entryCount}</b> {playlist.entryCount === 1 ? 'entry' : 'entries'}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">·</Typography>
              <Typography variant="body2" color="text.secondary">
                Total: <b>{playlist.duration}</b>
              </Typography>
            </Stack>
          </Stack>

          <Button
            variant="outlined"
            size="small"
            onClick={() => setDetailsOpen(true)}
            startIcon={<TuneRoundedIcon />}
            sx={{ textTransform: 'none', borderRadius: 999, flexShrink: 0 }}
          >
            Details
          </Button>
        </Stack>
      </Paper>

      {/* cluster list */}
      {clusters.length === 0 ? (
        <EmptyPlaylistState />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleClusterDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        >
          <SortableContext
            items={clusters.map((c) => c.master.id)}
            strategy={verticalListSortingStrategy}
          >
            <Box>
              {(() => {
                /* Render-time bookkeeping: master-only Nr counter + flat-index offset per cluster. */
                let flatIndexCursor = 0;
                return clusters.map((cluster, clusterIx) => {
                  const masterVisibleNr = clusterIx + 1; // 1-based master count
                  const clusterStartFlatIndex = flatIndexCursor;
                  flatIndexCursor += 1 + cluster.followers.length;
                  return (
                    <PlaylistEntryCluster
                      key={cluster.master.id}
                      cluster={cluster}
                      masterVisibleNr={masterVisibleNr}
                      clusterStartFlatIndex={clusterStartFlatIndex}
                      totalFlatEntries={orderedEntries.length}
                      expandedId={expandedId}
                      onExpandToggle={toggleExpand}
                      onEntryDeleted={() => setExpandedId(null)}
                      coverUrlBySongId={coverUrlBySongId}
                      tagHierarchy={tagHierarchy}
                      displayedTagGroupIds={displayedTagGroupIds}
                      onFollowerReorder={handleFollowerReorder}
                    />
                  );
                });
              })()}
            </Box>
          </SortableContext>
        </DndContext>
      )}

      <PlaylistDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        playlist={playlist}
      />
    </Container>
  );
}


/* --- Empty / loading sub-views --- */

function NoPlaylistSelectedState({ onCreate }: { onCreate: () => void }) {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper variant="outlined" sx={{ p: 5, borderRadius: 2, textAlign: 'center' }}>
        <QueueMusicRoundedIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
          No playlist selected
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
          Pick a playlist from the NavBar or create a new one for the current group.
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={onCreate}
          sx={{ textTransform: 'none', borderRadius: 999 }}
        >
          Create playlist
        </Button>
      </Paper>
    </Container>
  );
}

function EmptyPlaylistState() {
  return (
    <Paper variant="outlined" sx={{ p: 5, borderRadius: 2, textAlign: 'center' }}>
      <LibraryMusicRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
      <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 700 }}>
        This playlist is empty
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Add songs from the Music Library: select rows and use the floating "Add to" bar.
      </Typography>
    </Paper>
  );
}

function LoadingState() {
  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={72} />
        <Skeleton variant="rounded" height={96} />
        <Skeleton variant="rounded" height={96} />
        <Skeleton variant="rounded" height={96} />
      </Stack>
    </Container>
  );
}
