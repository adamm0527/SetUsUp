import { useEffect, useState, useRef, useCallback, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, Link as RouterLink } from '@tanstack/react-router';
import { Container, Stack, Paper, Card, Typography, Button, Divider, Snackbar, Alert,
  Checkbox, FormControlLabel, Link } from '@mui/material';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import { SetUsUpLogo, EmailField, UserNameField, PasswordField, ToggleThemeMode,
  RegisterSuccessModal, RegisterSuccessModalSkeleton, RegisterFailureModal } from '#root/components';
import { fullUserSchema, loginWithEmailSchema, INVALID_EMAIL_MESSAGE,
  TOO_SHORT_USERNAME_MESSAGE, TOO_LONG_USERNAME_MESSAGE,
  EMPTY_PASSWORD_MESSAGE } from '#root/lib/validation/loginSchema.ts';
import { MIN_USERNAME_LEN, MAX_USERNAME_LEN, ROUTES_PUBLIC } from '#root/lib/constants';
import { useAuthFormStore } from '#root/clientdata/stores';
import { api_UserRegister, api_UserResendConfirmMail } from '#root/api/endpoints';
import { useEndpointMutation, useApiErrorMessage } from '#root/api/queryHooks.ts';


export default function RegisterPage() {
  /* --- states & hooks --- */
  const formState = useAuthFormStore(); // stores all input values and error helper labels
  const emailInputRef = useRef<HTMLInputElement | null>(null); // used when email input needs focus
  const usernameInputRef = useRef<HTMLInputElement | null>(null); // used when username input needs focus
  const passwordInputRef = useRef<HTMLInputElement | null>(null); // used when password input needs focus
  const loginNavButtonRef = useRef<HTMLButtonElement | null>(null); // used when login nav button needs focus
  const navigate = useNavigate(); // used for navigating to register page and login restricted area
  const [modalLoadingState, setModalLoadingState] = useState(false);
  const [modalSuccessOpenState, setModalSuccessOpenState] = useState(false);
  const [modalFailureOpenState, setModalFailureOpenState] = useState(false);
  const api_register = useEndpointMutation(api_UserRegister); // endpoint for registration
  const api_resendMail = useEndpointMutation(api_UserResendConfirmMail); // for resending confirmation email
  const apiRegMessage = useApiErrorMessage(api_register, 'registration');
  // const apiResendMessage = useApiErrorMessage(api_resendMail, 'confirmation email resending'); // see: res.errorBody
  const resendDebounced = useRef(false); const alreadyResent = useRef(false); // these prevent api spamming
  const [emailSentToastOpen, setEmailSentToastOpen] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);

  /* --- on mount: determining where to put focus after page loaded --- */
  useEffect(() => {
    const emailEmpty = formState.email === '';
    const emailError = formState.errorEmail.length > 0;
    const usernameEmpty = formState.username === '';
    const usernameError = formState.errorUsername.length > 0;
    const pwEmpty = formState.password === '';
    const pwError = formState.errorPassword.length > 0;

    if (emailEmpty && usernameEmpty && pwEmpty && !emailError && !usernameError && !pwError)
      return; // if whole form is empty, we don't set focus: let user decide where to start

    if (emailEmpty || emailError) // if email not filled correctly yet, focus there
      emailInputRef.current!.focus();
    else if (usernameEmpty || usernameError) // priority downward: if username faulty, focus there
      usernameInputRef.current!.focus();
    else if (pwEmpty || pwError) // priority downward: if password faulty, focus there
      passwordInputRef.current!.focus();

    if (formState.triedSubmit)
      isInputValid();
  }, []);


  /* --- event handlers for form-validation --- */

  const handleEmailChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const newEmail = ev.target.value as string;
    formState.setEmail(newEmail);
    /* live-validation help for the user if already submitted without success */
    if (formState.triedSubmit || formState.errorEmail !== '') {
      const emailResult = loginWithEmailSchema.pick({ account: true }).safeParse({ account: newEmail });
      formState.setErrorEmail(emailResult.success ? '' : INVALID_EMAIL_MESSAGE);
    }
  };
  
  const handleUsernameChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const newUsername = ev.target.value as string;
    formState.setUsername(newUsername);
    /* live-validation help for the user if already submitted without success */
    if (formState.triedSubmit) {
      if (newUsername.length >= MIN_USERNAME_LEN && newUsername.length <= MAX_USERNAME_LEN)
        formState.setErrorUsername(''); // removing error state if user fixed the input
      else if (newUsername.length < MIN_USERNAME_LEN)
        formState.setErrorUsername(TOO_SHORT_USERNAME_MESSAGE);
      else
        formState.setErrorUsername(TOO_LONG_USERNAME_MESSAGE);
    }
  };
  
  const handlePasswordChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const newPw = ev.target.value as string;
    formState.setPassword(newPw);

    if (newPw === '') {
      formState.setErrorPassword(EMPTY_PASSWORD_MESSAGE);
      return;
    } else {
      formState.setErrorPassword(''); // gracefully resetting error after typed at least a character
    }

    /* live-validation help for the user if already submitted without success */
    if (formState.triedSubmit) {
      /* re-run validation (for password only) */
      const pwResult = loginWithEmailSchema.pick({ password: true }).safeParse({ password: newPw });
      if (pwResult.success) {
        formState.setErrorPassword(''); // removing error state if user fixed the input
      } else {
        /* constructing the helperText so that it includes all issues */
        let newPwError = '';
        for (const issue of pwResult.error.issues)
          newPwError += (newPwError === '') ? `Missing: ${issue.message}` : `, ${issue.message}`;
        formState.setErrorPassword(newPwError);
      }
    }
  };
  
  function isInputValid() { // this function validates everything (email/username and password)
    const currInputState = {
      email: formState.email,
      username: formState.username,
      password: formState.password
    };
    const result = fullUserSchema.safeParse(currInputState);
    /* handling input errors */
    if (!result.success) {
      /* storing all issues into a dictionary to display later */
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as string;
        if (!fieldErrors[path]) fieldErrors[path] = issue.message;
        else fieldErrors[path] += `, ${issue.message}`;
      }
      formState.setErrorEmail(fieldErrors.email ?? '');
      formState.setErrorUsername(fieldErrors.username ?? '');
      if (formState.password === '') formState.setErrorPassword(EMPTY_PASSWORD_MESSAGE);
      else formState.setErrorPassword(fieldErrors.password ? `Missing: ${fieldErrors.password}` : '');
      /* setting focus to the first culprit input */
      if (fieldErrors.email)
        emailInputRef.current!.focus();
      else if (fieldErrors.username)
        usernameInputRef.current!.focus();
      else
        passwordInputRef.current!.focus();

      return false;
    }
    return true;
  }
  
  const handleSubmit = (ev: FormEvent) => { // used by the Register button
    /* clientside form validation */
    ev.preventDefault();
    formState.setTriedSubmit();
    if (!isInputValid() || formState.hasAnyRegisterError())
      return false;
    
    /* Legal gate: although the Register button is disabled when !legalAccepted, defensively block submission too. */
    if (!legalAccepted)
      return false;

    /* displaying skeleton modal until api response */
    setModalLoadingState(true);

    /* clientside validation passed, api can now be called */
    api_register.mutate({ body: {
        email: formState.email,
        userName: formState.username,
        password: formState.password
      }}, {onSuccess: (res) => {
        setModalLoadingState(false);
        if (res.success)
          setModalSuccessOpenState(true); // open success modal
        else
          setModalFailureOpenState(true); // open failure modal
      }, onError: () => {
        setModalLoadingState(false);
        setModalFailureOpenState(true); // open failure modal
      }}
    );
  };

  const handleLogin = () => {
    formState.resetPassword();
    navigate({ to: ROUTES_PUBLIC.get('LOGIN')! });
  };

  const handleConfirmResend = useCallback(async () => {
    /* first validate email clientside */
    if (formState.errorEmail != '') return;
    const emailResult = loginWithEmailSchema.pick({ account: true }).safeParse({ account: formState.email });
    const newEmailError = emailResult.success ? '' : INVALID_EMAIL_MESSAGE;
    formState.setErrorEmail(newEmailError);

    /* guarding the api from being called unnecessarily (input validation & debouncing after requests) */
    if (newEmailError === '' && !resendDebounced.current && !alreadyResent.current) {
      try {
        resendDebounced.current = true;
        const res =  await api_resendMail.mutateAsync({ body: formState.email });
        if (!res.success) {
          formState.setErrorEmail(res.errorBody.message);
        } else {
          alreadyResent.current = true;
          setEmailSentToastOpen(true);
        }
      } catch (err) {
        formState.setErrorEmail(err as string);
      } finally {
        resendDebounced.current = false;
      }
    }
    emailInputRef.current!.focus();
  }, [formState.email, formState.errorEmail, resendDebounced, alreadyResent])


  return (
    <>
      {/* -- MAIN PAGE CONTENT -- */}
      <Container maxWidth="sm" sx={{ 
        minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
      >
        <ToggleThemeMode/>
        <Paper component="form" onSubmit={handleSubmit} elevation={0}
          sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, borderRadius: 3 }}
        >
          <Card elevation={1} sx={(theme) => ({ p: 2, border: `1px solid ${theme.palette.divider}` })}>
            <SetUsUpLogo direction="column-reverse" iconSize={120}/>
            <Typography variant="h6" align="center" sx={{ lineHeight: 1.4, color: 'text.primary', mb: 2 }}>
              Your music's everywhere?<br/>
              Your friends' too?<br/>
              –let us <em>set you up</em>.
            </Typography>
          </Card>
          <Stack spacing={2} sx={{ width: '100%', mt: 2 }}>
            <EmailField variant="outlined" size="medium" fullWidth ref={emailInputRef}
              value={formState.email} onChange={handleEmailChange} handleConfirmResend={handleConfirmResend}
              error={!!formState.errorEmail} helperText={formState.errorEmail || ' '}
            />
            <UserNameField variant="outlined" size="medium" fullWidth ref={usernameInputRef}
              value={formState.username} onChange={handleUsernameChange}
              error={!!formState.errorUsername} helperText={formState.errorUsername || ' '}
            />
            <PasswordField variant="outlined" fullWidth ref={passwordInputRef}
              value={formState.password} onChange={handlePasswordChange}
              error={!!formState.errorPassword} helperText={formState.errorPassword || ' '}
            />

            {/* Legal acceptance gate. Required before Register becomes clickable. */}
            <FormControlLabel control={
                <Checkbox
                  checked={legalAccepted}
                  onChange={(_e, v) => setLegalAccepted(v)}
                  sx={{ alignSelf: 'flex-start', pt: 0 }}
                />
              }
              sx={{ alignItems: 'flex-start', m: 0 }}
              label={
                <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                  I have read and accept the{' '}
                  <Link component={RouterLink} to={ROUTES_PUBLIC.get('LEGAL_PRIVACY')!} target="_blank" rel="noopener">
                    Privacy Notice
                  </Link>{' '}
                  and the{' '}
                  <Link component={RouterLink} to={ROUTES_PUBLIC.get('LEGAL_TERMS')!}   target="_blank" rel="noopener">
                    Terms of Service
                  </Link>.
                </Typography>
              }
            />

            <Divider sx={{ my: 1 }}>Join Us today!</Divider>
            <Stack spacing={2} direction="row">
              <Button onClick={handleLogin} ref={loginNavButtonRef} variant="outlined" size="medium" fullWidth>Back to login</Button>
              <Divider orientation="vertical"/>
              <Button type="submit" disabled={!legalAccepted} variant="contained" size="medium" fullWidth>Register</Button>
            </Stack>          
          </Stack>
        </Paper>
      </Container>

      {/* -- MODALS FOR SUCCESS/FAILURE -- */}
      <RegisterSuccessModalSkeleton open={modalLoadingState}/>
      <RegisterSuccessModal
        open={modalSuccessOpenState}
        onClose={() => setModalSuccessOpenState(false)}
        onBackToLogin={handleLogin}
        userName={formState.username}
        email={formState.email}
        focusTarget={loginNavButtonRef.current ?? undefined}
      />
      <RegisterFailureModal
        open={modalFailureOpenState}
        onClose={() => {
          setModalFailureOpenState(false);

          /* setting focus to the input the error relates to */
          setTimeout(() => { // Wait for Dialog close animation + unmount
            if (apiRegMessage.toLowerCase().includes('email'))
              formState.setErrorEmail(apiRegMessage);
            else if (apiRegMessage.toLowerCase().includes('username')
              || apiRegMessage.toLowerCase().includes('user name'))
              formState.setErrorUsername(apiRegMessage);
            else
              formState.setErrorPassword(apiRegMessage);
          }, 150); // MUI default transition is 150ms
        }}
        onBackToLogin={handleLogin}
        apiMessage={apiRegMessage}
        focusTarget={formState.errorEmail ? emailInputRef.current ?? undefined : usernameInputRef.current ?? undefined}
      />
      <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center' }} autoHideDuration={4500} sx={{ marginTop: 1.5 }}
        open={emailSentToastOpen}  onClose={() => setEmailSentToastOpen(false)} transitionDuration={500}
        slotProps={{ clickAwayListener: { mouseEvent: false } }}>
          <Alert security='success' icon={<MarkEmailReadIcon sx={{fontSize: '1.7rem'}} />} sx={{fontSize: '1.1rem',
            boxShadow: `5px 5px 10px 0px #0000008f`, transition: 'box-shadow 500ms ease'}}>
            Confirmation email has been resent. You can check your inbox.
          </Alert>
      </Snackbar>
    </>
  );
}
