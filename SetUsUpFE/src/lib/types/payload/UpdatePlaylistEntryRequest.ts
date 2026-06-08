
// all fields optional: null/undefined means "don't change"
export default interface UpdatePlaylistEntryRequest {
  startTime?: string;   // hh:mm:ss within the song
  endTime?: string;     // hh:mm:ss within the song
  comment?: string;
  hexColour?: string;   // AARRGGBB
  withPrev?: boolean;   // true -> "play with previous" (BE rejects true on first entry)
  bpmChange?: number;   // signed BPM delta applied on top of the song's BPM, affecting duration
}
