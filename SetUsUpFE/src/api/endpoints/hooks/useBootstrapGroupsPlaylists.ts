import { useEndpointQuery } from '#root/api/queryHooks';
import { api_GroupsGetAll, api_PlaylistsGetAll } from '..';
import type { ApiResponse, GroupInfoList, PlaylistInfoList } from '#root/lib/types';
import { useUserSelectionStore, useAuthTokenStore } from '#root/clientdata/stores/';


export default function useBootstrapGroupsPlaylists() {
  const token = useAuthTokenStore((store) => store.token);
  const seemsAuthed = !!token;
  const { selGroup } = useUserSelectionStore();

  /* query for all groups of the current user */
  const groupsQuery = useEndpointQuery<void, void, GroupInfoList, ApiResponse>(
    ['groups'],
    api_GroupsGetAll,
    undefined,
    {
      enabled: seemsAuthed,
      staleTime: Infinity
    }
  );

  /* query for all playlists of the CURRENTLY SELECTED GROUP (stored server-side) */
  const playlistQuery = useEndpointQuery<void, void, PlaylistInfoList | null, ApiResponse>(
    ['playlists'],
    api_PlaylistsGetAll,
    undefined,
    {
      enabled: seemsAuthed && !!selGroup, // only after selected group is already fetched
      staleTime: Infinity
    }
  );

  const queriedGroups: GroupInfoList = (groupsQuery.data?.success && groupsQuery.data.data)
    ? groupsQuery.data.data.map((group) => ({
        id: group.id,
        name: group.name,
        role: group.role,
        isPersonal: group.isPersonal,
        memberCount: group.memberCount,
        memberNames: group.memberNames
      }))
    : [];

  const queriedPlaylists: PlaylistInfoList = (playlistQuery.data?.success && playlistQuery.data.data)
     ? playlistQuery.data.data.map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        creatorUserName: playlist.creatorUserName
       }))
    : [];

  return {
    groupsQuery,
    playlistQuery,
    queriedGroups,
    queriedPlaylists,
    isLoading: groupsQuery.isLoading || playlistQuery.isLoading
  };
}
