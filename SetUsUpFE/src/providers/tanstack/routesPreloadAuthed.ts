/* importing all authed routes to preload them at once after login, see: LoginPage.tsx */
import {
  musicLibraryRoute,
  playlistEditorRoute,
  groupDetailsRoute,
  userSettingsRoute
} from "./routeTree.ts";


export async function routesPreloadAuthed(router: any) {
  const authedRoutes = [
    musicLibraryRoute,
    playlistEditorRoute,
    groupDetailsRoute,
    userSettingsRoute
  ];

  await Promise.all(
    authedRoutes.map((r) => router.preloadRoute(r))
  );
}
