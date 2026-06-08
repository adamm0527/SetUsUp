import { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';


interface SpotifyEmbedPlayerProps {
  spotifySongId: string | null | undefined;
  height?: 80 | 152 | 352;
  themeColor?: 'light' | 'dark';
  /* When true (default), the iframe is deferred until either the user clicks Play OR the panel
     has been idle-open for `idleMountMs`. Set false to mount immediately (but causes immeadiate lag). */
  deferred?: boolean;
  idleMountMs?: number;
}


/* Defers the heavy Spotify iframe load (Spotify's Embed pulls in their whole player JS bundle)
   which is the single biggest cost when opening a song detail panel.
   We replace it with a click-to-play placeholder until either:
     - the user clicks OR
     - idleMountMs elapses (default 500ms) of the panel being open. */
export default function SpotifyEmbedPlayer({
  spotifySongId, height = 152, themeColor = 'dark',
  deferred = true, idleMountMs = 500,
}: SpotifyEmbedPlayerProps) {
  const [mounted, setMounted] = useState(!deferred);
  const idleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!deferred || mounted || !spotifySongId) return;
    idleTimerRef.current = window.setTimeout(() => setMounted(true), idleMountMs);
    return () => {
      if (idleTimerRef.current != null) window.clearTimeout(idleTimerRef.current);
    };
  }, [deferred, mounted, spotifySongId, idleMountMs]);

  if (!spotifySongId) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 2, border: 1, borderColor: 'divider', backgroundColor: 'background.default', px: 2,
      }}>
        <Typography variant="body2" color="text.secondary">Not linked to Spotify yet.</Typography>
      </Box>
    );
  }

  if (!mounted) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 2, border: 1, borderColor: 'divider', backgroundColor: 'background.default',
        cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' },
      }} onClick={() => setMounted(true)}>
        <Button startIcon={<PlayArrowRoundedIcon />} sx={{ textTransform: 'none' }}>
          Load Spotify player
        </Button>
      </Box>
    );
  }

  const themeParam = themeColor === 'light' ? '1' : '0';
  const src = `https://open.spotify.com/embed/track/${encodeURIComponent(spotifySongId)}?theme=${themeParam}`;

  return (
    <Box sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 1, backgroundColor: 'background.default' }}>
      <iframe
        title="Spotify embed player" src={src} width="100%" height={height}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy" style={{ display: 'block', border: 'none' }}
      />
    </Box>
  );
}
