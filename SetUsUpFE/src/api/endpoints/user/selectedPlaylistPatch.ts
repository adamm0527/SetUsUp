import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type SelPlaylistPatchRequest } from '#root/lib/types';


const api_UserSelectedPlaylistPatch: EndpointDescriptor<
  void,                     // no path or query params
  SelPlaylistPatchRequest,  // request body
  null,                     // success body (empty: 204_NoContent)
  ApiResponse               // error body
> = {
  method: 'PATCH',
  url: () => '/user/selected-playlist',
  /* graceful fallback if unexpected/malformed data is returned */
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while patching selected playlist of the user.'
    };
  }
};

export default api_UserSelectedPlaylistPatch;
