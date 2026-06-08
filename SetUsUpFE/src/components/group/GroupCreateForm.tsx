import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Stack, TextField, Button, Typography, Divider, CircularProgress, Paper } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useEndpointMutation } from '#root/api/queryHooks';
import { api_GroupCreate } from '#root/api/endpoints';
import { useLoggedInUserStore } from '#root/clientdata/stores';
import { useAppSnackbar } from '#root/providers';
import MemberNameChipInput from './MemberNameChipInput.tsx';


interface GroupCreateFormProps {
  onCreated: (newGroupId: string) => void; // called after a successful create with the new group id (so parent can select it)
  onCancel: () => void; // called when the user wants to back out without creating
}


export default function GroupCreateForm({ onCreated, onCancel }: GroupCreateFormProps) {
  const { user: loggedInName } = useLoggedInUserStore();
  const queryClient = useQueryClient();
  const snackbar = useAppSnackbar();

  const [name, setName] = useState('');
  const [memberNames, setMemberNames] = useState<string[]>([]);

  const trimmedName = name.trim();
  const nameError = useMemo(() => {
    if (name.length === 0) return null; // don't frustrate the user before they even start typing
    if (trimmedName.length === 0) return 'Group name cannot be empty.';
    return null;
  }, [name, trimmedName]);

  const createGroup = useEndpointMutation(api_GroupCreate);
  const isPending = createGroup.isPending;
  const canSubmit = trimmedName.length > 0 && !isPending;

  const submit = async () => {
    if (!canSubmit) return;
    const result = await createGroup.mutateAsync({
      body: { name: trimmedName, memberNames }
    });
    if (result.success) {
      snackbar.success(result.data?.message ?? 'Group created.');
      /* refetch dependent caches:
         - the groups list (this page + NavBar dropdown)
         - the user's selected group + selected playlist
           (Backend auto-selects the new group as the user's selected one, and clears their selected playlist)
         - the playlists dropdown (now belongs to the new group, expected empty) */
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['groups'], exact: false }),
        queryClient.refetchQueries({ queryKey: ['user', 'selectedGroup'], exact: true }),
        queryClient.refetchQueries({ queryKey: ['user', 'selectedPlaylist'], exact: true }),
        queryClient.refetchQueries({ queryKey: ['playlists'], exact: false })
      ]);
      setName('');
      setMemberNames([]);
      onCreated(''); // parent uses heuristic to pick up the new id from the refreshed list
    } else {
      snackbar.error(result.errorBody?.message ?? 'Could not create group.');
    }
  };

  /* Esc cancels the form (only when not mid-submit) */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPending, onCancel]);

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Create a new group</Typography>
          <Button onClick={onCancel} size="small" startIcon={<CloseRoundedIcon />} disabled={isPending}>
            Cancel
          </Button>
        </Stack>
        <Divider />

        <TextField label="Group name" required fullWidth value={name} onChange={(e) => setName(e.target.value)}
          error={!!nameError} helperText={nameError ?? 'A short, recognizable name for the group.'} autoFocus disabled={isPending}
        />

        <MemberNameChipInput value={memberNames} onChange={setMemberNames} disabled={isPending}
          excludeNames={loggedInName ? [loggedInName] : []}
          helperText="Optional. Press Enter after each username. They get verified only after submitting."
        />

        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ pt: 1 }}>
          <Button variant="contained" onClick={submit} disabled={!canSubmit}
            startIcon={isPending ? <CircularProgress size={16} color="inherit" /> : <AddRoundedIcon />}
          >
            Create group
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
