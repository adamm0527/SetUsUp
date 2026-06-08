import { Box, Fade } from '@mui/material';
import GroupEmptyState from './GroupEmptyState.tsx';
import GroupCreateForm from './GroupCreateForm.tsx';
import GroupEditForm from './GroupEditForm.tsx';


export type DetailMode =
  | { kind: 'empty' }
  | { kind: 'create' }
  | { kind: 'edit'; groupId: string };


interface GroupDetailPanelProps {
  mode: DetailMode;
  onStartCreate: () => void;
  onCreated: (newGroupId: string) => void;
  onCancelCreate: () => void;
  onDeparted: () => void;
}


/* right pane of the master-detail layout. Switches between empty/create/edit modes
   via a Fade transition keyed on the mode/groupId, so React re-mounts the inner content for a clean rerender when switching cards. */
export default function GroupDetailPanel({
  mode, onStartCreate, onCreated, onCancelCreate, onDeparted
}: GroupDetailPanelProps) {

  const renderInner = () => {
    switch (mode.kind) {
      case 'create':  return <GroupCreateForm onCreated={onCreated} onCancel={onCancelCreate} />;
      case 'edit':    return <GroupEditForm key={mode.groupId} groupId={mode.groupId} onDeparted={onDeparted} />;
      case 'empty':
      default:        return <GroupEmptyState onStartCreate={onStartCreate} />;
    }
  };

  /* a key derived from mode helps Fade retrigger when switching between modes/groups */
  const fadeKey =
    mode.kind === 'edit' ? `edit:${mode.groupId}` :
    mode.kind === 'create' ? 'create' : 'empty';

  return (
    <Box sx={{ height: '100%' }}>
      <Fade in key={fadeKey} timeout={200}>
        <Box sx={{ height: '100%' }}>
          {renderInner()}
        </Box>
      </Fade>
    </Box>
  );
}
