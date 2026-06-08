
export default interface CreateSongRequest {
  artist: string;
  title: string;
  duration: string; // "hh:mm:ss"
  bpm: number; // decimal in [0, 300]
  bpmOut?: number; // defaults to bpm on BE if omitted
  initKey?: string | null; // Camelot string in "DDL" or "0DL" format, e.g. "05A"
  spotifySongId?: string | null; // optional Spotify link
}
