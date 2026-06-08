import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type PlaylistEntryRating } from "#root/lib/types";


export interface PlaylistEntryRatingDeleteParams {
  entryId: string;
}

/* Removes the calling user's rating for the entry. Returns the post-deletion rating snapshot. */
const api_PlaylistEntryRatingDelete: EndpointDescriptor<
  PlaylistEntryRatingDeleteParams,
  void,
  PlaylistEntryRating,
  ApiResponse
> = {
  method: 'DELETE',
  url: ({ entryId }) => `/playlists/entries/${encodeURIComponent(entryId)}/rating`,
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while removing your rating.'
    };
  }
};

export default api_PlaylistEntryRatingDelete;
