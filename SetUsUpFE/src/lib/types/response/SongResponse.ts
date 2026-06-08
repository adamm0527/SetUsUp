
// Used by the SongCard component when rendered as part of a PlaylistEntry row.
export interface SongInfo {
  id: string;
  artist: string;
  title: string;
  bpm: number;
  bpmOut: number;
  initKey: string | null;
  spotifySongId: string | null;
  tagIds: string[];
}

// Used by the SongCard component in the MusicLibraryPage and by the SongDetailPanel.
export interface SongDetail {
  id: string;
  artist: string;
  title: string;
  duration: string; // <--> C# TimeOnly "HH:mm:ss"
  bpm: number;
  bpmOut: number;
  initKey: string | null;
  canEditUI: boolean;
  spotifySongId: string | null;
  tagIds: string[]; // sorted alphabetically by ID
}

export type SongDetailList = SongDetail[];
