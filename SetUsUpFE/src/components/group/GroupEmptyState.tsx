import { Box, Stack, Typography, Button } from '@mui/material';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';


interface GroupEmptyStateProps {
  onStartCreate: () => void;
}


/* placeholder shown in the right pane when nothing is selected and we're not creating */
export default function GroupEmptyState({ onStartCreate }: GroupEmptyStateProps) {
  return (
    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack alignItems="center" spacing={2} sx={{ textAlign: 'center', maxWidth: 360 }}>
        <GroupsRoundedIcon sx={{ fontSize: 72, color: 'text.disabled' }} />
        <Typography variant="h6" color="text.secondary">
          Pick a group to manage
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a group on the left to view its members and options,
          or create a new group from scratch.
        </Typography>
        <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={onStartCreate}>
          New Group
        </Button>
      </Stack>
    </Box>
  );
}
