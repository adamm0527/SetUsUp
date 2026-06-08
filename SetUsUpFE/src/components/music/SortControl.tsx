import { useState } from 'react';
import { Box, Button, Chip, Menu, MenuItem, Stack, Tooltip, Typography } from '@mui/material';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { type SortChain, type SortField, type SortStep } from '#root/clientdata/stores';


interface SortControlProps {
  sort: SortChain;
  onChange: (next: SortChain) => void;
}


const SORT_FIELD_LABELS: Record<SortField, string> = {
  artist: 'Artist',
  title:  'Title',
  bpm:    'BPM',
  key:    'Key',
};


/* Shows the active multi-sort chain as a row of removable chips with a leading "Sort:" label.
   Functionality of the chips:
     - click direction icon to toggle asc/desc
     - click up/donw arrows to reorder within the chain
     - click X to remove
 * A trailing "+" button (menu) appends a new sort step. */
export default function SortControl({ sort, onChange }: SortControlProps) {
  const [addAnchor, setAddAnchor] = useState<HTMLElement | null>(null);

  const usedFields = new Set(sort.map((s) => s.field));
  const remainingFields = (['artist', 'title', 'bpm', 'key'] as SortField[]).filter((f) => !usedFields.has(f));

  const toggleDir = (idx: number) => {
    const next = [...sort];
    next[idx] = { ...next[idx], dir: next[idx].dir === 'asc' ? 'desc' : 'asc' };
    onChange(next);
  };

  const remove = (idx: number) => {
    const next = sort.filter((_, i) => i !== idx);
    onChange(next);
  };

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= sort.length) return;
    const next = [...sort];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const add = (field: SortField) => {
    setAddAnchor(null);
    const step: SortStep = { field, dir: 'asc' };
    onChange([...sort, step]);
  };

  return (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
      <SortRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
      <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
        Sort:
      </Typography>

      {sort.map((step, idx) => (
        <Chip
          key={step.field}
          icon={step.dir === 'asc' ? <ArrowUpwardRoundedIcon /> : <ArrowDownwardRoundedIcon />}
          label={
            <Stack direction="row" alignItems="center" spacing={0.25}>
              <Box component="span">{SORT_FIELD_LABELS[step.field]}</Box>
              {sort.length > 1 && (
                <>
                  <Tooltip title="Move earlier" arrow disableInteractive>
                    <KeyboardArrowUpRoundedIcon
                      fontSize="small"
                      onClick={(e) => { e.stopPropagation(); move(idx, -1); }}
                      sx={{
                        cursor: 'pointer', ml: 0.5, opacity: idx === 0 ? 0.3 : 0.7,
                        pointerEvents: idx === 0 ? 'none' : 'auto'
                      }}
                    />
                  </Tooltip>
                  <Tooltip title="Move later" arrow disableInteractive>
                    <KeyboardArrowDownRoundedIcon
                      fontSize="small"
                      onClick={(e) => { e.stopPropagation(); move(idx, 1); }}
                      sx={{
                        cursor: 'pointer', opacity: idx === sort.length - 1 ? 0.3 : 0.7,
                        pointerEvents: idx === sort.length - 1 ? 'none' : 'auto'
                      }}
                    />
                  </Tooltip>
                </>
              )}
            </Stack>
          }
          size="small"
          variant="outlined"
          color={idx === 0 ? 'primary' : 'default'}
          onClick={() => toggleDir(idx)}
          onDelete={() => remove(idx)}
          deleteIcon={<CloseRoundedIcon />}
          sx={{ borderRadius: 999, height: 26, fontWeight: 600 }}
        />
      ))}

      {remainingFields.length > 0 && (
        <>
          <Button
            size="small"
            variant="text"
            onClick={(e) => setAddAnchor(e.currentTarget)}
            sx={{ textTransform: 'none', minWidth: 'auto', fontWeight: 700 }}
          >
            + add
          </Button>
          <Menu anchorEl={addAnchor} open={!!addAnchor} onClose={() => setAddAnchor(null)}>
            {remainingFields.map((f) => (
              <MenuItem key={f} onClick={() => add(f)}>
                {SORT_FIELD_LABELS[f]}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </Stack>
  );
}
