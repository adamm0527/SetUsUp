import { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, Stack, TextField, Typography } from '@mui/material';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import { useEndpointMutation } from '#root/api/queryHooks';
import { api_PlaylistUpdate, api_UserSelectedPlaylistPatch, api_PlaylistDelete } from '#root/api/endpoints';
import {  } from '#root/lib/types';
import { useAppSnackbar } from '#root/providers';
import { useUserSelectionStore } from '#root/clientdata/stores';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmTypedDeletionDialog } from '#root/components';
import type { PlaylistDetail, PlaylistInfoList, ApiResponse } from '#root/lib/types';
import { type ApiResult } from '#root/api/fetcher';


interface PlaylistDetailsModalProps {
  open: boolean;
  onClose: () => void;
  playlist: PlaylistDetail | null;
}


/* Modal that bundles the playlist's editable metadata (name, description)
   plus the danger-zone delete action behind one entry point. Triggered by the "Details" button on the header

   Delete uses a two-step confirmation: the user must type the playlist name exactl to enable the destructive button.
   On success the user's selected playlist is cleare and the modal closes. */
export default function PlaylistDetailsModal({ open, onClose, playlist }: PlaylistDetailsModalProps) {
  const snackbar = useAppSnackbar();
  const queryClient = useQueryClient();
  const { setSelPlaylist } = useUserSelectionStore();
  
  const patchSelPlaylistMutation = useEndpointMutation(api_UserSelectedPlaylistPatch);
  const updateMutation = useEndpointMutation(api_PlaylistUpdate);
  const deleteMutation = useEndpointMutation(api_PlaylistDelete);
  

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  /* reset local form state every time the modal opens against a (possibly different) playlist */
  useEffect(() => {
    if (!open || !playlist) return;
    setName(playlist.name);
    setDescription(playlist.description ?? '');
    setConfirmDeleteOpen(false);
  }, [open, playlist]);

  if (!playlist) return null;

  const canEdit = playlist.canEditUI;
  const dirty = name.trim() !== playlist.name || (description ?? '') !== (playlist.description ?? '');

  const handleSave = async () => {
    const body: Record<string, unknown> = {};
    if (name.trim() !== playlist.name) body.name = name.trim();
    if ((description ?? '') !== (playlist.description ?? '')) body.description = description;

    const res = await updateMutation.mutateAsync({ params: { playlistId: playlist.id }, body });
    if (res.success) {
      snackbar.success('Playlist updated.');
      await queryClient.invalidateQueries({ queryKey: ['playlists'], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['playlist', playlist.id], exact: false });
    } else {
      const msg = res.errorBody && 'message' in res.errorBody
        ? (res.errorBody as { message?: string }).message ?? 'Could not update playlist.'
        : 'Could not update playlist.';
      snackbar.error(msg);
    }
  };

const handleConfirmDelete = async () => {
    const res = await deleteMutation.mutateAsync({ params: { playlistId: playlist.id } });
    if (!res.success) {
      const msg = res.errorBody && 'message' in res.errorBody
        ? (res.errorBody as { message?: string }).message ?? 'Could not delete playlist.'
        : 'Could not delete playlist.';
      snackbar.error(msg);
      return;
    }

    snackbar.success(`Deleted "${playlist.name}".`);
    setConfirmDeleteOpen(false);
    onClose();

    /* Refresh dropdown options so we have a fresh list to fall back to. */
    await queryClient.refetchQueries({ queryKey: ['playlists'], exact: false });

    /* The BE, too, just set the user's SelectedPlaylistId to null,
        so we pick a sensible default on the FE and PATCH it back so it persists (if there's still a playlist). */
    const fresh = queryClient.getQueryData<ApiResult<PlaylistInfoList | null, ApiResponse>>(['playlists']);
    const remaining = (fresh?.success && fresh.data)
      ? fresh.data.filter((p) => p.id !== playlist.id)
      : [];

    if (remaining.length > 0) {
      const fallback = remaining[0];
      setSelPlaylist({ id: fallback.id, name: fallback.name });
      try {
        await patchSelPlaylistMutation.mutateAsync({ body: { playlistId: fallback.id } });
      } catch (err) {
        console.warn('Auto-fallback PATCH selectedPlaylist failed', err);
      }
      /* Force refetch of the new playlist's queries overwriting any staleness */
      void queryClient.invalidateQueries({ queryKey: ['playlist'], exact: false });
      void queryClient.invalidateQueries({ queryKey: ['playlistEntries'], exact: false });
    } else {
      /* No playlists left in this group leave selPlaylist null and focus the selector */
      setSelPlaylist(null);
      await queryClient.invalidateQueries({ queryKey: ['playlistEntries'], exact: false });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Playlist details</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary">Stats</Typography>
            <Stack direction="row" spacing={3}>
              <Typography variant="body2">
                <b>{playlist.entryCount}</b> songs
              </Typography>
              <Typography variant="body2">
                Total: <b>{playlist.duration}</b>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created by {playlist.creatorUserName}
              </Typography>
            </Stack>
          </Stack>

          <Divider />

          <TextField
            label="Name"
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit || updateMutation.isPending}
            fullWidth
          />
          <TextField
            label="Description"
            size="small"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!canEdit || updateMutation.isPending}
            fullWidth
            multiline
            minRows={2}
            maxRows={6}
            placeholder="What's this playlist about?"
          />

          {canEdit && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                size="small"
                onClick={handleSave}
                disabled={!dirty || updateMutation.isPending}
                startIcon={updateMutation.isPending
                  ? <CircularProgress size={14} color="inherit" />
                  : <SaveRoundedIcon />}
                sx={{ textTransform: 'none' }}
              >
                Save changes
              </Button>
            </Box>
          )}

          {canEdit && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'error.main', mb: 1 }}>
                  Danger zone
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Deleting this playlist removes all of its entries. This cannot be undone.
                </Typography>
                <Stack direction="row" justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => setConfirmDeleteOpen(true)}
                    disabled={deleteMutation.isPending}
                    startIcon={<DeleteForeverRoundedIcon />}
                    sx={{ textTransform: 'none' }}
                  >
                    Delete playlist
                  </Button>
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Close</Button>
      </DialogActions>
      <ConfirmTypedDeletionDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete this playlist?"
        description={
          <>
            This will permanently delete the playlist <b>{playlist.name}</b> with all its entries.
            The underlying songs in your music library stay intact.
            <br /><br />
            <b>Other group members who relied on this playlist will lose it too.</b>
            <br />
            This cannot be undone.
          </>
        }
        phrase={playlist.name}
        confirmLabel="Delete playlist"
        isPending={deleteMutation.isPending}
      />      
    </Dialog>
  );
}
