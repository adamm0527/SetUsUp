import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type PlaylistEntryDetail } from "#root/lib/types";


export interface PlaylistEntryGetParams {
  entryId: string;
}

// Fetches the per-entry detail (with start, end, comment, etc.).
// Used when a row is expanded in the PlaylistEditor.
const api_PlaylistEntryGet: EndpointDescriptor<
  PlaylistEntryGetParams,
  void,
  PlaylistEntryDetail,
  ApiResponse
> = {
  method: 'GET',
  url: ({ entryId }) => `/playlists/entries/${encodeURIComponent(entryId)}`,
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while loading playlist entry.'
    };
  }
};

export default api_PlaylistEntryGet;
