import { type PaletteOptions } from '@mui/material/styles';

const muiPaletteLight: PaletteOptions = {
  background: {
    default: '#cfe4e4',
    paper: '#bad2d2',
  },
  text: {
    primary: '#020404',
    secondary: '#556666',
    disabled: '#939c9c',
  },
  primary: {
    main: '#66b9c2',
    light: '#84c7ce',
    dark: '#478187',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#aa82ba',
    light: '#c1a3cc',
    dark: '#765b82',
    contrastText: '#ffffff',
  },
  error: {
    main: '#cf1500ff',
    light: '#e23c2aff',
    dark: '#9c2b1fff',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#ff9800',
    light: '#ffc947',
    dark: '#b1834e',
    contrastText: '#000000',
  },
  info: {
    main: '#29b6f6',
    light: '#73e8ff',
    dark: '#2c91a5',
    contrastText: '#000000',
  },
  success: {
    main: '#4caf50',
    light: '#80e27e',
    dark: '#109e60',
    contrastText: '#000000',
  },
  divider: '#fdfbfb'
};

export default muiPaletteLight;
