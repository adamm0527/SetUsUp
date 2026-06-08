import { Box, Collapse, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import type { DraggableAttributes } from '@dnd-kit/core';
import { useEndpointMutation } from '#root/api/queryHooks';
import { api_PlaylistEntryUpdate } from '#root/api/endpoints';
import { useQueryClient } from '@tanstack/react-query';
import { useAppSnackbar } from '#root/providers';
import { SongCard } from '#root/components';
import type { PlaylistEntryInfo, TagCategoryList } from '#root/lib/types';
import KeyTransitionIcon from './KeyTransitionIcon.tsx';
import { DisplayRatingStars } from './RatingStars.tsx';
import ColourSwatchPicker from './ColourSwatchPicker.tsx';
import PlaylistEntryDetails from './PlaylistEntryDetails.tsx';


export type PlaylistEntryRowVariant = 'master' | 'follower';

interface PlaylistEntryRowProps {
  entry: PlaylistEntryInfo;
  variant: PlaylistEntryRowVariant;
  /* master: 1-based master-position Nr (1, 2, 3, ...)
     follower: Nr ignored, always rendered as "w/". For this pass null. */
  visibleMasterNr: number | null;
  isLast: boolean;
  expanded: boolean;
  onExpandToggle: () => void;
  onEntryDeleted: () => void;
  coverUrl?: string | null | undefined;
  tagHierarchy?: TagCategoryList | null;
  displayedTagGroupIds?: string[];

  /* dnd-kit props provided by the parent (cluster or follower entry wrapper). */
  dragHandleListeners?: SyntheticListenerMap;
  dragHandleAttributes?: DraggableAttributes;
  isDragging?: boolean;
}


export default function PlaylistEntryRow({
  entry, variant, visibleMasterNr, isLast, expanded, onExpandToggle, onEntryDeleted,
  coverUrl, tagHierarchy, displayedTagGroupIds,
  dragHandleListeners, dragHandleAttributes, isDragging,
}: PlaylistEntryRowProps) {
  const queryClient = useQueryClient();
  const snackbar = useAppSnackbar();
  const updateMutation = useEndpointMutation(api_PlaylistEntryUpdate);

  /* "w/" replaces the Nr for play-with-previous rows. */
  const ordinalLabel = variant === 'follower' ? 'w/' : `${visibleMasterNr ?? '?'}.`;
  const outgoingTransition = isLast ? null : entry.transitionToNext;

  const handleColourChange = async (nextHex: string | null) => {
    const res = await updateMutation.mutateAsync({
      params: { entryId: entry.id },
      body: { hexColour: nextHex ?? '' },
    });
    if (!res.success) {
      snackbar.error('Could not update entry colour.');
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['playlistEntries'], exact: false });
    await queryClient.invalidateQueries({ queryKey: ['playlistEntries', entry.id, 'detail'], exact: true });
  };

  const isFollower = variant === 'follower';

  return (
    <Box sx={{
      mb: isFollower ? 0.5 : 0,
      pl: isFollower ? 4 : 0,           // indent followers inside the master Paper
      opacity: isDragging ? 0.55 : 1,
    }}>
      <Paper
        variant={isFollower ? 'elevation' : 'outlined'}
        elevation={isFollower ? 0 : undefined}
        sx={{
          borderRadius: isFollower ? 1.5 : 2,
          borderColor: isFollower
            ? 'divider'
            : (expanded ? 'primary.main' : 'divider'),
          borderWidth: !isFollower && expanded ? 2 : 1,
          border: isFollower ? '1px dashed' : undefined,
          backgroundColor: isFollower ? 'background.default' : 'background.paper',
          boxShadow: !isFollower
            ? (expanded ? 4 : (isDragging ? 6 : 1))
            : undefined,
          transition: 'border-color 160ms ease, box-shadow 160ms ease',
          overflow: 'hidden',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ p: isFollower ? 0.75 : 1.25 }}>
          {/* drag handle. Follower handles are smaller + only meaningful within their cluster's inner sortable context.
              Master handles drag the whole cluster (Paper + followers). */}
          <Tooltip arrow disableInteractive title={
            isFollower ? 'Drag to reorder within this cluster' : 'Drag to reorder cluster'
          }>
            <IconButton
              size="small"
              {...dragHandleAttributes}
              {...dragHandleListeners}
              sx={{ cursor: isDragging ? 'grabbing' : 'grab', flexShrink: 0,
                opacity: isFollower ? 0.7 : 1 }}
              aria-label="Drag handle"
            >
              <DragIndicatorRoundedIcon fontSize={isFollower ? 'inherit' : 'small'} />
            </IconButton>
          </Tooltip>

          {/* Nr label */}
          <Typography
            sx={{
              minWidth: 32,
              textAlign: 'right',
              pr: 0.5,
              fontFamily: 'monospace',
              fontWeight: 700,
              fontSize: isFollower ? '0.85rem' : '0.95rem',
              color: isFollower ? 'text.secondary' : 'text.primary',
              fontStyle: isFollower ? 'italic' : 'normal',
              flexShrink: 0,
            }}
          >
            {ordinalLabel}
          </Typography>

          {/* Outgoing-transition glyph based on BE-computed "transitionToNext").
              The last row renders the muted Indeterminate placeholder so the layout stays stable. */}
          <Box sx={{ flexShrink: 0, mr: 0.25 }}>
            <KeyTransitionIcon transitionAtomic={outgoingTransition} size={isFollower ? 24 : 32} />
          </Box>

          {/* SongCard fills remaining width. */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <SongCard
              songId={entry.song.id}
              artist={entry.song.artist}
              title={entry.song.title}
              bpm={entry.song.bpm}
              bpmOut={entry.song.bpmOut}
              initKey={entry.song.initKey}
              spotifySongId={entry.song.spotifySongId}
              coverUrl={coverUrl}
              tagIds={entry.song.tagIds}
              tagHierarchy={tagHierarchy}
              displayedTagGroupIds={displayedTagGroupIds}
              compact={variant === 'follower'}
            />
          </Box>

          {/* Colour swatch (click to pick or clear) */}
          <Box sx={{ flexShrink: 0, ml: 0.5 }}>
            <ColourSwatchPicker
              value={entry.hexColour}
              onChange={handleColourChange}
              disabled={updateMutation.isPending}
              size={isFollower ? 16 : 18}
            />
          </Box>

          {/* Live average rating. Clicking it opens the inline detail expansion
              where the user can edit their own rating. */}
          <DisplayRatingStars
            value={entry.averageRating}
            totalRaters={entry.totalRaters}
            size={isFollower ? 16 : 18}
            onClick={onExpandToggle}
          />

          {/* expand toggle */}
          <Tooltip arrow disableInteractive title={expanded ? 'Hide details' : 'Show details'}>
            <IconButton size="small" onClick={onExpandToggle} sx={{ flexShrink: 0 }}>
              {expanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
            </IconButton>
          </Tooltip>
        </Stack>
        <Collapse in={expanded} mountOnEnter unmountOnExit>
          <PlaylistEntryDetails
            entryId={entry.id}
            visibleNr={isFollower ? 2 : (visibleMasterNr ?? 1)}
            onDeleted={onEntryDeleted}
          />
        </Collapse>
      </Paper>
    </Box>
  );
}
