import createCache from '@emotion/cache';

const jointMuiAtlasCache = createCache({
  key: 'mui-atlas', // shared prefix for both
  prepend: true, // ensuring MUI styles load first
});

export default jointMuiAtlasCache;
