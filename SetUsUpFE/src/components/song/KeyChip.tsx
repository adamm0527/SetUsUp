import { Chip, type ChipProps } from '@mui/material';
import { formatKeyForDisplay, getKeyColor } from '#root/lib//camelot/keyColors';


interface KeyChipProps {
  /* Camelot string in "DDL" / "0DL" form (e.g. "05A"). Null shows "?" with neutral background. */
  initKey: string | null | undefined;
  size?: ChipProps['size'];                 // defaults to 'small'
  variant?: ChipProps['variant'];           // defaults to 'filled'
  onClick?: () => void; // additional click handler when chip is interactive (e.g. as a filter chip)
  emphasized?: boolean; // visually emphasize the chip (e.g. when already in the active filter)
}


/* Single Camelot-key chip. Background is the pastel palette from lib/keyColors,
   foreground is forced to a near-black for guaranteed contrast in both theme modes.
   When `emphasized`, a thick primary-coloured ring (drawn as a box-shadow so it
   doesn't shift surrounding layout) makes the chip pop against the pastel fill. */
export default function KeyChip({
  initKey, size = 'small', variant = 'filled', onClick, emphasized = false,
}: KeyChipProps) {
  const label = initKey ? formatKeyForDisplay(initKey) : '?';
  const bg = getKeyColor(initKey);

  return (
    <Chip
      label={label}
      size={size}
      variant={variant}
      onClick={onClick}
      clickable={!!onClick}
      sx={(theme) => ({
        backgroundColor: bg ?? theme.palette.action.disabledBackground,
        color: '#1a1a1a',  // forced dark text -- pastels are always light enough for this
        fontWeight: emphasized ? 800 : 700,
        letterSpacing: '0.04em',
        minWidth: 44,
        // Emphasized state: vibrant info ring rendered via box-shadow (no layout shift).
        // Two stacked shadows: an outer ring in the theme's info colour, and a small drop
        // shadow underneath to lift the chip off the bar.
        boxShadow: emphasized
          ? `0 0 0 3px ${theme.palette.info.main}, 0 2px 6px ${theme.palette.action.active}33`
          : 'none',
        transition: 'box-shadow 120ms ease, font-weight 120ms ease',
        '&:hover': onClick ? { filter: 'brightness(0.93)' } : undefined,
      })}
    />
  );
}
