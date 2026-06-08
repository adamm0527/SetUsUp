import { useMemo, useState } from 'react';
import { Box, Button, Popover, Stack, Tooltip, Typography } from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { KeyChip } from '#root/components';


interface KeyFilterProps {
  /* the user-selected key set, in stored "DDL" format ("05A") */
  selectedKeys: string[];
  /* called when the user toggles a key (add if not present, remove if present) */
  onToggleKey: (key: string) => void;
  /* called when the user wants to clear all keys */
  onClearAll: () => void;
}


/* All 24 Camelot keys in display form. We store keys in canonical "DDL" form (e.g. "05A")
   but the picker shows "5A" for clarity. Helper functions handle both. */
const ALL_DISPLAY_KEYS: string[] = (() => {
  const out: string[] = [];
  for (let n = 1; n <= 12; n++) {
    out.push(`${n}A`);
    out.push(`${n}B`);
  }
  return out;
})();
const MAX_INLINE_CHIPS = 4;

/* Picker for one or more Camelot keys. Selected keys appear as inline chips. */
export default function KeyFilter({ selectedKeys, onToggleKey, onClearAll }: KeyFilterProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [overflowAnchor, setOverflowAnchor] = useState<HTMLElement | null>(null);

  const selectedDisplay = useMemo(
    () => selectedKeys.map(displayKey),
    [selectedKeys]
  );

  /* For the "overflown" chips. */
  const overflowSelected = selectedDisplay.slice(MAX_INLINE_CHIPS);
  const overflowCount = overflowSelected.length;

  return (
    <>
      {/* Trigger button + selected chip list */}
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
        <Button variant="outlined" size="small"
          onClick={(e) => setAnchor(e.currentTarget)} endIcon={<KeyboardArrowDownRoundedIcon />}
          sx={{ borderRadius: 999, textTransform: 'none' }}
        >
          Key
          {selectedKeys.length > 0 && (
            <Box component="span" sx={{ ml: 0.5, fontWeight: 700 }}>
              ({selectedKeys.length})
            </Box>
          )}
        </Button>

        {/* Active key chips inline (capped by constant), click removes. */}
        {selectedDisplay.slice(0, MAX_INLINE_CHIPS).map((k) => (
          <Tooltip key={k} title="Click to remove from filter" arrow disableInteractive>
            <Box>
              <KeyChip initKey={k}
                onClick={() => onToggleKey(toStoredKey(k))} emphasized
              />
            </Box>
          </Tooltip>
        ))}

        {/* Overflow indicator opening Popover with the truncated chips. */}
        {overflowCount > 0 && (
          <Tooltip title={`${overflowCount} more selected. Click to manage.`} arrow disableInteractive>
            <Button
              variant="outlined" size="small"
              onClick={(e) => setOverflowAnchor(e.currentTarget)}
              sx={{
                borderRadius: 999,
                textTransform: 'none',
                minWidth: 44,
                fontWeight: 700,
                py: 0,
                height: 24,
                lineHeight: 1,
              }}
            >
              +{overflowCount}
            </Button>
          </Tooltip>
        )}

        {selectedKeys.length > 0 && (
          <Tooltip title="Clear all key filters" arrow disableInteractive>
            <Box>
              <Button size="small" onClick={onClearAll} startIcon={<CloseRoundedIcon />}
                sx={{ textTransform: 'none', minWidth: 'auto' }}>
                clear
              </Button>
            </Box>
          </Tooltip>
        )}
      </Stack>

      {/* Popover with the 24-key picker */}
      <Popover open={!!anchor} anchorEl={anchor} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        onClose={() => setAnchor(null)}
      >
        <Box sx={{ p: 2, maxWidth: 360 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Click keys to toggle in the filter. Empty filter = all keys included.
          </Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {ALL_DISPLAY_KEYS.map((k) => {
              const stored = toStoredKey(k);
              const isSelected = selectedKeys.includes(stored);
              return (
                <Tooltip key={k} title={isSelected ? 'Click to remove from filter' : 'Click to add to filter'}
                  arrow disableInteractive
                >
                  <Box>
                    <KeyChip initKey={k}
                      onClick={() => onToggleKey(stored)} emphasized={isSelected}
                    />
                  </Box>
                </Tooltip>
              );
            })}
          </Stack>
        </Box>
      </Popover>

      {/* Overflow Popover showing truncated chips, each clickable to remove. */}
      <Popover open={!!overflowAnchor} anchorEl={overflowAnchor} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        onClose={() => setOverflowAnchor(null)}>
        <Box sx={{ p: 2, maxWidth: 320 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {overflowCount} more selected. Click any to remove from filter.
          </Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {overflowSelected.map((k) => (
              <Tooltip key={k} title="Click to remove from filter" arrow disableInteractive>
                <Box>
                  <KeyChip
                    initKey={k}
                    onClick={() => {
                      onToggleKey(toStoredKey(k));
                      /* When the user removes the last overflow chip, close the popover so the "+N" button to disappears with it. */
                      if (overflowCount === 1) setOverflowAnchor(null);
                    }}
                    emphasized
                  />
                </Box>
              </Tooltip>
            ))}
          </Stack>
        </Box>
      </Popover>
    </>
  );
}


/* e.g. "05A" -> "5A" (trim leading zero) */
function displayKey(stored: string): string {
  const m = stored.match(/^0?(\d{1,2})([AB])$/i);
  if (!m) return stored;
  return `${parseInt(m[1], 10)}${m[2].toUpperCase()}`;
}

/* e.g. "5A" or "05A" -> canonical "05A" */
function toStoredKey(any: string): string {
  const m = any.match(/^0?(\d{1,2})([AB])$/i);
  if (!m) return any;
  const n = parseInt(m[1], 10);
  return `${String(n).padStart(2, '0')}${m[2].toUpperCase()}`;
}
