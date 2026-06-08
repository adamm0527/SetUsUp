import { useEffect, useMemo, useState } from 'react';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, IconButton, Stack, Tab, Tabs, Tooltip, Typography } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import { TagGroupTypes, type TagCategoryInfo, type TagCategoryList,
  type TagGroupInfo } from '#root/lib/types';
import { getTagCategoryIcon } from '#root/lib/camelot/tagCategoryIcons';
import TaggerGroup from './TaggerGroup.tsx';


interface TaggerModalProps {
  open: boolean;
  onClose: () => void;
  /* the song's current tag IDs (initialized into pending state on open) */
  initialTagIds: string[];
  /* the full tag hierarchy (required for the modal to render anything) */
  tagHierarchy: TagCategoryList;
  /* called with the next tag-ids snapshot when the user clicks Save */
  onSave: (tagIds: string[]) => Promise<void> | void;
  /* save-in-flight flag (controls the spinner + disables Save) */
  saving?: boolean;
}


/* Multi-category tagging modal. Tabs across the top, one per TagCategory.
   Each tab body shows the category's TagGroups in a 3-column layout.

   Rule enforcement:
 - MX / MXP: radio, no clear -> picking another tag in the group replaces the previous.
 - OX: radio with clear -> picking another replaces, but "clear" link can set none.
 - OM / OMC: checkboxes -> toggle.
 - OXC: hybrid sub-clusters (handled inside TaggerGroup).
 - MXP pivot: when its tag suffix is "01" (the "off" state, e.g. instrumental), all OMC
     groups in the same category are visually disabled AND their selections are silently
     reset whenever the pivot moves back to "01".
   Cancel button (or X) discards the pending state. Save writes through to the BE via the supplied onSave callback. */
