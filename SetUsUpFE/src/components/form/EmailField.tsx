import { useRef, forwardRef, type MutableRefObject } from 'react';
import { TextField, type TextFieldProps, InputAdornment, Tooltip, IconButton } from '@mui/material';
import { Email } from '@mui/icons-material';


export type EmailFieldProps = TextFieldProps & {
  handleConfirmResend: () => void;
}

const EmailField = forwardRef<HTMLInputElement, EmailFieldProps>(({ handleConfirmResend, ...props }, ref) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const caption = 'Click to resend confirm email';
  

  return(
  <TextField label="Email" {...props}
      inputRef={(node) => {
        inputRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as MutableRefObject<HTMLInputElement | null>).current = node;
      }}
      slotProps={{
      input: {
        type: 'email',
        name: 'account-email',
        autoComplete: 'one-time-code', // disabling browser caching
        endAdornment: (
          <InputAdornment position="end">
            <Tooltip placement='bottom' arrow title={caption} slotProps={{
              popper: { // changing "closeness" of the tooltip with its popper
                modifiers: [{ name: 'offset', options: { offset: [0, -12] } }],
              }
            }}>
              <IconButton onClick={handleConfirmResend} color="tertiary" edge="end" tabIndex={-1} disableRipple aria-label={caption}>
                <Email/>
              </IconButton>
            </Tooltip>
          </InputAdornment>
        )
      }
    }}
    />
  );
});

export default EmailField;
