import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Button, Stack, CircularProgress, TextField, Typography, Zoom } from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';


interface ConfirmTypedDeletionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string; // dialog title (e.g. "Delete group/playlist/account"
  description: React.ReactNode; // longer body text describing the consequence
  phrase: string; // user must type this exact string to perform the locked action
  helperText?: string; // helper text shown under TextField (default: `Type "{phrase}" to confirm.`)
  confirmLabel: string; // confirm button label, e.g. "Delete group/account"
  cancelLabel?: string;
  /* Mutation in-flight flag (disables both buttons + shows spinner on confirm). */
  isPending?: boolean;
}


/* Typed-phrase confirm dialog, inteded for destructive actions with long-term consequences (e.g. deleting entities)
   For lighter deletions ConfirmDestructiveDialog fits better (that just asks for a button press confirmation).
   Behaviour:
   - The confirm button is disabled until the user types the exact phrase.
   - Dialog cannot be dismissed by while a mutation is in flight. */
export default function ConfirmTypedDeletionDialog({
  open, onClose, onConfirm, title, description, phrase, helperText,
  confirmLabel, cancelLabel, isPending,
}: ConfirmTypedDeletionDialogProps) {
  const [typed, setTyped] = useState('');

  /* Resetting the typed phrase every time the dialog opens. */
  useEffect(() => {
    if (open) setTyped('');
  }, [open]);

  const armed = typed === phrase;

  const handleConfirm = async () => {
    if (!armed) return;
    try { await onConfirm(); } catch { /* will be surfaced in snackbar from caller */ }
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
        <DialogContentText component="div" sx={{ textAlign: 'left', mt: 1 }}>
          {description}
        </DialogContentText>
        <Stack spacing={1} sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {helperText ?? `Type "${phrase}" below to confirm.`}
          </Typography>
          <TextField
            autoFocus
            size="small"
            fullWidth
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && armed && !isPending) void handleConfirm();
            }}
            disabled={isPending}
            inputProps={{ 'aria-label': 'Type confirmation phrase' }}
          />
        </Stack>
      </DialogContent>
      <DialogActions disableSpacing sx={{ justifyContent: 'center', gap: 1, p: 3, pt: 1 }}>
        <Button variant="outlined" onClick={onClose} disabled={isPending}>
          {cancelLabel ?? 'Cancel'}
        </Button>
        <Button variant="contained" color="error" onClick={handleConfirm}
          disabled={!armed || isPending}
          startIcon={isPending
            ? <CircularProgress size={16} color="inherit" />
            : <DeleteForeverRoundedIcon />}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
