import type { QueryClient } from '@tanstack/react-query';


/* Part of the App's three-layer Spotify cover caching, as Layer 0.
   It stores cover URLs in localStorage with a 30-day TTL, keyed by songId.
   FE uses it as a quick check before asking the BE for a cover URL to save roundtrips between FE-BE-DB and BE-Spotify.

   Implementation core details:
     - module-singleton semaphore that caps in-flight cover requests at 6 globally.
     - forceRefreshSet: a Set tracking song ids that should bypass localStorage AND send `?forceRefresh=true`
          on their next BE call. (This forces a successful revalidation for them.)
    - invalidateCoverForSong(songId, queryClient): the public entry point.
      Drops the localStorage entry, adds the song to the force-refresh set, and asks React Query to refetch.

   Removal of stale covers:
     - Primary: 30-day TTL on localStorage entries.
     - Reactive: `wasUnlinked=true` is catched from BE (in queryFn)
     - Reactive: image-load-failure triggers `invalidateCoverForSong`, this one also forces a refresh. */

const LOCALSTORAGE_KEY = 'spotify-cover-cache-v1';
const LOCALSTORAGE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface PersistedCoverEntry {
  coverUrl: string | null;
  ts: number;
}

type PersistedCoverCache = Record<string, PersistedCoverEntry>;


/* Persistent storage layer (localStorage) */

function loadAll(): PersistedCoverCache {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LOCALSTORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PersistedCoverCache;
    const now = Date.now();
    const fresh: PersistedCoverCache = {};
    for (const [songId, entry] of Object.entries(parsed)) {
      if (entry && typeof entry.ts === 'number' && (now - entry.ts) < LOCALSTORAGE_TTL_MS) {
        fresh[songId] = entry;
      }
    }
    return fresh;
  } catch {
    return {};
  }
}

function saveAll(cache: PersistedCoverCache): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(cache));
  } catch {
    /* Quota/disabled (in-memory layer continues to work). */
  }
}

export function readPersistedCover(songId: string): PersistedCoverEntry | null {
  const cache = loadAll();
  const entry = cache[songId];
  if (!entry) return null;
  if ((Date.now() - entry.ts) >= LOCALSTORAGE_TTL_MS) return null;
  return entry;
}

export function writePersistedCover(songId: string, coverUrl: string | null): void {
  const cache = loadAll();
  cache[songId] = { coverUrl, ts: Date.now() };
  saveAll(cache);
}

export function clearPersistedCover(songId: string): void {
  const cache = loadAll();
  if (cache[songId]) {
    delete cache[songId];
    saveAll(cache);
  }
}

export function clearAllPersistedCovers(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(LOCALSTORAGE_KEY);
  } catch { /* ignore */ }
}


/* Force-refresh flag set, consumed once per fetch. (queryFn checks it before reading localStorage.) */

const forceRefreshSet = new Set<string>();

export function isForceRefreshPending(songId: string): boolean {
  return forceRefreshSet.has(songId);
}

export function consumeForceRefreshFlag(songId: string): boolean {
  if (forceRefreshSet.has(songId)) {
    forceRefreshSet.delete(songId);
    return true;
  }
  return false;
}


/* This should be called from anywhere the FE has reason to believe its cached cover URL is stale 
   (e.g. when CoverArt's onError handler when the <img> fails to load). Does three things:
     1. Drops the localStorage entry
     2. Marks the songId as pending force-refresh
        (so the queryFn sends `?forceRefresh=true` and the BE bypasses its own DB cache too).
     3. Invalidates the React Query cache entry so React Query schedules a refetch.

   The next render will roundtrip -> queryFn -> BE -> Spotify and pull the freshest cover successfully. */
export function invalidateCoverForSong(songId: string, queryClient: QueryClient): void {
  clearPersistedCover(songId);
  forceRefreshSet.add(songId);
  void queryClient.invalidateQueries({ queryKey: ['spotify-cover', songId], exact: true });
}


/* Concurrency semaphore ----- caps the current Spotify destined BE requests.
   Module-scoped singleton --- two pages mounted concurrently share the same cap. */

const MAX_CONCURRENT = 6;

class CoverFetchSemaphore {
  private inflight = 0;
  private waiters: Array<() => void> = [];

  acquire(): Promise<void> {
    if (this.inflight < MAX_CONCURRENT) {
      this.inflight++;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.waiters.push(() => {
        this.inflight++;
        resolve();
      });
    });
  }

  release(): void {
    this.inflight = Math.max(0, this.inflight - 1);
    const next = this.waiters.shift();
    if (next) next();
  }

  get queueDepth(): number { return this.waiters.length; }
}

export const coverFetchSemaphore = new CoverFetchSemaphore();
