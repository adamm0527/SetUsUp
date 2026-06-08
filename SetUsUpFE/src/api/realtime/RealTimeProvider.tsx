import { createContext, useContext, type ReactNode,
  useState, useEffect, useMemo, useRef, useCallback} from 'react';
import { type HubConnection } from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import createAppHubConnection from './createAppHubConnection';
import { useAuthTokenStore } from '#root/clientdata/stores';
import { ChangedEntity, Change, type RealTimeResponse, type PlaylistInfoList, type ApiResponse } from '#root/lib/types';
import { useUserSelectionStore } from '#root/clientdata/stores';
import { useEndpointMutation } from '#root/api/queryHooks';
import { api_UserSelectedPlaylistPatch, use_api_GroupsPlaylistsBootstrap } from '#root/api/endpoints';
import { type ApiResult } from '#root/api/fetcher';


type RealTimeContextValue = {
  connection: HubConnection | null;
  isConnected: boolean;
  lastDisconnectedAt: number | null;
};

const RealTimeContext = createContext<RealTimeContextValue | null>(null);

export const useRealTime = () => {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime cannot be used outside <RealTimeProvider>');
  }
  return context;
}

export default function RealTimeProvider({ children }: { children: ReactNode }) {
  const { token } = useAuthTokenStore();
  const queryClient = useQueryClient();

  const [connState, setConnState] = useState<HubConnection | null>(null);
  const [isConnState, setIsConnState] = useState(false);
  const [lastDisconnState, setLastDisconnState] = useState<number | null>(null);
  const connRef = useRef<HubConnection |  null>(null); // always-current ref to conn to be used in (stale) callbacks

  const api_patchSelPlaylist = useEndpointMutation(api_UserSelectedPlaylistPatch);
  const { queriedPlaylists } = use_api_GroupsPlaylistsBootstrap();

  /* central place to handle incoming SignalR events */
  const handleRealTimeNotification = useCallback(async (dto: RealTimeResponse) => {
    switch (dto.entityKind) {

      /* if GROUP WAS renamed/removed */
      case ChangedEntity.Group: {
        const selStore = useUserSelectionStore.getState();

        /* invalidating group options for dropdown (and possible dependencies) */
        void queryClient.refetchQueries({ queryKey: ['groups'], exact: false });

        const groupDeleted = (dto.changeKind === Change.Deleted);

        /* invalidating selectedGroup when it's the changed entity (based on id) */
        if (dto.entityId === selStore.selGroup?.id) {
          if (groupDeleted) {
            /* IMPORTANT ORDER: clear LOCALLY FIRST (sync), THEN refetch (async). */
            selStore.setSelPlaylist(null);
            selStore.setSelGroup(null);
          }
          /* refetch the valid selections from BE */
          void queryClient.refetchQueries({ queryKey: ['user', 'selectedGroup'], exact: true });
          if (groupDeleted) {
            void queryClient.refetchQueries({ queryKey: ['user', 'selectedPlaylist'], exact: true });
            void queryClient.invalidateQueries({ queryKey: ['playlists'], exact: false });
            /* delayed so we give time to remount with the new value. */
            setTimeout(() => {
              selStore.setShouldFocusGroupSelector(true);
            }, 50);
          }
        }

        /* if the given group was deleted, leave the corresponding SignalR channel ('Group') */
        if (groupDeleted) {
          connRef.current?.invoke('LeaveGroupAsync', dto.groupId)
            .catch((err) => console.warn('LeaveGroupAsync failed', err));
        }

        break;
      }


      /* if CLIENT USER HAS BEEN added to / removed from GROUP the client user is a member of
        (this branch handles BOTH the per-user notifications and the per-group broadcasts) */
      case ChangedEntity.GroupMembership: {

        /* invalidating group options for dropdown (and possible dependencies) */
        await queryClient.invalidateQueries({ queryKey: ['groups'], exact: false });

        /* handling SignalR channel ('Group') changes */
        if (dto.changeKind === Change.Created) {
          /* if client user has been added (invited) to a new domain group:
             join the SignalR channel (group) for this corresponding domain group */
          connRef.current?.invoke('JoinGroupAsync', dto.groupId)
            .catch((err) => console.error("JoinGroupAsync failed", err));
        } else if (dto.changeKind === Change.Deleted) {
          /* Client user has been kicked/left(self-kicked) from this domain group.
             If that group was their selected group, the Backend has already auto-reset
             their SelectedGroupId to their personal group on the user record (here we mirror with Frontend reinvalidation): */
          const selStore = useUserSelectionStore.getState();
          if (dto.groupId === selStore.selGroup?.id) {
            /* clear selections immediately for instant UI feedback */
            selStore.setSelPlaylist(null);
            selStore.setSelGroup(null);
            /* refetch user-selection queries from Backend - bootstrap propagates the new (personal) group back into the store */
            void queryClient.refetchQueries({ queryKey: ['user', 'selectedGroup'], exact: true });
            void queryClient.refetchQueries({ queryKey: ['user', 'selectedPlaylist'], exact: true });
            void queryClient.invalidateQueries({ queryKey: ['playlists'], exact: false });
            selStore.setShouldFocusGroupSelector(true); // transfer focus for visual feedback
          }
          /* leave the corresponding SignalR channel ('Group') */
          connRef.current?.invoke('LeaveGroupAsync', dto.groupId)
            .catch((err) => console.warn('LeaveGroupAsync failed', err));
        }

        break;
      }


      /* if SONG WAS created/updated/deleted in a group the client user is a member of */
      case ChangedEntity.Song: {
        const groupId = dto.groupId;
        const songId  = dto.entityId;

        /* always invalidate the songs list for that group */
        void queryClient.invalidateQueries({ queryKey: ['songs', groupId], exact: false });

        if (dto.changeKind === Change.Updated || dto.changeKind === Change.Deleted) {
          /* detail / related-keys / access list for this specific song */
          void queryClient.invalidateQueries({ queryKey: ['songs', songId, 'detail'], exact: true });
          void queryClient.invalidateQueries({ queryKey: ['songs', songId, 'related-keys'], exact: true });
          void queryClient.invalidateQueries({ queryKey: ['songs', songId, 'access'], exact: true });
          void queryClient.invalidateQueries({ queryKey: ['spotify-cover', songId], exact: true })
        }

        if (dto.changeKind === Change.Deleted) {
          /* related playlist entries were cascade-removed by the Backend, now refresh the playlist queries
             so any open PlaylistEditor in the affected group sees the change */
          void queryClient.invalidateQueries({ queryKey: ['playlists'], exact: false });
          void queryClient.invalidateQueries({ queryKey: ['playlistEntries'], exact: false });
        }

        break;
      }


      /* if PLAYLIST WAS created/updated/deleted in a group the client user is a member of */
      case ChangedEntity.Playlist: {
        const selStore = useUserSelectionStore.getState();
        const selectedPlaylist = selStore.selPlaylist;

        if (dto.groupId !== selStore.selGroup?.id)
          return; // only reacting when change happened in the client's currently selected group

        /* invalidating playlist options for dropdown (and possible dependencies) */
        await queryClient.refetchQueries({ queryKey: ['playlists'], exact: false });

        /* if there's no previous playlist selected for the client, but another client just created one, it get's automatically selected */
        if (!selectedPlaylist && dto.changeKind === Change.Created) {
          selStore.setSelPlaylist({ id: dto.entityId, name: dto.payloadJson! });
          void api_patchSelPlaylist.mutateAsync({ body: { playlistId: dto.entityId } });
        }

        /* invalidating selectedPlaylist when it's the changed entity (based on id) */
        if (dto.entityId === selectedPlaylist?.id) {
          if (dto.changeKind === Change.Deleted) {
            /* Cear local selection firstt */
            selStore.setSelPlaylist(null);

            /* The BE, too, just set the user's SelectedPlaylistId to null,
               so we pick a sensible default on the FE and PATCH it back so it persists (if there's still a playlist). */
            const fresh = queryClient.getQueryData<ApiResult<PlaylistInfoList | null, ApiResponse>>(['playlists']);
            const remaining = (fresh?.success && fresh.data)
              ? fresh.data.filter((p) => p.id !== dto.entityId) // defensive
              : [];

            if (remaining.length > 0) {
              const fallback = remaining[0];
              selStore.setSelPlaylist({ id: fallback.id, name: fallback.name });
              /* PATCH BE with the new auto-selection */
              try {
                await api_patchSelPlaylist.mutateAsync({ body: { playlistId: fallback.id } });
              } catch (err) {
                console.warn('Auto-fallback PATCH selectedPlaylist failed', err);
              }
              /* Refetch correct BE state right after. */
              void queryClient.invalidateQueries({ queryKey: ['playlist'], exact: false });
              void queryClient.invalidateQueries({ queryKey: ['playlistEntries'], exact: false });

            } else {
              /* No playlists left in this group leave selPlaylist null and focus the selector */
              setTimeout(() => {
                selStore.setShouldFocusPlaylistSelector(true);
              }, 50);
            }
          }
          /* reconciling selStore with BE truth in case anything raced, just in case */
          void queryClient.refetchQueries({ queryKey: ['user', 'selectedPlaylist'], exact: true });
          void queryClient.invalidateQueries({ queryKey: ['playlist', dto.entityId], exact: false });
        }

        break;
      }


      /* if PLAYLIST ENTRY WAS created/updated/reordered/deleted in a playlist the client user is a member of */
      case ChangedEntity.PlaylistEntry: {
        const eventPlaylistId = dto.payloadJson ?? null;
        const eventEntryId = dto.entityId;

        if (eventPlaylistId) {
          void queryClient.invalidateQueries({ queryKey: ['playlistEntries', eventPlaylistId], exact: false });
          void queryClient.invalidateQueries({ queryKey: ['playlist', eventPlaylistId], exact: false });
        } else {
          // Fallback: invalidate everything if for some reason the payload didn't carry the id
          void queryClient.invalidateQueries({ queryKey: ['playlistEntries'], exact: false });
          void queryClient.invalidateQueries({ queryKey: ['playlist'], exact: false });
        }

        /* Invalidate the entry detail view, too */
        void queryClient.invalidateQueries({ queryKey: ['playlistEntries', eventEntryId, 'detail'], exact: true });
        void queryClient.invalidateQueries({ queryKey: ['playlistEntries', eventEntryId], exact: false });
        break;
      }

      
      /* if USER WAS updated/deleted and the client user is a member of a group that the affected user is/was a member of */
      case ChangedEntity.User: {
        void queryClient.invalidateQueries({ queryKey: ['groupDetails'], exact: false });
        void queryClient.invalidateQueries({ queryKey: ['groups'], exact: false });

        if (dto.changeKind === Change.Deleted) {
          void queryClient.invalidateQueries({ queryKey: ['songs'], exact: false });
          void queryClient.invalidateQueries({ queryKey: ['playlists'], exact: false });
          void queryClient.invalidateQueries({ queryKey: ['playlistEntries'], exact: false });
          void queryClient.invalidateQueries({ queryKey: ['playlist'], exact: false });
        }
        break;
      }

      default:
        break;
    }
  }, [queriedPlaylists]);

  /* Initial connection + reconnect when token changes */
  useEffect(() => {
    if (!token) {
      if (connState) { // No jwt: tear down existing connection
        connState.stop().catch(console.error);
      }
      setConnState(null);
      setIsConnState(false);
      return;
    }

    let isDisposed = false;

    const conn = createAppHubConnection(
      () => token,
      (dto) => handleRealTimeNotification(dto)
    );

    connRef.current = conn; // for the SignalR callback
    setConnState(conn); // for exposing via context

    conn.start()
      .then(() => {
        if (isDisposed) return;
        /* SignalR connected */
        setIsConnState(true);
        setLastDisconnState(null);
      })
      .catch((err) => {
        console.error('SignalR Initial connection failed', err);
        setIsConnState(false);
        setLastDisconnState(Date.now());
      });

    conn.onreconnecting((error) => {
      console.warn('SignalR Reconnecting...', error);
      setIsConnState(false);
      setLastDisconnState(Date.now());
    });

    conn.onreconnected((_connectionId) => {
      /* SignalR reconnected... */
      setIsConnState(true);

      // safety invalidation upon reconnect -- after a reconnect we may have missed
      // events while disconnected, so refresh everything that depends on RT updates
      void queryClient.invalidateQueries({ queryKey: ['playlists'], exact: false });
      void queryClient.invalidateQueries({ queryKey: ['playlistEntries'], exact: false });
      void queryClient.invalidateQueries({ queryKey: ['playlist'], exact: false });
      void queryClient.invalidateQueries({ queryKey: ['songs'], exact: false });
      void queryClient.invalidateQueries({ queryKey: ['groupDetails'], exact: false });
    });

    conn.onclose((error) => {
      if (error)
        console.warn('SignalR Closed ungracefully', error);
      setIsConnState(false);
      setLastDisconnState(Date.now());
    });

    return () => {
      isDisposed = true;
      conn.stop()
        .catch((err) => console.error('SignalR Error during stop()', err));
    };
  }, [token]); // re-run when auth token changes

  /* Secondary reconnection place: browser comes back online after being offline */
  useEffect(() => {
    const handleOnline = () => {
      /* browser is back online here */
      // SignalR will auto-reconnect; nothing else to do here for now.
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [queryClient]);

  const value: RealTimeContextValue = useMemo(
    () => ({
      connection: connState,
      isConnected: isConnState,
      lastDisconnectedAt: lastDisconnState,
    }),
    [connState, isConnState, lastDisconnState]
  );

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
}
