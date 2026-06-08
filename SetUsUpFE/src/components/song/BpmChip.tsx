import { Chip, type ChipProps, Tooltip } from '@mui/material';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';


interface BpmChipProps {
  bpm: number;
  bpmOut?: number | null; // when different from bpm, the song doesn't have constant tempo
  size?: ChipProps['size']; // defaults to 'small'
  variant?: ChipProps['variant']; // defaults to 'outlined'
}


/* BPM display chip. When bpmOut differs from bpm, the label becomes "in --> out",
  to signal a variable-tempo song (DJ-relevant: the song speeds up or slows down across its duration). */
export default function BpmChip({ bpm, bpmOut, size = 'small', variant = 'outlined' }: BpmChipProps) {
  const inRounded = roundOne(bpm);
  const outRounded = bpmOut != null ? roundOne(bpmOut) : null;
  const variable = outRounded != null && outRounded !== inRounded;

  const label = variable ? `${inRounded} → ${outRounded}` : `${inRounded}`;
  const tooltipText = variable
    ? `BPM varies from ${inRounded} (mix-in) to ${outRounded} (mix-out)`
    : `BPM: ${inRounded}`;

  return (
    <Tooltip title={tooltipText} arrow disableInteractive>
      <Chip icon={<SpeedRoundedIcon />} label={label} size={size} variant={variant} sx={{ fontWeight: 600, minWidth: 64 }} />
    </Tooltip>
  );
}

function roundOne(n: number): string {
  // Render at most 1 decimal; drop ".0" for cleanliness ("128" not "128.0").
  const rounded = Math.round(n * 10) / 10;
  return rounded % 1 === 0 ? String(Math.round(rounded)) : rounded.toFixed(1);
}
