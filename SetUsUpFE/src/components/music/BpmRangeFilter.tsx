import { useEffect, useState } from 'react';
import { Box, Slider, Stack, TextField, Tooltip } from '@mui/material';


interface BpmRangeFilterProps {
  /* nulls mean "no bound" (slider at the edge) */
  min: number | null;
  max: number | null;
  onChange: (min: number | null, max: number | null) => void;
}


const BPM_MIN = 0;
const BPM_MAX = 300;


/* Dual-thumb BPM slider + matching numeric inputs. Validates 0..300, ensures min <= max.
   Inputs support clearing (empty string) -> the corresponding bound becomes "no bound" (null). */
export default function BpmRangeFilter({ min, max, onChange }: BpmRangeFilterProps) {
  // local state for typing
  const [low, setLow] = useState<number>(min ?? BPM_MIN);
  const [high, setHigh] = useState<number>(max ?? BPM_MAX);
  const [lowText, setLowText] = useState<string>(min == null ? '' : String(min));
  const [highText, setHighText] = useState<string>(max == null ? '' : String(max));

  useEffect(() => {
    setLow(min ?? BPM_MIN);
    setLowText(min == null ? '' : String(min));
  }, [min]);
  useEffect(() => {
    setHigh(max ?? BPM_MAX);
    setHighText(max == null ? '' : String(max));
  }, [max]);

  const commitSlider = (vals: number[]) => {
    const [a, b] = vals;
    onChange(
      a <= BPM_MIN ? null : a,
      b >= BPM_MAX ? null : b
    );
  };

  const commitInputs = () => {
    const a = parseBpm(lowText, BPM_MIN);
    const b = parseBpm(highText, BPM_MAX);
    // swap if user got them backwards
    const [lo, hi] = a > b ? [b, a] : [a, b];
    setLow(lo); setHigh(hi);
    setLowText(lo === BPM_MIN ? lowText : String(lo));
    setHighText(hi === BPM_MAX ? highText : String(hi));
    onChange(
      lowText.trim() === '' ? null : lo,
      highText.trim() === '' ? null : hi
    );
  };

  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 320 }}>
      <Tooltip title="Lower BPM bound (empty = no bound)" arrow disableInteractive>
        <TextField size="small" value={lowText}
          onChange={(e) => setLowText(e.target.value)} onBlur={commitInputs}
          onKeyDown={(e) => { if (e.key === 'Enter') commitInputs(); }}
          placeholder="min" inputMode="decimal" sx={{ width: 80 }}
        />
      </Tooltip>
      <Box sx={{ flex: 1, px: 1 }}>
        <Slider
          value={[low, high]} min={BPM_MIN} max={BPM_MAX} step={1}
          onChange={(_e, v) => Array.isArray(v) && (setLow(v[0]), setHigh(v[1]))}
          onChangeCommitted={(_e, v) => Array.isArray(v) && commitSlider(v)}
          size="small" valueLabelDisplay="auto"
          sx={{ '& .MuiSlider-valueLabel': { fontSize: '0.7rem' } }}
        />
      </Box>
      <Tooltip title="Upper BPM bound (empty = no bound)" arrow disableInteractive>
        <TextField size="small" value={highText}
          onChange={(e) => setHighText(e.target.value)} onBlur={commitInputs}
          onKeyDown={(e) => { if (e.key === 'Enter') commitInputs(); }}
          placeholder="max" inputMode="decimal" sx={{ width: 80 }}
        />
      </Tooltip>
    </Stack>
  );
}

function parseBpm(text: string, fallback: number): number {
  if (text.trim() === '') return fallback;
  const n = parseFloat(text);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(BPM_MAX, Math.max(BPM_MIN, n));
}
