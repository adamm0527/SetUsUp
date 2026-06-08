
// All "?: null" fields can come back null depending on Spotify/RapidAPI availability
export interface SpotifyTrack {
  id: string;
  artist: string;
  title: string;
  album: string;
  durationMs: number;
  coverUrl: string | null;
  bpm: number | null; // populated by /lookup when RapidAPI is reachable and within quota
  initKey: string | null; // similarly. Camelot string, e.g. "08B"
}

export type SpotifyTrackList = SpotifyTrack[];
