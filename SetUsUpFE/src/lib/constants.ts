/* Endpoint URLs and miscellaneous API related constants */
export const BASE_URL = 'http://localhost:5072';
export const AUTH_REFRESH_URL = '/user/refresh-session';
export const AUTH_TOKEN_ERROR_STATUS = 'User.InvalidToken';

/* Frontend routes */
export const ROUTES_PUBLIC = new Map<string, string>([
  ['LOGIN', '/login'],
  ['REGISTER', '/register'],
  ['REGISTER_CONFIRMATION', '/register-confirmation'],
  ['LEGAL_PRIVACY', '/legal/privacy'],
  ['LEGAL_TERMS', '/legal/terms'],
  ['FORGOT_PASSWORD', '/forgot-password'],
  ['RESET_PASSWORD', '/reset-password'],
  ['EMAIL_CHANGE_CONFIRMED', '/email-changed'],  
]);
export const ROUTES_AUTHED = new Map<string, string>([
  ['MUSIC_LIBRARY', '/music-library'],
  ['PLAYLIST_EDITOR', '/playlist-editor'],
  ['GROUP_DETAILS', '/group-details'],
  ['USER_SETTINGS', '/user-settings']
]);

/* Public (non-authed) Backend routes */
export const BACKEND_ROUTES_PUBLIC_AUTH = new Map<string, string>([
  ['LOGIN_W_EMAIL', '/user/login-w-email'],
  ['LOGIN_W_USERNAME', '/user/login-w-username'],
]);

/* public asset filenames */
export const PUBLIC_SU_ICON_LIGHT = 'setusup_icon_light.svg';
export const PUBLIC_SU_ICON_DARK = 'setusup_icon_dark.svg';
export const PUBLIC_SU_LOGO_LIGHT = 'setusup_logo_light.svg';
export const PUBLIC_SU_LOGO_DARK = 'setusup_logo_dark.svg';

/* localStorage keys */
export const AUTH_TOKEN_KEY = 'auth-jwt';
export const AUTH_VALID_TO_KEY = 'auth-valid-to';
export const LOGGED_IN_USER_KEY = 'app-user';
export const USER_SEL_GROUP_KEY = 'app-user-sel-group';
export const USER_SEL_PLAYLIST_KEY = 'app-user-sel-playlist';
export const LAST_VISITED_PAGE_KEY = 'ui-last-visited-page';
export const LOGIN_PREF_KEY = 'ui-login-pref';
export const THEME_MODE_KEY = 'ui-theme-mode';

/* UI-related util constants */
export const MIN_USERNAME_LEN = 3;
export const MAX_USERNAME_LEN = 30;
export const COLOUR_KEYS = [
  /* the standard MUI colour keys */
  'primary',
  'secondary',
  'error',
  'warning',
  'info',
  'success',
  'tertiary' // custom tertiary colour
] as const;
