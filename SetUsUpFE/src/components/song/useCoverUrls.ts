import { useEffect, useMemo } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import callEndpoint from '#root/api/fetcher';
import { api_SpotifyCoverGet } from '#root/api/endpoints';
import type { SpotifyCover } from '#root/lib/types';
import {
  readPersistedCover, writePersistedCover, clearPersistedCover,
  consumeForceRefreshFlag, coverFetchSemaphore,
} from '#root/clientdata/stores/local/spotifyCoverCache.tsx';


/* Resolves CoverArts per song.
   Order of operations:
     1. Check force-refresh flag: if set, drop from and skip localStorage + send ?forceRefresh=true to BE.
     2. Otherwise read localStorage (30-day TTL). Hit = short-circuit.
     3. Otherwise ask BE to fetch from either it's 180-day DB cache or from Spotify directly if missing/gone.
     4. Persist the result to localStorage on the way back.
        On wasUnlinked=true: drop localStorage entry + invalidate ['songs'] so the song's link state refreshes.

    Usage from a list page:
     const { coverUrlBySongId, isLoading } = useCoverUrls(visibleSongs);
     ...
     <VirtualizedSongList songs={visibleSongs} coverUrlBySongId={coverUrlBySongId} ... /> */

const STALE_24H = 24 * 60 * 60 * 1000;
const GC_7D = 7 * 24 * 60 * 60 * 1000;


interface SongLike {
  id: string;
  spotifySongId: string | null | undefined;
}

interface UseCoverUrlsResult {
  coverUrlBySongId: Record<string, string | null | undefined>;
  isLoading: boolean;
}


export default function useCoverUrls(songs: SongLike[]): UseCoverUrlsResult {
  const queryClient = useQueryClient();

  const linkedIds = useMemo(() => {
    const set = new Set<string>();
    for (const s of songs) {
      if (s.spotifySongId) set.add(s.id);
    }
    return Array.from(set).sort();
  }, [songs]);

  const queries = useQueries({
    queries: linkedIds.map((songId) => ({
      queryKey: ['spotify-cover', songId],
      queryFn: async () => fetchOneCover(songId),
      staleTime: STALE_24H,
      gcTime: GC_7D,
    })),
  });

  /* wasUnlinked side-effect: drop the broader songs caches so linked songs refresh on the next render. */
  useEffect(() => {
    let anyUnlinked = false;
    for (const q of queries) {
      const result = q.data;
      if (!result || !result.success || !result.data) continue;
      if ((result.data as SpotifyCover).wasUnlinked) {
        anyUnlinked = true;
        break;
      }
    }
    if (anyUnlinked) {
      void queryClient.invalidateQueries({ queryKey: ['songs'], exact: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries.map((q) => q.dataUpdatedAt).join(',')]);

  const coverUrlBySongId: Record<string, string | null | undefined> = useMemo(() => {
    const map: Record<string, string | null | undefined> = {};
    linkedIds.forEach((songId, ix) => {
      const result = queries[ix]?.data;
      if (!result || !result.success) {
        map[songId] = undefined;
        return;
      }
      const cover = result.data as SpotifyCover | null;
      map[songId] = cover ? cover.coverUrl : null;
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedIds, queries.map((q) => q.dataUpdatedAt).join(',')]);

  const isLoading = queries.some((q) => q.isLoading);

  return { coverUrlBySongId, isLoading };
}


/* The queryFn body for a single song. */
async function fetchOneCover(songId: string): Promise<
  | { success: true; data: SpotifyCover | null }
  | { success: false; status: number; errorBody: unknown }
> {
  /* Force-refresh flag: unlink SpotifySong, drop and bypass localStorage. */
  const forceRefresh = consumeForceRefreshFlag(songId);

  /* Layer 0: localStorage (skipped on force refresh). */
  if (!forceRefresh) {
    const persisted = readPersistedCover(songId);
    if (persisted) {
      return {
        success: true,
        data: { spotifySongId: '', coverUrl: persisted.coverUrl, wasUnlinked: false },
      };
    }
  }

  /* Layer 1,2: BE call (to its 180-day DB cache, then Spotify source of truth). */
  await coverFetchSemaphore.acquire();
  try {
    const res = await callEndpoint(api_SpotifyCoverGet, {
      params: { songId, forceRefresh },
    });
    if (res.success) {
      const cover = res.data as SpotifyCover | null;
      if (cover) {
        if (cover.wasUnlinked) {
          clearPersistedCover(songId);
        } else {
          writePersistedCover(songId, cover.coverUrl);
        }
      }
    }
    return res as
      | { success: true; data: SpotifyCover | null }
      | { success: false; status: number; errorBody: unknown };
  } finally {
    coverFetchSemaphore.release();
  }
}
