
// A playlist's details available to the user's selected group (even without selecting it).
export interface PlaylistInfo {
  id: string;
  name: string;
  creatorUserName: string;
}

export type PlaylistInfoList = PlaylistInfo[];


// The playlist's full metadata (with explicit selection).
// Entries are fetched separately via /playlists/entries.
export interface PlaylistDetail {
  id: string;
  name: string;
  description: string | null;
  creatorUserName: string;
  duration: string; // total run time of non-withPrev entries, "hh:mm:ss"
  entryCount: number; // count of non-withPrev entries
  canEditUI: boolean; // hint from BE: true when the caller has write access to this playlist
}
