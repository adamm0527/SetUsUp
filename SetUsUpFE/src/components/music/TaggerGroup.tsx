import { Box, FormControl, FormLabel, Stack, Tooltip, Typography } from '@mui/material';
import { TagGroupTypes, type TagGroupInfo, type TagInfo } from '#root/lib/types';
import TaggerCheckboxTag from './TaggerCheckboxTag.tsx';
import TaggerRadioTag from './TaggerRadioTag.tsx';


interface TaggerGroupProps {
  group: TagGroupInfo;
  /* the song's currently-selected tag IDs */
  selectedIds: Set<string>;
  /* when true, all controls in this group are visually-disabled (e.g. an OMC group whose MXP pivot is at "01") */
  disabled: boolean;
  /* called when the user toggles or selects a tag in this group */
  onTagToggle: (tagId: string) => void;
  /* called when the user clears the radio selection on an OX group (which allows clear) */
  onClearRadio: () => void;
}


/* Renders one TagGroup with the correct interaction model based on its `type`:
    MX   -> radio, no clear
    OX   -> radio, with a "clear" button
    OM   -> checkboxes
    MXP  -> radio, no clear (serves as a pivot for OMC groups in the same category)
    OMC  -> checkboxes, visually disabled when `disabled === true`
    OXC  -> hybrid: ids 01..09 act like OX (radios), ids 10+ act like OM (checkboxes) */
export default function TaggerGroup({
  group, selectedIds, disabled, onTagToggle, onClearRadio,
}: TaggerGroupProps) {
  const type = group.type;
  const isRadio = type === TagGroupTypes.MX || type === TagGroupTypes.OX || type === TagGroupTypes.MXP;
  const isCheckbox = type === TagGroupTypes.OM || type === TagGroupTypes.OMC;
  const isHybrid = type === TagGroupTypes.OXC;

  return (
    <FormControl component="fieldset" sx={{ mb: 1.5, width: '100%', opacity: disabled ? 0.65 : 1 }}>
      <FormLabel component="legend" sx={{ fontSize: '0.8rem', fontWeight: 700, mb: 0.5 }}>
        <Tooltip
          title={describeType(type)}
          arrow
          placement="top"
          enterDelay={500}
          disableInteractive
        >
          <Box component="span">{group.name}</Box>
        </Tooltip>
      </FormLabel>

      {isRadio && (
        <Stack spacing={0}>
          {group.tags.map((t) => (
            <TaggerRadioTag
              key={t.id}
              tag={t}
              checked={selectedIds.has(t.id)}
              disabled={disabled}
              onSelect={() => onTagToggle(t.id)}
            />
          ))}
          {type === TagGroupTypes.OX && (
            <Box sx={{ mt: 0.5 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ cursor: 'pointer', userSelect: 'none', textDecoration: 'underline' }}
                onClick={disabled ? undefined : onClearRadio}
              >
                clear
              </Typography>
            </Box>
          )}
        </Stack>
      )}

      {isCheckbox && (
        <Stack spacing={0}>
          {group.tags.map((t) => (
            <TaggerCheckboxTag
              key={t.id}
              tag={t}
              checked={selectedIds.has(t.id)}
              disabled={disabled}
              onToggle={() => onTagToggle(t.id)}
            />
          ))}
        </Stack>
      )}

      {isHybrid && (
        <HybridOxcCluster
          group={group}
          selectedIds={selectedIds}
          disabled={disabled}
          onTagToggle={onTagToggle}
        />
      )}
    </FormControl>
  );
}


/* OXC hybrid: within a single group:
    - tags whose suffix is "01".."09" act as a mutually-exclusive radios.
    - tags whose suffix is "10"+ act as multi-select checkboxes. */
function HybridOxcCluster({
  group, selectedIds, disabled, onTagToggle
}: {
  group: TagGroupInfo;
  selectedIds: Set<string>;
  disabled: boolean;
  onTagToggle: (tagId: string) => void;
}) {
  const radioTags: TagInfo[] = [];
  const checkboxTags: TagInfo[] = [];
  for (const t of group.tags) {
    const suffix = parseInt(t.id.slice(-2), 10);
    if (suffix >= 1 && suffix <= 9) radioTags.push(t);
    else checkboxTags.push(t);
  }

  return (
    <Stack spacing={0}>
      {radioTags.length > 0 && (
        <Box sx={{ mb: checkboxTags.length > 0 ? 0.75 : 0 }}>
          {radioTags.map((t) => (
            <TaggerRadioTag
              key={t.id}
              tag={t}
              checked={selectedIds.has(t.id)}
              disabled={disabled}
              onSelect={() => onTagToggle(t.id)}
            />
          ))}
        </Box>
      )}
      {checkboxTags.length > 0 && (
        <Box>
          {checkboxTags.map((t) => (
            <TaggerCheckboxTag
              key={t.id}
              tag={t}
              checked={selectedIds.has(t.id)}
              disabled={disabled}
              onToggle={() => onTagToggle(t.id)}
            />
          ))}
        </Box>
      )}
    </Stack>
  );
}


function describeType(type: number): string {
  switch (type) {
    case TagGroupTypes.MX:  return 'Mandatory + exclusive: pick exactly one.';
    case TagGroupTypes.OX:  return 'Optional + exclusive: pick at most one.';
    case TagGroupTypes.OM:  return 'Optional + multi: pick any number.';
    case TagGroupTypes.MXP: return 'Mandatory + exclusive (pivot): controls related groups in this category.';
    case TagGroupTypes.OMC: return 'Optional + multi (conditional): available only when the pivot above is set to a non-default value.';
    case TagGroupTypes.OXC: return 'Hybrid: lower tags (01-09) are mutually exclusive; upper tags (10+) are multi-select.';
    default: return '';
  }
}
