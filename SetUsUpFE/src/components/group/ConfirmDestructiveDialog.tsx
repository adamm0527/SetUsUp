import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Button, Stack, CircularProgress, Zoom } from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';


interface ConfirmDestructiveDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string; // dialog title (e.g. "Delete group")
  description: React.ReactNode; // longer body text describing the consequence
  confirmLabel: string; // confirm button label, e.g. "Delete", "Kick", "Leave"
  cancelLabel?: string; // cancel button label, default 'Cancel'
  isPending?: boolean; // mutation is still in-progress flag (disables both buttons + shows spinner on confirm)
}

/* small re-usable modal for actions that have no undo (delete group, kick member, leave group) */
export default function ConfirmDestructiveDialog({
  open, onClose, onConfirm, title, description, confirmLabel, cancelLabel, isPending
}: ConfirmDestructiveDialogProps) {

  const handleConfirm = async () => {
    try { await onConfirm(); } catch { /* surface in snackbar from caller */ }
  };

  return (
    <Dialog open={open} onClose={isPending ? undefined : onClose} maxWidth="xs" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3, p: 1, backgroundColor: 'background.default' } } }}>
      <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
        <Zoom in={open} style={{ transitionDelay: open ? '120ms' : '0ms' }}>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
            <WarningAmberRoundedIcon color="error" sx={{ fontSize: 28 }} />
            <span>{title}</span>
          </Stack>
        </Zoom>
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ textAlign: 'center', mt: 1 }}>
          {description}
        </DialogContentText>
      </DialogContent>
      <DialogActions disableSpacing sx={{ justifyContent: 'center', gap: 1, p: 3, pt: 1 }}>
        <Button variant="outlined" onClick={onClose} disabled={isPending}>
          {cancelLabel ?? 'Cancel'}
        </Button>
        <Button variant="contained" color="error" onClick={handleConfirm} disabled={isPending}
          startIcon={isPending ? <CircularProgress size={16} color="inherit" /> : undefined}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
