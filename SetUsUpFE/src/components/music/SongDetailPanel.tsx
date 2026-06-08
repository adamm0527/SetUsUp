import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Divider, Fade, Paper, Skeleton, Stack,
  TextField, Tooltip, Typography } from '@mui/material';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LabelRoundedIcon from '@mui/icons-material/LabelRounded';
import { useEndpointMutation, useEndpointQuery } from '#root/api/queryHooks';
import { useQueryClient } from '@tanstack/react-query';
import { api_SongCreate, api_SongGet, api_SongTagsPut, api_SongUpdate,
  api_TagsGetAll } from '#root/api/endpoints';
import { type SongDetail, type TagCategoryList } from '#root/lib/types';
import { useAppSnackbar } from '#root/providers';
import useCoverUrls from '#root/components/song/useCoverUrls';
import { invalidateCoverForSong } from '#root/clientdata/stores';
import { SpotifyEmbedPlayer, CoverArt } from '#root/components';
import SpotifyAttribution from '#root/components/spotify/SpotifyAttribution';
import SpotifyLinkSearch, { type SpotifyAutoFillFields } from './SpotifyLinkSearch.tsx';
import RelatedKeysSection from './RelatedKeysSection.tsx';
import SharingSection from './SharingSection.tsx';
import DangerZone from './DangerZone.tsx';
import TaggerModal from './TaggerModal.tsx';


export type SongDetailMode =
  | { kind: 'empty' }
  | { kind: 'create' }
  | { kind: 'edit'; songId: string };


interface SongDetailPanelProps {
  mode: SongDetailMode;
  onStartCreate: () => void;
  onCancelCreate: () => void;
  onCreated: (newSongId?: string) => void;
  onDeleted: () => void;
  /* called when the user clicks a related-key chip (the page TOGGLES the key in the filter) */
  onKeyFilterToggle: (storedKey: string) => void;
  /* keys currently in the filter (so RelatedKeysSection can show "in-filter" emphasis) */
  filterKeys: string[];
}


/* The right pane of the MusicLibraryPage. Routes between three sub-views:
     - empty:  call-to-action (create a new song)
     - create: blank form with inline SpotifyLinkSearch + autofill + Save
     - edit:   loaded SongDetail with editable form, embed player, related keys, tags, sharing, danger zone */
export default function SongDetailPanel({
  mode, onStartCreate, onCancelCreate, onCreated, onDeleted, onKeyFilterToggle, filterKeys,
}: SongDetailPanelProps) {

  if (mode.kind === 'empty')
    return <EmptyState onStartCreate={onStartCreate} />;

  if (mode.kind === 'create')
    return <CreateForm onCreated={onCreated} onCancel={onCancelCreate} />;

  return <EditForm
    key={mode.songId}
    songId={mode.songId}
    onDeleted={onDeleted}
    onKeyFilterToggle={onKeyFilterToggle}
    filterKeys={filterKeys}
    onStartCreate={onStartCreate}
  />;
}


/* --- EMPTY STATE --- */

function EmptyState({ onStartCreate }: { onStartCreate: () => void }) {
  return (
    <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, height: '100%' }}>
      <Stack alignItems="center" spacing={2} sx={{ textAlign: 'center', maxWidth: 380, mx: 'auto', mt: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Pick a song to view its details
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Click a card on the left to open its detail panel, or create a new song.
        </Typography>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={onStartCreate}>
          New song
        </Button>
      </Stack>
    </Paper>
  );
}


/* --- CREATE FORM --- */

interface FormState {
  artist: string;
  title: string;
  duration: string; // "hh:mm:ss"
  bpm: string; // string for input control; parsed on submit
  bpmOut: string;
  initKey: string;
  spotifySongId: string; // empty string = not linked
  coverUrl: string | null; // not submitted; rendered only
}

const emptyFormState: FormState = {
  artist: '', title: '', duration: '', bpm: '', bpmOut: '', initKey: '',
  spotifySongId: '', coverUrl: null,
};


