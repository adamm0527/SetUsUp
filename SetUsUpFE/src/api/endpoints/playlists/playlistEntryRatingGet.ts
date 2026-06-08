import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type PlaylistEntryRating } from "#root/lib/types";


export interface PlaylistEntryRatingGetParams {
  entryId: string;
}

/* Gets the aggregate ratings for an entry plus the calling user's own current rating (if any). */
const api_PlaylistEntryRatingGet: EndpointDescriptor<
  PlaylistEntryRatingGetParams,
  void,
  PlaylistEntryRating,
  ApiResponse
> = {
  method: 'GET',
  url: ({ entryId }) => `/playlists/entries/${encodeURIComponent(entryId)}/rating`,
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while fetching the entry rating.'
    };
  }
};

export default api_PlaylistEntryRatingGet;
