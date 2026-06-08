import { useEffect, useState } from 'react';
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  Stack, Typography, Zoom } from '@mui/material';
import { Link as RouterLink, useSearch } from '@tanstack/react-router';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SetUsUpLogo from '../common/SetUsUpLogo.tsx';
import axiosClient from '#root/api/axiosClient';
import { ROUTES_PUBLIC } from '#root/lib/constants';


/* Landing modal for the email-change confirmation link the user receives in their email.
   On mount: reads token + email + userId from the URL and POSTs to /user/confirm-email-change (BE). */
export default function EmailChangeConfirmationModal() {
  const search = useSearch({ strict: false }) as { token?: string; userId?: string; newEmail?: string; };
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { token, userId, newEmail: email } = search;
      if (!token || !userId || !email) {
        if (!cancelled) setStatus('error');
        return;
      }
      try {
        await axiosClient.post(
          `/user/confirm-email-change?token=${encodeURIComponent(token)}` +
          `&userId=${encodeURIComponent(userId)}&newEmail=${encodeURIComponent(email)}`
        );
        if (!cancelled) setStatus('success');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Dialog open={true} maxWidth="sm" fullWidth
      slotProps={{
        paper: { sx: { borderRadius: 3, p: 1, elevation: 0, backgroundColor: 'background.default' } }
    }}>
      <DialogTitle sx={{ textAlign: 'center', pb: 0, my: 1 }}>
        <SetUsUpLogo direction="column-reverse" iconSize={80}/>
        {/* Animated status Icon */}
        {status === 'pending' && (
          <Zoom in style={{ transitionDelay: '200ms' }}>
            <Typography variant="h6" component='span' sx={{ mt: 2, display: 'inline-flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={22} thickness={5}/> Applying email change...
            </Typography>
          </Zoom>
        )}
        {status === 'success' && (
          <Zoom in style={{ transitionDelay: '200ms' }}>
            <Typography color='success' variant="h6" component='span' sx={{ mt: 2 }}>
              <CheckCircleIcon sx={{ display: 'inline', fontSize: 25, my: -0.5,
                color: 'success', animation: 'popIn 0.5s ease-out' }}/> Email changed!
            </Typography>
          </Zoom>
        )}
        {status === 'error' && (
          <Zoom in style={{ transitionDelay: '200ms' }}>
            <Typography color='error' variant="h6" component='span' sx={{ mt: 2 }}>
              <ErrorOutlineIcon sx={{ display: 'inline', fontSize: 25, my: -0.5,
                color: 'error', animation: 'popIn 0.5s ease-out' }}/> Confirmation link invalid
            </Typography>
          </Zoom>
        )}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ textAlign: 'center', mt: 1 }}>
          {status === 'pending' && (
            <Typography variant="body1">
              Hang on a moment while we apply the change...
            </Typography>
          )}
          {status === 'success' && (
            <>
              <Typography variant="body1">
                Your account email has been updated.
              </Typography>
              <Typography variant="body1" sx={{ backgroundColor: 'secondary.dark', px: 2, py: 1, borderRadius: 3 }}>
                You can now close this browser tab, and go back to the login page to sign in with your new email.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your existing sessions on the old email have been signed out for security.
              </Typography>
            </>
          )}
          {status === 'error' && (
            <>
              <Typography variant="body1">
                This link is invalid or has expired.
              </Typography>
              <Typography variant="body1" sx={{ backgroundColor: 'secondary.dark', px: 2, py: 1, borderRadius: 3 }}>
                Email-change links expire after 24&nbsp;hours. Open the app, log in, and submit a fresh email-change request from your settings page.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your current email is unchanged.
              </Typography>
            </>
          )}
        </Stack>
      </DialogContent>
      {status !== 'pending' && (
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button component={RouterLink} to={ROUTES_PUBLIC.get('LOGIN')!} variant="contained"
            sx={{ textTransform: 'none', borderRadius: 2 }}>
            Go to login
          </Button>
        </DialogActions>
      )}
      {/* Keyframe animation for the status icon */}
      <style>
        {`
          @keyframes popIn {
            0% { transform: scale(0); opacity: 0; }
            60% { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(1); }
          }
        `}
      </style>
    </Dialog>
  );
}
