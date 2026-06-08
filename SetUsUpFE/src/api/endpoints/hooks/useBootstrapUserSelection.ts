import { useEffect } from 'react';
import { useEndpointQuery } from '#root/api/queryHooks';
import { type ApiResult } from '#root/api/fetcher';
import { type ApiResponse, type NamedEntity } from '#root/lib/types';
import { api_UserSelectedGroupGet, api_UserSelectedPlaylistGet } from '..';
import { useUserSelectionStore, useAuthTokenStore } from '#root/clientdata/stores/';


export default function useBootstrapUserSelection() {
  const token = useAuthTokenStore((store) => store.token);
  const seemsAuthed = !!token;
  const { selGroup: currentSelGroup, selPlaylist: currentSelPlaylist } = useUserSelectionStore.getState();
  // the above are initial values (not states) to avoid depencendy loops in initialData setting below

  const selGroupQuery = useEndpointQuery<void, void, NamedEntity, ApiResponse>(
    ['user', 'selectedGroup'], // key
    api_UserSelectedGroupGet, // endpoint
    undefined, // no params
    { // options
      enabled: seemsAuthed,
      staleTime: Infinity,
      initialData: currentSelGroup
        ? ({ // hydrating query cache from store if present
            success: true,
            data: currentSelGroup
           } as ApiResult<NamedEntity, ApiResponse>)
        : undefined
    }
  );

  const selPlaylistQuery = useEndpointQuery<void, void, NamedEntity | null, ApiResponse>(
    ['user', 'selectedPlaylist'], // key
    api_UserSelectedPlaylistGet, // endpoint
    undefined, // no params
    { // options
      enabled: seemsAuthed,
      staleTime: Infinity,
      initialData: currentSelPlaylist
        ? ({ // hydrating query cache from store if present
            success: true,
            data: currentSelPlaylist
           } as ApiResult<NamedEntity, ApiResponse>)
        : undefined 
    }
  );

  /* Syncing group query result (initial/invalidated) -> store -> UI */
  useEffect(() => {
    const apiResult = selGroupQuery.data as
      | ApiResult<NamedEntity, ApiResponse>
      | undefined;

    /* we don't sync in unlikely edge-cases
      (domain enforces a selected-group at all times, we can assume it's return) */
    if (!apiResult || !apiResult.success || !apiResult.data)
      return;

    const selectionState = useUserSelectionStore.getState();
    const existingGroup = selectionState.selGroup;
    const returnedGroup = apiResult.data;
    /* only writing to the store when needed (selected group changed) */
    if (!existingGroup || existingGroup.id !== returnedGroup.id || existingGroup.name !== returnedGroup.name)
      selectionState.setSelGroup(returnedGroup);
  }, [selGroupQuery.data]);

  /* Syncing playlist query result (initial/invalidated) -> store -> UI */
  useEffect(() => {
    const apiResult = selPlaylistQuery.data as
      | ApiResult<NamedEntity | null, ApiResponse>
      | undefined;

    /* we don't sync in unlikely edge-cases */
    if (!apiResult || !apiResult.success)
      return;

    const selectionState = useUserSelectionStore.getState();
    const existingPlaylist = selectionState.selPlaylist;
    const returnedPlaylist = apiResult.data; // can be null

    const selPlaylistChanged =
      (!existingPlaylist && !!returnedPlaylist) || (!!existingPlaylist && !returnedPlaylist) ||
      (existingPlaylist?.id !== returnedPlaylist?.id || existingPlaylist?.name !== returnedPlaylist?.name);

    /* only writing to the store when needed (selected playlist changed) */
    if (selPlaylistChanged)
      selectionState.setSelPlaylist(returnedPlaylist);
  }, [selPlaylistQuery.data]);

  return {
    selGroupQuery,
    selPlaylistQuery,
    isBootstrapping:
      seemsAuthed && (selGroupQuery.isLoading || selPlaylistQuery.isLoading)
  };
}
