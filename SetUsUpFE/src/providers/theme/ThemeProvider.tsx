import { type ReactNode, useMemo, useEffect } from 'react';
import { css, Global } from '@emotion/react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { useThemeTokenStore, useThemeModeStore } from '#root/clientdata/stores';
import EmotionCacheProvider from './EmotionCacheProvider.tsx';
import getMuiTheme from './getMuiTheme.tsx';


const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const modeState = useThemeModeStore((store) => store.mode);
  const themeState = useMemo(() => getMuiTheme(modeState), [modeState]);
  const atlaskitOverridesState = useThemeTokenStore((store) => store.overrides);

  // Apply Atlaskit tokens (on change: TokenStore subscribes to ModeStore's changing)
  useEffect(() => {
    Object.entries(atlaskitOverridesState).forEach(([variable, value]) => {
      document.documentElement.style.setProperty(variable, value);
    });
  }, [atlaskitOverridesState]);
  
  return (
    <EmotionCacheProvider>
      <MuiThemeProvider theme={themeState}>
        <Global
          styles={css`
            html {
              background-color: ${themeState.palette.background.default};
              height: 100%;
            }
            body, #root {
              background-color: ${themeState.palette.background.default};
              color: ${themeState.palette.text.primary};
              font-family: ${themeState.typography.fontFamily};
              transition: background-color 0.3s ease;
              height: 100%;
            }
          `}
        />
        {children}
      </MuiThemeProvider>
    </EmotionCacheProvider>
  )
}

export default ThemeProvider;
