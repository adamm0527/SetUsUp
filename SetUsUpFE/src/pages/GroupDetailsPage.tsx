import { useState, useEffect, useMemo, useRef } from 'react';
import { Box, Container, Stack, useMediaQuery, useTheme } from '@mui/material';
import { useEndpointQuery } from '#root/api/queryHooks';
import { api_GroupsGetAll } from '#root/api/endpoints';
import { useUserSelectionStore } from '#root/clientdata/stores';
import { GroupList, GroupDetailPanel } from '#root/components';
import { type DetailMode } from '#root/components/group/GroupDetailPanel';


/* Page-level layout for /group-details:
   left = scrollable list of group cards | right = detail panel (empty/create/edit).
   On md+ the two panels live side-by-side; below md the list collapses underneath the detail.
   
   Selection sync (two-way) with NavBar:
   - external selGroup change (NavBar dropdown, or initial bootstrap) drives mode to edit
   - clicking a card on this page also pushes the selection back to selGroup,
     keeping the NavBar input in sync.*/
export default function GroupDetailsPage() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  /* groups list */
  const groupsQuery = useEndpointQuery(['groups'], api_GroupsGetAll);
  const groups = useMemo(
    () => (groupsQuery.data && groupsQuery.data.success ? groupsQuery.data.data : []),
    [groupsQuery.data]
  );

  /* the right pane's mode is independent of selection: it can be create/edit/empty */
  const [mode, setMode] = useState<DetailMode>({ kind: 'empty' });

   /* NavBar -> Page : when selGroup changes (from any source), reflect it on this page
     UNLESS the user is mid-create. We also leave 'edit' mode alone if it already matches. */
  const { selGroup, setSelGroup } = useUserSelectionStore();
  useEffect(() => {
    if (!selGroup?.id) return;
    if (!groups.some(g => g.id === selGroup.id)) return; // wait until the list has the group
    if (mode.kind === 'create') return; // don't blow away an active create form
    if (mode.kind === 'edit' && mode.groupId === selGroup.id) return; // no-op
    setMode({ kind: 'edit', groupId: selGroup.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selGroup?.id, groups]);

  /* SAFETY NET: if the currently-edited group disappears from the list (deleted, or user gets kicked from it),
     drop straight to empty mode so we don't render a stale form or briefly flash a "could not load" error 
     while the SignalR-driven selection reset is in flight. */
  useEffect(() => {
    if (mode.kind !== 'edit') return;
    if (groupsQuery.isLoading) return; // wait for first load before deciding anything's missing
    if (!groups.some(g => g.id === mode.groupId)) {
      setMode({ kind: 'empty' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, groupsQuery.isLoading, mode.kind, mode.kind === 'edit' ? mode.groupId : null]);

  /* When the groups list refreshes after a create, auto-select the freshly-created group.
     The Backend auto-selects it serverside, so once selGroup picks up the new id, this page will be switched to edit-mode for it (above effect).
     We still keep the below heuristic to pick-up the latest group when running offline/stale. */
  const knownIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (groups.length === 0) return;
    const newSet = new Set(groups.map(g => g.id));
    if (mode.kind === 'create' && knownIdsRef.current.size > 0) {
      const created = groups.find(g => !knownIdsRef.current.has(g.id));
      if (created) {
        setMode({ kind: 'edit', groupId: created.id });
        /* also push to NavBar's selection if not already in sync */
        if (created.id !== selGroup?.id) {
          setSelGroup({ id: created.id, name: created.name });
        }
      }
    }
    knownIdsRef.current = newSet;
    // intentionally NOT depending on mode to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  const selectedId = mode.kind === 'edit' ? mode.groupId : null;

  /* Page -> NavBar : clicking a card also updates the NavBar's selectedGroup (two-way sync) */
  const handleSelect = (id: string) => {
    setMode({ kind: 'edit', groupId: id });
    const g = groups.find(g => g.id === id);
    if (g && g.id !== selGroup?.id) {
      setSelGroup({ id: g.id, name: g.name });
    }
  };

  const handleStartCreate = () => setMode({ kind: 'create' });
  const handleCancelCreate = () => setMode({ kind: 'empty' });
  const handleCreated = (_id: string) => { /* the freshly created group will be auto-selected via the effects above */ };
  const handleDeparted = () => setMode({ kind: 'empty' });

  return (
    <Container maxWidth="xl" sx={{ py: 3, height: 'calc(100vh - 64px)' }}>
      <Stack direction={isDesktop ? 'row' : 'column'} spacing={2} sx={{ height: '100%', minHeight: 0 }}>
        {/* LEFT - group list */}
        <Box sx={{ width: isDesktop ? '32%' : '100%', maxWidth: isDesktop ? 420 : 'unset',
          height: isDesktop ? '100%' : 'auto', maxHeight: isDesktop ? '100%' : '45vh', minHeight: 0
        }}>
          <GroupList groups={groups} isLoading={groupsQuery.isLoading} selectedId={selectedId}
            onSelect={handleSelect} onStartCreate={handleStartCreate} isInCreateMode={mode.kind === 'create'}
          />
        </Box>

        {/* RIGHT - detail/create/empty view */}
        <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, height: isDesktop ? '100%' : 'auto', overflowY: 'auto', pr: 0.5 }}>
          <GroupDetailPanel
            mode={mode} onStartCreate={handleStartCreate} onCreated={handleCreated}
            onCancelCreate={handleCancelCreate} onDeparted={handleDeparted}
          />
        </Box>
      </Stack>
    </Container>
  );
}
