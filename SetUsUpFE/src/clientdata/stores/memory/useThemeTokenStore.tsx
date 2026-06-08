import { create } from 'zustand';
import getAtlaskitOverrides, {type AtlaskitTokenOverrides}
  from '#root/providers/theme/overrideAtlaskitPalette.ts';
import getMuiTheme from '#root/providers/theme/getMuiTheme.tsx';
import useThemeModeStore from '../local/useThemeModeStore.tsx';


interface ThemeTokenStore {
  overrides: AtlaskitTokenOverrides;
}

const useThemeTokenStore = create<ThemeTokenStore>((set) => {
  /* initialize with current mode */
  set({ 
    overrides: getAtlaskitOverrides(
      getMuiTheme(useThemeModeStore.getState().mode)
    )
  });

  /* subscribe to changes in theme mode */
  useThemeModeStore.subscribe((store, prevStore) => {
    if (store.mode !== prevStore.mode) {
      set({ overrides: getAtlaskitOverrides(getMuiTheme(store.mode)) });
    }
  });

  return { 
    overrides: getAtlaskitOverrides(
      getMuiTheme(useThemeModeStore.getState().mode)
  )};
});

export default useThemeTokenStore;
