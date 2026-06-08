import { create } from 'zustand';
import { AUTH_TOKEN_KEY, AUTH_VALID_TO_KEY } from '#root/lib/constants';


export interface AuthTokenStore {
  token: string | null; // jwt
  validTo: string | null; // until when is the jwt valid
  setAuth: (token: string, validTo: string) => void; // called to set the previous
  clearJwt: () => void; // called to remove them from localStorage (e.g. on logout)
}

const useAuthStore = create<AuthTokenStore>(set => ({
  token: (() => {
    /* first check if already persisted (in localStorage) */
    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    return (savedToken && savedToken.trim() !== '') ? savedToken : null;
  })(),
  validTo: (() => {
    /* first check if already persisted (in localStorage) */
    const savedValidTo = localStorage.getItem(AUTH_VALID_TO_KEY);
    return (savedValidTo && savedValidTo.trim() !== '') ? savedValidTo : null;
  })(),
  setAuth: (token, validTo) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    set({ token });
    localStorage.setItem(AUTH_VALID_TO_KEY, validTo);
    set({ validTo });
  },
  clearJwt: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    set({ token: null });
    localStorage.removeItem(AUTH_VALID_TO_KEY);
    set({ validTo: null });
  }
}));

export default useAuthStore;
