import React, { forwardRef, useState, type ReactNode } from 'react';
import { Autocomplete, TextField, InputAdornment, Tooltip } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import type { NamedEntity } from '#root/lib/types';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';


interface EntitySelectorProps {
  label?: string;
  placeholder?: string;
  icon: SvgIconComponent;
  options: NamedEntity[];
  value: NamedEntity | null | '';
  inputValue: string;
  onValueChange: (value: NamedEntity | null) => void;
  onInputChange: (input: string) => void;
  onClose?: () => void;
  sx?: any;
  /* optional: render extra content inside a tooltip for each option (e.g. member chips).
     If provided, each option row is wrapped in a slowly-appearing tooltip. */
  optionTooltipContent?: (option: NamedEntity) => ReactNode;
  tooltipEnterDelay?: number; // delay for the option tooltip in ms; defaults to 600 (slow)
}

const EntitySelector = forwardRef<HTMLInputElement, EntitySelectorProps>(
  function EntitySelector(props, ref) {
    const [openState, setOpenState] = useState(false);

    /* event-handlers for autocomplete selection/change */
    const handleChange = (_ev: any, newValue: NamedEntity | string) => {
      let final: NamedEntity | null;

      if (typeof newValue === 'string') {
        final = findBestMatch(newValue, props.options);
        if (final)
          props.onValueChange(final);
      } else {
        final = newValue;
        props.onValueChange(newValue);
      }
      props.onInputChange(final ? final.name : '');
    }

    /* handling free-typing + Enter to pick nearest match */
    const handleKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        // find closest match
        const best = findBestMatch((ev.target as HTMLInputElement).value, props.options);
        if (best) {
          props.onValueChange(best);
          props.onInputChange(best.name);
        }
      }
    }

    /* event-handlers for autocomplete closing */
    const handleClose = () => {
      const valueText = (typeof props.value === 'string') ? props.value : props.value?.name;
      const inputChanged = (valueText !== props.inputValue); // guards against unnecessary updates
      const hasOptions = (props.options.length > 0);
      if (hasOptions)
      {
        /* if autocomplete has options */
        const hasInput = props.inputValue.trim().length > 0;
        if (hasInput) {
          /* if there's input in the autocomplete */
          if (inputChanged) {
            const best = findBestMatch(props.inputValue, props.options);
            if (best) {
              /* setting best match (if found) */
              props.onValueChange(best);
              props.onInputChange(best.name);
            } else {
              /* if there's no match for the input, we pick the first one by default */
              props.onValueChange(props.options[0]);
              props.onInputChange(props.options[0].name);
            }
          }
        } else {
          /* if there's no input in the autocomplete, but there are options, we pick the first one by default */
          props.onValueChange(props.options[0]);
          props.onInputChange(props.options[0].name);
        }
      } else {
        /* if no options exist, nothing can be selected (clearing on leaving) */
        if (valueText !== '') {
          props.onValueChange(null);
          props.onInputChange('');
        }
      }
      setOpenState(false);
      props.onClose?.(); // calling extra callback (e.g. to transfer focus)
    }

    return (
      /* boolean parameters are as follows: !mutliple, disableClearable, freeSolo) */
      <Autocomplete<NamedEntity, false, true, true> freeSolo disableClearable forcePopupIcon openOnFocus
        autoComplete blurOnSelect handleHomeEndKeys size="small" sx={props.sx} options={props.options}
        open={openState} onOpen={() => setOpenState(true)} onClose={handleClose}
        value={props.value ?? ''} onChange={handleChange}
        inputValue={props.inputValue} onInputChange={(_ev, v) => props.onInputChange(v) }
        getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
        isOptionEqualToValue={(option, value) => {
          if (typeof option === 'string' || typeof value === 'string')
            return (option === value);

          return (option.id === value.id);
        }}
        renderOption={(renderProps, option, { inputValue }) => {
          const { key, ...optionProps } = renderProps;
          /* get matches inside the option name */
          const matches = match(option.name, inputValue, { insideWords: true });
          const parts = parse(option.name, matches);

          const inner = (
            <li key={option.id} {...optionProps}>
              <div>
                {parts.map((part, index) => (
                  <span key={index} style={{ fontWeight: part.highlight ? 700 : 400 }}>
                    {part.text}
                  </span>
                ))}
              </div>
            </li>
          );
          /* If a tooltip content factory is supplied, wrap each option in a slowly-appearing tooltip. */
          if (props.optionTooltipContent) {
            return (
              <Tooltip key={option.id} placement="right" arrow
                enterDelay={props.tooltipEnterDelay ?? 600} enterNextDelay={props.tooltipEnterDelay ?? 600} leaveDelay={120}
                slotProps={{
                  tooltip: { sx: { p: 1, maxWidth: 360, backgroundColor: 'background.paper', color: 'text.primary',
                                   border: 1, borderColor: 'divider', boxShadow: 4 } },
                  arrow:   { sx: { color: 'background.paper' } }
                }}
                title={props.optionTooltipContent(option)}
              >
                {inner}
              </Tooltip>
            );
          }
          return inner;
        }}
        renderInput={(params) => (
          <TextField {...params} label={props.label} placeholder={props.placeholder} inputRef={ref}
            onKeyDown={handleKeyDown} slotProps={{
              inputLabel: { sx: { fontSize: 'large', }},
              input: {
                sx: { fontSize: 'large' },
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start" sx={{ paddingLeft: 0.5, paddingRight: 0, marginRight: 0 }}>
                    <props.icon/>
                  </InputAdornment>
                ),
              }
            }}
          />
        )}
      />
    );
  }
)

export default EntitySelector;


/* function to find the closest matching option */
function findBestMatch(input: string, options: NamedEntity[]) {
  if (!input)
    return null;

  const q = input.trim().toLowerCase();
  let match = options.find((o) => o.name.toLowerCase().startsWith(q)); // exact match
  if (!match)
    match = options.find((o) => o.name.toLowerCase().includes(q)); // contains at least
  return match ?? options[0] ?? null;
}
