import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Divider, FormControlLabel, Skeleton, Slider,
  Stack, Switch, TextField, Tooltip, Typography } from '@mui/material';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { useEndpointMutation, useEndpointQuery } from '#root/api/queryHooks';
import { api_PlaylistEntryGet, api_PlaylistEntryUpdate, api_PlaylistEntryDelete,
  api_PlaylistEntryRatingSet, api_PlaylistEntryRatingDelete } from '#root/api/endpoints';
import { useAppSnackbar } from '#root/providers';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmDestructiveDialog, SpotifyEmbedPlayer } from '#root/components';
import ColourSwatchPicker from './ColourSwatchPicker.tsx';
import { InteractiveRatingStars, DisplayRatingStars } from './RatingStars.tsx';


interface PlaylistEntryDetailsProps {
  entryId: string; // 1-based position ordinal, gating the WithPrev toggle for first entry
  visibleNr: number;
  onDeleted: () => void; // callback for once the entry has been deleted
}


/* The expanded edit pane for one PlaylistEntry. Lazy-fetches the per-entry detail on mount. */
export default function PlaylistEntryDetails({
  entryId, visibleNr, onDeleted,
}: PlaylistEntryDetailsProps) {
  const snackbar = useAppSnackbar();
  const queryClient = useQueryClient();

  const detailQuery = useEndpointQuery(
    ['playlistEntries', entryId, 'detail'],
    api_PlaylistEntryGet,
    { entryId },
    { enabled: !!entryId }
  );
  const detail = detailQuery.data?.success ? detailQuery.data.data : null;

  const updateMutation = useEndpointMutation(api_PlaylistEntryUpdate);
  const deleteMutation = useEndpointMutation(api_PlaylistEntryDelete);
  const ratingSetMutation = useEndpointMutation(api_PlaylistEntryRatingSet);
  const ratingDeleteMutation = useEndpointMutation(api_PlaylistEntryRatingDelete);

  /* Local form state for the editable fields */
  const [startSec, setStartSec] = useState(0);
  const [endSec, setEndSec] = useState(0);
  const [withPrev, setWithPrev] = useState(false);
  const [bpmChange, setBpmChange] = useState(0);
  const [hexColour, setHexColour] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  /* Confirm-delete modal open state. */
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (!detail) return;
    setStartSec(hmsToSec(detail.start));
    setEndSec(hmsToSec(detail.end));
    setWithPrev(detail.withPrev);
    setBpmChange(detail.bpmChange);
    setHexColour(detail.hexColour);
    setComment(detail.comment ?? '');
  }, [detail]);

  if (detailQuery.isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="rounded" height={56} />
          <Skeleton variant="rounded" height={56} />
          <Skeleton variant="rounded" height={80} />
        </Stack>
      </Box>
    );
  }

  if (!detail) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Could not load entry details.</Alert>
      </Box>
    );
  }

  const canEdit = detail.canEditUI;
  const canDelete = detail.canDeleteUI;
  const songDurationSec = hmsToSec(detail.song.duration);
  const songBpm = detail.song.bpm;

  /* dirty: did any editable field diverge from the persisted detail? */
  const dirty =
    startSec !== hmsToSec(detail.start) ||
    endSec !== hmsToSec(detail.end) ||
    withPrev !== detail.withPrev ||
    bpmChange !== detail.bpmChange ||
    (hexColour ?? null) !== (detail.hexColour ?? null) ||
    (comment.trim() || null) !== (detail.comment ?? null);

  const withPrevDisabled = visibleNr === 1 || !canEdit;

  /* --- Saving --- */

  const handleSave = async () => {
    /* Sending only fields that actually changed */
    const body: Record<string, unknown> = {};
    if (startSec !== hmsToSec(detail.start)) body.startTime = secToHms(startSec);
    if (endSec !== hmsToSec(detail.end))     body.endTime   = secToHms(endSec);
    if (withPrev !== detail.withPrev)        body.withPrev  = withPrev;
    if (bpmChange !== detail.bpmChange)      body.bpmChange = bpmChange;
    if ((hexColour ?? null) !== (detail.hexColour ?? null)) body.hexColour = hexColour ?? '';
    if ((comment.trim() || null) !== (detail.comment ?? null)) body.comment = comment.trim();

    const res = await updateMutation.mutateAsync({ params: { entryId }, body });
    if (res.success) {
      snackbar.success('Entry updated.');
      await queryClient.invalidateQueries({ queryKey: ['playlistEntries'], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['playlistEntries', entryId, 'detail'], exact: true });
    } else {
      const msg = res.errorBody && 'message' in res.errorBody
        ? (res.errorBody as { message?: string }).message ?? 'Could not update entry.'
        : 'Could not update entry.';
      snackbar.error(msg);
    }
  };

  /* --- Deletion --- */

  const handleConfirmDelete = async () => {
    const res = await deleteMutation.mutateAsync({ params: { entryId } });
    if (res.success) {
      snackbar.success('Entry removed.');
      setConfirmDeleteOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['playlistEntries'], exact: false });
      onDeleted();
    } else {
      const msg = res.errorBody && 'message' in res.errorBody
        ? (res.errorBody as { message?: string }).message ?? 'Could not remove entry.'
        : 'Could not remove entry.';
      snackbar.error(msg);
    }
  };

  /* --- Rating --- */

  const handleApplyMyRating = async (newRating: number) => {
    const res = await ratingSetMutation.mutateAsync({
      params: { entryId },
      body: { rating: newRating },
    });
    if (res.success) {
      snackbar.success('Rating saved.');
      await queryClient.invalidateQueries({ queryKey: ['playlistEntries', entryId, 'detail'], exact: true });
      await queryClient.invalidateQueries({ queryKey: ['playlistEntries'], exact: false });
    } else {
      snackbar.error('Could not save your rating.');
    }
  };

  const handleClearMyRating = async () => {
    const res = await ratingDeleteMutation.mutateAsync({ params: { entryId } });
    if (res.success) {
      snackbar.success('Your rating was removed.');
      await queryClient.invalidateQueries({ queryKey: ['playlistEntries', entryId, 'detail'], exact: true });
      await queryClient.invalidateQueries({ queryKey: ['playlistEntries'], exact: false });
    } else {
      snackbar.error('Could not remove your rating.');
    }
  };

  const handleColourPick = async (next: string | null) => {
    const previous = hexColour;
    setHexColour(next); // optimistic
    try {
      const res = await updateMutation.mutateAsync({
        params: { entryId },
        body: { hexColour: next ?? '' },  // BE's "clear" sentinel
      });
      if (res.success) {
        await queryClient.invalidateQueries({ queryKey: ['playlistEntries'], exact: false });
        await queryClient.invalidateQueries({ queryKey: ['playlistEntries', entryId, 'detail'], exact: true });
      } else {
        snackbar.error('Could not update entry colour.');
        setHexColour(previous); // revert
      }
    } catch {
      snackbar.error('Could not update entry colour.');
      setHexColour(previous);
    }
  };

  /* --- Rendering --- */

  /* Range slider needs an array value [start, end], MUI sorts on commit but we force here too. */
  const sliderValue: [number, number] = [
    Math.min(startSec, endSec),
    Math.max(startSec, endSec),
  ];

  const effectiveBpm = (songBpm + bpmChange).toFixed(1);

  return (
    <Box sx={{ p: 2, backgroundColor: 'background.default', borderTop: 1, borderColor: 'divider' }}>
      <Stack spacing={2}>
        {/* --- Read-only header: start | duration | creator | colour swatch --- */}
        <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', rowGap: 1, alignItems: 'center' }}>
          <Field label="Starts at" value={detail.start} />
          <Field label="Duration" value={detail.duration} />
          <Field label="Added by" value={detail.creatorUserName} />
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" color="text.secondary">Colour</Typography>
            <ColourSwatchPicker
              value={hexColour}
              onChange={handleColourPick}
              disabled={!canEdit || updateMutation.isPending}
              size={22}
            />
          </Stack>
        </Stack>

        {/* --- Spotify embed for linked songs --- */}
        {detail.song.spotifySongId && (
          <SpotifyEmbedPlayer spotifySongId={detail.song.spotifySongId} height={80} />
        )}

        <Divider />

        {/* --- Start + End range slider with text fine-tuning --- */}
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Start / End within the song
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
              {secToHms(sliderValue[0])} – {secToHms(sliderValue[1])} (of {detail.song.duration})
            </Typography>
          </Stack>
          <Slider
            value={sliderValue}
            min={0}
            max={Math.max(songDurationSec, 1)}
            step={1}
            disabled={!canEdit || updateMutation.isPending}
            onChange={(_, val) => {
              if (Array.isArray(val)) {
                setStartSec(val[0]);
                setEndSec(val[1]);
              }
            }}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => secToHms(v)}
            sx={{ mt: 1 }}
          />
          <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
            <TextField
              label="Start (hh:mm:ss)"
              size="small"
              value={secToHms(startSec)}
              onChange={(e) => {
                const next = hmsToSecOrNull(e.target.value);
                if (next != null) setStartSec(Math.min(next, songDurationSec));
              }}
              disabled={!canEdit || updateMutation.isPending}
              sx={{ width: 160 }}
              inputProps={{ pattern: '^\\d{2}:\\d{2}:\\d{2}$' }}
            />
            <TextField
              label="End (hh:mm:ss)"
              size="small"
              value={secToHms(endSec)}
              onChange={(e) => {
                const next = hmsToSecOrNull(e.target.value);
                if (next != null) setEndSec(Math.min(next, songDurationSec));
              }}
              disabled={!canEdit || updateMutation.isPending}
              sx={{ width: 160 }}
              inputProps={{ pattern: '^\\d{2}:\\d{2}:\\d{2}$' }}
            />
          </Stack>
        </Box>

        <Divider />

        {/* --- BPM change slider + computed effective BPM --- */}
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              BPM change (applied on top of the source song's {songBpm.toFixed(1)} BPM)
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
              {bpmChange >= 0 ? '+' : ''}{bpmChange.toFixed(1)} → effective <b>{effectiveBpm}</b> BPM
            </Typography>
          </Stack>
          <Slider
            value={bpmChange}
            min={-30}
            max={30}
            step={0.1}
            disabled={!canEdit || updateMutation.isPending}
            onChange={(_, val) => {
              if (typeof val === 'number') setBpmChange(val);
            }}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => (v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1))}
            marks={[{ value: 0, label: '0' }]}
            sx={{ mt: 1 }}
          />
          <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
            <TextField
              label="BPM change"
              size="small"
              type="number"
              value={bpmChange}
              onChange={(e) => {
                const n = parseFloat(e.target.value);
                if (Number.isFinite(n)) setBpmChange(n); // BE validates the range
              }}
              disabled={!canEdit || updateMutation.isPending}
              sx={{ width: 140 }} helperText="Here you can enter >30 deltas."
              slotProps={{ 
                htmlInput: { step: 0.1 },
                formHelperText: { sx: { mt: 0.5, fontSize: '0.7rem' } }
              }}
            />
          </Stack>
        </Box>

        <Divider />

        {/* --- WithPrev toggle --- */}
        <Box>
          <Tooltip
            arrow disableInteractive
            title={visibleNr === 1
              ? 'The first entry can\'t be set to play-with-previous.'
              : 'When ON, this entry is mixed in with the previous one and shares its slot.'}
          >
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={withPrev}
                  onChange={(_e, v) => setWithPrev(v)}
                  disabled={withPrevDisabled || updateMutation.isPending}
                />
              }
              label="Play with previous"
              slotProps={{ typography: { variant: 'body2' } }}
            />
          </Tooltip>
        </Box>

        <Divider />

        {/* --- editable Comment (multiline) --- */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Comment
          </Typography>
          <TextField
            multiline
            minRows={2}
            maxRows={6}
            fullWidth
            size="small"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={canEdit ? 'Add a comment about this entry…' : 'No comment.'}
            disabled={!canEdit || updateMutation.isPending}
          />
        </Box>

        {/* --- Save changes button (for ALL the editable fields above) --- */}
        {canEdit && (
          <Stack direction="row" justifyContent="flex-end">
            <Button
              size="small"
              variant="contained"
              onClick={handleSave}
              disabled={!dirty || updateMutation.isPending}
              startIcon={updateMutation.isPending
                ? <CircularProgress size={14} color="inherit" />
                : <SaveRoundedIcon />}
              sx={{ textTransform: 'none' }}
            >
              Save changes
            </Button>
          </Stack>
        )}

        <Divider />

        {/* --- ratings --- */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1, flexWrap: 'wrap', rowGap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Average rating:
            </Typography>
            <DisplayRatingStars
              value={detail.averageRating}
              totalRaters={detail.totalRaters}
              size={20}
            />
            <Typography variant="caption" color="text.secondary">
              {detail.totalRaters === 0
                ? 'no ratings yet'
                : `${(detail.averageRating ?? 0).toFixed(2)} by ${detail.totalRaters} ${detail.totalRaters === 1 ? 'member' : 'members'}`}
            </Typography>
          </Stack>
          <InteractiveRatingStars
            initialMyRating={detail.myRating}
            onApply={handleApplyMyRating}
            onClear={detail.myRating !== null ? handleClearMyRating : undefined}
            isPending={ratingSetMutation.isPending || ratingDeleteMutation.isPending}
            size={22}
          />
        </Box>

        {canDelete && (
          <>
            <Divider />
            <Stack direction="row" justifyContent="flex-end">
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={deleteMutation.isPending}
                startIcon={deleteMutation.isPending
                  ? <CircularProgress size={14} color="inherit" />
                  : <DeleteOutlineRoundedIcon />}
                sx={{ textTransform: 'none' }}
              >
                Remove from playlist
              </Button>
            </Stack>
          </>
        )}
      </Stack>

      {/* --- typed-free destructive confirm --- */}
      <ConfirmDestructiveDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Remove entry"
        description={
          <>
            Remove <b>{detail.song.artist} – {detail.song.title}</b> from this playlist?
            The track itself stays in the music library; only this playlist entry is removed.
          </>
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        isPending={deleteMutation.isPending}
      />
    </Box>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Stack>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{value}</Typography>
    </Stack>
  );
}

/* hh:mm:ss <-> seconds helpers. The BE persists Start/End as TimeOnly strings.
   the FE sliders work in integer seconds. */

function hmsToSec(hms: string): number {
  const m = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(hms.trim());
  if (!m) return 0;
  return parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + parseInt(m[3], 10);
}

function hmsToSecOrNull(hms: string): number | null {
  const m = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(hms.trim());
  if (!m) return null;
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const ss = parseInt(m[3], 10);
  if (mm >= 60 || ss >= 60) return null;
  return hh * 3600 + mm * 60 + ss;
}

function secToHms(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}
