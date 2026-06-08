import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type PlaylistEntryDetail, type UpdatePlaylistEntryRequest } from "#root/lib/types";


export interface PlaylistEntryUpdateParams {
  entryId: string;
}

// BE returns 200 + updated PlaylistEntryDetail when something changed, or 204 when no field was provided.
const api_PlaylistEntryUpdate: EndpointDescriptor<
  PlaylistEntryUpdateParams,
  UpdatePlaylistEntryRequest,
  PlaylistEntryDetail | null,
  ApiResponse
> = {
  method: 'PATCH',
  url: ({ entryId }) => `/playlists/entries/${encodeURIComponent(entryId)}`,
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while updating playlist entry.'
    };
  }
};

export default api_PlaylistEntryUpdate;
