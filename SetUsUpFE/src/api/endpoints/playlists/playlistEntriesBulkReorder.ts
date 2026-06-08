import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type BulkReorderPlaylistEntriesRequest } from "#root/lib/types";


/* Replaces the current playlist's entry ordering with the supplied list.
   Used by drag operations where moving a "parent" entry needs to carry its WithPrev "children" along. */
const api_PlaylistEntriesBulkReorder: EndpointDescriptor<
  void,
  BulkReorderPlaylistEntriesRequest,
  void,
  ApiResponse
> = {
  method: 'PATCH',
  url: () => '/playlists/entries/reorder',
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Could not reorder the playlist. Refresh and try again.'
    };
  }
};

export default api_PlaylistEntriesBulkReorder;
