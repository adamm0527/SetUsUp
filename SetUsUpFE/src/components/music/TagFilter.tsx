import { useMemo, useState } from 'react';
import {
  Box, Button, Chip, Divider, FormControlLabel, Popover, Radio, RadioGroup,
  Stack, Tabs, Tab, TextField, Typography,
} from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  type TagCategoryList, type TagInfo, type TagCategoryInfo, type TagGroupInfo
} from '#root/lib/types';


interface TagFilterProps {
  /* the full tag hierarchy (cached query) */
  tagHierarchy: TagCategoryList | undefined | null;
  /* selected tag IDs (e.g. ["ENRGY04", "SCHHF01"]) */
  selectedTagIds: string[];
  /* AND / OR semantics for matching songs against the selected tag set */
  tagMode: 'all' | 'any';
  /* called when the user toggles a tag */
  onToggleTag: (tagId: string) => void;
  /* called when the user switches the AND/OR mode */
  onModeChange: (mode: 'all' | 'any') => void;
  /* called when the user clears all selected tags */
  onClearAll: () => void;
}


/* Trigger button + popover for the tag filter. Popover has a search bar across all tags. */
export default function TagFilter({
  tagHierarchy, selectedTagIds, tagMode, onToggleTag, onModeChange, onClearAll
}: TagFilterProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');

  const categories = tagHierarchy ?? [];
  const selectedSet = useMemo(() => new Set(selectedTagIds), [selectedTagIds]);

  /* flat list of all tags for search (across categories) */
  const flatTags = useMemo(() => {
    const out: { tag: TagInfo; group: TagGroupInfo; category: TagCategoryInfo }[] = [];
    for (const cat of categories) {
      for (const g of cat.tagGroups) {
        for (const t of g.tags) out.push({ tag: t, group: g, category: cat });
      }
    }
    return out;
  }, [categories]);

  const searchActive = search.trim().length >= 2;
  const filteredFlat = useMemo(() => {
    if (!searchActive) return [];
    const q = search.trim().toLowerCase();
    return flatTags.filter(({ tag }) => tag.name.toLowerCase().includes(q));
  }, [flatTags, searchActive, search]);

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Button
          variant="outlined"
          size="small"
          onClick={(e) => setAnchor(e.currentTarget)}
          endIcon={<KeyboardArrowDownRoundedIcon />}
          sx={{ borderRadius: 999, textTransform: 'none' }}
        >
          Tags
          {selectedTagIds.length > 0 && (
            <Box component="span" sx={{ ml: 0.5, fontWeight: 700 }}>
              ({selectedTagIds.length}, {tagMode === 'all' ? 'ALL' : 'ANY'})
            </Box>
          )}
        </Button>

        {selectedTagIds.length > 0 && (
          <Button size="small" onClick={onClearAll} startIcon={<CloseRoundedIcon />}
            sx={{ textTransform: 'none', minWidth: 'auto' }}>
            clear
          </Button>
        )}
      </Stack>

      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { width: 560, maxWidth: '90vw', maxHeight: '70vh' } } }}
      >
        <Box sx={{ p: 2 }}>
          {/* mode toggle */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              Match songs with
            </Typography>
            <RadioGroup
              row
              value={tagMode}
              onChange={(_e, v) => onModeChange(v as 'all' | 'any')}
            >
              <FormControlLabel value="all" control={<Radio size="small" />} label="ALL tags" />
              <FormControlLabel value="any" control={<Radio size="small" />} label="ANY tag" />
            </RadioGroup>
          </Stack>

          {/* search */}
          <TextField
            size="small"
            fullWidth
            placeholder="Search across all tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 1 }}
          />

          {searchActive ? (
            /* --- search results --- */
            <Box sx={{ maxHeight: 360, overflow: 'auto' }}>
              {filteredFlat.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No tags match.
                </Typography>
              ) : (
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  {filteredFlat.map(({ tag, group, category }) => (
                    <Chip
                      key={tag.id}
                      label={`${tag.name}`}
                      size="small"
                      title={`${category.name} / ${group.name} / ${tag.id}: ${tag.description}`}
                      onClick={() => onToggleTag(tag.id)}
                      color={selectedSet.has(tag.id) ? 'primary' : 'default'}
                      variant={selectedSet.has(tag.id) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          ) : (
            /* --- tabbed by category --- */
            <>
              <Tabs
                value={tab}
                onChange={(_e, v) => setTab(v)}
                variant="scrollable"
                scrollButtons="auto"
              >
                {categories.map((c) => (
                  <Tab key={c.id} label={c.name} sx={{ textTransform: 'none' }} />
                ))}
              </Tabs>
              <Divider />
              <Box sx={{ maxHeight: 360, overflow: 'auto', pt: 1 }}>
                {categories[tab]?.tagGroups.map((g) => (
                  <Box key={g.id} sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary"
                      sx={{ display: 'block', fontWeight: 700, mb: 0.5 }}>
                      {g.name}
                    </Typography>
                    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      {g.tags.map((t) => (
                        <Chip
                          key={t.id}
                          label={t.name}
                          size="small"
                          title={t.description}
                          onClick={() => onToggleTag(t.id)}
                          color={selectedSet.has(t.id) ? 'primary' : 'default'}
                          variant={selectedSet.has(t.id) ? 'filled' : 'outlined'}
                        />
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>
      </Popover>
    </>
  );
}
