import { Autocomplete, Chip, TextField } from '@mui/material';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';


interface MemberNameChipInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  excludeNames?: string[]; // optional names to exclude (e.g. the current user, already-added members)
  label?: string; // label on the TextField
  placeholder?: string; // placeholder shown when no chips are present
  helperText?: string;
}

/* chip-style input for typing arbitrary usernames (Backend validates existence on submit) */
export default function MemberNameChipInput({
  value, onChange, disabled, excludeNames, label, placeholder, helperText
}: MemberNameChipInputProps) {

  const normalizeAndDedupe = (raw: string[]): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    const exclude = new Set((excludeNames ?? []).map(n => n.toLowerCase()));
    for (const r of raw) {
      const trimmed = r.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seen.has(key) || exclude.has(key)) continue;
      seen.add(key);
      out.push(trimmed);
    }
    return out;
  };

  return (
    <Autocomplete<string, true, true, true>
      multiple
      freeSolo
      disableClearable
      options={[]} // no suggestions; user types freely
      value={value}
      onChange={(_e, next) => onChange(normalizeAndDedupe(next as string[]))}
      disabled={disabled}
      renderValue={(values, getItemProps) =>
        values.map((option, index) => {
          const itemProps = getItemProps({ index });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { key, ...rest } = itemProps;
          return (
            <Chip key={key} variant="outlined" color="primary" icon={<PersonAddRoundedIcon />} label={option} {...rest}
            />
          );
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          label={label ?? 'Members to invite (by username)'}
          placeholder={value.length === 0 ? (placeholder ?? 'type a username + Enter') : ''}
          helperText={helperText ?? 'Press Enter after each username. Existence is verified upon submit.'}
        />
      )}
    />
  );
}
