import { type ThemeOptions } from '@mui/material/styles';
type TypographyOptions = ThemeOptions['typography'];

const muiTypography: TypographyOptions = {
  fontFamily: "'Nunito', 'Roboto', sans-serif",
  h1: { fontFamily: "'Libre Franklin', 'Roboto', sans-serif" },
  h2: { fontFamily: "'Libre Franklin', 'Roboto', sans-serif" },
  h3: { fontFamily: "'Libre Franklin', 'Roboto', sans-serif" },
  h4: { fontFamily: "'Libre Franklin', 'Roboto', sans-serif" },
  h5: { fontFamily: "'Libre Franklin', 'Roboto', sans-serif" },
  button: { fontFamily: "'Libre Franklin', 'Roboto', sans-serif", fontWeight: 'bold' }
} as const;

export default muiTypography;
