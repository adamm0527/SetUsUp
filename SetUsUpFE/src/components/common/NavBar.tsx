import React, { useState, useCallback, useRef, useEffect, useMemo} from 'react';
import { useRouterState } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Box, Stack, IconButton, Avatar, Tooltip, Menu, Divider, Typography } from '@mui/material';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import GroupIcon from '@mui/icons-material/Group';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { type NamedEntity } from '#root/lib/types';
import { ROUTES_AUTHED, ROUTES_PUBLIC } from '#root/lib/constants.ts';
import { useUserSelectionStore, useAuthTokenStore, useThemeModeStore,
  useLastVisitedPageStore, useLoggedInUserStore } from '#root/clientdata/stores';
import { NavLinkItem, EntitySelector, ToggleThemeMode, SetUsUpLogo } from '#root/components';
import GroupMembersTooltipContent from '#root/components/group/GroupMembersTooltipContent';
import CreatePlaylistModal from '#root/components/playlist/CreatePlaylistModal';
import { useEndpointMutation, useEndpointQuery } from '#root/api/queryHooks';
import { api_UserLogout, api_UserSelectedGroupPatch, api_UserSelectedPlaylistPatch, api_UserProfileGet,
  use_api_UserSelectionBootstrap, use_api_GroupsPlaylistsBootstrap } from '#root/api/endpoints';



/* map of all the different routes where the navbar can navigate */
const NAV_LINKS = new Map<string, string>([
  ['Music',     ROUTES_AUTHED.get('MUSIC_LIBRARY')!],
  ['Playlist',  ROUTES_AUTHED.get('PLAYLIST_EDITOR')!],
  ['Group',     ROUTES_AUTHED.get('GROUP_DETAILS')!],
  ['Settings',  ROUTES_AUTHED.get('USER_SETTINGS')!],
  ['Log out',   ROUTES_PUBLIC.get('LOGIN')!]
]);

