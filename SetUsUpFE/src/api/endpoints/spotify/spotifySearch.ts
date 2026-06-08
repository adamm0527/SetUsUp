import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type SpotifyTrackList } from "#root/lib/types";


export interface SpotifySearchParams {
  q: string;
  limit?: number; // 1..50; defaults to 10 on BE
}

// 204 NoContent when there are zero results, caller treats that as an empty array.
const api_SpotifySearch: EndpointDescriptor<
  SpotifySearchParams,
  void,
  SpotifyTrackList | null,
  ApiResponse
> = {
  method: 'GET',
  url: ({ q, limit }) => {
    const params = new URLSearchParams();
    params.set('q', q);
    if (limit !== undefined) params.set('limit', String(limit));
    return `/songs/spotify/search?${params.toString()}`;
  },
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while searching Spotify.'
    };
  }
};

export default api_SpotifySearch;
