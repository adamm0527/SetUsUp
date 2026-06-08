import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type PlaylistEntryInfoList } from "#root/lib/types";


// Returns all entries of the user's currently selected playlist.
// BE responds with 204 NoContent when the selected playlist is empty.
const api_PlaylistEntriesGetAll: EndpointDescriptor<
  void,
  void,
  PlaylistEntryInfoList | null,
  ApiResponse
> = {
  method: 'GET',
  url: () => '/playlists/entries',
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while loading playlist entries.'
    };
  }
};

export default api_PlaylistEntriesGetAll;
