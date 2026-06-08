import { createRootRoute, createRoute, lazyRouteComponent, redirect } from '@tanstack/react-router';
import AuthLayout from '#root/components/common/AuthLayout.tsx';
import LoginPage from '#root/pages/LoginPage.tsx';
import RegisterPage from '#root/pages/RegisterPage.tsx';
import { ROUTES_PUBLIC, ROUTES_AUTHED } from '#root/lib/constants.ts';
import { useLastVisitedPageStore } from '#root/clientdata/stores';


const rootRoute = createRootRoute();

/* --- public routes --- */

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  loader: () => redirect({
    to: useLastVisitedPageStore.getState().route
  })
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES_PUBLIC.get('LOGIN')!,
  component: LoginPage
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES_PUBLIC.get('REGISTER')!,
  component: RegisterPage
});

const registerConfirmationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES_PUBLIC.get('REGISTER_CONFIRMATION')!,
  component: lazyRouteComponent(() => import('#root/pages/confirm/RegisterConfirmedPage'))
});

const legalPrivacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES_PUBLIC.get('LEGAL_PRIVACY')!,
  component: lazyRouteComponent(() => import('#root/pages/legal/PrivacyPage.tsx'))
});

const legalTermsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES_PUBLIC.get('LEGAL_TERMS')!,
  component: lazyRouteComponent(() => import('#root/pages/legal/TermsPage.tsx'))
});

const passwordForgotRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES_PUBLIC.get('FORGOT_PASSWORD')!,
  component: lazyRouteComponent(() => import('#root/pages/confirm/PasswordForgotPage.tsx'))
});

const passwordResetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES_PUBLIC.get('RESET_PASSWORD')!,
  component: lazyRouteComponent(() => import('#root/pages/confirm/PasswordResetPage.tsx'))
});

const emailChangeConfirmedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ROUTES_PUBLIC.get('EMAIL_CHANGE_CONFIRMED')!,
  component: lazyRouteComponent(() => import('#root/pages/confirm/EmailChangeConfirmedPage.tsx'))
});

/* --- shared auth layout (renders NavBar) --- */
const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth-layout',
  component: AuthLayout
});

/* --- routes behind authorization --- */
/* (they are all bundle-loaded during login thus the lazy, see: routesPreloadAuthed.ts) */

export const musicLibraryRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: ROUTES_AUTHED.get('MUSIC_LIBRARY')!,
  component: lazyRouteComponent(() => import('#root/pages/MusicLibraryPage.tsx'))
});

export const playlistEditorRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: ROUTES_AUTHED.get('PLAYLIST_EDITOR')!,
  component: lazyRouteComponent(() => import('#root/pages/PlaylistEditorPage.tsx'))
});

export const groupDetailsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: ROUTES_AUTHED.get('GROUP_DETAILS')!,
  component: lazyRouteComponent(() => import('#root/pages/GroupDetailsPage.tsx'))
});

export const userSettingsRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: ROUTES_AUTHED.get('USER_SETTINGS')!,
  component: lazyRouteComponent(() => import('#root/pages/UserSettingsPage.tsx'))
});

/* --- building the route tree --- */
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  registerConfirmationRoute,
  legalPrivacyRoute,
  legalTermsRoute,
  passwordForgotRoute,
  passwordResetRoute,
  emailChangeConfirmedRoute,  
  authLayoutRoute.addChildren([
    musicLibraryRoute,
    playlistEditorRoute,
    groupDetailsRoute,
    userSettingsRoute
  ])
]);

export default routeTree;
