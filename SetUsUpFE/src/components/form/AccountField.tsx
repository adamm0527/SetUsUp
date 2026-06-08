import { useRef, forwardRef, useEffect, type ChangeEvent, type MutableRefObject } from 'react';
import { TextField, type TextFieldProps, IconButton, InputAdornment, Tooltip } from '@mui/material';
import { AccountCircle, Email } from '@mui/icons-material';
import { useLoginPreferenceStore } from '#root/clientdata/stores';


const AccountField = forwardRef<HTMLInputElement, TextFieldProps>((props, ref) => {
  /* states */
  const togglePreferenceState = useLoginPreferenceStore((store) => store.togglePref);
  const loginPreferenceState = useLoginPreferenceStore((store) => store.pref);
  const loginWithEmailState = (loginPreferenceState === 'email'); // if true, email is used for login
  const inputRef = useRef<HTMLInputElement | null>(null); // for accessing input field in event handler
  const caption = loginWithEmailState ? 'Login with username' : 'Login with email';

  const handleToggle = () => {
    togglePreferenceState();
    /* give focus back to the input field, so user can continue typing without disruption */
    inputRef.current!.focus();
  };

  /* fire parent's onChange AFTER the preference has changed */
  useEffect(() => {
    if (!props.onChange || !inputRef.current) return;

    const fakeEvent = {
      target: inputRef.current,
    } as ChangeEvent<HTMLInputElement>;
    /* thanks to this, error labels update on login mode toggling */
    props.onChange(fakeEvent);
  }, [loginPreferenceState]); // runs each time email/username toggles

  return (
    <TextField label={loginWithEmailState ? "Email" : "Username"} {...props}
     inputRef={(node) => {
        inputRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as MutableRefObject<HTMLInputElement | null>).current = node;
      }}
      slotProps={{
        input: {
          type: loginWithEmailState ? 'email' : 'text',
          name: `account-${loginWithEmailState ? 'email' : 'text'}`,
          autoComplete: 'one-time-code', // disabling browser caching, even when type is 'text'
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip placement='bottom' arrow title={caption} slotProps={{
                popper: { // changing "closeness" of the tooltip with its popper
                  modifiers: [{ name: 'offset', options: { offset: [0, -12] } }],
                }
              }}>
                <IconButton edge="end" onClick={handleToggle} tabIndex={-1} disableRipple aria-label={caption}>
                  {loginWithEmailState ? <AccountCircle/> : <Email/>}
                </IconButton>
              </Tooltip>
            </InputAdornment>
          )
        }
      }}
    />
  );
})

export default AccountField;
