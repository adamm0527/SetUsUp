import { Box, Stack, Chip, CircularProgress, Typography } from '@mui/material';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { useEndpointQuery } from '#root/api/queryHooks';
import { api_GroupGet } from '#root/api/endpoints';
import { Role, type RoleType } from '#root/lib/types';
import { useLoggedInUserStore } from '#root/clientdata/stores';


interface GroupMembersTooltipContentProps {
  groupId: string;
}

/* tooltip body that lazily fetches a group's detail (only when the tooltip opens) */
export default function GroupMembersTooltipContent({ groupId }: GroupMembersTooltipContentProps) {
  const { user: loggedInName } = useLoggedInUserStore();

  const detailQuery = useEndpointQuery(
    ['groups', groupId, 'detail'],
    api_GroupGet,
    { groupId },
    {
      /* cache result for a minute so repeated hovers don't refetch unnecessarily.
         SignalR invalidations will still bust this when something actually changes. */
      staleTime: 60_000,
      gcTime: 60_000
    }
  );

  if (detailQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.5 }}>
        <CircularProgress size={14} />
        <Typography variant="body2">loading members...</Typography>
      </Box>
    );
  }

  const detail = detailQuery.data && detailQuery.data.success ? detailQuery.data.data : undefined;
  if (!detail) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 0.5 }}>
        Could not load members.
      </Typography>
    );
  }

  /* sort by role desc (Creator first, then Admins, then Members) - mirrors the detail page list */
  const sorted = [...detail.members].sort((a, b) => b.role - a.role);

  return (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
        Members ({detail.memberCount})
      </Typography>
      <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap' }}>
        {sorted.map((m) => (
          <MemberChip key={m.userInfo.id} name={m.userInfo.name} role={m.role}
            isSelf={!!loggedInName && m.userInfo.name === loggedInName} />
        ))}
      </Stack>
    </Box>
  );
}


/* small chip variant matching the look of RoleBadge but inline with the name */
function MemberChip({ name, role, isSelf }: { name: string; role: RoleType; isSelf: boolean }) {
  const variant: 'filled' | 'outlined' = (role === Role.Member) ? 'outlined' : 'filled';
  const color: 'primary' | 'secondary' | 'default' =
    role === Role.Creator || role === Role.Admin ? 'primary' : 'default';

  const Icon =
    (role === Role.Creator) ? StarRoundedIcon :
    (role === Role.Admin)   ? ShieldRoundedIcon :
                              PersonRoundedIcon;

  return (
    <Chip icon={<Icon />} label={isSelf ? `${name} (you)` : name} size="small"
      color={color} variant={variant} sx={{ fontWeight: role === Role.Member ? 500 : 600, maxWidth: 200 }}
    />
  );
}
