import { Box, Button, Divider, FormControlLabel, Paper, Stack, Switch, Tooltip, Typography, Checkbox } from '@mui/material';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import LibraryMusicRoundedIcon from '@mui/icons-material/LibraryMusicRounded';
import { type MusicFilterState, defaultFilterState } from '#root/clientdata/stores';
import { type TagCategoryList } from '#root/lib/types';
import TextFilter from './TextFilter.tsx';
import BpmRangeFilter from './BpmRangeFilter.tsx';
import KeyFilter from './KeyFilter.tsx';
import TagFilter from './TagFilter.tsx';
import SortControl from './SortControl.tsx';


interface FilterBarProps {
  state: MusicFilterState; // current filter state to render
  /* called with the next full state when any sub-control changes */
  onChange: (next: MusicFilterState) => void;
  /* tag hierarchy for the TagFilter sub-control (may be null while still loading) */
  tagHierarchy: TagCategoryList | undefined | null;
  /* "N of M shown" indicator (computed in the page) */
  shown: number;
  total: number;
  selectedCount: number; // how many are currently selected (for bulk actions)
  onToggleSelectAll: () => void;
}


/* Sticky filter bar at the top of the MusicLibraryPage. Composes the five sub-controls
   plus a "N of M shown" indicator and a "Clear filters" button. */
export default function FilterBar({ 
  state, onChange, tagHierarchy, shown, total,
  selectedCount, onToggleSelectAll
 }: FilterBarProps) {

  const patch = (p: Partial<MusicFilterState>) => onChange({ ...state, ...p });

  const toggleKey = (storedKey: string) => {
    const has = state.keys.includes(storedKey);
    patch({ keys: has ? state.keys.filter((k) => k !== storedKey) : [...state.keys, storedKey] });
  };
  const clearKeys = () => patch({ keys: [] });

  const toggleTag = (tagId: string) => {
    const has = state.tagIds.includes(tagId);
    patch({ tagIds: has ? state.tagIds.filter((t) => t !== tagId) : [...state.tagIds, tagId] });
  };
  const clearTags = () => patch({ tagIds: [] });

  const isDirty = !sameAsEmpty(state);
  const resetAll = () => onChange(defaultFilterState);

  return (
    <Paper
      variant="outlined"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        p: 1.25,
        borderRadius: 2,
        backgroundColor: 'background.paper',
      }}
    >
      <Stack spacing={1}>
        {/* row 1: text + bpm + key + tags + spotify-only */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          <TextFilter value={state.text} onChange={(t) => patch({ text: t })} />
          <BpmRangeFilter min={state.bpmMin} max={state.bpmMax} onChange={(min, max) => patch({ bpmMin: min, bpmMax: max })}
          />
          <KeyFilter selectedKeys={state.keys} onToggleKey={toggleKey} onClearAll={clearKeys} />
          <TagFilter tagHierarchy={tagHierarchy} selectedTagIds={state.tagIds}
            tagMode={state.tagMode} onToggleTag={toggleTag} onModeChange={(m) => patch({ tagMode: m })}
            onClearAll={clearTags} />
          <FormControlLabel
            control={
              <Switch size="small"
                checked={state.spotifyOnly}
                onChange={(_e, v) => patch({ spotifyOnly: v })}
              />
            }
            label="Linked to Spotify only"
            slotProps={{ typography: { variant: 'body2' } }}
          />
        </Stack>

        <Divider />

        {/* row 2: sort + counters + clear */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ minHeight: 28 }}>
          <Tooltip
            title={selectedCount === 0
              ? 'Select all currently-visible songs'
              : selectedCount === shown
                ? 'Deselect every visible song'
                : 'Deselect every visible song (some are already selected)'}
            arrow disableInteractive
          >
            <Box>
              <Checkbox
                size="small"
                checked={shown > 0 && selectedCount === shown}
                indeterminate={selectedCount > 0 && selectedCount < shown}
                onChange={onToggleSelectAll}
                disabled={shown === 0}
                sx={{ p: 0.5 }}
                inputProps={{ 'aria-label': 'Select all visible songs' }}
              />
            </Box>
          </Tooltip>
          <Typography variant="body2" color="text.secondary">
            {selectedCount === 0
              ? 'Select all visible'
              : `${selectedCount} of ${shown} selected`}
          </Typography>
        </Stack>
          
          
          <SortControl sort={state.sort} onChange={(s) => patch({ sort: s })} />

          <Box sx={{ flex: 1 }} />

          <Tooltip title="Songs currently shown / total in this group" arrow disableInteractive>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <LibraryMusicRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                <b>{shown}</b> of {total}
              </Typography>
            </Stack>
          </Tooltip>

          <Button size="small" variant="text" onClick={resetAll} disabled={!isDirty}
            startIcon={<RestartAltRoundedIcon />} sx={{ textTransform: 'none' }}>
            Clear filters
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}


function sameAsEmpty(s: MusicFilterState): boolean {
  return s.text === '' && s.bpmMin == null && s.bpmMax == null &&
    s.keys.length === 0 && s.tagIds.length === 0 && s.tagMode === 'all' && !s.spotifyOnly &&
    JSON.stringify(s.sort) === JSON.stringify(defaultFilterState.sort);
}
