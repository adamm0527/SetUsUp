import { useEffect, useState } from 'react';
import { InputAdornment, TextField } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';


interface TextFilterProps {
  value: string;
  onChange: (next: string) => void;
  debounceMs?: number; // defaults to 200ms (typing feel)
}


/* Debounced text input for filtering songs by artist+title substring. */
export default function TextFilter({ value, onChange, debounceMs = 200 }: TextFilterProps) {
  const [local, setLocal] = useState(value);

  /* keep local in sync if parent (URL hydration) overrides */
  useEffect(() => { setLocal(value); }, [value]);

  /* debounce parent updates */
  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== value) onChange(local);
    }, debounceMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, debounceMs]);

  return (
    <TextField
      placeholder="Search artist or title…"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      size="small"
      sx={{ minWidth: 240 }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon fontSize="small" />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
