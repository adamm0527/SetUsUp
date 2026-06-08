import { create } from 'zustand';
import { type NamedEntity } from '#root/lib/types';
import { USER_SEL_GROUP_KEY, USER_SEL_PLAYLIST_KEY } from '#root/lib/constants';


export interface UserSelectionStore {
  selGroup: NamedEntity | null;
  selPlaylist: NamedEntity | null;
  setSelGroup: (group: NamedEntity | null) => void;
  setSelPlaylist: (playlist: NamedEntity | null) => void;
  clearUserSelection: () => void;
  shouldFocusGroupSelector: boolean;
  setShouldFocusGroupSelector: (value: boolean) => void;
  shouldFocusPlaylistSelector: boolean;
  setShouldFocusPlaylistSelector: (value: boolean) => void;
}

const useUserSelectionStore = create<UserSelectionStore>(set => ({
  selGroup: (() => {
    const jsonSavedGroup = localStorage.getItem(USER_SEL_GROUP_KEY);
    if (jsonSavedGroup)
      return JSON.parse(jsonSavedGroup) as NamedEntity;
    else
      return null;
  })(),
  selPlaylist: (() => {
    const jsonSavedPlaylist = localStorage.getItem(USER_SEL_PLAYLIST_KEY);
    if (jsonSavedPlaylist)
      return JSON.parse(jsonSavedPlaylist) as NamedEntity;
    else
      return null;
  })(),
  setSelGroup: (group) => {
    if (group) {
      localStorage.setItem(USER_SEL_GROUP_KEY, JSON.stringify(group));
      set({ selGroup: group });
    } else {
      localStorage.removeItem(USER_SEL_GROUP_KEY);
      set({ selGroup: null});
    }
  },
  setSelPlaylist: (playlist) => {
    if (playlist) {
      localStorage.setItem(USER_SEL_PLAYLIST_KEY, JSON.stringify(playlist));
      set({ selPlaylist: playlist });
    } else {
      localStorage.removeItem(USER_SEL_PLAYLIST_KEY);
      set({ selPlaylist: null});
    }
  },
  clearUserSelection: () => {
    localStorage.removeItem(USER_SEL_GROUP_KEY);
    set({ selGroup: null});
    localStorage.removeItem(USER_SEL_PLAYLIST_KEY);
    set({ selPlaylist: null});
  },
  shouldFocusGroupSelector: false,
  setShouldFocusGroupSelector: (value) => {
    set({ shouldFocusGroupSelector: value });
  },
  shouldFocusPlaylistSelector: false,
  setShouldFocusPlaylistSelector: (value) => {
    set({ shouldFocusPlaylistSelector: value });
  }
}))

export default useUserSelectionStore;
