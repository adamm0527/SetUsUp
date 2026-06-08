import { useRef, useState, type ChangeEvent } from 'react';
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  Stack, Typography, Zoom } from '@mui/material';
import { Link as RouterLink } from '@tanstack/react-router';
import LockResetIcon from '@mui/icons-material/LockReset';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import SetUsUpLogo from '../common/SetUsUpLogo.tsx';
import { EmailField } from '#root/components';
import { useEndpointMutation } from '#root/api/queryHooks';
import { api_UserPasswordForgot } from '#root/api/endpoints';
import { ROUTES_PUBLIC } from '#root/lib/constants';
import { loginWithEmailSchema, INVALID_EMAIL_MESSAGE } from '#root/lib/validation/loginSchema';


/* "Forgot password" entry modal. Two render states:
     - form   -> email TextField + "Send reset link" button
     - sent   -> MarkEmailReadIcon heading + "check your inbox" + Back-to-login button */
export default function PasswordForgotModal() {
  const emailInputRef = useRef<HTMLInputElement | null>(null);  
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [triedSubmit, setTriedSubmit] = useState(false);  
  const [sent, setSent] = useState(false);
  const [serverErrorMsg, setServerErrorMsg] = useState<string | null>(null);
  const forgot = useEndpointMutation(api_UserPasswordForgot);

  
  // Re-validate the email after the user has tried once (same pattern as LoginPage).
  const handleEmailChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const next = ev.target.value;
    setEmail(next);
    if (triedSubmit || emailError !== '') {
      const r = loginWithEmailSchema.pick({ account: true }).safeParse({ account: next });
      setEmailError(r.success ? '' : INVALID_EMAIL_MESSAGE);
    }
  };

  const isInputValid = (): boolean => {
    const r = loginWithEmailSchema.pick({ account: true }).safeParse({ account: email });
    if (!r.success) {
      setEmailError(INVALID_EMAIL_MESSAGE);
      emailInputRef.current?.focus();
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async () => {
    setTriedSubmit(true);
    setServerErrorMsg(null);
    if (!isInputValid()) return;

    const res = await forgot.mutateAsync({ body: { email: email.trim() } });
    if (res.success) {
      setSent(true);
    } else {
      const msg = res.errorBody && 'message' in res.errorBody
        ? (res.errorBody as { message?: string }).message
        : 'Could not send reset email.';
      setServerErrorMsg(msg ?? 'Could not send reset email.');
    }
  };

  return (
    <Dialog open={true} maxWidth="sm" fullWidth
      slotProps={{
        paper: { sx: { borderRadius: 3, p: 1, elevation: 0, backgroundColor: 'background.default' } }
    }}>
      <DialogTitle sx={{ textAlign: 'center', pb: 0, my: 1 }}>
        <SetUsUpLogo direction="column-reverse" iconSize={80}/>
        {/* Animated status Icon */}        
        {!sent ? (
          <Zoom in style={{ transitionDelay: '200ms' }}>
            <Typography variant="h6" component='span' sx={{ mt: 2 }}>
              <LockResetIcon sx={{ display: 'inline', fontSize: 25, my: -0.5,
                color: 'primary.main', animation: 'popIn 0.5s ease-out' }}/> Reset your password
            </Typography>
          </Zoom>
        ) : (
          <Zoom in style={{ transitionDelay: '200ms' }}>
            <Typography color='info' variant="h6" component='span' sx={{ mt: 2 }}>
              <MarkEmailReadIcon sx={{ display: 'inline', fontSize: 25, my: -0.5,
                color: 'info.main', animation: 'popIn 0.5s ease-out' }}/> Check your inbox
            </Typography>
          </Zoom>
        )}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ textAlign: 'center', mt: 1 }}>
          {!sent ? (
            <>
              <Typography variant="body1">
                Enter your account email and we'll send a link you can use to set a new password.
              </Typography>
              <EmailField variant="outlined" size="medium" fullWidth autoFocus ref={emailInputRef} value={email}
                onChange={handleEmailChange} error={!!emailError} helperText={emailError || ' '}
                handleConfirmResend={() => { void handleSubmit(); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !forgot.isPending) void handleSubmit();
                }} />
              {serverErrorMsg && <Alert severity="error">{serverErrorMsg}</Alert>}
              <Typography variant="body2" color="text.secondary">
                The reset link expires after 1&nbsp;hour.
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="body1">
                If an account with that email exists, a reset link is on its way.
              </Typography>
              <Typography variant="body1" sx={{ backgroundColor: 'secondary.dark', px: 2, py: 1, borderRadius: 3 }}>
                Click the link in the email within the next hour to set a new password. You can close this tab.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Didn't get an email? Check spam, then try again from the login page.
              </Typography>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 1 }}>
        {!sent ? (
          <>
            <Button component={RouterLink} to={ROUTES_PUBLIC.get('LOGIN')!} variant="outlined"
              sx={{ textTransform: 'none', borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              variant="contained" onClick={handleSubmit} disabled={forgot.isPending}
              startIcon={forgot.isPending ? <CircularProgress size={14} color="inherit" /> : null}
              sx={{ textTransform: 'none', borderRadius: 2 }}>
              Send reset link
            </Button>
          </>
        ) : (
          <Button component={RouterLink} to={ROUTES_PUBLIC.get('LOGIN')!} variant="contained"
            sx={{ textTransform: 'none', borderRadius: 2 }}>
            Back to login
          </Button>
        )}
      </DialogActions>
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
