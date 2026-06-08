/* the purpose of this store is to store & get the user's last visited authed page,
   so that his session can be continued there (e.g. after re-login, browser close, etc.) */
import { create } from 'zustand';
import { LAST_VISITED_PAGE_KEY, ROUTES_AUTHED } from '#root/lib/constants';


export interface LastVisitedPageStore {
  route: string; // stores the last visited page route
  setRoute: (route: string) => void; // called to explicitly set the last visited page route
}

const useLastVisitedPageStore = create<LastVisitedPageStore>(set => ({
  route: (() => {
    // first check if already persisted (in localStorage)
    const savedRoute = localStorage.getItem(LAST_VISITED_PAGE_KEY);

    /* check if saved route is valid */
    let savedRouteValid = false;
    for (const route of ROUTES_AUTHED.values()) {
      if (savedRoute === route) {
        savedRouteValid = true;
        break;
      }
    }

    // only returning a valid saved route
    if (savedRoute && savedRouteValid)
      return savedRoute!;

    // we default to the music library page if no valid route found
    return ROUTES_AUTHED.get('MUSIC_LIBRARY')!;
  })(),
  setRoute: (route) => {
    localStorage.setItem(LAST_VISITED_PAGE_KEY, route);
    set({ route });
  }
}))

export default useLastVisitedPageStore;
