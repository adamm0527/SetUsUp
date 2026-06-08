import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type UpdateSongTagsRequest } from "#root/lib/types";


export interface SongTagsPutParams {
  songId: string;
}

// Atomically replaces the song's Tag set with the body's TagIds.
const api_SongTagsPut: EndpointDescriptor<
  SongTagsPutParams,
  UpdateSongTagsRequest,
  null, // 204 NoContent on success
  ApiResponse
> = {
  method: 'PUT',
  url: ({ songId }) => `/songs/${encodeURIComponent(songId)}/tags`,
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while updating song tags.'
    };
  }
};

export default api_SongTagsPut;
