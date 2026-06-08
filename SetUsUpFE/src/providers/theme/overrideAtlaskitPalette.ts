import { type Theme } from '@mui/material/styles';

export type AtlaskitTokenOverrides = {
  [cssVariable: string]: string;
}

/* returns Atlaskit token overrides based on the MUI theme */
const getAtlaskitOverrides = (theme: Theme): AtlaskitTokenOverrides => ({
  '--ds-background': theme.palette.background.default,
  '--ds-surface': theme.palette.background.paper,  
  '--ds-text': theme.palette.text.primary,
  '--ds-text-subtle': theme.palette.text.secondary,
  '--ds-border': theme.palette.divider
});

export default getAtlaskitOverrides;
