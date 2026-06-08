import { useRef, useCallback, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Box, Checkbox, Stack, Typography } from '@mui/material';
import LibraryMusicRoundedIcon from '@mui/icons-material/LibraryMusicRounded';
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded';
import { SongCard } from '#root/components';
import { type SongDetail, type TagCategoryList } from '#root/lib/types';


interface VirtualizedSongListProps {
  songs: SongDetail[];
  totalSongsInGroup?: number;
  selectedSongIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (id: string) => void;
  selectedDetailId: string | null;
  tagHierarchy: TagCategoryList | undefined | null;
  displayedTagGroupIds?: string[];
  /* coverUrl cache: songId -> coverUrl. The MusicLibraryPage maintains this via the useCoverUrls hook. */
  coverUrlBySongId?: Record<string, string | null | undefined>;
}


const ROW_HEIGHT_PX = 90;

interface SongRowProps {
  song: SongDetail;
  isSelected: boolean;
  isOpen: boolean;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (id: string) => void;
  coverUrl: string | null | undefined;
  tagHierarchy: TagCategoryList | undefined | null;
  displayedTagGroupIds?: string[];
}

const SongRow = memo(function SongRow({
  song, isSelected, isOpen,
  onToggleSelect, onOpenDetail,
  coverUrl, tagHierarchy, displayedTagGroupIds,
}: SongRowProps) {
  const handleSelect = useCallback(() => onToggleSelect(song.id), [onToggleSelect, song.id]);
  const handleOpen   = useCallback(() => onOpenDetail(song.id),   [onOpenDetail, song.id]);

  return (
    <Stack direction="row" spacing={0.75} alignItems="center"
      sx={{ height: '100%', overflow: 'hidden' }}
    >
      <Checkbox
        size="small"
        checked={isSelected}
        onChange={handleSelect}
        sx={{ flexShrink: 0 }}
        inputProps={{ 'aria-label': `Select ${song.title}` }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <SongCard
          songId={song.id}
          artist={song.artist}
          title={song.title}
          bpm={song.bpm}
          bpmOut={song.bpmOut}
          initKey={song.initKey}
          spotifySongId={song.spotifySongId}
          tagIds={song.tagIds}
          tagHierarchy={tagHierarchy ?? undefined}
          displayedTagGroupIds={displayedTagGroupIds}
          coverUrl={coverUrl}
          selected={isOpen}
          onClick={handleOpen}
        />
      </Box>
    </Stack>
  );
});


/* Virtualized list of song rows. Uses TanStack Virtual with FIXED row height + a memoised
   per-row component for snappy 60 fps scrolling regardless of library size. */
export default function VirtualizedSongList({
  songs,
  totalSongsInGroup,
  selectedSongIds,
  onToggleSelect,
  onOpenDetail,
  selectedDetailId,
  tagHierarchy,
  displayedTagGroupIds,
  coverUrlBySongId,
}: VirtualizedSongListProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: songs.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: 6,
  });

  if (songs.length === 0) {
    const libraryEmpty = totalSongsInGroup === 0;
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        {libraryEmpty ? (
          <>
            <LibraryMusicRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 700 }}>
              This group has no songs yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Use the <b>New song</b> button in the detail panel to add the first track.
            </Typography>
          </>
        ) : (
          <>
            <FilterAltOffRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 700 }}>
              No songs match the current filter
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Clear or relax a filter chip above to see more results.
            </Typography>
          </>
        )}
      </Box>
    );
  }

  return (
    <Box
      ref={scrollRef}
      sx={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        contain: 'strict',
        pr: 0.5,
        '&::-webkit-scrollbar': { width: 8 },
        '&::-webkit-scrollbar-thumb': { backgroundColor: 'divider', borderRadius: 4 },
      }}
    >
      <Box
        sx={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((vRow) => {
          const song = songs[vRow.index];
          const isSelected = selectedSongIds.has(song.id);
          const isOpen = selectedDetailId === song.id;
          const coverUrl = coverUrlBySongId?.[song.id] ?? null;

          return (
            <Box
              key={song.id}
              data-index={vRow.index}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: ROW_HEIGHT_PX,
                transform: `translateY(${vRow.start}px)`,
                pb: 0.5,
              }}
            >
              <SongRow
                song={song}
                isSelected={isSelected}
                isOpen={isOpen}
                onToggleSelect={onToggleSelect}
                onOpenDetail={onOpenDetail}
                coverUrl={coverUrl}
                tagHierarchy={tagHierarchy}
                displayedTagGroupIds={displayedTagGroupIds}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
