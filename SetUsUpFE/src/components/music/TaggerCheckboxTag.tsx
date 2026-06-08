import { Checkbox, FormControlLabel, Tooltip } from '@mui/material';
import Fade from '@mui/material/Fade';
import { type TagInfo } from '#root/lib/types';


interface TaggerCheckboxTagProps {
  tag: TagInfo;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}


/* One checkbox row inside a TaggerGroup. Tooltip shows the tag's description. */
export default function TaggerCheckboxTag({ tag, checked, disabled, onToggle }: TaggerCheckboxTagProps) {
  return (
    <Tooltip title={tag.description} arrow placement="top" enterDelay={500} disableInteractive slots={{ transition: Fade }}>
      <FormControlLabel
        control={
          <Checkbox size="small" checked={checked} disabled={disabled} onChange={onToggle} />
        }
        label={tag.name}
        sx={{
          width: '100%',
          mr: 0,
          '& .MuiFormControlLabel-label': {
            fontSize: '0.85rem',
            opacity: disabled ? 0.5 : 1,
          }
        }}
      />
    </Tooltip>
  );
}
