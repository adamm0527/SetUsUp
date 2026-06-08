import { useEffect, useState, useRef, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useRouter, Link as RouterLink } from '@tanstack/react-router';
import { Container, Stack, Paper, Card, Typography, Button, Divider, Link } from '@mui/material';
import { SetUsUpLogo, AccountField, PasswordField, ToggleThemeMode,
  LoadingGenericModal, LoginFailureModal } from '#root/components';
import { loginWithUsernameSchema, loginWithEmailSchema, INVALID_EMAIL_MESSAGE,
  TOO_SHORT_USERNAME_MESSAGE, TOO_LONG_USERNAME_MESSAGE, 
  EMPTY_PASSWORD_MESSAGE} from '#root/lib/validation/loginSchema';
import { MIN_USERNAME_LEN, MAX_USERNAME_LEN, ROUTES_PUBLIC } from '#root/lib/constants';
import { useLoginPreferenceStore, useAuthFormStore, useAuthTokenStore,
  useLastVisitedPageStore, useLoggedInUserStore } from '#root/clientdata/stores';
import { api_UserLoginWithEmail, api_UserLoginWithUserName } from '#root/api/endpoints';
import { useEndpointMutation, useApiErrorMessage } from '#root/api/queryHooks';
import type { JwtResponse } from '#root/lib/types';
import { routesPreloadAuthed } from '#root/providers';


