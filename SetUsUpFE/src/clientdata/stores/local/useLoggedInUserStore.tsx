import { create } from 'zustand';
import { LOGGED_IN_USER_KEY } from '#root/lib/constants';


export interface LoggedInUserStore {
  user: string | null; // stores currently logged-in user
  setUser: (user: string) => void; // called to explicitly set a currently logged-in user
  clearUser: () => void; // called to remove them from localStorage (e.g. on logout)
}

const useLoggedInUserStore = create<LoggedInUserStore>(set => ({
  user: (() => {
    /* first check if already persisted (in localStorage) */
    const savedUser = localStorage.getItem(LOGGED_IN_USER_KEY);
    if (savedUser && savedUser.trim() !== '')
      return savedUser;

    return ''; // empty string, indicating no one is logged in right now
  })(),
  setUser: (user) => {
    localStorage.setItem(LOGGED_IN_USER_KEY, user);
    set({ user });
  },
  clearUser: () => {
    localStorage.removeItem(LOGGED_IN_USER_KEY);
    set({ user: null });
  }
}));

export default useLoggedInUserStore;