function CreateForm({ onCreated, onCancel }: { onCreated: (id?: string) => void; onCancel: () => void }) {
  const snackbar = useAppSnackbar();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyFormState);

  const create = useEndpointMutation(api_SongCreate);
  const isPending = create.isPending;

  const handleAutoFill = (fields: SpotifyAutoFillFields, mode: 'fill-missing' | 'overwrite-all') => {
    setForm((prev) => {
      const next = { ...prev };
      const apply = (key: keyof FormState, incoming: string | number | null) => {
        if (incoming == null || incoming === '') return;
        const incomingStr = String(incoming);
        if (mode === 'overwrite-all') next[key] = incomingStr as never;
        else if (!prev[key]) next[key] = incomingStr as never;
      };
      apply('artist', fields.artist);
      apply('title', fields.title);
      apply('duration', formatMsToHms(fields.durationMs));
      apply('bpm', fields.bpm ?? '');
      apply('initKey', fields.initKey ?? '');
      // always overwrite Spotify-linked metadata
      next.spotifySongId = fields.spotifySongId;
      next.coverUrl = fields.coverUrl;
      return next;
    });
  };

  const submit = async () => {
    const bpmNum = parseFloat(form.bpm);
    const bpmOutNum = form.bpmOut.trim() === '' ? undefined : parseFloat(form.bpmOut);
    if (!form.artist.trim() || !form.title.trim() || !form.duration.trim() || !Number.isFinite(bpmNum)) {
      snackbar.warning('Please fill artist, title, duration and BPM.');
      return;
    }
    const res = await create.mutateAsync({
      body: {
        artist: form.artist.trim(),
        title: form.title.trim(),
        duration: form.duration.trim(),
        bpm: bpmNum,
        bpmOut: bpmOutNum,
        initKey: form.initKey.trim() || null,
        spotifySongId: form.spotifySongId.trim() || null,
      }
    });
    if (res.success) {
      snackbar.success(res.data?.message ?? 'Song created.');
      await queryClient.invalidateQueries({ queryKey: ['songs'] });
      onCreated();
    } else {
      const msg = res.errorBody && 'message' in res.errorBody
        ? (res.errorBody as { message?: string }).message ?? 'Could not create song.'
        : 'Could not create song.';
      snackbar.error(msg);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" sx={{ fontWeight: 700 }}>New song</Typography>
          <Button onClick={onCancel} size="small" startIcon={<CloseRoundedIcon />} disabled={isPending}>
            Cancel
          </Button>
        </Stack>

        <SpotifyLinkSearch onAutoFill={handleAutoFill} currentLinkedId={form.spotifySongId || null} />

        {/* Preview embed */}
        {form.spotifySongId && (
          <SpotifyEmbedPlayer spotifySongId={form.spotifySongId} height={152} />
        )}

        <Stack direction="row" spacing={2} alignItems="center">
          <CoverArt
            spotifySongId={form.spotifySongId || null}
            coverUrl={form.coverUrl}
            title={form.title || 'New'}
            size={72}
          />
          <Stack sx={{ flex: 1 }} spacing={1.5}>
            <FormFieldRow form={form} setForm={setForm} disabled={isPending} />
          </Stack>
        </Stack>

        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ pt: 1 }}>
          <Button
            variant="contained"
            onClick={submit}
            disabled={isPending}
            startIcon={isPending ? <CircularProgress size={16} color="inherit" /> : <AddRoundedIcon />}
          >
            Create song
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}


/* --- EDIT FORM --- */

