import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Stack, TextField, Button, Typography, Divider, CircularProgress, Paper,
  Box, List, Tooltip, IconButton, Skeleton, Alert } from '@mui/material';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import { useEndpointQuery, useEndpointMutation } from '#root/api/queryHooks';
import { api_GroupGet, api_GroupRename, api_GroupDelete,
  api_GroupMemberInvite, api_GroupMemberRole, api_GroupMemberKick } from '#root/api/endpoints';
import { Role, type GroupDetail, type MemberInfo } from '#root/lib/types';
import { useLoggedInUserStore } from '#root/clientdata/stores';
import { useAppSnackbar } from '#root/providers';
import MemberListItem from './MemberListItem.tsx';
import ConfirmDestructiveDialog from './ConfirmDestructiveDialog.tsx';
import { ConfirmTypedDeletionDialog } from '#root/components';

interface GroupEditFormProps {
  groupId: string; // called when the group is deleted/left (so parent can drop selection)
  onDeparted: () => void;
}

type PendingConfirm =
  | { kind: 'delete' }
  | { kind: 'kick'; member: MemberInfo }
  | { kind: 'leave' }
  | null;


export default function GroupEditForm({ groupId, onDeparted }: GroupEditFormProps) {
  const { user: loggedInName } = useLoggedInUserStore();
  const queryClient = useQueryClient();
  const snackbar = useAppSnackbar();

  /* fetch group detail via the api_GroupGet endpoint, keyed by groupId */
  const detailQuery = useEndpointQuery(
    ['groups', groupId, 'detail'],
    api_GroupGet,
    { groupId },
    { enabled: !!groupId }
  );
  const detail: GroupDetail | undefined =
    detailQuery.data && detailQuery.data.success ? detailQuery.data.data : undefined;

  /* --- rename --- */
  const [renameInput, setRenameInput] = useState('');
  useEffect(() => {
    if (detail) setRenameInput(detail.name);
  }, [detail?.id, detail?.name]);

  const renameMutation = useEndpointMutation(api_GroupRename);
  const isRenamePending = renameMutation.isPending;

  const renameDirty = !!detail && renameInput.trim().length > 0 && renameInput.trim() !== detail.name;
  const canRename = !!detail && !detail.isPersonal && detail.role === Role.Creator;

  const submitRename = async () => {
    if (!detail || !renameDirty || isRenamePending) return;
    const res = await renameMutation.mutateAsync({
      params: { groupId: detail.id },
      body: { newGroupName: renameInput.trim() }
    });
    if (res.success) {
      snackbar.success('Group successfully renamed.');
      await queryClient.invalidateQueries({ queryKey: ['groups'], exact: false });
    } else {
      snackbar.error(res.errorBody?.message ?? 'Could not rename group.');
    }
  };

  /* --- invite (add member by username) --- */
  const [inviteInput, setInviteInput] = useState('');
  const inviteMutation = useEndpointMutation(api_GroupMemberInvite);
  const isInvitePending = inviteMutation.isPending;
  const canInvite = !!detail && !detail.isPersonal && detail.role >= Role.Admin;

  const submitInvite = async () => {
    const userName = inviteInput.trim();
    if (!detail || userName.length === 0 || isInvitePending) return;
    const res = await inviteMutation.mutateAsync({
      params: { groupId: detail.id, userName }
    });
    if (res.success) {
      snackbar.success(res.data?.message ?? `${userName} added to the group.`);
      setInviteInput('');
      await queryClient.invalidateQueries({ queryKey: ['groups'], exact: false });
    } else {
      snackbar.error(res.errorBody?.message ?? `Could not add ${userName}.`);
    }
  };

  /* --- role change (promote/demote) --- */
  const roleMutation = useEndpointMutation(api_GroupMemberRole);
  const [roleChangingUserId, setRoleChangingUserId] = useState<string | null>(null);

  const submitRoleChange = async (member: MemberInfo, isPromotion: boolean) => {
    if (!detail) return;
    setRoleChangingUserId(member.userInfo.id);
    const res = await roleMutation.mutateAsync({
      params: { groupId: detail.id, userId: member.userInfo.id },
      body: { isPromotion }
    });
    setRoleChangingUserId(null);
    if (res.success) {
      snackbar.success(`${member.userInfo.name} is now ${isPromotion ? 'an admin' : 'a member'}.`);
      await queryClient.invalidateQueries({ queryKey: ['groups'], exact: false });
    } else {
      snackbar.error(res.errorBody?.message ?? 'Could not change role.');
    }
  };

  /* --- kick/leave/delete (destructive: confirm modal first) --- */
  const kickMutation = useEndpointMutation(api_GroupMemberKick);
  const deleteMutation = useEndpointMutation(api_GroupDelete);
  const [confirm, setConfirm] = useState<PendingConfirm>(null);
  const [kickingUserId, setKickingUserId] = useState<string | null>(null);

  const runKick = async (member: MemberInfo) => {
    if (!detail) return;
    setKickingUserId(member.userInfo.id);
    const res = await kickMutation.mutateAsync({
      params: { groupId: detail.id, userId: member.userInfo.id }
    });
    setKickingUserId(null);
    if (res.success) {
      snackbar.success(`${member.userInfo.name} was removed from the group.`);
      setConfirm(null);
      await queryClient.invalidateQueries({ queryKey: ['groups'], exact: false });
    } else {
      snackbar.error(res.errorBody?.message ?? 'Could not remove member.');
    }
  };

  const runLeave = async () => {
    if (!detail || !selfMember) return;
    setKickingUserId(selfMember.userInfo.id);
    const res = await kickMutation.mutateAsync({
      params: { groupId: detail.id, userId: selfMember.userInfo.id }
    });
    setKickingUserId(null);
    if (res.success) {
      snackbar.success(`You left "${detail.name}".`);
      setConfirm(null);
      await queryClient.invalidateQueries({ queryKey: ['groups'], exact: false });
      onDeparted();
    } else {
      snackbar.error(res.errorBody?.message ?? 'Could not leave group.');
    }
  };

  const runDelete = async () => {
    if (!detail) return;
    const res = await deleteMutation.mutateAsync({
      params: { groupId: detail.id }
    });
    if (res.success) {
      snackbar.success(`"${detail.name}" was deleted.`);
      setConfirm(null);
      await queryClient.invalidateQueries({ queryKey: ['groups'], exact: false });
      onDeparted();
    } else {
      snackbar.error(res.errorBody?.message ?? 'Could not delete group.');
    }
  };

  /* identify the row that represents the caller */
  const selfMember: MemberInfo | undefined = useMemo(() => {
    if (!detail || !loggedInName) return undefined;
    return detail.members.find(m => m.userInfo.name === loggedInName);
  }, [detail, loggedInName]);

  /* loading + error states */
  if (detailQuery.isLoading) {
    return (
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Stack spacing={2}>
          <Skeleton variant="text" width="40%" height={36} />
          <Skeleton variant="rounded" height={56} />
          <Skeleton variant="rounded" height={120} />
        </Stack>
      </Paper>
    );
  }
  if (!detail) {
    return (
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Alert severity="error">Could not load group details.</Alert>
      </Paper>
    );
  }

  const canDelete = detail.role === Role.Creator && !detail.isPersonal;
  const callerRole = detail.role;

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
      <Stack spacing={3}>
        {/* header */}
        <Stack direction="row" alignItems="center" spacing={1}>
          {detail.isPersonal && (
            <Tooltip title="Personal library - cannot be renamed or shared." arrow>
              <LockRoundedIcon color="action" />
            </Tooltip>
          )}
          <Typography variant="h6" sx={{ fontWeight: 700, flex: 1, minWidth: 0 }} noWrap>
            {detail.name}
          </Typography>
        </Stack>

        {/* rename block */}
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <TextField label="Group name" value={renameInput} onChange={(e) => setRenameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canRename && renameDirty && !isRenamePending) {
                e.preventDefault();
                submitRename();
              }
            }}
            disabled={!canRename || isRenamePending} fullWidth size="small"
            helperText={
              detail.isPersonal ? 'Your personal library cannot be renamed.' :
              detail.role !== Role.Creator ? 'Only the creator can rename a group.' :
              renameDirty ? 'Unsaved changes' : ' '
            }
          />
          <Button variant="contained"  onClick={submitRename} disabled={!canRename || !renameDirty || isRenamePending}
            startIcon={isRenamePending ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
            sx={{ mt: 0.5, whiteSpace: 'nowrap' }}
          >
            Save
          </Button>
        </Stack>

        <Divider />

        {/* invite block */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Add member</Typography>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <TextField label="Username" value={inviteInput} onChange={(e) => setInviteInput(e.target.value)}
              disabled={!canInvite || isInvitePending} fullWidth size="small" onKeyDown={(e) => { if (e.key === 'Enter') submitInvite(); }}
              helperText={
                detail.isPersonal ? 'Cannot invite users to your personal library.' :
                callerRole < Role.Admin ? 'Only admins or the creator can invite new members.' :
                ' '
              }
            />
            <Tooltip title="Invite this user" arrow>
              <span>
                <IconButton color="primary" onClick={submitInvite}
                  disabled={!canInvite || isInvitePending || inviteInput.trim().length === 0} sx={{ mt: 0.5 }}
                >
                  {isInvitePending ? <CircularProgress size={20} /> : <PersonAddRoundedIcon />}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Box>

        <Divider />

        {/* member list */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Members ({detail.memberCount})
          </Typography>
          <List disablePadding>
            {detail.members.map((m) => (
              <MemberListItem key={m.userInfo.id} member={m} callerRole={callerRole} isSelf={m.userInfo.name === loggedInName}
                onPromote={() => submitRoleChange(m, true)} onDemote={() => submitRoleChange(m, false)}
                onKick={() => setConfirm({ kind: 'kick', member: m })} onLeave={() => setConfirm({ kind: 'leave' })}
                isRoleChangePending={roleChangingUserId === m.userInfo.id} isKickPending={kickingUserId === m.userInfo.id}
              />
            ))}
          </List>
        </Box>

        {/* danger zone */}
        {canDelete && (
          <>
            <Divider />
            <Box>
              <Typography variant="subtitle2" color="error" sx={{ fontWeight: 700, mb: 1 }}>
                Danger zone
              </Typography>
              <Button
                variant="outlined" color="error" startIcon={<DeleteForeverRoundedIcon />}
                onClick={() => setConfirm({ kind: 'delete' })} disabled={deleteMutation.isPending}
              >
                Delete group
              </Button>
            </Box>
          </>
        )}
      </Stack>

      {/* destructive-action confirmation dialogs */}
      <ConfirmTypedDeletionDialog
        open={confirm?.kind === 'delete'}
        onClose={() => setConfirm(null)}
        onConfirm={runDelete}
        title="Delete this group?"
        description={
          <>This will permanently delete <b>{detail.name}</b> and all of its content (playlists, songs, etc.).
            All members <b>lose access to all content</b>. This action cannot be undone. </>
        }
        phrase={detail.name}
        confirmLabel="Delete group "
        isPending={deleteMutation.isPending}
      />
      <ConfirmDestructiveDialog
        open={confirm?.kind === 'kick'}
        onClose={() => setConfirm(null)}
        onConfirm={() => { if (confirm?.kind === 'kick') runKick(confirm.member)}}
        title="Remove this member?"
        description={
          confirm?.kind === 'kick'
            ? <><b>{confirm.member.userInfo.name}</b> will no longer have access to this group.</>
            : null
        }
        confirmLabel="Remove"
        isPending={!!kickingUserId}
      />
      <ConfirmDestructiveDialog
        open={confirm?.kind === 'leave'}
        onClose={() => setConfirm(null)}
        onConfirm={runLeave}
        title="Leave this group?"
        description={<>You will lose access to <b>{detail.name}</b>. The creator can re-invite you later.</>}
        confirmLabel="Leave"
        isPending={!!kickingUserId}
      />
    </Paper>
  );
}
