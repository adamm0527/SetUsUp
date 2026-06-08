import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Container, Stack } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useEndpointQuery } from '#root/api/queryHooks';
import { api_SongsGetAll, api_TagsGetAll, api_UserProfileGet } from '#root/api/endpoints';
import { useMusicFilterStore, useUserSelectionStore,
  type MusicFilterState, type SortChain } from '#root/clientdata/stores';
import { type SongDetail, type TagCategoryList } from '#root/lib/types';
import { useAppSnackbar } from '#root/providers';
import FilterBar from '#root/components/music/FilterBar';
import BulkAddBar from '#root/components/music/BulkAddBar';
import VirtualizedSongList from '#root/components/music/VirtualizedSongList';
import SongDetailPanel, { type SongDetailMode } from '#root/components/music/SongDetailPanel';
import { useMusicFilterUrlSync } from '#root/components/music/useMusicFilterUrlSync';
import useCoverUrls from '#root/components/song/useCoverUrls';

/* Music Library page.
   Split layout: FilterBar (sticky) + [VirtualizedSongList (left)] [SongDetailPanel (right)].
   Floating BulkAddBar appears when >=1 songs are multi-selected via checkbox.
 
  Filter state lives in two places that stay in sync:
    1. URL search params (shareable, refresh-safe)
    2. useMusicFilterStore (per-group Zustand slot; survives page navigation within session) */
