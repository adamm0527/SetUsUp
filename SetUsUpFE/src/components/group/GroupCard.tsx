import { Card, CardActionArea, CardContent, Stack, Typography, Box, Chip, Tooltip } from '@mui/material';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import { type GroupInfo } from '#root/lib/types';
import RoleBadge from './RoleBadge.tsx';


interface GroupCardProps {
  group: GroupInfo;
  selected: boolean;
  onSelect: () => void;
}

const MEMBER_PREVIEW_LIMIT = 3;


/* one card in the GroupList; renders a ReadGroupDto and signals selection back up */
export default function GroupCard({ group, selected, onSelect }: GroupCardProps) {
  const previewNames = group.memberNames.slice(0, MEMBER_PREVIEW_LIMIT);
  const remainingNames = group.memberNames.slice(MEMBER_PREVIEW_LIMIT);
  const hasMore = remainingNames.length > 0;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        borderColor: selected ? 'primary.main' : 'divider',
        borderWidth: selected ? 2 : 1,
        transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
        boxShadow: selected ? 4 : 0,
        transform: selected ? 'translateY(-1px)' : 'none',
        '&:hover': {
          borderColor: 'primary.light',
          boxShadow: selected ? 4 : 2
        }
      }}
    >
      <CardActionArea onClick={onSelect} sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          {/* top row: name + role badge + personal lock */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
              {group.isPersonal && (
                <Tooltip title="Your personal library - cannot be renamed or shared." arrow>
                  <LockRoundedIcon fontSize="small" color="action" />
                </Tooltip>
              )}
              <Typography
                variant="subtitle1"
                noWrap
                sx={{ fontWeight: 600 }}
                title={group.name}
              >
                {group.name}
              </Typography>
            </Stack>
            <RoleBadge role={group.role} />
          </Stack>

          {/* second row: member count + member name chips (capped at 3 + "and N more" tooltip) */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 0.5 }}>
            <Chip icon={<PeopleAltRoundedIcon />} label={group.memberCount} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
            <Box sx={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5, minWidth: 0 }}>
              {previewNames.map((name) => (
                <Chip key={name} label={name} size="small" variant="outlined" sx={{ maxWidth: 140 }} />
              ))}
              {hasMore && (
                <Tooltip title={remainingNames.join(', ')} arrow placement="top">
                  <Chip label={`+${remainingNames.length} more`} size="small" color="info" variant="outlined" sx={{ fontStyle: 'italic' }} />
                </Tooltip>
              )}
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
