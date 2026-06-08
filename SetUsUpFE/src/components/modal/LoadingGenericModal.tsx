/* a generic modal loading spinner that blocks every action in a page until it's open */
import { Backdrop, Box, CircularProgress, Modal } from '@mui/material';

interface LoadingGenericModalProps {
  open: boolean;
}

export default function LoadingGenericModal({ open }: LoadingGenericModalProps) {
  return (
    <Modal open={open} aria-labelledby="loading-modal" aria-describedby="loading-spinner"
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      disableRestoreFocus closeAfterTransition slots={{ backdrop: Backdrop }}
      slotProps={{
        root: { tabIndex: -1 },
        backdrop: {
          timeout: 200,
          sx: {
            backgroundColor: 'rgba(0,0,0,0.35)', // standard dimming
            backdropFilter: 'blur(2px)',
          },
        },
      }}>
      {/* Transparent container, only spinner shows */}
      <Box tabIndex={-1} sx={{ pointerEvents: 'none' }}>
        <CircularProgress size={70} thickness={4}/>
      </Box>
    </Modal>
  );
}