export default function MusicLibraryPage() {
  const { selGroup } = useUserSelectionStore();
  const groupId = selGroup?.id ?? null;
  const snackbar = useAppSnackbar();
  const queryClient = useQueryClient();

  /* fetch the song list for the currently selected group */
  const songsQuery = useEndpointQuery(
    ['songs', groupId ?? '_none_'],
    api_SongsGetAll,
    undefined,
    { enabled: !!groupId }
  );
  const allSongs: SongDetail[] = useMemo(
    () => (songsQuery.data?.success ? (songsQuery.data.data ?? []) : []),
    [songsQuery.data]
  );
  const { coverUrlBySongId } = useCoverUrls(allSongs);

  /* tag hierarchy -- cached for the session */
  const tagsQuery = useEndpointQuery(['tags'], api_TagsGetAll, undefined, { staleTime: Infinity });
  const tagHierarchy: TagCategoryList | null =
    tagsQuery.data && tagsQuery.data.success ? (tagsQuery.data.data ?? null) : null;

  const profileQuery = useEndpointQuery(['user', 'profile'], api_UserProfileGet);
  const profile = profileQuery.data?.success ? profileQuery.data.data : null;
  const displayedTagGroupIds = profile?.displayedTagGroupIds?.length
    ? profile.displayedTagGroupIds
    : undefined;

  /* filter state from Zustand + url sync */
  const filterState = useMusicFilterStore((s) => s.getFilter(groupId));
  const { writeFilter } = useMusicFilterUrlSync(groupId);

  /* detail-pane mode */
  const [mode, setMode] = useState<SongDetailMode>({ kind: 'empty' });

  /* multi-select state for bulk-add */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const lastKnownOpenSongIdRef = useRef<string | null>(null);
  const lastKnownGroupIdRef = useRef<string | null>(null);

  const prevGroupIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevGroupIdRef.current === groupId) return;
    prevGroupIdRef.current = groupId;

    /* Clean local UI state. */
    setMode({ kind: 'empty' });
    setSelectedIds(new Set());
    lastKnownOpenSongIdRef.current = null;
    lastKnownGroupIdRef.current = null;

    /* Force-refetch the songs list for the new group; if the previous group had a revoke in
       flight, this avoids briefly serving a now-stale cached list. */
    if (groupId) {
      void queryClient.invalidateQueries({ queryKey: ['songs', groupId], exact: false });
    }
  }, [groupId, queryClient]);

  /* Real-time safeguard: if the open song vanishes from the refreshed list (deletion by
     another user / sharing-revoked / similar), drop the detail pane to empty and show a brief
     toast so the user understands why the panel closed.*/

  useEffect(() => {
    if (mode.kind !== 'edit') {
      lastKnownOpenSongIdRef.current = null;
      lastKnownGroupIdRef.current = null;
      return;
    }
    if (songsQuery.isLoading) return; // wait for first load
    if (!songsQuery.data?.success) return; // error state: keep current mode, let the detail panel show its own error
    if (!groupId) return; // no group selected -- nothing to compare against

    const stillPresent = allSongs.some((s) => s.id === mode.songId);
    if (!stillPresent) {
      const seenInThisGroup =
        lastKnownOpenSongIdRef.current === mode.songId &&
        lastKnownGroupIdRef.current === groupId;
      lastKnownOpenSongIdRef.current = null;
      lastKnownGroupIdRef.current = null;
      setMode({ kind: 'empty' });
      if (seenInThisGroup) {
        snackbar.info('The song you were viewing is no longer available in this group.');
      }
    } else {
      lastKnownOpenSongIdRef.current = mode.songId;
      lastKnownGroupIdRef.current = groupId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSongs, songsQuery.isLoading, songsQuery.data, mode, groupId]);

  /* Stable across renders so SongRow / SongCard memo barriers can actually skip work
     during scroll-induced parent re-renders. */
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  /* Real-time safeguard: prune the multi-select set when songs disappear (other-user delete) */
  useEffect(() => {
    if (selectedIds.size === 0) return;
    const valid = new Set(allSongs.map((s) => s.id));
    let pruned = false;
    const next = new Set<string>();
    for (const id of selectedIds) {
      if (valid.has(id)) next.add(id);
      else pruned = true;
    }
    if (pruned) setSelectedIds(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSongs]);

  /* apply the filter + sort to the song list */
  const visibleSongs = useMemo(
    () => applyFilterAndSort(allSongs, filterState),
    [allSongs, filterState]
  );

  const selectedSongObjs = useMemo(
    () => visibleSongs.filter((s) => selectedIds.has(s.id)),
    [visibleSongs, selectedIds]
  );

  const toggleSelectAllVisible = useCallback(() => {
    setSelectedIds((prev) => {
      const anyVisibleSelected = visibleSongs.some((s) => prev.has(s.id));
      const next = new Set(prev);
      if (anyVisibleSelected) {
        for (const s of visibleSongs) next.delete(s.id);
      } else {
        for (const s of visibleSongs) next.add(s.id);
      }
      return next;
    });
  }, [visibleSongs]);  


  /* detail-pane handlers */
  const openDetail = useCallback((id: string) => setMode({ kind: 'edit', songId: id }), []);
  const onCancelCreate = useCallback(() => setMode({ kind: 'empty' }), []);
  const onCreated = useCallback(() => setMode({ kind: 'empty' }), []);
  const onDeleted = useCallback(() => setMode({ kind: 'empty' }), []);
  const onStartCreate = useCallback(() => setMode({ kind: 'create' }), []);

  /* clicking a related-key chip in the detail pane TOGGLES that key in the filter:
       - if it's already in the filter, remove it
       - if not, add it
     This mirrors the FilterBar's KeyFilter chip behaviour, so the two surfaces stay consistent. */
  const onKeyFilterToggle = (storedKey: string) => {
    if (!groupId) return;
    const has = filterState.keys.includes(storedKey);
    const nextKeys = has
      ? filterState.keys.filter((k) => k !== storedKey)
      : [...filterState.keys, storedKey];
    writeFilter(groupId, { ...filterState, keys: nextKeys });
  };

  /* user changed any filter -> persist via the url-sync helper */
  const onFilterChange = (next: MusicFilterState) => {
    if (!groupId) return;
    writeFilter(groupId, next);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <Stack spacing={1.5} sx={{ height: '100%', minHeight: 0 }}>
        <FilterBar
          state={filterState}
          onChange={onFilterChange}
          tagHierarchy={tagHierarchy}
          shown={visibleSongs.length}
          total={allSongs.length}
          selectedCount={selectedSongObjs.length}
          onToggleSelectAll={toggleSelectAllVisible}          
        />

        <Stack direction="row" spacing={2} sx={{ flex: 1, minHeight: 0 }}>
          <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <VirtualizedSongList
              songs={visibleSongs}
              selectedSongIds={selectedIds}
              onToggleSelect={toggleSelect}
              onOpenDetail={openDetail}
              selectedDetailId={mode.kind === 'edit' ? mode.songId : null}
              coverUrlBySongId={coverUrlBySongId}
              tagHierarchy={tagHierarchy}
              displayedTagGroupIds={displayedTagGroupIds}
            />
          </Box>
          <Box sx={{ width: '50%', minHeight: 0, overflowY: 'auto', pr: 0.5 }}>
            <SongDetailPanel
              mode={mode}
              onStartCreate={onStartCreate}
              onCancelCreate={onCancelCreate}
              onCreated={onCreated}
              onDeleted={onDeleted}
              onKeyFilterToggle={onKeyFilterToggle}
              filterKeys={filterState.keys}
            />
          </Box>
        </Stack>
      </Stack>

      <BulkAddBar
        selectedSongs={selectedSongObjs}
        onClearSelection={clearSelection}
      />
    </Container>
  );
}

/* Client-side filter + sort -- everything except the BE list-fetch happens here. */

function applyFilterAndSort(songs: SongDetail[] | null | undefined, f: MusicFilterState): SongDetail[] {
  if (!songs || songs.length === 0) return [];

  const keyFilter = new Set<string>(f.keys);

  const textTokens = f.text.trim().toLowerCase().split(/\s+/).filter(Boolean);

  const filtered = songs.filter((s) => {
    if (f.bpmMin != null && s.bpm < f.bpmMin) return false;
    if (f.bpmMax != null && s.bpm > f.bpmMax) return false;

    if (keyFilter.size > 0) {
      if (!s.initKey) return false;
      if (!keyFilter.has(s.initKey)) return false;
    }

    if (f.spotifyOnly && !s.spotifySongId) return false;

    if (textTokens.length > 0) {
      const haystack = `${s.artist} ${s.title}`.toLowerCase();
      for (const tok of textTokens)
        if (!haystack.includes(tok)) return false;
    }

    if (f.tagIds.length > 0) {
      const songTags = new Set(s.tagIds);
      if (f.tagMode === 'all') {
        for (const t of f.tagIds) if (!songTags.has(t)) return false;
      } else {
        let anyMatch = false;
        for (const t of f.tagIds) if (songTags.has(t)) { anyMatch = true; break; }
        if (!anyMatch) return false;
      }
    }

    return true;
  });

  return sortSongs(filtered, f.sort);
}

function sortSongs(songs: SongDetail[], sort: SortChain): SongDetail[] {
  if (sort.length === 0) return songs;

  return [...songs].sort((a, b) => {
    for (const step of sort) {
      let cmp = 0;
      switch (step.field) {
        case 'artist': cmp = a.artist.localeCompare(b.artist, undefined, { sensitivity: 'base' }); break;
        case 'title':  cmp = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }); break;
        case 'bpm':    cmp = a.bpm - b.bpm; break;
         case 'key': {
          /* Camelot keys are stored as 3-char "DDL" strings (e.g. "05A", "11B"), so a simple
             string compare gives the natural Camelot wheel order: 01A < 01B < 02A < 02B < ...
             Null keys (songs whose initKey is unset) go to the END regardless of direction. We
             short-circuit with `return` rather than setting `cmp`, so the asc/desc flip below
             cannot move nulls back to the front when sorting descending. */
          const ak = a.initKey;
          const bk = b.initKey;
          if (ak == null && bk == null)  cmp = 0; // tie; fall through to next sort step
          else if (ak == null)           return 1;
          else if (bk == null)           return -1;
          else                           cmp = ak.localeCompare(bk);
          break;
        }       
      }
      if (cmp !== 0) return step.dir === 'desc' ? -cmp : cmp;
    }
    return 0;
  });
}
