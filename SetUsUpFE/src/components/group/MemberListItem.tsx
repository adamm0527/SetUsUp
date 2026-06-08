import { ListItem, ListItemAvatar, ListItemText, Avatar, Stack, IconButton, Tooltip,
  Chip, CircularProgress, Link } from '@mui/material';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded';
import ExitToAppRoundedIcon from '@mui/icons-material/ExitToAppRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import InstagramIcon from '@mui/icons-material/Instagram';
import { Role, type MemberInfo, type RoleType } from '#root/lib/types';
import RoleBadge from './RoleBadge.tsx';


interface MemberListItemProps {
  member: MemberInfo;
  callerRole: RoleType; // the role of the currently logged-in user in this group
  isSelf: boolean; // true if this row represents the logged-in user themselves
  onPromote: () => void; // called when the creator presses promote
  onDemote: () => void; // called when the creator presses demote
  onKick: () => void; // called when caller kicks this member
  onLeave: () => void; // called when caller kicks themselves (leaves the group, if isSelf)
  /* pending flags to disable per-action buttons + show spinners */
  isRoleChangePending?: boolean;
  isKickPending?: boolean;
}


/* one row in the member list of GroupEditForm
   - shows username, role badge (and Instagram @handle if set)
   - shows action buttons depending on caller's privilege + whether this is "me" */
export default function MemberListItem({
  member, callerRole, isSelf,
  onPromote, onDemote, onKick, onLeave,
  isRoleChangePending, isKickPending
}: MemberListItemProps) {
  const igHandle = member.userInfo.instagramAccount?.replace(/^@+/, '') ?? null;
  const targetRole = member.role;

  /* permission logic mirroring the backend rules */
  const canPromote = !isSelf && callerRole === Role.Creator && targetRole === Role.Member;
  const canDemote  = !isSelf && callerRole === Role.Creator && targetRole === Role.Admin;
  /* kick: caller must have strictly higher privilege than target (and not target self via kick) */
  const canKick    = !isSelf && (callerRole > targetRole);
  /* leave: only the row that represents the caller, and only if not creator */
  const canLeave   = isSelf && targetRole !== Role.Creator;

  return (
    <ListItem
      sx={{ borderRadius: 2, bgcolor: isSelf ? 'action.hover' : 'background.paper', border: 1, borderColor: 'divider', mb: 1 }}
      secondaryAction={
        <Stack direction="row" spacing={0.5} alignItems="center">
          {canPromote && (
            <Tooltip title="Promote to admin" arrow>
              <span>
                <IconButton size="small" color="primary" onClick={onPromote} disabled={isRoleChangePending}>
                  {isRoleChangePending ? <CircularProgress size={16} /> : <ArrowUpwardRoundedIcon fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
          )}
          {canDemote && (
            <Tooltip title="Demote to member" arrow>
              <span>
                <IconButton size="small" color="warning" onClick={onDemote} disabled={isRoleChangePending}>
                  {isRoleChangePending ? <CircularProgress size={16} /> : <ArrowDownwardRoundedIcon fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
          )}
          {canKick && (
            <Tooltip title="Remove from group" arrow>
              <span>
                <IconButton size="small" color="error" onClick={onKick} disabled={isKickPending}>
                  {isKickPending ? <CircularProgress size={16} /> : <PersonRemoveRoundedIcon fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
          )}
          {canLeave && (
            <Tooltip title="Leave this group" arrow>
              <span>
                <IconButton size="small" color="error" onClick={onLeave} disabled={isKickPending}>
                  {isKickPending ? <CircularProgress size={16} /> : <ExitToAppRoundedIcon fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      }
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: isSelf ? 'primary.main' : 'background.default', color: isSelf ? 'primary.contrastText' : 'text.primary' }}>
          <PersonRoundedIcon />
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0, flexWrap: 'wrap', rowGap: 0.25 }}>
            <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {member.userInfo.name}
            </span>
            {isSelf && <Chip label="You" size="small" variant="outlined" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />}
            {igHandle && (
              <Tooltip arrow disableInteractive title={`Open @${igHandle} on Instagram`}>
                <Link
                  href={`https://instagram.com/${encodeURIComponent(igHandle)}`}
                  target="_blank" rel="noopener noreferrer" underline="hover" color="text.secondary"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.25,
                    fontSize: '0.78rem',
                    fontWeight: 500,
                  }}
                >
                  <InstagramIcon sx={{ fontSize: '0.95rem' }} />
                  @{igHandle}
                </Link>
              </Tooltip>
            )}            
          </Stack>
        }
        secondary={<RoleBadge role={member.role} size="small" />}
        slotProps={{ secondary: { component: 'div' } }}
      />
    </ListItem>
  );
}