export default function TaggerModal({
  open,
  onClose,
  initialTagIds,
  tagHierarchy,
  onSave,
  saving = false,
}: TaggerModalProps) {
  const [tab, setTab] = useState(0);
  const [pending, setPending] = useState<Set<string>>(new Set(initialTagIds));

  /* initialize pending state each time the modal opens (or when initialTagIds changes externally) */
  useEffect(() => {
    if (open) {
      setPending(new Set(initialTagIds));
      setTab(0);
    }
  }, [open, initialTagIds]);

  /* indexes for fast pivot resolution */
  const { pivotByCategory, omcGroupsByPivot } = useMemo(
    () => indexPivots(tagHierarchy),
    [tagHierarchy]
  );

  const toggleTag = (tagId: string, group: TagGroupInfo) => {
    setPending((prev) => {
      const next = new Set(prev);
      const isRadio = group.type === TagGroupTypes.MX
                   || group.type === TagGroupTypes.OX
                   || group.type === TagGroupTypes.MXP;
      const isHybridRadioPart = group.type === TagGroupTypes.OXC && isOxcRadioTag(tagId);

      if (isRadio || isHybridRadioPart) {
        // single-select cluster: remove all other tags in this radio cluster, then set this one
        for (const t of group.tags) {
          if (t.id === tagId) continue;
          // for OXC, only siblings in the radio sub-cluster get cleared by another radio pick
          if (group.type === TagGroupTypes.OXC) {
            if (isOxcRadioTag(t.id)) next.delete(t.id);
          } else {
            next.delete(t.id);
          }
        }
        if (prev.has(tagId)) {
          // OX-only: clicking the currently-selected option allows clearing
          if (group.type === TagGroupTypes.OX) next.delete(tagId);
        } else {
          next.add(tagId);
        }
      } else {
        // checkbox / OXC-checkbox cluster: simple toggle
        if (prev.has(tagId)) next.delete(tagId);
        else next.add(tagId);
      }

      /* pivot-side-effect: if a MXP just changed, may need to reset linked OMCs */
      if (group.type === TagGroupTypes.MXP) {
        const newPivotTag = [...next].find((id) => belongsToGroup(id, group)) ?? null;
        if (newPivotTag && isOffStateTag(newPivotTag)) {
          // pivot moved to "01" -> reset all OMC tags in this category
          const omcs = omcGroupsByPivot.get(group.id) ?? [];
          for (const omc of omcs) {
            for (const t of omc.tags) next.delete(t.id);
          }
        }
      }

      return next;
    });
  };

  const clearRadio = (group: TagGroupInfo) => {
    setPending((prev) => {
      const next = new Set(prev);
      for (const t of group.tags) next.delete(t.id);
      return next;
    });
  };

  /* an OMC group is disabled only if its category's MXP is unset or set to an "off-state" tag */
  const isGroupDisabled = (group: TagGroupInfo, category: TagCategoryInfo): boolean => {
    if (group.type !== TagGroupTypes.OMC) return false;
    const pivotGroup = pivotByCategory.get(category.id);
    if (!pivotGroup) return false; // no pivot in this category -> not disabled
    const selectedPivotTag = [...pending].find((id) => belongsToGroup(id, pivotGroup));
    if (!selectedPivotTag) return true;
    return isOffStateTag(selectedPivotTag);
  };

  const handleSave = async () => {
    await onSave([...pending].sort());
  };

  const selectedCount = pending.size;
  const totalCount = useMemo(
    () => tagHierarchy.reduce((sum, c) => sum + c.tagGroups.reduce((s, g) => s + g.tags.length, 0), 0),
    [tagHierarchy]
  );

  const activeCategory = tagHierarchy[tab];

  return (
    <Dialog
      open={open}
      maxWidth="lg"
      fullWidth
      onClose={(_e, reason) => {
        // user can only close via the explicit X / Cancel / Save buttons, not via backdrop click
        if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') onClose();
      }}
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle sx={{ pr: 6 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Edit tags</Typography>
            <Typography variant="caption" color="text.secondary">
              {selectedCount} of {totalCount} tags selected
            </Typography>
          </Box>
          <Tooltip title="Cancel without saving" arrow disableInteractive>
            <IconButton onClick={onClose} disabled={saving} sx={{ position: 'absolute', right: 8, top: 12 }}>
              <CloseRoundedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogTitle>

      <Tabs
        value={tab}
        onChange={(_e, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        {tagHierarchy.map((c) => {
          const Icon = getTagCategoryIcon(c.id);
          return (
            <Tab
              key={c.id}
              icon={<Icon fontSize="small" />}
              iconPosition="start"
              label={c.name}
              sx={{ textTransform: 'none', minHeight: 44 }}
            />
          );
        })}
      </Tabs>

      <DialogContent sx={{ p: 2 }}>
        {activeCategory && (
          <CategoryThreeColumns
            category={activeCategory}
            isDisabled={(g) => isGroupDisabled(g, activeCategory)}
            selectedIds={pending}
            onTagToggle={(tagId, group) => toggleTag(tagId, group)}
            onClearRadio={(g) => clearRadio(g)}
          />
        )}
      </DialogContent>

      <DialogActions disableSpacing sx={{ p: 2, gap: 1, justifyContent: 'flex-end' }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
        >
          Save tags
        </Button>
      </DialogActions>
    </Dialog>
  );
}


/* --- 3-column layout for one category's groups --- */

function CategoryThreeColumns({
  category, isDisabled, selectedIds, onTagToggle, onClearRadio,
}: {
  category: TagCategoryInfo;
  isDisabled: (g: TagGroupInfo) => boolean;
  selectedIds: Set<string>;
  onTagToggle: (tagId: string, group: TagGroupInfo) => void;
  onClearRadio: (g: TagGroupInfo) => void;
}) {
  const groups = category.tagGroups;
  const cnt = groups.length;
  const base = Math.floor(cnt / 3);
  const extra = cnt % 3;
  const end1 = base + (extra >= 1 ? 1 : 0);
  const end2 = end1 + base + (extra === 2 ? 1 : 0);

  const col1 = groups.slice(0, end1);
  const col2 = groups.slice(end1, end2);
  const col3 = groups.slice(end2);

  const renderGroup = (g: TagGroupInfo) => (
    <TaggerGroup
      key={g.id}
      group={g}
      selectedIds={selectedIds}
      disabled={isDisabled(g)}
      onTagToggle={(tid) => onTagToggle(tid, g)}
      onClearRadio={() => onClearRadio(g)}
    />
  );

  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
      gap: 2,
    }}>
      <Box>{col1.map(renderGroup)}</Box>
      <Box>{col2.map(renderGroup)}</Box>
      <Box>{col3.map(renderGroup)}</Box>
    </Box>
  );
}


/* --- pivot indexing & helpers --- */

function indexPivots(hierarchy: TagCategoryList) {
  const pivotByCategory = new Map<string, TagGroupInfo>();
  const omcGroupsByPivot = new Map<string, TagGroupInfo[]>();
  for (const cat of hierarchy) {
    const pivot = cat.tagGroups.find((g) => g.type === TagGroupTypes.MXP);
    if (pivot) {
      pivotByCategory.set(cat.id, pivot);
      const omcs = cat.tagGroups.filter((g) => g.type === TagGroupTypes.OMC);
      if (omcs.length > 0) omcGroupsByPivot.set(pivot.id, omcs);
    }
  }
  return { pivotByCategory, omcGroupsByPivot };
}

function belongsToGroup(tagId: string, group: TagGroupInfo): boolean {
  return group.tags.some((t) => t.id === tagId);
}

/* Tag's suffix is "01" -> off-state (e.g. SVOPR01 = Instrumental). */
function isOffStateTag(tagId: string): boolean {
  return tagId.slice(-2) === '01';
}

/* Within an OXC, tags with suffix 01..09 belong to the radio sub-cluster. */
function isOxcRadioTag(tagId: string): boolean {
  const n = parseInt(tagId.slice(-2), 10);
  return n >= 1 && n <= 9;
}
