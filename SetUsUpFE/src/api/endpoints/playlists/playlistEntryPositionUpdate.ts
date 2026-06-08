import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type UpdatePlaylistEntryPositionRequest } from "#root/lib/types";


export interface PlaylistEntryPositionUpdateParams {
  entryId: string;
}

// Moves an entry to a new 1-based position. On success Returns 204.
// FE refetches /playlists/entries to get the recomputed Nr + TransitionToNext values.
const api_PlaylistEntryPositionUpdate: EndpointDescriptor<
  PlaylistEntryPositionUpdateParams,
  UpdatePlaylistEntryPositionRequest,
  void,
  ApiResponse
> = {
  method: 'PATCH',
  url: ({ entryId }) => `/playlists/entries/${encodeURIComponent(entryId)}/position`,
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while reordering playlist entry.'
    };
  }
};

export default api_PlaylistEntryPositionUpdate;
