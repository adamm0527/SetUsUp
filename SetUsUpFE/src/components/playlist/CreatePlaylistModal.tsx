import { useEffect, useState } from 'react';
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Stack, TextField, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useQueryClient } from '@tanstack/react-query';
import { useEndpointMutation } from '#root/api/queryHooks';
import { api_PlaylistCreate } from '#root/api/endpoints';
import { useAppSnackbar } from '#root/providers';
import { useUserSelectionStore } from '#root/clientdata/stores';


interface CreatePlaylistModalProps {
  open: boolean;
  onClose: () => void;
}


/* Modal form for creating a new playlist in the user's currently selected group.
   On success the BE auto-sets the new playlist as the user's selected playlist, and sends real-time signalling.
   So we just need to:
     1. submit the body
     2. invalidate locally as a safety net (real-time may be delayed)
     3. close the modal
  If the user lacks Admin role in the selected group the BE returns 403 which we display inline as an Alert. */
export default function CreatePlaylistModal({ open, onClose }: CreatePlaylistModalProps) {
  const snackbar = useAppSnackbar();
  const queryClient = useQueryClient();
  const { selGroup } = useUserSelectionStore();

  const createMutation = useEndpointMutation(api_PlaylistCreate);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* reset form whenever the modal opens (avoid leaking state from a previous attempt) */
  useEffect(() => {
    if (!open) return;
    setName('');
    setDescription('');
    setErrorMsg(null);
  }, [open]);

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && !!selGroup && !createMutation.isPending;

  const handleClose = () => {
    if (createMutation.isPending) return;  // never close mid-flight
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setErrorMsg(null);

    const res = await createMutation.mutateAsync({
      body: {
        name: trimmedName,
        description: description.trim() || null,
      }
    });

    if (res.success) {
      snackbar.success(`Created "${trimmedName}".`);
      /* invalidate playlist list + the user's selected-playlist query. */
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['playlists'], exact: false }),
        queryClient.invalidateQueries({ queryKey: ['user', 'selectedPlaylist'], exact: false }),
      ]);
      onClose();
    } else {
      const msg = res.errorBody && 'message' in res.errorBody
        ? (res.errorBody as { message?: string }).message ?? 'Could not create playlist.'
        : 'Could not create playlist.';
      setErrorMsg(msg);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>New playlist</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {!selGroup && (
            <Alert severity="warning">
              Pick a group first -- playlists belong to a group.
            </Alert>
          )}
          {selGroup && (
            <Typography variant="body2" color="text.secondary">
              Creating in <b>{selGroup.name}</b>. Only group admins can create playlists.
            </Typography>
          )}

          <TextField
            label="Name"
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={createMutation.isPending || !selGroup}
            autoFocus
            fullWidth
            inputProps={{ maxLength: 64 }}
            placeholder="e.g. Friday warm-up"
            onKeyDown={(e) => {
              /* Enter submits (consistent with the rest of the app's modals) */
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit();
              }
            }}
          />

          <TextField
            label="Description (optional)"
            size="small"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={createMutation.isPending || !selGroup}
            fullWidth
            multiline
            minRows={2}
            maxRows={5}
            inputProps={{ maxLength: 512 }}
            placeholder="What's this playlist for?"
          />

          {errorMsg && (
            <Alert severity="error" onClose={() => setErrorMsg(null)}>
              {errorMsg}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={createMutation.isPending}
          startIcon={<CloseRoundedIcon />}
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit}
          startIcon={createMutation.isPending
            ? <CircularProgress size={14} color="inherit" />
            : <AddRoundedIcon />}
          sx={{ textTransform: 'none' }}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
