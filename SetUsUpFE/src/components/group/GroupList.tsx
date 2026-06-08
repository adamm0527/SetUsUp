import { Box, Button, Skeleton, Stack, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { type GroupInfo } from '#root/lib/types';
import GroupCard from './GroupCard.tsx';


interface GroupListProps {
  groups: GroupInfo[];
  isLoading: boolean;
  selectedId: string | null; // currently selected card id (null while in "create new" mode or no selection)
  onSelect: (id: string) => void; // user picked an existing group
  onStartCreate: () => void; // user pressed "+ New Group"
  isInCreateMode: boolean; // true if the right side is currently in 'create' mode -- gives feedback on the button
}


/* left panel of the master-detail layout: header + new-group button + scrollable list of cards */
export default function GroupList({
  groups, isLoading, selectedId, onSelect, onStartCreate, isInCreateMode
}: GroupListProps) {
  return (
    <Stack sx={{ height: '100%', minHeight: 0 }}>
      {/* header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, mb: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Your Groups{!isLoading && groups.length > 0 ? ` (${groups.length})` : ''}
        </Typography>
        <Button onClick={onStartCreate} variant={isInCreateMode ? 'contained' : 'outlined'} color="primary" size="small" startIcon={<AddRoundedIcon />}>
          New Group
        </Button>
      </Stack>

      {/* scrollable list */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 1,
        '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'divider', borderRadius: 3 },
      }}>
        <Stack spacing={1.25} sx={{ pb: 2 }}>
          {isLoading && (
            <>
              <Skeleton variant="rounded" height={92} />
              <Skeleton variant="rounded" height={92} />
              <Skeleton variant="rounded" height={92} />
            </>
          )}
          {!isLoading && groups.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              You're not in any groups yet. Create one to get started.
            </Typography>
          )}
          {!isLoading && groups.map((g) => (
            <GroupCard key={g.id} group={g} selected={g.id === selectedId} onSelect={() => onSelect(g.id)} />
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}
