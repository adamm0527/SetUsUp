import { Dialog, DialogTitle, DialogContent, Stack, Typography, Zoom } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SetUsUpLogo from '../common/SetUsUpLogo.tsx';

export default function RegisterConfirmationModal() {
  return (
    <Dialog open={true} maxWidth="sm" fullWidth
      slotProps={{
        paper: { sx: { borderRadius: 3, p: 1, elevation: 0, backgroundColor: 'background.default' } }
    }}>
      <DialogTitle sx={{ textAlign: 'center', pb: 0, my: 1 }}>
        <SetUsUpLogo direction="column-reverse" iconSize={80}/>
          {/* Animated Success Icon */}
          <Zoom in style={{ transitionDelay: '200ms' }}>
            <Typography color='success' variant="h6" component='span' sx={{ mt: 2 }}>
              <CheckCircleIcon sx={{ display: 'inline', fontSize: 25, my: -0.5,
                color: 'success', animation: 'popIn 0.5s ease-out' }}/> Registration complete!
            </Typography>
          </Zoom>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ textAlign: 'center', mt: 1 }}>
          <Typography variant="body1">
            Your account has been successfully created.
          </Typography>
          <Typography variant="body1" sx={{backgroundColor: 'secondary.dark', px: 2, py: 1, borderRadius: 3}}>
            You can now close this browser tab, and go back to the login page to access your new account.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            From now on, you can log in using either your username or email address.
          </Typography>
        </Stack>
      </DialogContent>
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