export default function NavBar() {
  /* active route detection: isActive(route) returns whether it's the current page in the browser */
  const pathname = useRouterState({ select: state => state.location.pathname });
  const isActive = useCallback((route: string) => pathname.startsWith(route), [pathname]);

  /* keeping dropdown options (groups -> playlists for selGroup) in sync */
  use_api_UserSelectionBootstrap(); // this sets user selections after logging in (either from localStorage or API fallback)
  const { queriedGroups, queriedPlaylists, playlistQuery } = use_api_GroupsPlaylistsBootstrap(); // options for the dropdowns
  const api_patchSelGroup = useEndpointMutation(api_UserSelectedGroupPatch); // endpoint for changing currently selected group
  const api_patchSelPlaylist = useEndpointMutation(api_UserSelectedPlaylistPatch); // endpoint for changing currently selected playlist

  const queryClient = useQueryClient(); // used for invalidating local cached queries upon logout
  const { clearJwt } = useAuthTokenStore(); // used for clearing the jwt upon logout
  const { clearUser } = useLoggedInUserStore(); // used for clearing currently logged-in username upon logout
  const { clearUserSelection } = useUserSelectionStore(); // used for clearing the user selections upon logout
  const api_logout = useEndpointMutation(api_UserLogout); // logout endpoint (invalidates jwt on backend)

  /* the avatar dropdown shows the user's username + email as a non-clickable header */
  const profileQuery = useEndpointQuery(['user', 'profile'], api_UserProfileGet);
  const profile = profileQuery.data?.success ? profileQuery.data.data : null;

  /* --- properties of navigation attributes --- */

  const navLinkItemProps = useMemo(() => [
    { label: 'Music',    muiIcon: LibraryMusicIcon, linkTo: NAV_LINKS.get('Music')!,     active: isActive(NAV_LINKS.get('Music')!),
      onLeaving: undefined },
    { label: 'Playlist', muiIcon: QueueMusicIcon,   linkTo: NAV_LINKS.get('Playlist')!,  active: isActive(NAV_LINKS.get('Playlist')!),
      onLeaving: undefined },
    { label: 'Group',    muiIcon: GroupIcon,        linkTo: NAV_LINKS.get('Group')!,     active: isActive(NAV_LINKS.get('Group')!),
      onLeaving: undefined },
  ], [pathname]);

  const navLinkMenuItemProps = useMemo(() => [
    { label: 'Settings', muiIcon: SettingsIcon,     linkTo: NAV_LINKS.get('Settings')!,  active: isActive(NAV_LINKS.get('Settings')!),
      onLeaving: undefined },
    { label: 'Log out',  muiIcon: LogoutIcon,       linkTo: NAV_LINKS.get('Log out')!,   active: false,
      onLeaving: async () => {
        /* user is gone, pretend this client never saw anything */
        try { await api_logout.mutateAsync({}); } catch (err) { console.error(err); }
        clearJwt();
        clearUser();
        clearUserSelection();
        queryClient.clear();
      }
    },
  ], [pathname, queryClient, clearJwt, clearUserSelection]);


  /* callback for nav links to persist current page route (so user can resume where they leave) */
  const { setRoute } = useLastVisitedPageStore();
  const setLastPageCallback = useCallback((nextRoute: string) => {
    if (nextRoute === pathname)
      return; // preventing unnecessary updates (when same page is refreshed)

    for (const route of ROUTES_PUBLIC.values())
      if (route === nextRoute)
        return; // we also don't store public routes; this persists the last "content" page

    setRoute(nextRoute);
  }, [pathname]);

  /* state of selectors */
  const { selGroup, selPlaylist, setSelGroup, setSelPlaylist,
    shouldFocusGroupSelector, setShouldFocusGroupSelector,
    shouldFocusPlaylistSelector, setShouldFocusPlaylistSelector } = useUserSelectionStore();
  const lastSyncedSelGroupId = useRef<string | null>(null); // for syncing local update to server
  const lastSyncedSelPlaylistId = useRef<string | null>(null); // for syncing local update to server
  const groupSelectorRef = useRef<HTMLInputElement | null>(null); // for transferring focus
  const playlistSelectorRef = useRef<HTMLInputElement | null>(null); // for transferring focus
  const allowFocusPlaylistsRef = useRef(false); // for signalling when to transfer focus

  /* input state for Autocomplete free-typing (we want controlled input so we can handle Enter) */
  const [groupInputState, setGroupInputState] = useState(selGroup?.name ?? '');
  const [playlistInputState, setPlaylistInputState] = useState(selPlaylist?.name ?? '');

  /* "Create playlist" modal: shared entry-point used by the NavBar "+" button */
  const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false);

  /* keep the group input text in sync with current selection */
  useEffect(() => {
    setGroupInputState(selGroup?.name ?? '');
  }, [selGroup]);

  /* keep the playlist input text in sync with current selection */
  useEffect(() => {
    setPlaylistInputState(selPlaylist?.name ?? '');
  }, [selPlaylist]);

  /* guarded group selection change event-handler (only triggering actual state change when selected is different) */
  /* PATCH-FIRST then setSelGroup. Optimistically update the input text so the user sees
     the new selection instantly; the page content transitions ~150ms later when the BE
     PATCH lands and setSelGroup triggers the page re-render + fetch. */
  const handleGroupSelect = useCallback(async (value: NamedEntity | null) => {
    if (!value || value.id === selGroup?.id)
      return;

    /* Optimistic input-text update so the dropdown's input field shows the new selection
       immediately. The MUI Autocomplete `value` (= selGroup) is what we actually delay,
       but `inputValue` (= groupInputState) drives the visible text. */
    setGroupInputState(value.name);

    /* Clear the playlist locally; harmless and matches the visual we want during sync
       (new group is being loaded -> "no playlist selected" until user picks one). */
    const prevPlaceholder = playlistSelectorRef.current?.placeholder ?? '';
    if (playlistSelectorRef.current) playlistSelectorRef.current.placeholder = '';
    setSelPlaylist(null);
    setTimeout(() => {
      if (playlistSelectorRef.current) playlistSelectorRef.current.placeholder = prevPlaceholder;
    }, 50);
    allowFocusPlaylistsRef.current = true;

    try {
      /* Await BE PATCH BEFORE flipping the local store. The page is still rendering with
         the OLD selGroup right now -- its query keys/data don't change. */
      await api_patchSelGroup.mutateAsync({ body: { groupId: value.id } });

      /* Refresh the things the new group implies (selectedPlaylist + playlists dropdown
         options). Awaiting these means subsequent renders see correct dropdown content. */
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['user', 'selectedPlaylist'], exact: true }),
        queryClient.refetchQueries({ queryKey: ['playlists'], exact: false }),
      ]);

      /* Mark synced FIRST so the side-effect's "already synced" guard skips. */
      lastSyncedSelGroupId.current = value.id;
      /* Now flip the local store. Page re-renders, fires ['songs', value.id] which hits
         the BE with the now-correct SelectedGroupId. Loading state -> correct data. */
      setSelGroup(value);
    } catch (err) {
      console.error('PATCH selected-group failed', err);
      /* Revert optimistic input text on error so it stays in sync with the actual value. */
      setGroupInputState(selGroup?.name ?? '');
    }
  }, [selGroup, setSelGroup, setSelPlaylist, api_patchSelGroup, queryClient]);

  /* guarded playlist selection change event-handler (only triggering actual state change when selected is different) */
  const handlePlaylistSelect = useCallback(async (value: NamedEntity | null) => {
    if (!value || value.id === selPlaylist?.id)
      return;

    /* Optimistic input-text update for instant visual feedback. */
    setPlaylistInputState(value.name);

    try {
      await api_patchSelPlaylist.mutateAsync({ body: { playlistId: value.id } });

      /* Mark synced FIRST so the side-effect's guard skips. */
      lastSyncedSelPlaylistId.current = value.id;
      setSelPlaylist(value);
    } catch (err) {
      console.error('PATCH selected-playlist failed', err);
      setPlaylistInputState(selPlaylist?.name ?? '');
    }
  }, [selPlaylist, setSelPlaylist, api_patchSelPlaylist]);

  /* side-effects when selected group changes (api calls/sync) */
  useEffect(() => {
    if (!selGroup) {
      lastSyncedSelGroupId.current = null;
      return;
    }

    /* skip syncing if group was already synced to backend */
    const currId = selGroup.id;
    if (currId === lastSyncedSelGroupId.current)
      return;

    lastSyncedSelGroupId.current = currId;
    (async () => {
      /* trying to set selected group serverside (this always succeeds unless there's something extraordinary) */
      try {
        await api_patchSelGroup.mutateAsync({ body: { groupId: currId } });

        await Promise.all([
          /* refetching currently selected playlist for the user */
          queryClient.refetchQueries({ queryKey: ['user', 'selectedPlaylist'], exact: true }),
          /* refetching options for playlist dropdown, to display the playlists of the newly selected group */
          queryClient.refetchQueries({ queryKey: ['playlists'], exact: false })
        ]);
        /* invalidate dependent pages' content */
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['songs'], exact: false }),
          queryClient.invalidateQueries({ queryKey: ['playlist'], exact: false }),
          queryClient.invalidateQueries({ queryKey: ['playlistEntries'], exact: false }),
        ]);        
      } catch (err) {
        console.error(err);
        lastSyncedSelGroupId.current = null; // allowing retry
      }
    })();
  }, [selGroup?.id, api_patchSelGroup, queryClient]);


  /* side-effects when selected playlist changes (api calls/sync) */
  useEffect(() => {
    if (!selPlaylist) {
      lastSyncedSelPlaylistId.current = null;
      return;
    }

    /* don't use stale options while playlists for the new group are still loading */
    if (playlistQuery.isFetching)
      return;

    /* guarding against playlist not being in current group's playlists */
    const currId = selPlaylist.id;
    const existsInOptions = queriedPlaylists.some(p => p.id === currId);
    if (!existsInOptions) {
      /* just wait until transient mismatch resolves itselfs after couple of rerenders */
      return;
    }

    /* skip syncing if playlist was already synced to backend */
    if (currId === lastSyncedSelPlaylistId.current)
      return;

    lastSyncedSelPlaylistId.current = currId;
    (async () => {
    /* trying to set selected playlist serverside (this always succeeds unless there's something extraordinary) */
      try {
        await api_patchSelPlaylist.mutateAsync({ body: { playlistId: currId } });

        /* invalidate dependent pages' content */
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['playlist'], exact: false }),
          queryClient.invalidateQueries({ queryKey: ['playlistEntries'], exact: false }),
        ]);
      } catch (err: any) {
        console.error(err);
        lastSyncedSelPlaylistId.current = null; // allowing retry
      }
    })();
  }, [selPlaylist?.id, queriedPlaylists, playlistQuery.isFetching, api_patchSelPlaylist, queryClient]);


  /* as group dropdown changes value, we transfer focus to playlist dropdown if not empty */
  const kickOffFocusHelperRef = useRef(true);
  useEffect(() => {
    /* must have a group */
    if (!selGroup)
      return;

    /* wait until playlists for this group finished loading */
    if (!playlistQuery.isFetched || playlistQuery.isFetching)
      return; // still loading, keep waiting

    /* we don't transfer focus to empty playlist dropdown */
    if (!selPlaylist) {
      /* edge-case when focus transfer is preferred: other user added playlists while the client was offline */
      if (queriedPlaylists.length > 0 && kickOffFocusHelperRef.current) {
        playlistSelectorRef.current?.focus(); // transferring focus
        kickOffFocusHelperRef.current = false;
      }
      return;
    }

    if (allowFocusPlaylistsRef.current) {
      playlistSelectorRef.current?.focus(); // transferring focus
      allowFocusPlaylistsRef.current = false;
    }
  }, [selGroup?.id, selPlaylist?.id, queriedPlaylists.length, playlistQuery.isFetched, playlistQuery.isFetching])

  /* tiny effect reacting to external (e.g. SignalR) group dropdown focus notices based on global Zustand store */
  useEffect(() => {
    if (!shouldFocusGroupSelector)
      return;

    groupSelectorRef.current?.focus();
    setShouldFocusGroupSelector(false);
  }, [shouldFocusGroupSelector, setShouldFocusGroupSelector]);

  /* tiny effect reacting to external (e.g. SignalR) playlist dropdown focus notices based on global Zustand store */
  useEffect(() => {
    if (!shouldFocusPlaylistSelector)
      return;

    playlistSelectorRef.current?.focus();
    setShouldFocusPlaylistSelector(false);
  }, [shouldFocusPlaylistSelector, setShouldFocusPlaylistSelector]);


  /* user-avatar menu */
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const avatarOpen = Boolean(anchorEl);
  /* user-avatar menu handlers */
  const openAvatarMenu = (ev: React.MouseEvent<HTMLElement>) => setAnchorEl(ev.currentTarget);
  const closeAvatarMenu = () => setAnchorEl(null);

  /* Force-close the dropdown when going to a different route. */
  const handleMenuItemClick = useCallback((nextRoute: string) => {
    closeAvatarMenu();
    setLastPageCallback(nextRoute);
  }, [closeAvatarMenu, setLastPageCallback]);

  /* for theme mode related styling */
  const themeState = useThemeModeStore((store) => store.mode);
  const variantState = (themeState === 'dark') ? 'main' : 'dark';

  return (
    <Box component="nav" sx={{
      display: 'flex', alignItems: 'center', width: '100%', gap: 2, px: 2, paddingTop: 1, paddingBottom: 0,
      borderBottom: 1, borderColor: 'divider', background: (theme) => theme.palette.background.paper
    }}>
      <Stack direction="row" alignItems="center" sx={{ width: '100%' }}>
        {/* the application logo component - left corner */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SetUsUpLogo direction="row" iconSize={28}/>
        </Box>

        {/* center cluster - this is brough to the middle a bit */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <Stack direction="row" alignItems="center" spacing={4}>
            {/* center-left cluster: entity selector autocomplete fields */}
            <Stack direction="row" alignItems="center" spacing={4} sx={{ mr: 2 }}>
              {/* Selected Group (!mutliple, disableClearable, freeSolo) */}
              <EntitySelector label="Selected Group" placeholder='select a group' sx={{ width: '17.5vw', maxWidth: 300 }}
                icon={GroupIcon} options={queriedGroups.map((group) => ({ id: group.id, name: group.name } as NamedEntity))}
                value={selGroup} inputValue={groupInputState}
                onValueChange={handleGroupSelect} onInputChange={setGroupInputState} ref={groupSelectorRef}
                /* slowly-appearing tooltip on each group option, showing its members as role-coded chips */
                optionTooltipContent={(option) => <GroupMembersTooltipContent groupId={option.id} />}
                tooltipEnterDelay={650}/>

              {/* Selected Playlist + adjacent "Create new playlist" button */}
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <EntitySelector label="Selected Playlist" placeholder='group has no playlists yet' sx={{ width: '17.5vw', maxWidth: 300 }}
                  icon={QueueMusicIcon} options={queriedPlaylists.map((playlist) => ({ id: playlist.id, name: playlist.name } as NamedEntity))}
                  value={selPlaylist} inputValue={playlistInputState}
                  onValueChange={handlePlaylistSelect} onInputChange={setPlaylistInputState} ref={playlistSelectorRef}/>
                <Tooltip
                  title={selGroup ? 'Create new playlist in this group' : 'Pick a group first'}
                  arrow disableInteractive
                >
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => setCreatePlaylistOpen(true)}
                      disabled={!selGroup}
                      aria-label="Create new playlist"
                    >
                      <AddRoundedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Stack>

            {/* center-right cluster: nav links to main pages */}
            <Stack direction="row" spacing={4} sx={{ flex: 1, alignItems: 'center' }}>
              {navLinkItemProps.map((props) => (
                <NavLinkItem key={props.linkTo} label={props.label} onClick={setLastPageCallback} onLeaving={props.onLeaving}
                  muiIcon={props.muiIcon} linkTo={props.linkTo} active={props.active}/>
              ))}
            </Stack>
          </Stack>
        </Box>

        {/* corner-right cluster: Account avatar + theme toggle. */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Account"  placement="bottom" arrow slotProps={{
            popper: { // changing "closeness" of the tooltip with its popper
              modifiers: [{ name: 'offset', options: { offset: [0, -12] } }],
          }}}>
            <IconButton onClick={openAvatarMenu} size="small" sx={{ ml: 1 }}>
              <Avatar sx={{
                color: pathname.startsWith('/user') ? `secondary.${variantState}` : `tertiary.${variantState}`,
                background: (theme) => theme.palette.background.default }}
              />
            </IconButton>
          </Tooltip>
          <Menu anchorEl={anchorEl} open={avatarOpen} onClose={closeAvatarMenu}>
            {/* username + email header at the top of the avatar dropdown */}
            {profile && (
              <Box sx={{ px: 2, py: 1.25, minWidth: 220, pointerEvents: 'none', userSelect: 'none' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {profile.userName}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                  {profile.email}
                </Typography>
              </Box>
            )}
            {profile && <Divider sx={{ my: 0.5 }} />}
            {navLinkMenuItemProps.map((props) => (
              <NavLinkItem key={props.linkTo} label={props.label}
                onClick={handleMenuItemClick} onLeaving={props.onLeaving}
                inMenu muiIcon={props.muiIcon} linkTo={props.linkTo} active={props.active}/>
            ))}
          </Menu>
          <ToggleThemeMode variant='inline'/>
        </Stack>
      </Stack>

      {/* Create-playlist modal -- mounted at NavBar level so the button works on any page */}
      <CreatePlaylistModal
        open={createPlaylistOpen}
        onClose={() => setCreatePlaylistOpen(false)}
      />
    </Box>
  );
}
