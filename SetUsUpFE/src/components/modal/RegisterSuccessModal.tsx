import { Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Typography, Zoom } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SetUsUpLogo from '../common/SetUsUpLogo.tsx';


interface SuccessRegisterModalProps {
  open: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
  userName: string;
  email: string;
  focusTarget?: HTMLElement | HTMLButtonElement;
}

export default function RegisterSuccessModalProps(props: SuccessRegisterModalProps) {
  const providerUrl = extractEmailProviderUrl(props.email);
  const handleEmailClick = () => {
    if (providerUrl)
      window.open(providerUrl, '_blank');
  }
  
  return (
    <Dialog open={props.open} onClose={props.onClose} maxWidth="sm" fullWidth disableRestoreFocus
      slotProps={{
        paper: { sx: { borderRadius: 3, p: 1, elevation: 0, backgroundColor: 'background.default' } },
        transition: { onExited: () => props.focusTarget?.focus() }
    }}>
      <DialogTitle sx={{ textAlign: 'center', pb: 0, my: 1 }}>
        <SetUsUpLogo direction="column-reverse" iconSize={80}/>
          {/* Animated Success Icon */}
          <Zoom in={props.open} style={{ transitionDelay: props.open ? '200ms' : '0ms' }}>
            <Typography color='success' variant="h6" component="span" sx={{ mt: 2 }}>
              <CheckCircleIcon sx={{ display: 'inline', fontSize: 25, my: -0.5,
                color: 'success', animation: 'popIn 0.5s ease-out' }}/> Registration Email sent!
            </Typography>
          </Zoom>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ textAlign: 'center', mt: 1 }}>
          <Typography variant="body1">
            Thank you for registering
            <Typography color='primary.main' component="span"> {props.userName}</Typography> !<br/>
          </Typography>
          <Typography variant="body1" sx={{backgroundColor: 'secondary.dark', px: 2, py: 1, borderRadius: 3
          }}>
            Please check your inbox (<Typography color='primary.main' component="span" sx={{ cursor: 'pointer',
              textDecoration: 'underline', userSelect: 'none', '&:hover': { opacity: 0.8, color: 'primary.light' }
            }} onClick={handleEmailClick}>
              {props.email}
            </Typography>)
            , including your spam folder, and click the confirmation link to activate your account.
          </Typography>          
          <Typography variant="body2" color="text.secondary">
            Once confirmed, you can log in and start using your account immediately.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions disableSpacing sx={{ justifyContent: 'center', flexDirection: 'column', gap: 1, p: 4 }}>
        <Button variant="contained" fullWidth onClick={props.onBackToLogin}>Back to Login</Button>
        <Button variant="outlined" fullWidth onClick={props.onClose}>Close</Button>
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

function extractEmailProviderUrl(email?: string): string | null {
  if (!email || !email.includes('@')) return null;
  const domain = email.split('@')[1].toLowerCase();

  /* handle the most common ones cleanly */
  const knownProviders: Record<string, string> = {
    'gmail.com': 'https://mail.google.com',
    'edu.bme.hu': 'https://outlook.live.com',
    'outlook.com': 'https://outlook.live.com',
    'hotmail.com': 'https://outlook.live.com',
    'yahoo.com': 'https://mail.yahoo.com'
  };

  if (knownProviders[domain])
    return knownProviders[domain];

  return `https://${domain}`; // fallback for any domain
}
