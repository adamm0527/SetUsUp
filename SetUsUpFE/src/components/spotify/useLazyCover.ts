import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api_SpotifyCoverGet } from '#root/api/endpoints';
import axiosClient from '#root/api/axiosClient';


/* Hook that lazy-loads a Spotify cover for a single song using an IntersectionObserver.
   Subsequent calls for the same songId share React Query cache.
   Usage:
     const { ref, coverUrl } = useLazyCover(song.id, !!song.spotifySongId);
     return <div ref={ref}>{coverUrl ? <img src={coverUrl}/> : <Placeholder/>}</div>;

   The wrapping element receives a ref. When 50% of it enters viewport, the fetch triggers.
   This guards against triggering rate-limits (beyond Backend guards). */
export function useLazyCover(songId: string | null, hasSpotifyLink: boolean) {
  const queryClient = useQueryClient();
  const ref = useRef<HTMLElement | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [unlinked, setUnlinked] = useState(false);

  useEffect(() => {
    if (!songId || !hasSpotifyLink || !ref.current) return;

    /* Try cache first */
    const cached = queryClient.getQueryData<string | null>(['spotify-cover', songId]);
    if (cached !== undefined) {
      setCoverUrl(cached);
      return;
    }

    let cancelled = false;
    const observer = new IntersectionObserver(async (entries) => {
      const visible = entries.some(e => e.isIntersecting);
      if (!visible)
        return;
      observer.disconnect(); // one-shot

      try {
        const resp = await queryClient.fetchQuery({
          queryKey: ['spotify-cover', songId],
          queryFn: async () => {
            const r = await axiosClient.get<{ spotifySongId: string; coverUrl: string | null; wasUnlinked?: boolean }>(
              api_SpotifyCoverGet.url({ songId })
            );
            return r.data;
          },
          staleTime: 24 * 60 * 60 * 1000, // 24 hours
          gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        if (cancelled)
          return;
        setCoverUrl(resp?.coverUrl ?? null);
        if (resp?.wasUnlinked) {
          setUnlinked(true);
          /* Invalidate the song so its cached spotifySongId becomes null on next read. */
          await queryClient.invalidateQueries({ queryKey: ['songs'] });
        }
      } catch {
        /* swallow; no cover -> placeholder is rendered by CoverArt anyway */
      }
    }, { threshold: 0.5, rootMargin: '200px 0px' /* small look-ahead */ });

    observer.observe(ref.current);
    return () => { cancelled = true; observer.disconnect(); };
  }, [songId, hasSpotifyLink, queryClient]);

  return { ref, coverUrl, unlinked };
}
