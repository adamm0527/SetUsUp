import { IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useThemeModeStore } from '#root/clientdata/stores';


interface ToggleThemeModeProps {
  variant?: 'floating' | 'inline';
}

export default function ToggleThemeMode({ variant = 'floating' } : ToggleThemeModeProps) {
  const toggleMode = useThemeModeStore((store) => store.toggleMode);
  const modeState = useThemeModeStore((store) => store.mode);
  const isLightMode = (modeState === 'light');
  const caption = isLightMode ? 'Switch to dark mode' : 'Switch to light mode';

  return (
    <Tooltip title={caption} placement="bottom"
      sx={{ display: 'inline-flex' }} arrow slotProps={{
      popper: { // changing "closeness" of the tooltip with its popper
        modifiers: [{ name: 'offset', options: { offset: [0, -12] } }],
      }
    }}>
      <IconButton color="inherit" onClick={toggleMode} aria-label={caption} sx={{
        ...(variant === 'floating' && {
            position: 'absolute', top: 16, right: 16, zIndex: 10,
          }),
        ...(variant === 'inline' && {
            position: 'relative', alignSelf: 'center', m: 0,
          }),
        bgcolor: 'transparent',
        '&:hover': {
          bgcolor: (theme) => theme.palette.action.hover,
        }
      }}>
        {isLightMode ? <DarkMode/> : <LightMode/>}
      </IconButton>
    </Tooltip>
  );
}
