import { Box, Tooltip } from '@mui/material';
import { getKeyTransitionIconUrl } from '#root/lib/camelot/keyTransitionIcons';
import { formatKeyTransitionTooltip } from '#root/lib/camelot/keyTooltipFormat';


interface KeyTransitionIconProps {
  /* 3-char atomic code from the BE (e.g. "+1X", "-3C"). Null = unknown/last entry. */
  transitionAtomic: string | null | undefined;
  /* Pixel size of the icon (square). Defaults to 36. */
  size?: number;
}


/* Renders the SVG glyph for a key transition between two adjacent entries.
   The container is keyed by the URL so that when the transition changes (e.g. after a drag-reorder),
   the <img> remounts and the fade-in keyframe replays, giving a subtle animated swap to the new glyph. */
export default function KeyTransitionIcon({
  transitionAtomic, size = 36
}: KeyTransitionIconProps) {
  const url = getKeyTransitionIconUrl(transitionAtomic ?? null);
  const tooltip = formatKeyTransitionTooltip(transitionAtomic);

  const img = (
    <Box
      key={url}
      sx={{
        height: size,
        width: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '@keyframes keyTransitionFadeIn': {
          from: { opacity: 0, transform: 'scale(0.78)' },
          to:   { opacity: 1, transform: 'scale(1)' },
        },
        animation: 'keyTransitionFadeIn 280ms ease',
      }}
    >
      <Box
        component="img"
        src={url ?? undefined}
        alt={transitionAtomic ?? 'transition'}
        sx={{
          width: '100%',
          height: '100%',
          opacity: transitionAtomic ? 1 : 0.4,
          filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.18))',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
    </Box>
  );

  if (!transitionAtomic) return img;  // skip tooltip for indeterminate
  return <Tooltip arrow disableInteractive title={tooltip}>{img}</Tooltip>;
}
