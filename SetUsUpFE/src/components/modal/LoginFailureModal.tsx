import { useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Typography, Zoom } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import SetUsUpLogo from '../common/SetUsUpLogo.tsx';


interface FailureRegisterModalProps {
  open: boolean;
  onClose: () => void;
  oppositePref: string;
  onOppositePref: () => void;
  apiMessage: string;
  focusTarget?: HTMLElement | null;
}

export default function RegisterFailureModalProps(props: FailureRegisterModalProps) {
  const oppositePrefRef = useRef(props.oppositePref); // so that toggle caption won't re-render immediately
  const oppositePrefCaption = `Login with ${oppositePrefRef.current}`;
  const detailedCaption = `You can try again or choose to log in with your ${oppositePrefRef.current} instead.`;

  return (
    <Dialog open={props.open} onClose={props.onClose} maxWidth="sm" fullWidth disableRestoreFocus
      slotProps={{
        paper: { sx: { borderRadius: 3, p: 1, elevation: 0, backgroundColor: 'background.default' } },
        transition: { onExited: () => props.focusTarget?.focus()}
    }}>
      <DialogTitle sx={{ textAlign: 'center', pb: 0, my: 1 }}>
        <SetUsUpLogo direction="column-reverse" iconSize={80}/>
          {/* Animated Success Icon */}
          <Zoom in={props.open} style={{ transitionDelay: props.open ? '200ms' : '0ms' }}>
            <Typography color='error' variant="h6" component='span' sx={{ mt: 2 }}>
              <ErrorIcon sx={{ display: 'inline', fontSize: 25, my: -0.5,
                color: 'error', animation: 'popIn 0.5s ease-out' }}/> Login failed!
            </Typography>
          </Zoom>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ textAlign: 'center', mt: 1 }}>
          <Typography variant="body2">Something went wrong while trying to log you in:</Typography>
          {/* API error message */}      
          <Typography variant="body1" color="error.light" sx={{
              backgroundColor: 'warning.contrastText', px: 2, py: 1, borderRadius: 3
          }}>
            {props.apiMessage}
          </Typography>
          <Typography variant="body2" color="text.secondary">{detailedCaption}</Typography>
        </Stack>
      </DialogContent>
      <DialogActions disableSpacing sx={{ justifyContent: 'center', flexDirection: 'column', gap: 1, p: 4 }}>
        <Button variant="contained" fullWidth onClick={props.onClose}>Try again</Button>
        <Button variant="outlined" fullWidth onClick={props.onOppositePref}>{oppositePrefCaption}</Button>
      </DialogActions>
      {/* Keyframe animation for the success icon */}
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
