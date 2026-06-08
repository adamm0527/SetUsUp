import { type ReactNode } from 'react';
import { CacheProvider } from '@emotion/react';
import jointMuiAtlasCache from './emotionCache.ts';

const EmotionCacheProvider = ({ children }: { children: ReactNode }) => {
  return(
    <CacheProvider value={jointMuiAtlasCache}>
      {children}
    </CacheProvider>
  );
};

export default EmotionCacheProvider;
