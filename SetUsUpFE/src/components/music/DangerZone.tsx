import { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import { useEndpointMutation } from '#root/api/queryHooks';
import { api_SongDelete } from '#root/api/endpoints';
import { ConfirmDestructiveDialog } from '#root/components';
import { useAppSnackbar } from '#root/providers';
import { useQueryClient } from '@tanstack/react-query';


interface DangerZoneProps {
  songId: string;
  songLabel: string; // "Artist - Title", for the confirm dialog
  onDeleted: () => void;
}


/* Danger-zone "Delete song" block at the bottom of the SongDetailPanel. Creator-only. */
export default function DangerZone({ songId, songLabel, onDeleted }: DangerZoneProps) {
  const snackbar = useAppSnackbar();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const deleteMutation = useEndpointMutation(api_SongDelete);

  const handleDelete = async () => {
    const res = await deleteMutation.mutateAsync({ params: { songId } });
    if (res.success) {
      snackbar.success(`Deleted "${songLabel}".`);
      setConfirming(false);
      await queryClient.invalidateQueries({ queryKey: ['songs'] });
      onDeleted();
    } else {
      const msg = res.errorBody && 'message' in res.errorBody
        ? (res.errorBody as { message?: string }).message ?? 'Could not delete song.'
        : 'Could not delete song.';
      snackbar.error(msg);
    }
  };

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="subtitle2" color="error" sx={{ fontWeight: 700, mb: 1 }}>
        Danger zone
      </Typography>
      <Button variant="outlined" color="error"
        startIcon={<DeleteForeverRoundedIcon />}
        onClick={() => setConfirming(true)}
        disabled={deleteMutation.isPending}
      >
        Delete song
      </Button>

      <ConfirmDestructiveDialog
        title="Delete this song?" confirmLabel="Delete" open={confirming}
        onClose={() => setConfirming(false)} onConfirm={handleDelete}
        description={
          <>This will permanently delete <b>{songLabel}</b> and remove it from every playlist
            that referenced it. This action cannot be undone.</>
        }
        isPending={deleteMutation.isPending}
      />
    </Box>
  );
}
