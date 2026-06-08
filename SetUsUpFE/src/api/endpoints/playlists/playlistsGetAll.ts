import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type PlaylistInfoList } from "#root/lib/types";


const api_PlaylistsGetAll: EndpointDescriptor<
  void,                     // no path or query params
  void,                     // request body (empty)
  PlaylistInfoList | null,  // success body
  ApiResponse               // error body
> = {
  method: 'GET',
  url: () => '/playlists',
  /* graceful fallback if unexpected/malformed data is returned */
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while querying playlists of selected group.'
    };
  }
};

export default api_PlaylistsGetAll;
