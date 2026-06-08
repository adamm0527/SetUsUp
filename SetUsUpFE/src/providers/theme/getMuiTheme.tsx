import React from 'react';
import { type Theme, createTheme, type PaletteColor, type SimplePaletteColorOptions } from '@mui/material/styles';
import { Paper, Popper, type PopperProps, type ButtonProps, type FabProps, type TextFieldProps,
  type OutlinedInputProps, type FilledInputProps, type InputProps} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { type ThemeMode } from '#root/clientdata/stores/local/useThemeModeStore.tsx';
import { type MuiColour, tertiaryColour } from './muiPaletteAugmentation.ts';
import muiPaletteLight from './muiPaletteLight.ts';
import muiPaletteDark from './muiPaletteDark.ts';
import muiTypography from './muiTypography.ts';
import { COLOUR_KEYS } from '#root/lib/constants.ts';

const getMuiTheme = (mode: ThemeMode): Theme => createTheme({
  palette: {
    mode,
    ...(mode === 'dark' ? muiPaletteDark : muiPaletteLight),
    tertiary: {
      ...tertiaryColour
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        // adding border for contained buttons
        contained: ({ theme, ownerState }) => {
          const colourVariants = getVariantColour(theme, ownerState);
          return {
            border: '2px solid transparent', // initial transparent border to avoid size increase on hover
            '&:hover, &:focus': {
              // apply the actual visible border (outline) on hover
              border: `2px solid ${colourVariants.light}`,
            },
          }
        }
      }
    },
    MuiFab: {
      styleOverrides: {
        // similarly adding border for FABs
        root: ({ theme, ownerState }) => {
          const colourVariants = getVariantColour(theme, ownerState);
          return {
            border: '2px solid transparent',
            '&:hover, &:focus': {
              border: `2px solid ${colourVariants.light}`,
            },
          }
        }
      }
    },
    MuiRating: {
      // customized colours for Rating component
      styleOverrides: {
        iconFilled: ({ theme }) => ({ color: theme.palette.primary.main }),
        iconHover: ({ theme }) => ({ color: theme.palette.primary.light }),
        iconFocus: ({ theme }) => ({ color: theme.palette.primary.light }),
      }
    },  
    MuiTextField: {
      // customized label of TextField component
      styleOverrides: {
        root:  {
          '&:hover label': {
            fontWeight: 500,
          },
          '& .MuiInputLabel-standard': {
              paddingLeft: '13px' // only when inside standard variant
          }
        }
      }
    },
    MuiSelect: {
      // customized label of Select component on hover (matching that of TextField)
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiSelect-select': {
            fontWeight: 400,
            textShadow: 'none' // tricky way to preserve control size and page layout
          },
          '&:hover .MuiSelect-select': {
            fontWeight: 400,
            textShadow: `-0.001em 0 ${theme.palette.text.primary}`,
          },
        })
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme, ownerState }) => {
          const colourVariants = getVariantColour(theme, ownerState);
          return {
            /* chaning colours of the Outlined input field variant */
            '& .MuiOutlinedInput-notchedOutline': { // normal state
              border: `1px solid ${colourVariants.dark}`,
              boxShadow: `0px 0px 0px 0px ${colourVariants.dark}`,
              transition: 'border-color 100ms ease, box-shadow 200ms ease',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': { // hover state
              border: `1px solid ${colourVariants.light}`,
              boxShadow: `0px 0px 0px 0px ${colourVariants.light}`
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { // focused state
              border: `1px solid ${colourVariants.main}`,
              boxShadow: `0px 1px 0px 1px ${colourVariants.main}`
            },
            '&:hover.Mui-focused fieldset': { // focused+hover state
              border: `1px solid ${colourVariants.light}`,
              boxShadow: `0px 1px 0px 1px ${colourVariants.light}`
            },
            /* error states */
            '&.Mui-error .MuiOutlinedInput-notchedOutline': { // normal state
              borderColor: theme.palette.error.dark,
              boxShadow: `0px 0px 0px 0px ${theme.palette.error.dark}`,
            },
            '&.Mui-error:hover .MuiOutlinedInput-notchedOutline': { // hover state
              borderColor: theme.palette.error.light,
              boxShadow: `0px 0px 0px 0px ${theme.palette.error.light}`,
            },
            '&.Mui-error.Mui-focused .MuiOutlinedInput-notchedOutline': { // focused state
              borderColor: theme.palette.error.main,
              boxShadow: `0px 1px 0px 1px ${theme.palette.error.main}`,
            },
            '&.Mui-error:hover.Mui-focused .MuiOutlinedInput-notchedOutline': { // focused+hover state
              borderColor: theme.palette.error.light,
              boxShadow: `0px 1px 0px 1px ${theme.palette.error.light}`,
            },
          }
        }
      }
    },
    MuiFilledInput: {
      styleOverrides: {
        root: ({ theme, ownerState }) => {
          const colourVariants = getVariantColour(theme, ownerState);
          return {
            /* chaning colours of the Filled input field variant */
            '&': { // normal state
              border: `1px solid ${colourVariants.dark}`,
              boxShadow: `0px 0px 0px 0px ${colourVariants.dark}`,
              transition: 'border-color 100ms ease, box-shadow 200ms ease',
              '&:before': { borderBottom: `1px solid ${colourVariants.dark} !important` }
            },
            '&:hover': { // hover state
              border: `1px solid ${colourVariants.light}`,
              boxShadow: `0px 0px 0px 0px ${colourVariants.light}`
            },
            '&.Mui-focused': { // focused state
              border: `1px solid ${colourVariants.main}`,
              boxShadow: `0px 1px 0px 1px ${colourVariants.main}`
            },
            '&:hover.Mui-focused': { // focused+hover state
              border: `1px solid ${colourVariants.light}`,
              boxShadow: `0px 1px 0px 1px ${colourVariants.light}`
            },
            /* error states */
            '&.Mui-error': { // normal state
              borderColor: theme.palette.error.dark,
              boxShadow: `0px 0px 0px 0px ${theme.palette.error.dark}`,
              '&:before': { borderBottom: `1px solid ${theme.palette.error.dark} !important` }
            },
            '&.Mui-error:hover': { // hover state
              borderColor: theme.palette.error.light,
              boxShadow: `0px 0px 0px 0px ${theme.palette.error.light}`,
            },
            '&.Mui-error.Mui-focused': { // focused state
              borderColor: theme.palette.error.main,
              boxShadow: `0px 1px 0px 1px ${theme.palette.error.main}`,
            },
            '&.Mui-error:hover.Mui-focused': { // focused+hover state
              borderColor: theme.palette.error.light,
              boxShadow: `0px 1px 0px 1px ${theme.palette.error.light}`,
            },
          }
        }
      }
    },
    MuiInput: {
      styleOverrides: {
        root: ({ theme, ownerState }) => {
          const colourVariants = getVariantColour(theme, ownerState);
          return {
            /* chaning colours (and left padding) of the Standard TextField variant */
            '&': { // normal state
              paddingLeft: '13px',
              '&:before': {
                transition: 'border-color 100ms ease, transform 200ms cubic-bezier(0.0, 0, 0.2, 1)',
                borderBottom: `1px solid ${colourVariants.dark} !important`
              },
              '&:after': { 
                transition: 'border-color 100ms ease, transform 200ms cubic-bezier(0.0, 0, 0.2, 1)',
                borderBottom: `2px solid ${colourVariants.dark} !important`
              }
            },
            '&:hover': { // hover state
              '&:before': { borderBottom: `1px solid ${colourVariants.light} !important` },
              '&:after': { borderBottom: `2px solid ${colourVariants.light} !important` }
            },
            '&.Mui-focused': { // focused state
              '&:before': { borderBottom: `1px solid ${colourVariants.main} !important` },
              '&:after': { borderBottom: `2px solid ${colourVariants.main} !important` }
            },
            '&:hover.Mui-focused': { // focused+hover state
              '&:before': { borderBottom: `1px solid ${colourVariants.light} !important` },
              '&:after': { borderBottom: `2px solid ${colourVariants.light} !important` }
            }
          }
        }
      }
    },
    MuiAutocomplete: {
      defaultProps: { // giving animated popper to Autocomplete component
        slotProps: { popper: { component: MotionPopper } }
      }
    }
  },
  typography: muiTypography,
  shape: { borderRadius: 8 },
  spacing: 8
});

