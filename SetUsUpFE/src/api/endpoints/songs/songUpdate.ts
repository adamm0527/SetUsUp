import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type SongDetail, type UpdateSongRequest } from "#root/lib/types";


export interface SongUpdateParams {
  songId: string;
}

// BE returns 200 + updated SongDetail when something changed, or 204 when no field was provided.
// Caller should treat 204 as "no-op succeeded" (success: true, data: null).
const api_SongUpdate: EndpointDescriptor<
  SongUpdateParams,
  UpdateSongRequest,
  SongDetail | null,
  ApiResponse
> = {
  method: 'PATCH',
  url: ({ songId }) => `/songs/${encodeURIComponent(songId)}`,
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while updating song.'
    };
  }
};

export default api_SongUpdate;