export default function LoginPage() {
  /* --- states & hooks --- */
  const togglePreferenceState = useLoginPreferenceStore((store) => store.togglePref);
  const loginPrefState = useLoginPreferenceStore((store) => store.pref);
  const formSchema = (loginPrefState === 'email') ? loginWithEmailSchema : loginWithUsernameSchema;
  const formState = useAuthFormStore(); // stores all input values and error helper labels
  const accountInputRef = useRef<HTMLInputElement | null>(null); // used when account input needs focus
  const passwordInputRef = useRef<HTMLInputElement | null>(null); // used when password input needs focus
  const navigate = useNavigate(); // used for navigating to register page and login restricted area
  const router = useRouter(); // used for smooth async preloading the authed pages all at once during logging in
  const [modalLoadingState, setModalLoadingState] = useState(false);
  const [modalFailureOpenState, setModalFailureOpenState] = useState(false);
  const lastOrDefaultAuthRoute = useLastVisitedPageStore().route; // when logged in, navigate here
  const { setAuth } = useAuthTokenStore(); // used for storing the jwt upon successful login
  const { setUser } = useLoggedInUserStore(); // used for storing the username upon successful login
  const api_loginWithEmail = useEndpointMutation(api_UserLoginWithEmail); // email login endpoint
  const api_loginWithUserName = useEndpointMutation(api_UserLoginWithUserName); // username login endpoint
  const activeMutation = (loginPrefState === 'email') ? api_loginWithEmail : api_loginWithUserName;
  const apiMessage = useApiErrorMessage(activeMutation, "login");


  /* --- on mount: determining where to put focus after page loaded --- */
  useEffect(() => {
    const accEmpty = formState.getAccount(loginPrefState) === '';
    const accError = formState.getErrorAccount(loginPrefState).length > 0;
    const pwEmpty = formState.password === '';
    const pwError = formState.errorPassword.length > 0;

    if (accEmpty && pwEmpty && !accError && !pwError)
      return; // if whole form is empty, we don't set focus: let user decide where to start
    
    if (accEmpty || accError) // if account not filled correctly yet, focus there
      accountInputRef.current!.focus();
    else if (pwEmpty || pwError) // priority downward: if password faulty, focus there
      passwordInputRef.current!.focus();

    if (formState.triedSubmit)
      isInputValid();
  }, []);


  /* --- event handlers for form-validation --- */

  const handleAccountChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const newAcc = ev.target.value as string;
    formState.setAccount(loginPrefState, newAcc);
    /* live-validation help for the user if already submitted without success */
    if (formState.triedSubmit) {
      if (loginPrefState === 'username') { // validating based on username rules
        if (newAcc.length >= MIN_USERNAME_LEN && newAcc.length <= MAX_USERNAME_LEN)
          formState.setErrorUsername(''); // removing error state if user fixed the input
        else if (newAcc.length < MIN_USERNAME_LEN)
          formState.setErrorUsername(TOO_SHORT_USERNAME_MESSAGE);
        else
          formState.setErrorUsername(TOO_LONG_USERNAME_MESSAGE);
      } else { // validating based on email rules
        /* re-run validation (for email only) */
        const emailResult = loginWithEmailSchema.pick({ account: true }).safeParse({ account: newAcc });
        formState.setErrorEmail(emailResult.success ? '' : INVALID_EMAIL_MESSAGE);
      }
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
      const pwResult = formSchema.pick({ password: true }).safeParse({ password: newPw });
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
      account: formState.getAccount(loginPrefState),
      password: formState.password
    };
    const result = formSchema.safeParse(currInputState);
    /* handling input errors */
    if (!result.success) {
      /* storing all issues into a dictionary to display later */
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as string;
        if (!fieldErrors[path]) fieldErrors[path] = issue.message;
        else fieldErrors[path] += `, ${issue.message}`;
      }
      formState.setErrorAccount(loginPrefState, fieldErrors.account ?? '');
      if (formState.password === '') formState.setErrorPassword(EMPTY_PASSWORD_MESSAGE);
      else formState.setErrorPassword(fieldErrors.password ? `Missing: ${fieldErrors.password}` : '');
      /* setting focus to the first culprit input */
      if (fieldErrors.account)
        accountInputRef.current?.focus();
      else
        passwordInputRef.current?.focus();
      
      return false;
    }
    return true;
  }
  
  async function performLogin() {
    if (loginPrefState === 'email') { // performing login with email
      return await api_loginWithEmail.mutateAsync({
        body: { email: formState.email, password: formState.password }
      });
    } else { // performing login with username
      return await api_loginWithUserName.mutateAsync({
        body: { userName: formState.username, password: formState.password }
      })
    }
  }

  async function handleSuccessfulLogin({ token, validTo }: JwtResponse) {
    setAuth(token, validTo);
    setUser(formState.username);

    // preloading authed pages before removing loading spinner
    await routesPreloadAuthed(router);

    // smooth UX: now we can remove the spinner
    setModalLoadingState(false);

    formState.reset(); // clearing form (for the next login in the future)
    navigate({ to: lastOrDefaultAuthRoute });
  }
  
  const handleSubmit = async (ev: FormEvent) => { // used by the Login button
    /* clientside form validation */
    ev.preventDefault();
    formState.setTriedSubmit();
    if (!isInputValid() || formState.hasAnyLoginError(loginPrefState))
      return false;

    /* displaying loading modal until api response */
    setModalLoadingState(true);

    /* clientside validation passed, api can now be called */
    try {
      const res = await performLogin();
      
      /* response received from API */
      if (!res.success) {
        setModalLoadingState(false);
        setModalFailureOpenState(true);
      } else {
        handleSuccessfulLogin(res.data);
      }
    } catch (err) {
      setModalLoadingState(false);
      setModalFailureOpenState(true);
    }
  };
  
  const handleRegistration = () => {
    formState.resetPassword();
    navigate({ to: ROUTES_PUBLIC.get('REGISTER')! });
  };


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
          <Stack spacing={2} sx={{ width: '100%', height: '360px', mt: 2 }}>
            <AccountField variant="outlined" size="medium" fullWidth ref={accountInputRef}
              value={formState.getAccount(loginPrefState)} onChange={handleAccountChange}
              error={!!formState.getErrorAccount(loginPrefState)} helperText={formState.getErrorAccount(loginPrefState) || ' '}
            />
            <PasswordField variant="outlined" fullWidth ref={passwordInputRef}
              value={formState.password} onChange={handlePasswordChange}
              error={!!formState.errorPassword} helperText={formState.errorPassword || ' '}
              withForgotPassword
            />
            {/* "Forgot password?" navigates to the public /forgot-password page where the user requests a reset email.*/}
            <Button type="submit" variant="contained" size="large" fullWidth>Login</Button>
            <Divider className="stack-divider" sx={{ '&.stack-divider': { mt: 6.11 } }}>OR</Divider>
            <Button onClick={handleRegistration} variant="outlined" size="large" fullWidth>Register</Button>
            {/* Legal-doc footer links so anyone can read the Privacy Notice / ToS before deciding to register.*/}
            <Stack direction="row" justifyContent="center" spacing={2} sx={{ pt: 1 }}>
              <Link component={RouterLink} to={ROUTES_PUBLIC.get('LEGAL_PRIVACY')!} variant="caption" color="text.secondary">
                Privacy
              </Link>
              <Link component={RouterLink} to={ROUTES_PUBLIC.get('LEGAL_TERMS')!} variant="caption" color="text.secondary">
                Terms
              </Link>
            </Stack>
          </Stack>
        </Paper>
      </Container>

      {/* -- MODALS FOR LOADING/FAILURE -- */}
      <LoadingGenericModal open={modalLoadingState}/>
      <LoginFailureModal
        key={`${loginPrefState}-error-modal`} // forcing re-render upon preference state (symbiosis with useRef)
        open={modalFailureOpenState}
        onClose={() => {
          setModalFailureOpenState(false);

          /* setting focus to the input the error relates to */
          setTimeout(() => { // Wait for Dialog close animation + unmount
            if (apiMessage.includes('no user') || apiMessage.includes('email') || apiMessage.includes('user name'))
              formState.setErrorAccount(loginPrefState, apiMessage);
            else
              formState.setErrorPassword(apiMessage);
          }, 150); // MUI default transition is 150ms
        }}
        oppositePref={(loginPrefState === 'email') ? 'username' : 'email'}
        onOppositePref={() => { setModalFailureOpenState(false); togglePreferenceState(); } }
        apiMessage={apiMessage}
        focusTarget={formState.errorPassword ? passwordInputRef!.current : accountInputRef!.current}
      />
    </>
  );
}