export default getMuiTheme;


/* Implementation details follow... */

interface ColourVariant {
  main: string;
  light: string;
  dark: string;
}

// Returns the colour variants of the current colour of the supplied control (in the above ColourVariant structure)
function getVariantColour(theme: Theme, ownerState: ButtonProps | FabProps | TextFieldProps
    | OutlinedInputProps | FilledInputProps | InputProps): ColourVariant {
  const colourProp = ownerState.color;
  if (colourProp && COLOUR_KEYS.includes(colourProp as any)) {
    const colourKey = colourProp as MuiColour;
    const paletteColour = theme.palette[colourKey] as PaletteColor | SimplePaletteColorOptions;
    return {
      main: (paletteColour as PaletteColor)?.main || theme.palette.primary.main,
      light: (paletteColour as PaletteColor)?.light || theme.palette.primary.contrastText,
      dark: (paletteColour as PaletteColor)?.dark ||  theme.palette.primary.contrastText
    }
  }
  return { // fallback to default contrast colour in case of null/undefined or non-app colour
    main: theme.palette.primary.contrastText,
    light: theme.palette.primary.contrastText,
    dark: theme.palette.primary.contrastText
  }
}

/* Custom Popper component with smooth Motion animation, to replace Autocomplete's Popper */
const MotionPopper: React.FC<PopperProps & { children?: React.ReactNode }> = ({
    open, anchorEl, placement = 'bottom', children, ...rest }) => {
  return (
    <Popper open={Boolean(open)} anchorEl={anchorEl} placement={placement} {...rest}
        modifiers={[{ name: 'offset', options: { offset: [0, 2] } }]}
        style={{ width: anchorEl instanceof HTMLElement ? anchorEl.clientWidth : undefined }}>
      <AnimatePresence>
        {open && (
          <MotionWrapper>
            <Paper elevation={8}
                sx={{
                  width: '100%',
                  borderRadius: 1,
                  overflow: 'auto',
                  backgroundColor: 'background.paper',
                  color: 'text.primary',
                }}>
              {children}
            </Paper>
          </MotionWrapper>
        )}
      </AnimatePresence>
    </Popper>
  );
};

interface MotionWrapperProps {
  children: React.ReactNode;
  offsetY?: number;
}

/* The animation itself */
const MotionWrapper: React.FC<MotionWrapperProps> = ({ children, offsetY = 8 }) => {
  return (
    <motion.div
        initial={{ opacity: 0, y: offsetY, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: offsetY, scale: 0.98 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
};
