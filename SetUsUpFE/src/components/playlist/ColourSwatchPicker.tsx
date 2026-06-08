import { useState, type MouseEvent } from 'react';
import { Box, Popover, Stack, Tooltip, useTheme } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';


/* Colour palette swatch picker for PlaylistEntry rows, with default set of colours. */

export interface ColourSwatchPickerProps {
  value: string | null; // current colour as a hex string
  onChange: (hex: string | null) => void; // called on selection with a hex string or null when cleared
  size?: number; // size of the square swatch button in pixels (default: 18)
  disabled?: boolean; // wether interaction are disabled (e.g. while a mutation is in flight)
}


/* The six theme tokens we expose. Order matters: it determines the palette grid order. */
const PALETTE_TOKENS = [
  { name: 'primary',   tooltip: 'Primary'   },
  { name: 'secondary', tooltip: 'Secondary' },
  { name: 'info',      tooltip: 'Info'      },
  { name: 'success',   tooltip: 'Success'   },
  { name: 'warning',   tooltip: 'Warning'   },
  { name: 'error',     tooltip: 'Error'     },
] as const;

type PaletteName = typeof PALETTE_TOKENS[number]['name'];


export default function ColourSwatchPicker({ value, onChange, size = 18, disabled = false }: ColourSwatchPickerProps) {
  const theme = useTheme();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  /* Normalize the displayed colour: accept 6-char #RRGGBB, 8-char #AARRGGBB, or palette names in either case.
     Falls back to "no colour" (transparent + dashed outline) otherwise. */
  const displayedFill = normalizeHexFill(value);

  const handleOpen = (e: MouseEvent<HTMLElement>) => {
    if (disabled) return;
    setAnchor(e.currentTarget);
  };
  const handleClose = () => setAnchor(null);

  const pickPalette = (paletteName: PaletteName) => {
    const themeHex = theme.palette[paletteName].main;
    // Convert "#rrggbb" -> "FFRRGGBB" (full alpha)
    const aarrggbb = `FF${themeHex.replace('#', '').toUpperCase()}`;
    onChange(aarrggbb);
    handleClose();
  };

  const pickClear = () => {
    onChange(null);
    handleClose();
  };

  return (
    <>
      <Tooltip arrow disableInteractive title={value ? 'Change entry colour' : 'Set entry colour'}>
        <Box component="span" sx={{ display: 'inline-flex' }}>
          <Box
            component="button"
            type="button"
            onClick={handleOpen}
            disabled={disabled}
            aria-label="Pick entry colour"
            sx={{
              width: size,
              height: size,
              border: displayedFill ? `1px solid ${theme.palette.divider}` : `1px dashed ${theme.palette.divider}`,
              borderRadius: 1,
              backgroundColor: displayedFill ?? 'transparent',
              padding: 0,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              flexShrink: 0,
              transition: 'border-color 120ms ease, transform 80ms ease',
              '&:hover': disabled ? undefined : { transform: 'scale(1.1)' },
            }}
          />
        </Box>
      </Tooltip>

      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Stack direction="row" spacing={0.75} sx={{ p: 1, flexWrap: 'nowrap' }}>
          {PALETTE_TOKENS.map((p) => {
            const swatchHex = theme.palette[p.name].main;
            return (
              <Tooltip key={p.name} arrow disableInteractive title={p.tooltip}>
                <Box
                  component="button"
                  type="button"
                  onClick={() => pickPalette(p.name)}
                  aria-label={`Set colour: ${p.tooltip}`}
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: 1,
                    backgroundColor: swatchHex,
                    border: `1px solid ${theme.palette.divider}`,
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'transform 80ms ease',
                    '&:hover': { transform: 'scale(1.15)' },
                  }}
                />
              </Tooltip>
            );
          })}
          {/* Clear slot */}
          <Tooltip arrow disableInteractive title="No colour">
            <Box
              component="button"
              type="button"
              onClick={pickClear}
              aria-label="Clear entry colour"
              sx={{
                width: 22,
                height: 22,
                borderRadius: 1,
                backgroundColor: 'transparent',
                border: `1px dashed ${theme.palette.text.secondary}`,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: theme.palette.text.secondary,
                transition: 'transform 80ms ease',
                '&:hover': { transform: 'scale(1.15)' },
              }}
            >
              <CloseRoundedIcon sx={{ fontSize: 14 }} />
            </Box>
          </Tooltip>
        </Stack>
      </Popover>
    </>
  );
}


/* "AARRGGBB" or "RRGGBB" or "#..." -> a CSS-usable "#RRGGBB" / "#AARRGGBB" fill.
   Returns null when the input is null, empty, or doesn't look like a hex colour. */
function normalizeHexFill(input: string | null | undefined): string | null {
  if (!input) return null;
  const stripped = input.trim().replace(/^#/, '').toUpperCase();
  if (!/^[0-9A-F]{6}([0-9A-F]{2})?$/.test(stripped) && !/^[0-9A-F]{8}$/.test(stripped)) {
    return null;
  }
  /* Domain stores in AARRGGBB, CSS uses #RRGGBBAA. Re-order on render. */
  if (stripped.length === 8) {
    const aa = stripped.slice(0, 2);
    const rest = stripped.slice(2);
    return `#${rest}${aa}`;
  }
  return `#${stripped}`;
}
