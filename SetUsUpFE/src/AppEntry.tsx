// bootsrapping, setting up providers "before" rendering

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline } from '@mui/material';
import { QueryAndRouterProvider, ThemeProvider, AppSnackbarProvider, Fonts } from '#root/providers';
Fonts; // ensure fonts are loaded


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CssBaseline>
      <ThemeProvider>
        <AppSnackbarProvider>
          <QueryAndRouterProvider/>
        </AppSnackbarProvider>
      </ThemeProvider>
    </CssBaseline>
  </StrictMode>
);
