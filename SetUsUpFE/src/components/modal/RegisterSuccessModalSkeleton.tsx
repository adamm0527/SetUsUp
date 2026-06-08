import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Stack, Skeleton } from '@mui/material';

interface SuccessRegisterModalProps { open: boolean; }

export default function RegisterSuccessModalSkeleton({open} : SuccessRegisterModalProps) {
  return (
    <Dialog open={open} maxWidth="sm" fullWidth
      slotProps={{
        paper: { sx: { borderRadius: 3, p: 2, elevation: 0, backgroundColor: 'background.default' } }
      }}>
      <DialogTitle sx={{ textAlign: 'center', pb: 0, my: 1 }}>
        {/* Logo placeholder */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Skeleton variant="circular" width={80} height={80} />
        </Box>

        {/* Center success icon + title */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Skeleton variant="text" width={200} height={32} />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ textAlign: 'center', mt: 1 }}>
          <Skeleton variant="text" width="80%" height={28} sx={{ mx: 'auto' }} />
          <Skeleton variant="text" width="95%" height={28} sx={{ mx: 'auto' }} />
          <Skeleton variant="text" width="60%" height={22} sx={{ mx: 'auto' }} />
        </Stack>
      </DialogContent>

      <DialogActions disableSpacing sx={{ justifyContent: 'center', flexDirection: 'column', gap: 2, p: 3 }}>
        {/* Buttons get skeleton too */}
        <Skeleton variant="rounded" width="100%" height={40} />
        <Skeleton variant="rounded" width="100%" height={40} />
      </DialogActions>
    </Dialog>
  );
}
