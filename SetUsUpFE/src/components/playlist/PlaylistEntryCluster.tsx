import { Box, Paper, Stack } from '@mui/material';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent, } from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import type { PlaylistEntryInfo, TagCategoryList } from '#root/lib/types';
import PlaylistEntryRow from './PlaylistEntryRow.tsx';


/* A cluster is one MASTER entry (withPrev=false) plus its consecutive WithPrev followers.
   Visually a cluster is a single Paper. Inside:
     - the master row at the top
     - any followers rendered indented BELOW the master, each in their own dashed sub-Paper */

export interface ClusterModel {
  master: PlaylistEntryInfo;
  followers: PlaylistEntryInfo[];
}

interface PlaylistEntryClusterProps {
  cluster: ClusterModel;
  masterVisibleNr: number; // 1-based position/Nr for this cluster's master, only couting masters
  clusterStartFlatIndex: number; // 0-based position of this cluster's master inside whole flat list
  totalFlatEntries: number; // total number of entries (master + all followers)
  expandedId: string | null;
  onExpandToggle: (entryId: string) => void;
  onEntryDeleted: () => void;
  coverUrlBySongId?: Record<string, string | null | undefined>;
  tagHierarchy?: TagCategoryList | null;
  displayedTagGroupIds?: string[];
  onFollowerReorder: (masterId: string, newFollowerOrder: string[]) => void;
}

export default function PlaylistEntryCluster({
  cluster, masterVisibleNr, clusterStartFlatIndex, totalFlatEntries,
  expandedId, onExpandToggle, onEntryDeleted,
  coverUrlBySongId, tagHierarchy, displayedTagGroupIds,
  onFollowerReorder,
}: PlaylistEntryClusterProps) {
  /* Outer-context sortable for the master. The transform applies to the whole wrapper Box, so
     the Paper (master + nested followers) drags as a unit. */
  const masterSortable = useSortable({ id: cluster.master.id });

  const wrapperStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(masterSortable.transform),
    transition: masterSortable.transition,
    opacity: masterSortable.isDragging ? 0.55 : 1,
    zIndex: masterSortable.isDragging ? 5 : 'auto',
  };

  const hasFollowers = cluster.followers.length > 0;

  /* Inner dnd-kit setup for follower reordering.
     Scoped to this cluster: nested DndContexts don't bubble drag events to their parent. */
  const followerSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleFollowerDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentIds = cluster.followers.map((f) => f.id);
    const oldIndex = currentIds.indexOf(active.id as string);
    const newIndex = currentIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const newFollowerOrder = arrayMove(currentIds, oldIndex, newIndex);
    onFollowerReorder(cluster.master.id, newFollowerOrder);
  };

  const masterFlatIndex = clusterStartFlatIndex;
  const masterIsLast = masterFlatIndex === totalFlatEntries - 1;

  return (
    <Box ref={masterSortable.setNodeRef} style={wrapperStyle} sx={{ mb: 1 }}>
      {/* Outer Paper visually contains master + followers. */}
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 2,
          borderColor: expandedId === cluster.master.id ? 'primary.main' : 'divider',
          borderWidth: expandedId === cluster.master.id ? 2 : 1,
          boxShadow: expandedId === cluster.master.id ? 4 : (masterSortable.isDragging ? 6 : 1),
          transition: 'border-color 160ms ease, box-shadow 160ms ease',
          overflow: 'hidden',
        }}
      >
        {/* Master row */}
        <Box sx={{
          '& > div > .MuiPaper-root': {
            boxShadow: 'none !important',
            border: 'none !important',
            borderRadius: 0,
          },
        }}>
          <PlaylistEntryRow
            entry={cluster.master}
            variant="master"
            visibleMasterNr={masterVisibleNr}
            isLast={masterIsLast && !hasFollowers}
            expanded={expandedId === cluster.master.id}
            onExpandToggle={() => onExpandToggle(cluster.master.id)}
            onEntryDeleted={onEntryDeleted}
            tagHierarchy={tagHierarchy}
            coverUrl={coverUrlBySongId?.[cluster.master.song.id]}
            displayedTagGroupIds={displayedTagGroupIds}
            dragHandleListeners={masterSortable.listeners}
            dragHandleAttributes={masterSortable.attributes}
            isDragging={masterSortable.isDragging}
          />
        </Box>

        {/* Nested followers DndContext. Empty when the cluster has no followers. */}
        {hasFollowers && (
          <Box sx={{ px: 1, pb: 1 }}>
            <DndContext
              sensors={followerSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleFollowerDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <SortableContext
                items={cluster.followers.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <Stack spacing={0.5}>
                  {cluster.followers.map((f, ix) => {
                    const flatIndex = clusterStartFlatIndex + 1 + ix;
                    const isLast = flatIndex === totalFlatEntries - 1;
                    return (
                      <FollowerSortable
                        key={f.id}
                        follower={f}
                        isLast={isLast}
                        expanded={expandedId === f.id}
                        onExpandToggle={() => onExpandToggle(f.id)}
                        onEntryDeleted={onEntryDeleted}
                        coverUrl={coverUrlBySongId?.[f.song.id]}
                        tagHierarchy={tagHierarchy}
                        displayedTagGroupIds={displayedTagGroupIds}
                      />
                    );
                  })}
                </Stack>
              </SortableContext>
            </DndContext>
          </Box>
        )}
      </Paper>
    </Box>
  );
}


/* Wrapper that calls useSortable for a single follower within the cluster's inner SortableContext.
   Kept inline so PlaylistEntryRow doesn't have to leak out dnd-kit imports. */

interface FollowerSortableProps {
  follower: PlaylistEntryInfo;
  isLast: boolean;
  expanded: boolean;
  onExpandToggle: () => void;
  onEntryDeleted: () => void;
  coverUrl?: string | null | undefined;
  tagHierarchy?: TagCategoryList | null;
  displayedTagGroupIds?: string[];
}

function FollowerSortable({
  follower, isLast, expanded, onExpandToggle, onEntryDeleted,
  coverUrl, tagHierarchy, displayedTagGroupIds,
}: FollowerSortableProps) {
  const sortable = useSortable({ id: follower.id });

  const wrapperStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.55 : 1,
    zIndex: sortable.isDragging ? 5 : 'auto',
  };

  return (
    <Box ref={sortable.setNodeRef} style={wrapperStyle}>
      <PlaylistEntryRow
        entry={follower}
        variant="follower"
        visibleMasterNr={null}
        isLast={isLast}
        expanded={expanded}
        onExpandToggle={onExpandToggle}
        onEntryDeleted={onEntryDeleted}
        coverUrl={coverUrl}
        tagHierarchy={tagHierarchy}
        displayedTagGroupIds={displayedTagGroupIds}
        dragHandleListeners={sortable.listeners}
        dragHandleAttributes={sortable.attributes}
        isDragging={sortable.isDragging}
      />
    </Box>
  );
}
