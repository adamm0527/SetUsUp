import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type SpotifyTrack } from "#root/lib/types";


export interface SpotifyLookupParams {
  spotifySongId: string;
}

// Returns full metadata + BPM/Camelot key (when RapidAPI augmentation succeeds).
const api_SpotifyLookup: EndpointDescriptor<
  SpotifyLookupParams,
  void,
  SpotifyTrack,
  ApiResponse
> = {
  method: 'GET',
  url: ({ spotifySongId }) => `/songs/spotify/lookup/${encodeURIComponent(spotifySongId)}`,
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while looking up Spotify track.'
    };
  }
};

export default api_SpotifyLookup;
