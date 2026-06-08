import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type PlaylistEntryRating,
  type RatePlaylistEntryRequest } from "#root/lib/types";


export interface PlaylistEntryRatingSetParams {
  entryId: string;
}

/* Upserts the calling user's rating (1..5) for the entry.
   Idempotent: replaying with the same value is a no-op on the BE. */
const api_PlaylistEntryRatingSet: EndpointDescriptor<
  PlaylistEntryRatingSetParams,
  RatePlaylistEntryRequest,
  PlaylistEntryRating,
  ApiResponse
> = {
  method: 'PUT',
  url: ({ entryId }) => `/playlists/entries/${encodeURIComponent(entryId)}/rating`,
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while saving your rating.'
    };
  }
};

export default api_PlaylistEntryRatingSet;
