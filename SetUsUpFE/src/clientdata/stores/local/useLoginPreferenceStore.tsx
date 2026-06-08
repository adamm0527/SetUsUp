import { create } from 'zustand';
import { LOGIN_PREF_KEY } from '#root/lib/constants';


export type LoginPreference = 'email' | 'username';

export interface LoginPreferenceStore {
  pref: LoginPreference; // stores current preference
  togglePref: () => void; // called to toggle between email/username
  setPref: (pref: LoginPreference) => void; // called to explicitly set a pref
}

const useLoginPreferenceStore = create<LoginPreferenceStore>((set, get) => ({
  pref: (() => {
    /* first check if already persisted (in localStorage) */
    const savedPref = localStorage.getItem(LOGIN_PREF_KEY);
    if (savedPref === 'email' || savedPref === 'username')
      return savedPref;

    return 'username'; // default option
  })(),
  togglePref: () => {
    const nextPref = (get().pref === 'email') ? 'username' : 'email';
    localStorage.setItem(LOGIN_PREF_KEY, nextPref);
    set({ pref: nextPref });
  },
  setPref: (pref) => {
    localStorage.setItem(LOGIN_PREF_KEY, pref);
    set({ pref });
  }
}));

export default useLoginPreferenceStore;
