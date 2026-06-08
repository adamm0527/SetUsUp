import { create } from 'zustand';
import { THEME_MODE_KEY } from '#root/lib/constants';


export type ThemeMode = 'light' | 'dark';

export interface ThemeModeStore {
  mode: ThemeMode; // stores current mode
  toggleMode: () => void; // called to toggle between light/dark
  setMode: (mode: ThemeMode) => void; // called to explicitly set a mode
}

const useThemeModeStore = create<ThemeModeStore>((set, get) => ({
  mode: (() => {
    /* first check if already persisted (in localStorage) */
    const savedMode = localStorage.getItem(THEME_MODE_KEY);
    if (savedMode === 'light' || savedMode === 'dark')
      return savedMode;

    /* fallback: system preference */
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  })(),
  toggleMode: () => {
    const nextMode = (get().mode === 'light') ? 'dark' : 'light';
    localStorage.setItem(THEME_MODE_KEY, nextMode);
    set({ mode: nextMode });
  },
  setMode: (mode) => {
    localStorage.setItem(THEME_MODE_KEY, mode);
    set({ mode });
  }
}));

export default useThemeModeStore;
