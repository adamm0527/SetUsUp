import { create } from 'zustand';


// Filter state for the MusicLibraryPage.
// One slot saved per selected group, so switching groups in the NavBar restores that group's last-used filter.
// In-memory only: survives page navigation but is cleared on refresh/logout (URL params handle refresh).

// Empty `keys: []` (or empty `tagIds: []`) means "no key filter active" (ALL songs pass the key check).
export interface MusicFilterState {
  text: string;              // artist+title substring (case-insensitive, word-split)
  bpmMin: number | null;     // null = no lower bound
  bpmMax: number | null;     // null = no upper bound
  keys: string[];            // Camelot keys in DDL format, e.g. ["05A", "06A"]
  lockedKey: string | null;  // the open song's key, forced into the filter while detail is open
  tagIds: string[];          // tag ID filter (empty = all pass)
  tagMode: 'all' | 'any';    // AND vs OR semantics for the tag filter
  spotifyOnly: boolean;      // when true, only show songs with a SpotifySongId set (linked to Spotify)
  sort: SortChain;           // an ordered list of (SortField,SortDir) pairs, first entry is the primary sort
}

export type SortField = 'artist' | 'title' | 'bpm' | 'key';
export type SortDir = 'asc' | 'desc';
export interface SortStep { field: SortField; dir: SortDir; }
export type SortChain = SortStep[];


export const defaultFilterState: MusicFilterState = {
  text: '',
  bpmMin: null,
  bpmMax: null,
  keys: [],
  lockedKey: null,
  tagIds: [],
  tagMode: 'all',
  spotifyOnly: false,
  sort: [{ field: 'artist', dir: 'asc' }, { field: 'title', dir: 'asc' }],
};


interface MusicFilterStore {
  /* per-group filter slots; the active group's slot is returned by getFilter(activeGroupId) */
  byGroup: Record<string, MusicFilterState>;

  /* read the filter for a group (returns the default if no slot exists yet) */
  getFilter: (groupId: string | null | undefined) => MusicFilterState;

  /* write the filter for a group (replaces the slot atomically) */
  setFilter: (groupId: string, next: MusicFilterState) => void;

  /* partial update */
  patchFilter: (groupId: string, patch: Partial<MusicFilterState>) => void;

  /* clear a group's slot (back to defaults) */
  resetFilter: (groupId: string) => void;

  /* called on logout to wipe everything */
  clearAll: () => void;
}


const useMusicFilterStore = create<MusicFilterStore>((set, get) => ({
  byGroup: {},

  getFilter: (groupId) => {
    if (!groupId) return defaultFilterState;
    return get().byGroup[groupId] ?? defaultFilterState;
  },

  setFilter: (groupId, next) => {
    set((s) => ({ byGroup: { ...s.byGroup, [groupId]: next } }));
  },

  patchFilter: (groupId, patch) => {
    set((s) => {
      const current = s.byGroup[groupId] ?? defaultFilterState;
      return { byGroup: { ...s.byGroup, [groupId]: { ...current, ...patch } } };
    });
  },

  resetFilter: (groupId) => {
    set((s) => {
      const { [groupId]: _, ...rest } = s.byGroup;
      return { byGroup: rest };
    });
  },

  clearAll: () => set({ byGroup: {} }),
}));


export default useMusicFilterStore;
