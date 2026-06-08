import { FormControlLabel, Radio, Tooltip } from '@mui/material';
import Fade from '@mui/material/Fade';
import { type TagInfo } from '#root/lib/types';


interface TaggerRadioTagProps {
  tag: TagInfo;
  checked: boolean;
  disabled: boolean;
  onSelect: () => void;
}


/* One radio row inside a TaggerGroup (mutually exclusive choices). Tooltip shows description. */
export default function TaggerRadioTag({ tag, checked, disabled, onSelect }: TaggerRadioTagProps) {
  return (
    <Tooltip title={tag.description} arrow placement="top" enterDelay={500} disableInteractive slots={{ transition: Fade }}>
      <FormControlLabel
        control={
          <Radio size="small" checked={checked} disabled={disabled} onChange={onSelect} />
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
