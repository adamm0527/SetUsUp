import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse } from "#root/lib/types";


export interface PlaylistDeleteParams {
  playlistId: string;
}

const api_PlaylistDelete: EndpointDescriptor<
  PlaylistDeleteParams,
  void,
  void,
  ApiResponse
> = {
  method: 'DELETE',
  url: ({ playlistId }) => `/playlists/${encodeURIComponent(playlistId)}`,
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while deleting playlist.'
    };
  }
};

export default api_PlaylistDelete;
