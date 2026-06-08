import { useEffect, useRef } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useMusicFilterStore, defaultFilterState,
  type MusicFilterState, type SortChain, type SortField, type SortDir,
} from '#root/clientdata/stores';


// URL search-params shape for the music-library page. All fields optional; absence means "default".
export interface MusicSearch {
  q?: string; // artist+title substring
  bpmMin?: string; // "0".."300"
  bpmMax?: string; // "0".."300"
  keys?: string; // "5A,6A" (comma-separated; URL-form, no leading zeros)
  tags?: string; // "ENRGY05,SCHHF01"
  tagMode?: 'all' | 'any'; // "all" | "any"
  spotifyOnly?: '1'; // "1" when true
  sort?: string; // "artist,-title,bpm" (leading '-' = desc)
}


/* Two-way sync between TanStack Router search params and the per-group `useMusicFilterStore` slot.
   Behavior:
     - On mount and on URL changes: parse URL -> hydrate the active group's filter slot.
     - On filter-state changes initiated by FilterBar callers: serialize back into URL search params. */
export function useMusicFilterUrlSync(groupId: string | null | undefined) {
  const navigate = useNavigate();
  // strict:false because callers may live outside the typed-route generic scope
  const search = useSearch({ strict: false }) as MusicSearch;

  const setFilter = useMusicFilterStore((s) => s.setFilter);
  const getFilter = useMusicFilterStore((s) => s.getFilter);

  /* On URL change (or active group change), hydrate the per-group slot. */
  const lastSearchKeyRef = useRef<string>('');
  useEffect(() => {
    if (!groupId) return;

    const searchKey = JSON.stringify(search ?? {});
    if (searchKey === lastSearchKeyRef.current) return;
    lastSearchKeyRef.current = searchKey;

    if (urlHasAnyFilterParam(search)) {
      // URL wins (parse and store)
      setFilter(groupId, fromUrl(search));
    } else {
      // No URL params: keep whatever is already in the slot (or default), then sync it BACK to URL
      const current = getFilter(groupId);
      const newSearch = toUrl(current);
      if (Object.keys(newSearch).length > 0) {
        navigate({
          search: ((_prev: unknown) => newSearch) as never,
          replace: true,
        });
      }
    }
  }, [groupId, search, setFilter, getFilter, navigate]);


  /* Caller-facing helper: writes a new filter state into both Zustand and the URL.
     Use this from FilterBar callers (instead of patchFilter) so URL stays in lockstep. */
  const writeFilter = (groupId: string, next: MusicFilterState) => {
    setFilter(groupId, next);
    const newSearch = toUrl(next);
    navigate({
      search: ((_prev: unknown) => newSearch) as never,
      replace: true,
    });
    lastSearchKeyRef.current = JSON.stringify(newSearch);
  };

  return { writeFilter };
}


/* --- serialization helpers --- */

function urlHasAnyFilterParam(s: MusicSearch): boolean {
  return !!(s?.q || s?.bpmMin || s?.bpmMax || s?.keys || s?.tags || s?.tagMode || s?.spotifyOnly || s?.sort);
}

export function toUrl(state: MusicFilterState): Record<string, string> {
  const out: Record<string, string> = {};
  if (state.text) out.q = state.text;
  if (state.bpmMin != null) out.bpmMin = String(state.bpmMin);
  if (state.bpmMax != null) out.bpmMax = String(state.bpmMax);
  if (state.keys.length) out.keys = state.keys.join(',');
  if (state.tagIds.length) out.tags = state.tagIds.join(',');
  if (state.tagMode !== 'all') out.tagMode = state.tagMode;
  if (state.spotifyOnly) out.spotifyOnly = '1';

  const sortStr = serializeSort(state.sort);
  if (sortStr) out.sort = sortStr;

  return out;
}

export function fromUrl(s: MusicSearch): MusicFilterState {
  const next: MusicFilterState = {
    ...defaultFilterState,
    text: s.q ?? '',
    bpmMin: s.bpmMin != null ? clampBpm(parseFloat(s.bpmMin)) : null,
    bpmMax: s.bpmMax != null ? clampBpm(parseFloat(s.bpmMax)) : null,
    keys: parseList(s.keys),
    tagIds: parseList(s.tags),
    tagMode: s.tagMode === 'any' ? 'any' : 'all',
    spotifyOnly: s.spotifyOnly === '1',
    sort: parseSort(s.sort),
  };
  if (next.bpmMin != null && next.bpmMax != null && next.bpmMin > next.bpmMax)
    [next.bpmMin, next.bpmMax] = [next.bpmMax, next.bpmMin];
  return next;
}

function parseList(s: string | undefined): string[] {
  if (!s) return [];
  return s.split(',').map((v) => v.trim()).filter(Boolean);
}

function clampBpm(n: number): number | null {
  if (!Number.isFinite(n)) return null;
  if (n < 0) return 0;
  if (n > 300) return 300;
  return n;
}

function serializeSort(sort: SortChain): string {
  return sort
    .map((s) => (s.dir === 'desc' ? `-${s.field}` : s.field))
    .join(',');
}

function parseSort(s: string | undefined): SortChain {
  if (!s) return defaultFilterState.sort;
  const out: SortChain = [];
  for (const part of s.split(',')) {
    let token = part.trim();
    if (!token) continue;
    let dir: SortDir = 'asc';
    if (token.startsWith('-')) { dir = 'desc'; token = token.slice(1); }
    if (token === 'artist' || token === 'title' || token === 'bpm' || token === 'key') {
      const field = token as SortField;
      if (!out.find((x) => x.field === field)) out.push({ field, dir });
    }
  }
  return out.length ? out : defaultFilterState.sort;
}