function EditForm({
  songId, onDeleted, onKeyFilterToggle, filterKeys, onStartCreate,
}: {
  songId: string;
  onDeleted: () => void;
  onKeyFilterToggle: (storedKey: string) => void;
  filterKeys: string[];
  onStartCreate: () => void;
}) {
  const snackbar = useAppSnackbar();
  const queryClient = useQueryClient();

  const detailQuery = useEndpointQuery(
    ['songs', songId, 'detail'],
    api_SongGet,
    { songId },
    { enabled: !!songId }
  );
  const detail: SongDetail | undefined =
    detailQuery.data && detailQuery.data.success ? detailQuery.data.data : undefined;

  /* form state mirrors `detail` (reset whenever a new song is loaded) */
  const [form, setForm] = useState<FormState>(emptyFormState);
  useEffect(() => {
    if (!detail) return;
    setForm({
      artist: detail.artist,
      title: detail.title,
      duration: detail.duration,
      bpm: String(detail.bpm),
      bpmOut: detail.bpmOut === detail.bpm ? '' : String(detail.bpmOut),
      initKey: detail.initKey ?? '',
      spotifySongId: detail.spotifySongId ?? '',
      coverUrl: null, // could be enriched via spotify/lookup, optional
    });
  }, [detail]);

  const { coverUrlBySongId } = useCoverUrls(
    detail ? [{ id: detail.id, spotifySongId: form.spotifySongId || detail.spotifySongId }] : []
  );
  const resolvedCoverUrl = detail ? coverUrlBySongId[detail.id] : undefined;

  /* the tag hierarchy (cached for the session) */
  const tagsQuery = useEndpointQuery(['tags'], api_TagsGetAll, undefined, { staleTime: Infinity });
  const tagHierarchy: TagCategoryList | null =
    tagsQuery.data && tagsQuery.data.success ? tagsQuery.data.data : null;

  /* save (PATCH) */
  const updateMutation = useEndpointMutation(api_SongUpdate);
  const tagsMutation = useEndpointMutation(api_SongTagsPut);
  const [tagsOpen, setTagsOpen] = useState(false);

  const dirty = useMemo(() => {
    if (!detail) return false;
    return (
      form.artist !== detail.artist ||
      form.title !== detail.title ||
      form.duration !== detail.duration ||
      form.bpm !== String(detail.bpm) ||
      (form.bpmOut === '' ? detail.bpm !== detail.bpmOut : parseFloat(form.bpmOut) !== detail.bpmOut) ||
      form.initKey !== (detail.initKey ?? '') ||
      form.spotifySongId !== (detail.spotifySongId ?? '')
    );
  }, [form, detail]);

  const canEdit = !!detail && detail.canEditUI;

  const submitUpdate = async () => {
    if (!detail) return;
    const body: Record<string, unknown> = {};
    if (form.artist !== detail.artist) body.artist = form.artist;
    if (form.title !== detail.title) body.title = form.title;
    if (form.duration !== detail.duration) body.duration = form.duration;
    if (form.bpm !== String(detail.bpm)) body.bpm = parseFloat(form.bpm);
    if (form.bpmOut !== (detail.bpmOut === detail.bpm ? '' : String(detail.bpmOut)))
      body.bpmOut = form.bpmOut === '' ? parseFloat(form.bpm) : parseFloat(form.bpmOut);
    if (form.initKey !== (detail.initKey ?? '')) body.initKey = form.initKey;
    if (form.spotifySongId !== (detail.spotifySongId ?? '')) body.spotifySongId = form.spotifySongId;

    const res = await updateMutation.mutateAsync({ params: { songId }, body });
    if (res.success) {
      snackbar.success('Song updated.');
      await queryClient.invalidateQueries({ queryKey: ['songs'] });
      await queryClient.invalidateQueries({ queryKey: ['songs', songId, 'detail'] });
      /* If the user changed the Spotify link, the BE cache columns are cleared on its side too. */
      if (form.spotifySongId !== (detail.spotifySongId ?? '')) {
        await queryClient.invalidateQueries({ queryKey: ['spotify-cover', songId], exact: true });
      }      
    } else {
      const msg = res.errorBody && 'message' in res.errorBody
        ? (res.errorBody as { message?: string }).message ?? 'Could not update song.'
        : 'Could not update song.';
      snackbar.error(msg);
    }
  };

  const saveTags = async (tagIds: string[]) => {
    const res = await tagsMutation.mutateAsync({ params: { songId }, body: { tagIds } });
    if (res.success) {
      snackbar.success('Tags saved.');
      setTagsOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['songs'] });
      await queryClient.invalidateQueries({ queryKey: ['songs', songId, 'detail'] });
    } else {
      const msg = res.errorBody && 'message' in res.errorBody
        ? (res.errorBody as { message?: string }).message ?? 'Could not save tags.'
        : 'Could not save tags.';
      snackbar.error(msg);
    }
  };

  const handleAutoFill = (fields: SpotifyAutoFillFields, mode: 'fill-missing' | 'overwrite-all') => {
    setForm((prev) => {
      const next = { ...prev };
      const apply = (key: keyof FormState, incoming: string | number | null) => {
        if (incoming == null || incoming === '') return;
        const incomingStr = String(incoming);
        if (mode === 'overwrite-all') next[key] = incomingStr as never;
        else if (!prev[key]) next[key] = incomingStr as never;
      };
      apply('artist', fields.artist);
      apply('title', fields.title);
      apply('duration', formatMsToHms(fields.durationMs));
      apply('bpm', fields.bpm ?? '');
      apply('initKey', fields.initKey ?? '');
      next.spotifySongId = fields.spotifySongId;
      next.coverUrl = fields.coverUrl;
      return next;
    });
  };

  if (detailQuery.isLoading) {
    return (
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Stack spacing={2}>
          <Skeleton variant="text" width="50%" height={36} />
          <Skeleton variant="rounded" height={180} />
          <Skeleton variant="rounded" height={120} />
        </Stack>
      </Paper>
    );
  }
  if (!detail) {
    return (
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Alert severity="error">Could not load song details.</Alert>
      </Paper>
    );
  }

  /* Prefer the pending form state for the embed so users see their Spotify pick immediately
    (the "Not linked yet" placeholder otherwise stays until Save is pressed).
    Falls back to the persisted detail value when no pending change is in the form. Empty string -> placeholder. */
  const embedSongId = form.spotifySongId || detail.spotifySongId;
  const isSpotifyLinked = !!(form.spotifySongId || detail.spotifySongId);
  const headerCoverUrl = form.coverUrl ?? resolvedCoverUrl ?? null;

  return (
    <Fade in key={songId}>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Stack spacing={2.5}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <CoverArt
              songId={detail.id}
              spotifySongId={form.spotifySongId || detail.spotifySongId}
              coverUrl={headerCoverUrl}
              title={detail.title}
              size={72}
              onImageLoadError={(sid) => invalidateCoverForSong(sid, queryClient)}
            />
            <Stack sx={{ flex: 1, minWidth: 0 }}>
              {isSpotifyLinked && (
                <Box sx={{ mb: 0.5 }}>
                  <SpotifyAttribution variant="inline" />
                </Box>
              )}              
              <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>{detail.title}</Typography>
              <Typography variant="body2" color="text.secondary" noWrap>{detail.artist}</Typography>
            </Stack>
            <Tooltip arrow disableInteractive title="Create a new song">
              <Button variant="outlined" size="small" onClick={onStartCreate}
                startIcon={<AddRoundedIcon />} sx={{ textTransform: 'none', borderRadius: 999, flexShrink: 0, alignSelf: 'flex-start' }}
              >
                New song
              </Button>
            </Tooltip>            
          </Stack>

          <SpotifyEmbedPlayer spotifySongId={embedSongId} height={152} />

          {canEdit && (
            <SpotifyLinkSearch onAutoFill={handleAutoFill} currentLinkedId={form.spotifySongId || null} />
          )}

          <Divider />

          <FormFieldRow form={form} setForm={setForm} disabled={!canEdit || updateMutation.isPending} />

          {canEdit && (
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="contained"
                onClick={submitUpdate}
                disabled={!dirty || updateMutation.isPending}
                startIcon={updateMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
              >
                Save changes
              </Button>
            </Stack>
          )}

          <Divider />

          {/* tags */}
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Tags ({detail.tagIds.length})
              </Typography>
              {canEdit && (
                <Tooltip title="Open the full tagging modal" arrow disableInteractive>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setTagsOpen(true)}
                    startIcon={<LabelRoundedIcon />}
                  >
                    Edit tags
                  </Button>
                </Tooltip>
              )}
            </Stack>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              {detail.tagIds.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No tags yet.
                </Typography>
              )}
              {detail.tagIds.map((id) => (
                <Box
                  key={id}
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    px: 0.75, py: 0.25,
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'divider',
                    backgroundColor: 'background.default',
                  }}
                >
                  {id}
                </Box>
              ))}
            </Stack>
          </Box>

          <Divider />

          <RelatedKeysSection
            songId={songId}
            filterKeys={filterKeys}
            onKeyClick={onKeyFilterToggle}
          />

          <Divider />

          <SharingSection songId={songId} canEdit={canEdit} />

          {canEdit && (
            <>
              <Divider />
              <DangerZone
                songId={songId}
                songLabel={`${detail.artist} - ${detail.title}`}
                onDeleted={onDeleted}
              />
            </>
          )}
        </Stack>

        {/* Tagger modal -- mounted lazily by `open` boolean */}
        {tagHierarchy && (
          <TaggerModal
            open={tagsOpen}
            onClose={() => setTagsOpen(false)}
            initialTagIds={detail.tagIds}
            tagHierarchy={tagHierarchy}
            onSave={saveTags}
            saving={tagsMutation.isPending}
          />
        )}
      </Paper>
    </Fade>
  );
}


