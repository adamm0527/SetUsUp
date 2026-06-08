import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type PlaylistDetail, type UpdatePlaylistRequest } from "#root/lib/types";


export interface PlaylistUpdateParams {
  playlistId: string;
}

// BE returns 200 + updated PlaylistDetail when something changed, or 204 when no field was provided.
const api_PlaylistUpdate: EndpointDescriptor<
  PlaylistUpdateParams,
  UpdatePlaylistRequest,
  PlaylistDetail | null,
  ApiResponse
> = {
  method: 'PATCH',
  url: ({ playlistId }) => `/playlists/${encodeURIComponent(playlistId)}`,
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while updating playlist.'
    };
  }
};

export default api_PlaylistUpdate;
