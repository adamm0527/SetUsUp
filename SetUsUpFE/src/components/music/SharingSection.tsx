import { useState } from 'react';
import { Box, Button, Chip, CircularProgress, IconButton, ListItem, MenuItem,
  Select, Skeleton, Stack, Tooltip, Typography } from '@mui/material';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded';
import { useEndpointMutation, useEndpointQuery } from '#root/api/queryHooks';
import { api_GroupsGetAll, api_SongAccessGet, api_SongShare, api_SongRevokeAccess } from '#root/api/endpoints';
import { useAppSnackbar } from '#root/providers';
import { useQueryClient } from '@tanstack/react-query';


interface SharingSectionProps {
  songId: string;
  /* The song's creator user id. Only the creator can share/revoke. */
  canEdit: boolean;
}


/* Sharing block in the SongDetailPanel.
   - Lists groups currently with access to the song (read-only chip rows).
   - Lets the creator share to another group via a Select + Share button.
   - Lets the creator revoke access for any non-creator group via a small icon button.
 
  Both queries below MUST coalesce a possible null `.data` to [] when no NoContent yields null data.
  (when the song has no shares yet, OR when the user belongs to no groups.) */
export default function SharingSection({ songId, canEdit }: SharingSectionProps) {
  const snackbar = useAppSnackbar();
  const queryClient = useQueryClient();

  /* current access list */
  const accessQuery = useEndpointQuery(
    ['songs', songId, 'access'],
    api_SongAccessGet,
    { songId },
    { enabled: !!songId }
  );
  const accesses = accessQuery.data?.success ? (accessQuery.data.data ?? []) : [];

  /* all groups the user is in -- for the "share to..." picker */
  const groupsQuery = useEndpointQuery(['groups'], api_GroupsGetAll);
  const allGroups = groupsQuery.data?.success ? (groupsQuery.data.data ?? []) : [];

  const sharedGroupIds = new Set(accesses.map((a) => a.groupId));
  const eligibleToShare = allGroups.filter((g) => !sharedGroupIds.has(g.id) && !g.isPersonal);

  const [pickedGroupId, setPickedGroupId] = useState<string>('');

  const shareMutation = useEndpointMutation(api_SongShare);
  const revokeMutation = useEndpointMutation(api_SongRevokeAccess);
  const [revokingGroupId, setRevokingGroupId] = useState<string | null>(null);

  const handleShare = async () => {
    if (!pickedGroupId) return;
    const res = await shareMutation.mutateAsync({ params: { songId, groupId: pickedGroupId } });
    if (res.success) {
      snackbar.success(res.data?.message ?? 'Song shared.');
      setPickedGroupId('');
      await queryClient.invalidateQueries({ queryKey: ['songs', songId, 'access'] });
      await queryClient.invalidateQueries({ queryKey: ['songs'] });
    } else {
      const msg = res.errorBody && 'message' in res.errorBody
        ? (res.errorBody as { message?: string }).message ?? 'Could not share song.'
        : 'Could not share song.';
      snackbar.error(msg);
    }
  };

  const handleRevoke = async (groupId: string, groupName: string) => {
    setRevokingGroupId(groupId);
    const res = await revokeMutation.mutateAsync({ params: { songId, groupId } });
    setRevokingGroupId(null);
    if (res.success) {
      snackbar.success(`Revoked access from "${groupName}".`);
      /* Order matters slightly:
         1. The per-song access list (refreshes the chips in this section immediately).
         2. The revoked group's songs list (removes the song from any cached view of that group).
         3. The per-song detail / related-keys caches (so a click on the song from any group
            doesn't serve stale "you have access" data from cache).
         4. A wildcard ['songs'] invalidation as a safety net for other groups' lists. */
      await queryClient.invalidateQueries({ queryKey: ['songs', songId, 'access'], exact: true });
      await queryClient.invalidateQueries({ queryKey: ['songs', groupId], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['songs', songId, 'detail'], exact: true });
      await queryClient.invalidateQueries({ queryKey: ['songs', songId, 'related-keys'], exact: true });
      await queryClient.invalidateQueries({ queryKey: ['songs'], exact: false });
    } else {
      const msg = res.errorBody && 'message' in res.errorBody
        ? (res.errorBody as { message?: string }).message ?? 'Could not revoke access.'
        : 'Could not revoke access.';
      snackbar.error(msg);
    }
  };

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Sharing</Typography>

      {accessQuery.isLoading && <Skeleton variant="rounded" height={40} />}

      {!accessQuery.isLoading && (
        <Stack spacing={0.75}>
          {accesses.map((a) => (
            <ListItem key={a.groupId} dense sx={{
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
              backgroundColor: 'background.default',
              py: 0.5,
            }} secondaryAction={
              canEdit && !a.isCreatorGroup ? (
                <Tooltip title="Revoke access" arrow disableInteractive>
                  <span>
                    <IconButton size="small" color="error"
                      onClick={() => handleRevoke(a.groupId, a.groupName)}
                      disabled={revokingGroupId === a.groupId}
                    >
                      {revokingGroupId === a.groupId
                        ? <CircularProgress size={16} />
                        : <PersonRemoveRoundedIcon fontSize="small" />}
                    </IconButton>
                  </span>
                </Tooltip>
              ) : a.isCreatorGroup ? (
                <Tooltip title="Creator's collection (cannot be revoked)" arrow disableInteractive>
                  <LockRoundedIcon fontSize="small" color="action" />
                </Tooltip>
              ) : null
            }>
              <Stack direction="row" alignItems="center" spacing={1}>
                <GroupRoundedIcon fontSize="small" color="action" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{a.groupName}</Typography>
                {a.isCreatorGroup && (
                  <Chip label="creator" size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                )}
              </Stack>
            </ListItem>
          ))}
        </Stack>
      )}

      {/* share-to-new-group control (creator only) */}
      {canEdit && eligibleToShare.length > 0 && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
          <Select size="small" value={pickedGroupId} displayEmpty
            onChange={(e) => setPickedGroupId(String(e.target.value))} sx={{ flex: 1 }}
          >
            <MenuItem value="" disabled>
              <em>Share with another group…</em>
            </MenuItem>
            {eligibleToShare.map((g) => (
              <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
            ))}
          </Select>
          <Button variant="contained"
            onClick={handleShare} disabled={!pickedGroupId || shareMutation.isPending}
            startIcon={shareMutation.isPending ? <CircularProgress size={14} color="inherit" /> : null}
          >
            Share
          </Button>
        </Stack>
      )}

      {canEdit && eligibleToShare.length === 0 && allGroups.length > 1 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          Already shared with every group you're a member of.
        </Typography>
      )}
    </Box>
  );
}
