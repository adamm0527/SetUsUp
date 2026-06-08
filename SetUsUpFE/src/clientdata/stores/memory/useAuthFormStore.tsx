/* this (memory) store shares form state between LoginPage and RegisterPage */
import { create } from 'zustand';
import { type LoginPreference } from '../local/useLoginPreferenceStore.tsx';


export interface AuthFormStore {
  /* --- main data actually used by endpoints + feedback messages --- */
  email: string; errorEmail: string;
  username: string; errorUsername: string;
  password: string; errorPassword: string;
  triedSubmit: boolean; // UI/UX auxilary: true if the form was at least once submitted; for issue indication
  /* --- setters for the above main data */
  setEmail: (email: string) => void;
  setUsername: (username: string) => void;
  setPassword: (password: string) => void;
  setErrorEmail: (errorEmail: string) => void;
  setErrorUsername: (errorUsername: string) => void;
  setErrorPassword: (errorPassword: string) => void;
  setTriedSubmit: () => void; // sets the flag to true (won't be false again until reset called)
  reset: () => void;
  /* --- LoginPage specific methods (where email/username field is shared and toggelable) --- */
  getAccount: (loginPref: LoginPreference) => string;
  setAccount: (loginPref: LoginPreference, account: string) => void;
  getErrorAccount: (loginPref: LoginPreference) => string;
  setErrorAccount: (loginPref: LoginPreference, errorAccount: string) => void;
  /* --- UI/UX auxiliaries; mainly for issue indication --- */
  hasAnyLoginError: (oginPref: LoginPreference) => boolean;
  hasAnyRegisterError: () => boolean;
  resetPassword: () => void;
}

/* initial values and setter implementations */
const useAuthFormStore = create<AuthFormStore>((set, get) => ({
  email: '', errorEmail: '',
  username: '', errorUsername: '',
  password: '', errorPassword: '',
  triedSubmit: false,
  
  setEmail: (email) => set ({ email }),
  setUsername: (username) => set({ username }),
  setPassword: (password) => set({ password }),
  setErrorEmail: (errorEmail) => set ({ errorEmail }),
  setErrorUsername: (errorUsername) => set({ errorUsername }),
  setErrorPassword: (errorPassword) => set({ errorPassword }),
  setTriedSubmit: () => set({ triedSubmit: true }),
  reset: () => set({ 
    email: '', username: '', password: '',
    errorEmail: '', errorUsername: '', errorPassword: '',
    triedSubmit: false
  }),
  

  getAccount: (loginPref) => 
    (loginPref === 'email') ? get().email : get().username,
  
  setAccount: (loginPref, account) => set(
    (loginPref === 'email') ? { email: account } : { username: account }
  ),
  
  getErrorAccount: (loginPref) =>
    (loginPref === 'email') ? get().errorEmail : get().errorUsername,
  
  setErrorAccount: (loginPref, errorAccount) =>
    set((loginPref === 'email') ? { errorEmail: errorAccount } : { errorUsername: errorAccount }),
  
  hasAnyLoginError: (loginPref) => {
    if (loginPref === 'email')
      return (get().errorEmail != '' || get().errorPassword != '')
    else
      return (get().errorUsername != '' || get().errorPassword != '')
  },
  
  hasAnyRegisterError: () => (
    get().errorEmail != '' || get().errorUsername != '' || get().errorPassword != ''
  ),
  
  resetPassword: () => { set({ password: '' }); set({ errorPassword: '' }); }
}));

export default useAuthFormStore;
