import { useMemo, useState } from 'react';
import { Box, useTheme } from '@mui/material';


interface CoverArtProps {
  spotifySongId?: string | null; // when supplied (and the cover loads), render the cover based on it
  title: string; // used for the placeholder overlay initials when there's no cover
  size?: number; // box size in pixels (square)
}

interface CoverArtPropsWithUrl extends CoverArtProps {
  coverUrl?: string | null;
  songId?: string; // the LOCAL song id (Guid)
  onImageLoadError?: (songId: string) => void;
}

/* Square cover-art component. Renders the supplied Spotify cover URL when present,
   otherwise renders a vinyl-record SVG placeholder with the title's initials overlaid.

   On image load failure, the component:
     1. renders the vinyl placeholder,
     2. invokes "onImageLoadError" if provided (call site has to invalidate the cache) */

export default function CoverArt({
  spotifySongId, coverUrl, title, size = 56, songId, onImageLoadError,
}: CoverArtPropsWithUrl) {
  const theme = useTheme();
  const [imgError, setImgError] = useState(false);
  const showImage = !!coverUrl && !imgError;

  // First letter(s) of the title for the placeholder overlay (up to 2 chars, uppercased)
  const initials = useMemo(() => {
    const cleaned = (title ?? '').trim().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    if (!cleaned) return '?';
    const words = cleaned.split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }, [title]);

  const handleError = () => {
    setImgError(true);
    if (songId && onImageLoadError) {
      onImageLoadError(songId);
    }
  };

  return (
    <Box
      sx={{ width: size, height: size, flexShrink: 0, position: 'relative',
        borderRadius: 1, overflow: 'hidden',
        background: theme.palette.background.default,
        border: 1, borderColor: 'divider',
      }}
      aria-label={spotifySongId ? `Spotify cover for ${title}` : `Placeholder cover for ${title}`}
    >
      {showImage && (
        <Box component="img" src={coverUrl!} alt=""
          onError={handleError}
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}
      {!showImage && (
        <VinylPlaceholder size={size} initials={initials} />
      )}
    </Box>
  );
}


/* Pure SVG vinyl record with the title's initials in the centre.
   Inline so it inherits theme colour tokens via CSS currentColor. */
function VinylPlaceholder({ size, initials }: { size: number; initials: string }) {
  // viewBox is square, normalised to 100x100 for easy ratio scaling.
  // Colors use the theme palette via CSS variables that MUI's theme provides through "sx",
  // but since this is an inline SVG we hardcode tonal layers (dark outer ring, mid groove, primary-tinted label)
  return (
    <Box sx={{ width: size, height: size, position: 'relative' }}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        {/* outer disc */}
        <circle cx="50" cy="50" r="48" fill="#1a1a1a" />
        {/* concentric grooves */}
        <circle cx="50" cy="50" r="42" fill="none" stroke="#2a2a2a" strokeWidth="0.4" />
        <circle cx="50" cy="50" r="36" fill="none" stroke="#2a2a2a" strokeWidth="0.4" />
        <circle cx="50" cy="50" r="30" fill="none" stroke="#2a2a2a" strokeWidth="0.4" />
        <circle cx="50" cy="50" r="24" fill="none" stroke="#2a2a2a" strokeWidth="0.4" />
        {/* centre label */}
        <circle cx="50" cy="50" r="18" fill="currentColor" opacity="0.85" />
        {/* spindle hole */}
        <circle cx="50" cy="50" r="2" fill="#1a1a1a" />
      </svg>
      {/* initials overlay, positioned dead-centre */}
      <Box
        sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', pointerEvents: 'none', color: 'background.paper',
          fontWeight: 700, fontSize: Math.max(10, Math.round(size * 0.28)),
          letterSpacing: '0.05em', textShadow: '0 1px 2px rgba(0,0,0,0.4)',
        }}
      >
        {initials}
      </Box>
    </Box>
  );
}
