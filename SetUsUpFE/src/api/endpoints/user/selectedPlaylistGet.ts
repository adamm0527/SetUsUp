import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type NamedEntity } from '#root/lib/types';


const api_UserSelectedPlaylistGet: EndpointDescriptor<
  void,                // no path or query params
  void,                // request body (empty)
  NamedEntity | null,  // success body (based on status code: 200_OK or 204_NoContent)
  ApiResponse          // error body
> = {
  method: 'GET',
  url: () => '/user/selected-playlist',
  /* graceful fallback if unexpected/malformed data is returned */
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while querying selected playlist of the user.'
    };
  }
};

export default api_UserSelectedPlaylistGet;
