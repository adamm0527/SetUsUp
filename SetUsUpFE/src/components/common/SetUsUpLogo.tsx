import { Stack, type StackProps, Box } from '@mui/material';
import { useThemeModeStore } from '#root/clientdata/stores';
import {
  PUBLIC_SU_ICON_DARK, PUBLIC_SU_ICON_LIGHT,
  PUBLIC_SU_LOGO_LIGHT, PUBLIC_SU_LOGO_DARK
} from '#root/lib/constants';


interface LogoPaths {
  icon: string;
  logo: string;
}

export interface SetUsUpLogoProps {
  direction?: StackProps['direction'];
  iconSize?: number | string;
}

export default function SetUsUpLogo({direction, iconSize = 32 }: SetUsUpLogoProps) {
  const modeState = useThemeModeStore((store) => store.mode);

  const logoPaths: LogoPaths = (modeState === 'light')
    ? { icon: PUBLIC_SU_ICON_LIGHT, logo: PUBLIC_SU_LOGO_LIGHT }
    : { icon: PUBLIC_SU_ICON_DARK, logo: PUBLIC_SU_LOGO_DARK };

  return (
    <Stack direction={direction} alignItems="center" spacing={0.5}>
      <Box component="img" src={logoPaths.icon} alt="Set Us Up icon" sx={{ width: iconSize, height: iconSize, display: "block" }}/>
      <Box component="img" src={logoPaths.logo} alt="Set Us Up logo" sx={{ height: iconSize, display: "block" }}/>
    </Stack>
  );
}
