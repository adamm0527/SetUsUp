/* The purpose of this file is to extend the Palette with a custom 'tertiary' colour */
import { type PaletteColor, type SimplePaletteColorOptions } from '@mui/material/styles';
import { COLOUR_KEYS } from '#root/lib/constants.ts';

export type MuiColour = typeof COLOUR_KEYS[number]; // type for all app colours (extended with 'tertiary')

export const tertiaryColour: PaletteColor = {
  main: '#7baac7',
  light: '#93caec',
  dark: '#678597',
  contrastText: '#424141',
};

/* module augmentation (extending MUI types) to make TS happy before usage */
declare module '@mui/material/styles' {
  interface Palette {
    tertiary: PaletteColor;
  }
  interface PaletteOptions {
    tertiary?: SimplePaletteColorOptions;
  }
}

/* component augmentation (MUST be done for every component supporting the new 'tertiary' colour */
declare module '@mui/material/TextField' {
  interface TextFieldPropsColorOverrides {
    tertiary: true;
  }
}
declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    tertiary: true;
  }
}
declare module '@mui/material/IconButton' {
  interface IconButtonPropsColorOverrides {
    tertiary: true;
  }
}
declare module '@mui/material/Avatar' {
  interface AvatarPropsColorOverrides {
    tertiary: true;
  }
}
declare module '@mui/material/Checkbox' {
  interface CheckboxPropsColorOverrides {
    tertiary: true;
  }
}
declare module '@mui/material/Switch' {
  interface SwitchPropsColorOverrides {
    tertiary: true;
  }
}
declare module '@mui/material/Fab' {
  interface FabPropsColorOverrides {
    tertiary: true;
  }
}
declare module '@mui/material/Radio' {
  interface RadioPropsColorOverrides {
    tertiary: true;
  }
}
declare module '@mui/material/FormControl' {
  interface FormControlPropsColorOverrides {
    tertiary: true;
  }
}
declare module '@mui/material/FormLabel' {
  interface FormLabelPropsColorOverrides {
    tertiary: true;
  }
}
declare module '@mui/material/InputLabel' {
  interface InputLabelPropsColorOverrides {
    tertiary: true;
  }
}
declare module '@mui/material/OutlinedInput' {
  interface OutlinedInputPropsColorOverrides {
    tertiary: true;
  }
}
declare module '@mui/material/FilledInput' {
  interface FilledInputPropsColorOverrides {
    tertiary: true;
  }
}
declare module '@mui/material/Input' {
  interface InputPropsColorOverrides {
    tertiary: true;
  }
}