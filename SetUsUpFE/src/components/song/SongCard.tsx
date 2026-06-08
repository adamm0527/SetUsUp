import { memo, useCallback } from 'react';
import { Box, Card, CardActionArea, Stack, Tooltip, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { type TagCategoryList } from '#root/lib/types';
import { invalidateCoverForSong } from '#root/clientdata/stores';
import CoverArt from './CoverArt.tsx';
import KeyChip from './KeyChip.tsx';
import BpmChip from './BpmChip.tsx';
import TagChipStrip from './TagChipStrip.tsx';


interface SongCardProps {
  /* core song data (a subset of either SongInfo or SongDetail). */
  songId?: string;
  artist: string;
  title: string;
  bpm: number;
  bpmOut?: number | null;
  initKey?: string | null;
  spotifySongId?: string | null;
  /* full song detail extras (only used when present) */
  tagIds?: string[];
  coverUrl?: string | null; // when caller has already fetched it (e.g. from spotify/lookup)
  /* tag hierarchy + user's preferred chip groups (forwarded to TagChipStrip) */
  tagHierarchy?: TagCategoryList | null;
  displayedTagGroupIds?: string[];
  /* interactivity */
  selected?: boolean;
  onClick?: () => void; // card-body click; opens the detail pane in the library context
  /* visual density */
  compact?: boolean; // shrinks paddings & font sizes (used inside PlaylistEntryRow)
}


/* Reusable Song card. Used by the Music Library row (with a checkbox sibling outside the card for multi-select)
   and inside PlaylistEditor (inside a PlaylistEntryRow container) wrapped by a drag handle.
   The card itself is always simplistic: cover + artist/title + BPM + Key + tag chip strip. */
 const SongCard = memo(function SongCard({
  songId, artist, title, bpm, bpmOut, initKey, spotifySongId,
  tagIds, coverUrl, tagHierarchy, displayedTagGroupIds,
  selected = false, onClick, compact = false,
}: SongCardProps) {
  const queryClient = useQueryClient();
  const coverSize = compact ? 44 : 56;

  const handleCoverError = useCallback(
    songId
      ? (sid: string) => invalidateCoverForSong(sid, queryClient)
      : (() => undefined) as (sid: string) => void,
    [songId, queryClient]
  );

  const content = (
    <Stack direction="row" spacing={compact ? 1.25 : 1.5} alignItems="center"
      sx={{ p: compact ? 1 : 1.25, width: '100%' }}
    >
      <CoverArt songId={songId} spotifySongId={spotifySongId} coverUrl={coverUrl} title={title} size={coverSize} onImageLoadError={handleCoverError} />
      <Stack sx={{ flex: 1, minWidth: 0 }} spacing={compact ? 0.25 : 0.5}>
        {/* artist / title row */}
        <Stack direction="row" alignItems="baseline" spacing={1} sx={{ minWidth: 0 }}>
          <Tooltip title={`${artist} - ${title}`} arrow disableInteractive enterDelay={400}>
            <Typography component="div" sx={{
                minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontWeight: 700, fontSize: compact ? '0.92rem' : '1.0rem', lineHeight: 1.2,
              }}
            >
              <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500, mr: 0.5 }}>
                {artist}
              </Box>
              <Box component="span" sx={{ color: 'text.primary' }}>
                {title}
              </Box>
            </Typography>
          </Tooltip>
        </Stack>

        {/* chip row: key + bpm + tag chip strip */}
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
          <KeyChip initKey={initKey} size="small" />
          <BpmChip bpm={bpm} bpmOut={bpmOut} size="small" />

          {tagIds && tagIds.length > 0 && tagHierarchy && (
            <Box sx={{ ml: 0.5, minWidth: 0, display: 'flex', flexWrap: 'wrap' }}>
              <TagChipStrip
                tagIds={tagIds}
                tagHierarchy={tagHierarchy}
                displayedTagGroupIds={displayedTagGroupIds}
                compact={compact}
              />
            </Box>
          )}
        </Stack>
      </Stack>
    </Stack>
  );

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        borderColor: selected ? 'primary.main' : 'divider',
        borderWidth: selected ? 2 : 1,
        transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
        boxShadow: selected ? 4 : 0,
        transform: selected ? 'translateY(-1px)' : 'none',
        '&:hover': onClick
          ? { borderColor: 'primary.light', boxShadow: selected ? 4 : 2 }
          : undefined,
      }}
    >
      {onClick ? (
        <CardActionArea onClick={onClick} sx={{ borderRadius: 2 }}>
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </Card>
  );
});

export default SongCard;
