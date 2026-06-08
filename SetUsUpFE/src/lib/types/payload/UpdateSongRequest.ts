
// all fields optional: null/undefined means "don't change"
// EXCEPT spotifySongId where:
//   undefined / not-sent -> do not change
//   ""                   -> unlink (delete the SongSpotifyLink row)
//   "ID"                 -> (re-)link to this Spotify Song ID
export default interface UpdateSongRequest {
  artist?: string;
  title?: string;
  duration?: string; // "hh:mm:ss"
  bpm?: number;
  bpmOut?: number;
  initKey?: string; // pass "" to clear the key on the BE
  spotifySongId?: string; // see special semantics above
}
