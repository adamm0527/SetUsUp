import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type CreatePlaylistRequest } from "#root/lib/types";


const api_PlaylistCreate: EndpointDescriptor<
  void,                   // no path or query params
  CreatePlaylistRequest,  // request body
  ApiResponse,            // success body (201 Created with Response)
  ApiResponse             // error body
> = {
  method: 'POST',
  url: () => '/playlists',
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while creating playlist.'
    };
  }
};

export default api_PlaylistCreate;
