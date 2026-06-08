import { memo, useMemo } from 'react';
import { Chip, Stack, Tooltip, Box, Typography } from '@mui/material';
import { TagGroupTypes, type TagCategoryList, type TagGroupInfo,
  type TagGroupType, type TagInfo,
} from '#root/lib/types';
import { getCategoryIconByGroupOrTagId } from '#root/lib/camelot/tagCategoryIcons';


interface TagChipStripProps {
  /* The song's full tag-id list (from SongDetail.tagIds). */
  tagIds: string[];
  /* The full tag hierarchy (fetched once via api_TagsGetAll and cached). */
  tagHierarchy: TagCategoryList | undefined | null;
  /* The user's preferred ordered list of TagGroup IDs to show as chips (up to 5). */
  displayedTagGroupIds?: string[];
  /* When true, render chips a bit smaller (used inside row densities). */
  compact?: boolean;
}

const DEFAULT_DISPLAYED_TAG_GROUP_IDS = ['ENRGY', 'SVOPR', 'SVIEM'];
const MAX_DISPLAYED_GROUPS = 5;


/* Renders up to 5 chips, one per TagGroup in "displayedTagGroupIds", showing the song's tags for that group.
   Multi-select TagGroups (OM/OMC, OXC-checkbox part): the FIRST selected tag is displayed
   plus a small "+N" sibling chip when there are more.
   
   Each chip carries a slow tooltip with:
    <b>TagGroup name</b>
    01: TagName1, 02: TagName2, ...  */
const TagChipStrip = memo(function TagChipStrip({
  tagIds, tagHierarchy,
  displayedTagGroupIds = DEFAULT_DISPLAYED_TAG_GROUP_IDS,
  compact = false,
}: TagChipStripProps) {
  /* Building a fast lookup of tagId -> TagInfo, and groupId -> TagGroupInfo from the hierarchy */
  const { tagById, groupById } = useMemo(() => {
    const tags = new Map<string, TagInfo>();
    const groups = new Map<string, TagGroupInfo>();
    if (tagHierarchy) {
      for (const cat of tagHierarchy) {
        for (const g of cat.tagGroups) {
          groups.set(g.id, g);
          for (const t of g.tags) tags.set(t.id, t);
        }
      }
    }
    return { tagById: tags, groupById: groups };
  }, [tagHierarchy]);

  /* Group the song's tagIds by their parent TagGroup id */
  const tagsBySongGroup = useMemo(() => {
    const m = new Map<string, TagInfo[]>();
    for (const tagId of tagIds) {
      const tag = tagById.get(tagId);
      if (!tag) continue;
      // Tag's parent group id == first 5 chars (per the seed convention)
      const groupId = tagId.substring(0, 5);
      const list = m.get(groupId) ?? [];
      list.push(tag);
      m.set(groupId, list);
    }
    // sort each list by tag id so the chip label is deterministic
    for (const list of m.values())
      list.sort((a, b) => a.id.localeCompare(b.id));
    return m;
  }, [tagIds, tagById]);

  /* Cap to MAX_DISPLAYED_GROUPS and skip groups that have no selected tags on this song */
  const visibleGroups = useMemo(
    () => displayedTagGroupIds
      .slice(0, MAX_DISPLAYED_GROUPS)
      .map((gid) => ({ gid, tags: tagsBySongGroup.get(gid) ?? [] }))
      .filter((entry) => entry.tags.length > 0),
    [displayedTagGroupIds, tagsBySongGroup]
  );

  if (visibleGroups.length === 0) return null;

  return (
    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5, rowGap: 0.5, alignItems: 'center' }}>
      {visibleGroups.map(({ gid, tags }) => {
        const group = groupById.get(gid);
        const Icon = getCategoryIconByGroupOrTagId(gid);
        const isMulti = group && isMultiSelectType(group.type);
        const primary = tags[0];
        const extras = tags.slice(1);

        return (
          <Box key={gid} sx={{ display: 'inline-flex', gap: 0.25, alignItems: 'center' }}>
            <Tooltip arrow enterDelay={500} enterNextDelay={500}
              title={
                <TagPairsTooltipBody groupName={group?.name ?? gid} tags={tags} />
              }
              slotProps={{
                tooltip: { sx: { maxWidth: 280, p: 1 }, }
              }}
            >
              <Chip icon={<Icon />} label={primary.name} size="small" variant="filled"
                sx={{
                  fontWeight: 600, height: compact ? 22 : 24,
                  fontSize: compact ? '0.72rem' : '0.78rem', maxWidth: 180,
                  '& .MuiChip-label': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                }}
              />
            </Tooltip>
            {isMulti && extras.length > 0 && (
              <Chip label={`+${extras.length}`} size="small" variant="outlined"
                sx={{
                  fontWeight: 700, height: compact ? 22 : 24,
                  fontSize: compact ? '0.7rem' : '0.74rem', minWidth: 32,
                  fontStyle: 'italic',
                }}
              />
            )}
          </Box>
        );
      })}
    </Stack>
  );
});

export default TagChipStrip;


/* The tooltip content for a single chip: bold group name + comma-separated "XX: TagName" pairs,
   with each pair rendered as an inline-block span so they wrap as whole units (no mid-pair breaks). */
function TagPairsTooltipBody({ groupName, tags }: { groupName: string; tags: TagInfo[] }) {
  return (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, mb: 0.5 }}>
        {groupName}
      </Typography>
      <Box
        sx={{
          // normal whitespace so the container wraps (each pair span is nowrap so it stays atomic)
          whiteSpace: 'normal', lineHeight: 1.4,
        }}
      >
        {tags.map((t, idx) => {
          const suffix = t.id.length >= 2 ? t.id.slice(-2) : t.id;
          return (
            <Box key={t.id} component="span"
              sx={{
                display: 'inline-block', whiteSpace: 'nowrap',
                mr: 0.5, fontSize: '0.78rem',
              }}
            >
              {suffix}: {t.name}{idx < tags.length - 1 ? ',' : ''}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// Whether a TagGroupType allows multiple tags selected at once (the "+N" chip applies).
function isMultiSelectType(type: TagGroupType): boolean {
  switch (type) {
    case TagGroupTypes.OM:
    case TagGroupTypes.OMC:
    case TagGroupTypes.OXC: // OXC has a multi-select sub-cluster (ids 10+)
      return true;
    default:
      return false;
  }
}
