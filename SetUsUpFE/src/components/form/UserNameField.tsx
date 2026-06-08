import { useRef, forwardRef, type MutableRefObject } from 'react';
import { TextField, type TextFieldProps, InputAdornment, Tooltip, IconButton } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';

const UserNameField = forwardRef<HTMLInputElement, TextFieldProps>((props, ref) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const caption = 'Enter your username';

  return(
  <TextField label="Username" {...props}
      inputRef={(node) => {
        inputRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as MutableRefObject<HTMLInputElement | null>).current = node;
      }}
      slotProps={{
      input: {
        type: 'text',
        name: 'account-username',
        autoComplete: 'one-time-code', // disabling browser caching
        endAdornment: (
          <InputAdornment position="end">
            <Tooltip placement='bottom' arrow title={caption} slotProps={{
              popper: { // changing "closeness" of the tooltip with its popper
                modifiers: [{ name: 'offset', options: { offset: [0, -12] } }],
              }
            }}>
              <IconButton onClick={() => inputRef.current!.focus()} color="tertiary" edge="end" tabIndex={-1} disableRipple aria-label={caption}>
                <AccountCircle/>
              </IconButton>
            </Tooltip>
          </InputAdornment>
        )
      }
    }}
    />
  );
});

export default UserNameField;