/* --- FormFieldRow (shared by Create + Edit) --- */

function FormFieldRow({
  form, setForm, disabled,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  disabled: boolean;
}) {
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1}>
        <TextField label="Artist" size="small" fullWidth value={form.artist} disabled={disabled}
          onChange={(e) => set('artist', e.target.value)} />
        <TextField label="Title" size="small" fullWidth value={form.title} disabled={disabled}
          onChange={(e) => set('title', e.target.value)} />
      </Stack>
      <Stack direction="row" spacing={1}>
        <TextField label="Duration (hh:mm:ss)" size="small" sx={{ width: 160 }}
          value={form.duration} disabled={disabled}
          onChange={(e) => set('duration', e.target.value)} />
        <TextField label="BPM" size="small" sx={{ width: 100 }} type="number"
          inputProps={{ step: 0.1, min: 0, max: 300 }}
          value={form.bpm} disabled={disabled}
          onChange={(e) => set('bpm', e.target.value)} />
        <TextField label="BPM out" size="small" sx={{ width: 100 }} type="number"
          inputProps={{ step: 0.1, min: 0, max: 300 }}
          placeholder="(same)"
          value={form.bpmOut} disabled={disabled}
          onChange={(e) => set('bpmOut', e.target.value)} />
        <TextField label="Key" size="small" sx={{ width: 100 }}
          placeholder="e.g. 05A"
          value={form.initKey} disabled={disabled}
          onChange={(e) => set('initKey', e.target.value)} />
      </Stack>
    </Stack>
  );
}


function formatMsToHms(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}
