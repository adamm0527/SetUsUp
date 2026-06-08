import { Chip, type ChipProps } from '@mui/material';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { Role, type RoleType } from '#root/lib/types';


interface RoleBadgeProps {
  role: RoleType;
  size?: ChipProps['size']; // defaults to 'small'
  variant?: ChipProps['variant']; // defaults to 'filled'
}

/* small chip+icon badge for displaying a user's role in a group */
export default function RoleBadge({ role, size = 'small', variant = 'filled' }: RoleBadgeProps) {
  switch (role) {
    case Role.Creator:
      return (
        <Chip icon={<StarRoundedIcon />} label="Creator"
          size={size} variant={variant} color="secondary" sx={{ fontWeight: 600 }}
        />
      );
    case Role.Admin:
      return (
        <Chip icon={<ShieldRoundedIcon />} label="Admin"
          size={size} variant={variant} color="secondary" sx={{ fontWeight: 600 }}
        />
      );
    case Role.Member:
    default:
      return (
        <Chip icon={<PersonRoundedIcon />} label="Member"
          size={size} variant={variant === 'filled' ? 'outlined' : variant} color="primary" sx={{ fontWeight: 500 }}
        />
      );
  }
}
