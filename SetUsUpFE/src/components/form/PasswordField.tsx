import { useState, useRef, forwardRef, type ChangeEvent, type MutableRefObject } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { TextField, type TextFieldProps, IconButton, InputAdornment, Tooltip,
  Popper, Paper, Typography, List, ListItem, ListItemIcon, ListItemText} from '@mui/material';
import { Visibility, VisibilityOff, CheckCircleOutline, RadioButtonUnchecked, HelpOutlineRounded } from '@mui/icons-material';
import { passwordRequirements } from '#root/lib/validation/loginSchema';
import { ROUTES_PUBLIC } from '#root/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

interface PasswordFieldExtraProps {
  withForgotPassword?: boolean; // if true, an IconButton appears inside navigating to /forgot-password
}
type PasswordFieldProps = TextFieldProps & PasswordFieldExtraProps;


const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(({ withForgotPassword, ...props }, ref ) => {
  /* states */
  const [showPwState, setShowPwState] = useState(false); // if true, password should be visible
  const [valueState, setValueState] = useState(''); // current value of the password
  const [popupOpenState, setPopupOpenState] = useState(false); // if true, the helper popup should be visible
  const inputRef = useRef<HTMLInputElement | null>(null); // for accessing input field in event handler
  const caption = showPwState ? 'Hide password' : 'Show password';
  const navigate = useNavigate();

  /* event handlers */
  const handleToggle = () => {
    setShowPwState((prev) => !prev);
    /* give focus back to the input field, so user can continue typing without disruption */
    inputRef.current?.focus();
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValueState(e.target.value);
    props.onChange?.(e); // calling parent event handler !
  };
  const handleForgotClick = () => {
    navigate({ to: ROUTES_PUBLIC.get('FORGOT_PASSWORD')! });
  };

  return (
    <>
      <TextField label={withForgotPassword ? "Password" : "New password"} {...props}
        value={valueState} onChange={handleChange}
        onFocus={() => setPopupOpenState(true)} onBlur={() => setPopupOpenState(false)}

        inputRef={(node) => {
          inputRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as MutableRefObject<HTMLInputElement | null>).current = node;
        }}

        slotProps={{
          input: {
            type: showPwState ? 'text' : 'password', // input is masked (*****) when 'password'
            name: 'account-password',
            autoComplete: 'one-time-code', // disabling browser caching, even when type is 'text'
            endAdornment: (
              <InputAdornment position="end">
                {/* Forgot-password icon */}
                {withForgotPassword && (
                  <Tooltip placement='bottom' arrow title="Forgot password?" slotProps={{
                    popper: { modifiers: [{ name: 'offset', options: { offset: [0, -12] } }] }
                  }}>
                    <IconButton edge="end" onClick={handleForgotClick}
                      disableRipple tabIndex={-1} aria-label="Forgot password"
                    >
                      <HelpOutlineRounded fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip placement='bottom' arrow title={caption} slotProps={{
                  popper: { // changing "closeness" of the tooltip with its popper
                    modifiers: [{ name: 'offset', options: { offset: [0, -12] } }],
                  }
                }}>
                  <IconButton edge="end" onClick={handleToggle}
                    disableRipple tabIndex={-1} aria-label={caption}
                  >
                    {showPwState ? <VisibilityOff/> : <Visibility/>}
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            )
          }
        }}
      />
      <Popper open={popupOpenState} anchorEl={inputRef.current} placement="left" sx={{ width: 'fit-content' }}
        modifiers={[
          { name: 'offset', options: { offset: [0, 16] } },
          { name: 'preventOverflow', options: { padding: 8 } },
        ]}>
        <AnimatePresence>
          {popupOpenState && (
            <motion.div
              key="pw-requirements"
              initial={{ opacity: 0, scale: 0.95, x: -8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}     
            >
              <Paper elevation={1} sx={(theme) => ({
                p: 1,
                boxShadow: 3,
                border: `1px solid ${theme.palette.divider}`,
                minWidth: 180,
                position: 'relative',
                ml: 150
              })}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 500 }}>Password must include:</Typography>
                <List dense disablePadding>
                  {passwordRequirements.map((req) => {
                    const satisfied = req.test.test(valueState);
                    return (
                      <ListItem key={req.label} sx={{ py: 0.3 }} disableGutters>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          {satisfied
                            ? (<CheckCircleOutline color="success" fontSize="small"/>)
                            : (<RadioButtonUnchecked color="disabled" fontSize="small"/>)
                          }
                        </ListItemIcon>
                        <ListItemText primary={req.label} slotProps={{ primary: { typography : {
                          fontSize: '0.8rem',
                          color: satisfied ? 'text.primary' : 'text.secondary'
                        }}}}/>
                      </ListItem>
                    );
                  })}
                </List>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      </Popper>
    </>
  );
});

export default PasswordField;
