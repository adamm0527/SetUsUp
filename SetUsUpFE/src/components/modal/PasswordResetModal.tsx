import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  Stack, TextField, Typography, Zoom } from '@mui/material';
import { Link as RouterLink, useSearch, useNavigate } from '@tanstack/react-router';
import LockResetIcon from '@mui/icons-material/LockReset';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SetUsUpLogo from '../common/SetUsUpLogo.tsx';
import { PasswordField } from '#root/components';
import { useEndpointMutation } from '#root/api/queryHooks';
import { api_UserPasswordReset } from '#root/api/endpoints';
import { ROUTES_PUBLIC } from '#root/lib/constants';
import { loginWithEmailSchema, EMPTY_PASSWORD_MESSAGE } from '#root/lib/validation/loginSchema';


/* Reset-password modal: the user lands here from the email link with ?token=...&email=...
   They enter a new password twice, then submit. */
export default function PasswordResetModal() {
  const search = useSearch({ strict: false }) as { token?: string; email?: string };
  const navigate = useNavigate();

  const newPwInputRef = useRef<HTMLInputElement | null>(null);  
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [errorNewPw, setErrorNewPw] = useState('');
  const [errorNewPw2, setErrorNewPw2] = useState('');
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [serverErrorMsg, setServerErrorMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const reset = useEndpointMutation(api_UserPasswordReset);

  const linkValid = !!search.token && !!search.email;

  // Auto-redirect to login 4s after success so the user lands cleanly even if they leave the tab alone.
  useEffect(() => {
    if (!done) return;
    const handle = setTimeout(() => navigate({ to: ROUTES_PUBLIC.get('LOGIN')! }), 4000);
    return () => clearTimeout(handle);
  }, [done, navigate]);

  // live re-validate after the first submit attempt (same pattern as LoginPage)
  const handleNewPwChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const next = ev.target.value;
    setNewPw(next);

    if (next === '') {
      setErrorNewPw(EMPTY_PASSWORD_MESSAGE);
    } else if (triedSubmit) {
      const r = loginWithEmailSchema.pick({ password: true }).safeParse({ password: next });
      if (r.success) {
        setErrorNewPw('');
      } else {
        let composed = '';
        for (const issue of r.error.issues)
          composed += (composed === '' ? `Missing: ${issue.message}` : `, ${issue.message}`);
        setErrorNewPw(composed);
      }
    } else {
      setErrorNewPw('');
    }

    // if repeat already typed and triedSubmit was set, re-check match too
    if (triedSubmit && newPw2.length > 0 && next !== newPw2) {
      setErrorNewPw2('Passwords do not match');
    } else if (triedSubmit && next === newPw2) {
      setErrorNewPw2('');
    }
  };

  const handleNewPw2Change = (ev: ChangeEvent<HTMLInputElement>) => {
    const next = ev.target.value;
    setNewPw2(next);
    if (triedSubmit || next.length > 0) {
      setErrorNewPw2(next === newPw ? '' : 'Passwords do not match');
    }
  };

  const isInputValid = (): boolean => {
    const r = loginWithEmailSchema.pick({ password: true }).safeParse({ password: newPw });
    let valid = true;
    if (!r.success) {
      let composed = '';
      for (const issue of r.error.issues)
        composed += (composed === '' ? `Missing: ${issue.message}` : `, ${issue.message}`);
      setErrorNewPw(newPw === '' ? EMPTY_PASSWORD_MESSAGE : composed);
      valid = false;
    } else {
      setErrorNewPw('');
    }
    if (newPw !== newPw2) {
      setErrorNewPw2('Passwords do not match');
      valid = false;
    } else {
      setErrorNewPw2('');
    }
    if (!valid) newPwInputRef.current?.focus();
    return valid;
  };

  const handleSubmit = async () => {
    if (!linkValid) return;
    setTriedSubmit(true);
    setServerErrorMsg(null);
    if (!isInputValid()) return;

    const res = await reset.mutateAsync({ body: {
      email: search.email!,
      token: search.token!,
      newPassword: newPw,
    }});
    if (res.success) {
      setDone(true);
    } else {
      const msg = res.errorBody && 'message' in res.errorBody
        ? (res.errorBody as { message?: string }).message
        : 'Reset link invalid or expired.';
      setServerErrorMsg(msg ?? 'Reset link invalid or expired.');
    }
  };

  // show the error-link state in case of invalid parameters
  if (!linkValid) {
    return (
      <Dialog open={true} maxWidth="sm" fullWidth slotProps={{
          paper: { sx: { borderRadius: 3, p: 1, elevation: 0, backgroundColor: 'background.default' } }
      }}>
        <DialogTitle sx={{ textAlign: 'center', pb: 0, my: 1 }}>
          <SetUsUpLogo direction="column-reverse" iconSize={80}/>
          <Zoom in style={{ transitionDelay: '200ms' }}>
            <Typography color='error' variant="h6" component='span' sx={{ mt: 2 }}>
              <ErrorOutlineIcon sx={{ display: 'inline', fontSize: 25, my: -0.5,
                color: 'error', animation: 'popIn 0.5s ease-out' }}/> Reset link invalid
            </Typography>
          </Zoom>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ textAlign: 'center', mt: 1 }}>
            <Typography variant="body1">
              This link is malformed. Please request a new one from the login page.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button component={RouterLink} to={ROUTES_PUBLIC.get('LOGIN')!} variant="contained"
            sx={{ textTransform: 'none', borderRadius: 2 }}>
            Back to login
          </Button>
        </DialogActions>
        <style>{`@keyframes popIn { 0%{transform:scale(0);opacity:0;} 60%{transform:scale(1.15);opacity:1;} 100%{transform:scale(1);} }`}</style>
      </Dialog>
    );
  }

  // normal render state
  return (
    <Dialog open={true} maxWidth="sm" fullWidth slotProps={{
        paper: { sx: { borderRadius: 3, p: 1, elevation: 0, backgroundColor: 'background.default' } }
    }}>
      <DialogTitle sx={{ textAlign: 'center', pb: 0, my: 1 }}>
        <SetUsUpLogo direction="column-reverse" iconSize={80}/>
        {!done ? (
          <Zoom in style={{ transitionDelay: '200ms' }}>
            <Typography variant="h6" component='span' sx={{ mt: 2 }}>
              <LockResetIcon sx={{ display: 'inline', fontSize: 25, my: -0.5,
                color: 'primary.main', animation: 'popIn 0.5s ease-out' }}/> Set a new password
            </Typography>
          </Zoom>
        ) : (
          <Zoom in style={{ transitionDelay: '200ms' }}>
            <Typography color='success' variant="h6" component='span' sx={{ mt: 2 }}>
              <CheckCircleIcon sx={{ display: 'inline', fontSize: 25, my: -0.5,
                color: 'success', animation: 'popIn 0.5s ease-out' }}/> Password updated!
            </Typography>
          </Zoom>
        )}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ textAlign: 'center', mt: 1 }}>
          {!done ? (
            <>
              <Typography variant="body1">
                For <b>{search.email}</b>. Choose a strong password of at least 6 characters.
              </Typography>
              <PasswordField variant="outlined" fullWidth ref={newPwInputRef} value={newPw}
                onChange={handleNewPwChange} error={!!errorNewPw} helperText={errorNewPw || ' '} />
              <TextField label="Repeat new password" type="password" variant="outlined" fullWidth value={newPw2}
                onChange={handleNewPw2Change} error={!!errorNewPw2} helperText={errorNewPw2 || ' '}
                slotProps={{ input: { name: 'account-password-repeat', autoComplete: 'one-time-code' } }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !reset.isPending) void handleSubmit(); }} />
              {serverErrorMsg && <Alert severity="error">{serverErrorMsg}</Alert>}
            </>
          ) : (
            <>
              <Typography variant="body1">
                Your new password is active.
              </Typography>
              <Typography variant="body1" sx={{ backgroundColor: 'secondary.dark', px: 2, py: 1, borderRadius: 3 }}>
                You can now close this browser tab, and go back to the login page to access your account with the new password.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Redirecting to login automatically in a few seconds…
              </Typography>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        {!done ? (
          <Button variant="contained" onClick={handleSubmit} disabled={reset.isPending}
            startIcon={reset.isPending ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{ textTransform: 'none', borderRadius: 2 }}>
            Set new password
          </Button>
        ) : (
          <Button component={RouterLink} to={ROUTES_PUBLIC.get('LOGIN')!} variant="contained"
            sx={{ textTransform: 'none', borderRadius: 2 }}>
            Go to login now
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
