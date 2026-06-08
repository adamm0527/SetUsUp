import React from 'react';
import { Button, ListItemButton, ListItemIcon, ListItemText, Box } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import { useNavigate } from '@tanstack/react-router';
import { useThemeModeStore } from '#root/clientdata/stores';


export interface NavLinkItemProps {
  label: string;
  muiIcon: SvgIconComponent;
  linkTo: string;
  active?: boolean;
  inMenu?: boolean;
  onClick?: (nextRoute: string) => void;
  onLeaving?: () => void | Promise<void>;
}

function NavLinkItem(props: NavLinkItemProps) {
  const navigate = useNavigate();
  const themeState = useThemeModeStore((store) => store.mode);
  const variantState = (themeState === 'dark') ? 'main' : 'dark';
  const colourState = props.active ? `secondary.${variantState}` : `tertiary.${variantState}`

  /* shared style for both variants (whether inMenu or not) */
  const sharedColourSx = {
    color: colourState,
    '&:hover': { color: `secondary.${(themeState === 'dark') ? 'light' : 'main'}` },
    transition: 'color 150ms ease'
  }
  const sharedFontSx = {
    fontSize: 'large',
    fontWeight: 500
  }

  const handleClick = () => {
    /* calling callback from props if provided */
    if (props.onClick)
      props.onClick(props.linkTo);

    /* calling another supplementary callback (e.g. used for clearing jwt from localStorage after logout) */
    if (props.onLeaving)
      props.onLeaving();

    // navigate to the link (even if already there, allowing refresh behaviour)
    navigate({ to: props.linkTo });
  }

  /* a) rendering inside menu */
  if (props.inMenu) {
    return (
      <ListItemButton onClick={handleClick} sx={{ px: 2, ...sharedColourSx }}>
          <ListItemIcon sx={{ color: 'inherit', minWidth: 'auto', paddingRight: 1.25 }}>
            <props.muiIcon/>
          </ListItemIcon>
          <ListItemText primary={props.label} slotProps={{ primary: { ...sharedFontSx, textAlign: 'left' } }} />
      </ListItemButton>
    );
  }

  /* b) rendering outside menu (regular nav link) */
  return (
    <Button onClick={handleClick} sx={{ width: '6vw', display: 'flex', alignItems: 'center',
      maxWidth: 140, px: 1.25, textTransform: 'none', ...sharedFontSx, ...sharedColourSx
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <props.muiIcon sx={{ fontSize: '1.4rem', verticalAlign: 'middle' }}/>
        <span>{props.label}</span>
      </Box>
    </Button>
  );
}

export default React.memo(NavLinkItem);
