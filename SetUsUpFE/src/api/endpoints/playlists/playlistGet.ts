import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type PlaylistDetail } from "#root/lib/types";


export interface PlaylistGetParams {
  playlistId: string;
}

const api_PlaylistGet: EndpointDescriptor<
  PlaylistGetParams,
  void,
  PlaylistDetail,
  ApiResponse
> = {
  method: 'GET',
  url: ({ playlistId }) => `/playlists/${encodeURIComponent(playlistId)}`,
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while loading playlist.'
    };
  }
};

export default api_PlaylistGet;
