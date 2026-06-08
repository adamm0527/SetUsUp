import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type SpotifyCover } from "#root/lib/types";


export interface SpotifyCoverGetParams {
  songId: string;
  forceRefresh?: boolean; // when true, BE hits Spotify directly for a guaranteed up-to-date cover
}

/* Lazy cover lookup used by the FE's IntersectionObserver pipeline in CoverArt.
   Returns 204 NoContent when the song isn't linked to Spotify. 200 with { coverUrl, wasUnlinked } otherwise.
   wasUnlinked=true means the BE removed the SongSpotifyLink because Spotify returned 404 (caller should invalidate ['songs']) */
const api_SpotifyCoverGet: EndpointDescriptor<
  SpotifyCoverGetParams,
  void,
  SpotifyCover | null,
  ApiResponse
> = {
  method: 'GET',
  url: ({ songId, forceRefresh }) => {
    const path = `/songs/spotify/${encodeURIComponent(songId)}/cover`;
    return forceRefresh ? `${path}?forceRefresh=true` : path;
  },
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while loading Spotify cover.'
    };
  }
};

export default api_SpotifyCoverGet;
