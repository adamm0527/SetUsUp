import { useState } from 'react';
import { Box, Button, CircularProgress, FormControlLabel, MenuItem, Paper,
  Popover, Stack, Switch, Tooltip, Typography } from '@mui/material';
import PlaylistAddRoundedIcon from '@mui/icons-material/PlaylistAddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { useEndpointMutation, useEndpointQuery } from '#root/api/queryHooks';
import { api_PlaylistsGetAll, api_PlaylistEntryCreate,
  api_UserSelectedPlaylistPatch } from '#root/api/endpoints';
import { type SongDetail } from '#root/lib/types';
import { useAppSnackbar } from '#root/providers';
import { useUserSelectionStore } from '#root/clientdata/stores';
import { useQueryClient } from '@tanstack/react-query';


interface BulkAddBarProps {
  selectedSongs: SongDetail[]; // the songs the user has multi-selected in the list
  onClearSelection: () => void;
}


/* Floating bar that appears when one or more songs are checkbox-selected in the music library.
   Lets the user pick a playlist (from their current selected group) and bulk-add the songs.
   Has a "Skip duplicates" switch (default ON). Snackbar reports outcomes.
   Implemented as POST requests for each song, with default StartTime=00:00:00 and EndTime=song.duration. */
export default function BulkAddBar({ selectedSongs, onClearSelection }: BulkAddBarProps) {
  const snackbar = useAppSnackbar();
  const queryClient = useQueryClient();
  const { selPlaylist, setSelPlaylist } = useUserSelectionStore();

  /* available playlists (BE auto-scopes to the user's selected group) 
    IMPORTANT: the BE returns 204 NoContent when the group has zero playlists:
    the fetcher then sets data.data = null SO WE MUST coalesce to [] here to keep downstream .map/.length safe. */
  const playlistsQuery = useEndpointQuery(['playlists'], api_PlaylistsGetAll);
  const playlists = playlistsQuery.data?.success ? (playlistsQuery.data.data ?? []) : [];

  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [busy, setBusy] = useState(false);

  const patchSel = useEndpointMutation(api_UserSelectedPlaylistPatch);
  const addEntry = useEndpointMutation(api_PlaylistEntryCreate);

  if (selectedSongs.length === 0) return null;

  const handleAddToPlaylist = async (playlistId: string, playlistName: string) => {
    setAnchor(null);
    setBusy(true);

    /* The BE writes to the user's SELECTED playlist, so we temporarily set the target as selected,
       run the bulk add, then restore the previous selection. */
    const previousSelPlaylistId = selPlaylist?.id ?? null;
    const previousSelPlaylistName = selPlaylist?.name ?? null;

    try {
      if (previousSelPlaylistId !== playlistId) {
        await patchSel.mutateAsync({ body: { playlistId } });
        setSelPlaylist({ id: playlistId, name: playlistName });
      }

      let added = 0, failed = 0;
      const failureReasons: string[] = [];

      for (const song of selectedSongs) {
        try {
          const res = await addEntry.mutateAsync({
            body: {
              songId: song.id,
              startTime: '00:00:00',
              endTime: song.duration,
            }
          });
          if (res.success) {
            added++;
          } else {
            // BE returned a non-success (e.g. duplicate already exists)
            failed++;
            const msg = res.errorBody && 'message' in res.errorBody
              ? (res.errorBody as { message?: string }).message ?? 'unknown'
              : 'unknown';
            // "Skip duplicates" mode: treat duplicate errors as ignored, not failed
            if (skipDuplicates && /duplicate/i.test(msg)) {
              failed--;
              continue;
            }
            failureReasons.push(`${song.title}: ${msg}`);
          }
        } catch {
          failed++;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['playlists'], exact: false });

      if (failed === 0) {
        snackbar.success(`Added ${added} song${added === 1 ? '' : 's'} to "${playlistName}".`);
      } else {
        snackbar.warning(
          `${added} added to "${playlistName}", ${failed} failed.` +
          (failureReasons.length ? ` First failure: ${failureReasons[0]}` : '')
        );
      }

      onClearSelection();

      // Restore previous selection if needed
      if (previousSelPlaylistId && previousSelPlaylistId !== playlistId) {
        await patchSel.mutateAsync({ body: { playlistId: previousSelPlaylistId } });
        if (previousSelPlaylistName)
          setSelPlaylist({ id: previousSelPlaylistId, name: previousSelPlaylistName });
      }
    } catch (e) {
      snackbar.error('Bulk add failed before completing.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Paper
      elevation={6}
      sx={{ position: 'fixed', left: '50%', bottom: 16, transform: 'translateX(-50%)', zIndex: 9,
        borderRadius: 999, px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1.5,
        backgroundColor: 'background.paper', border: 1, borderColor: 'primary.main',
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        Selected: {selectedSongs.length}
      </Typography>

      <Tooltip title="Clear selection" arrow disableInteractive>
        <Button size="small" variant="text" onClick={onClearSelection}
          startIcon={<CloseRoundedIcon />} sx={{ textTransform: 'none', minWidth: 'auto' }}
        >
          clear
        </Button>
      </Tooltip>

      <Button size="small" variant="contained" onClick={(e) => setAnchor(e.currentTarget)}
        disabled={busy} startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <PlaylistAddRoundedIcon />}
        endIcon={<KeyboardArrowDownRoundedIcon />} sx={{ textTransform: 'none', borderRadius: 999 }}
      >
        Add to ▾
      </Button>

      <Popover open={!!anchor} anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 320, maxHeight: '60vh', p: 1.5 } } }}
      >
        <Stack spacing={1}>
          <FormControlLabel
            control={
              <Switch size="small" checked={skipDuplicates} onChange={(_e, v) => setSkipDuplicates(v)}
              />
            }
            label="Skip duplicates"
            slotProps={{ typography: { variant: 'body2' } }}
          />
          <Typography variant="caption" color="text.secondary">
            Pick a playlist in this group to add the selected songs to.
          </Typography>
          <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
            {playlists?.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 1, textAlign: 'center' }}>
                No playlists yet in this group.
              </Typography>
            )}
            {playlists?.map((p) => (
              <MenuItem
                key={p.id}
                onClick={() => handleAddToPlaylist(p.id, p.name)}
                disabled={busy}
              >
                {p.name}
              </MenuItem>
            ))}
          </Box>
        </Stack>
      </Popover>
    </Paper>
  );
}
