import { useState } from 'react';
import { Alert, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useEndpointMutation } from '#root/api/queryHooks';
import { api_UserLegalAccept } from '#root/api/endpoints';
import { useAppSnackbar } from '#root/providers';
import { CURRENT_LEGAL_VERSION } from '#root/lib/legal/constants';


interface AcceptLegalGateProps {
  /* The user's currently-stored AcceptedLegalVersion. 
     Must be greater than CRRENT_LEGAL_VERSION for success. */
  acceptedVersion: number;
}


/* Non-dismissible modal displayed after login when the user hasn't yet accepted current Privacy Notice + ToS.
   Bumping CURRENT_LEGAL_VERSION (both FE and BE constants) forces re-display for all users. */
export default function AcceptLegalGate({ acceptedVersion }: AcceptLegalGateProps) {
  const snackbar = useAppSnackbar();
  const queryClient = useQueryClient();
  const accept = useEndpointMutation(api_UserLegalAccept);

  const [ticked, setTicked] = useState(false);
  const open = (acceptedVersion < CURRENT_LEGAL_VERSION);
  const isFirstAcceptance = (acceptedVersion === 0);

  const handleAccept = async () => {
    const res = await accept.mutateAsync({ body: { version: CURRENT_LEGAL_VERSION } });
    if (res.success) {
      // invalidate the user profile cache so parent re-renders
      await queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    } else {
      const msg = res.errorBody && 'message' in res.errorBody
        ? (res.errorBody as { message?: string }).message
        : 'Could not record your acceptance.';
      snackbar.error(msg ?? 'Could not record your acceptance.');
    }
  };

  return (
    <Dialog open={open} maxWidth="sm" fullWidth disableEscapeKeyDown slotProps={{ paper: { sx: { borderRadius: 2 } } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isFirstAcceptance ? 'Welcome! Just a quick formality...' : 'Updated legal documents'}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {!isFirstAcceptance && (
            <Alert severity="info">
              We've updated our Privacy Notice and Terms of Service since you last agreed.
              Please review and confirm to continue.
            </Alert>
          )}
          <Typography variant="body2">
            Before using the app, please review the{' '}
            <Link component={RouterLink} to="/legal/privacy" target="_blank">Privacy Notice</Link>{' '}
            and the{' '}
            <Link component={RouterLink} to="/legal/terms" target="_blank">Terms of Service</Link>.
            Both open in a new tab.
          </Typography>
          <FormControlLabel
            control={<Checkbox checked={ticked} onChange={(_e, v) => setTicked(v)} />}
            label={
              <Typography variant="body2">
                I have read and accept the Privacy Notice and Terms of Service (version {CURRENT_LEGAL_VERSION}).
              </Typography>
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={handleAccept} disabled={!ticked || accept.isPending}
          startIcon={accept.isPending ? <CircularProgress size={14} color="inherit" /> : null} sx={{ textTransform: 'none' }}>
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
