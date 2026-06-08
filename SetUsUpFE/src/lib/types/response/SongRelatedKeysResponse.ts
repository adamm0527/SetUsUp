
// Used by the "Related keys" block in SongDetailPanel:
// each field is a clickable suggestion that becomes a key filter in the FilterBar.
// All key fields are Camelot strings, normalized to "DDL" form ("05A") when pushed to the filter store.
export interface SongRelatedKeys {
  exactMatch: string;            // the song's own key
  boost: string;                 // +1X
  drop: string;                  // -1X
  diagonal: string;              // +/-1C
  isDiagonalDown: boolean;
  diagonalAtonal: string;        // -/+1C
  scale: string;                 // 00C (same-number, flip A<->B)
  energyBoostBig: string;        // +2X
  energyDropBig: string;         // -2X
  energyBoost: string;           // +7X
  energyDrop: string;            // -7X
  payAttentionMinus: string;     // -3X
  payAttentionPlus: string;      // +3X
  moodShift: string;             // +/-3C
  isMoodShiftMajorDown: boolean;
  flatFourUp: string;            // +4X
  flatFourScale: string;         // +/-4C
  isFlatFourMinorDown: boolean;
  harmonicFlip: string;          // +6X (opposite side of the wheel)
  perfectMatches: string[];       // pre-computed list of harmonically perfect destinations
  similarMatches: string[];       // pre-computed list of similar/safe destinations
  allMatches: string[];           // union of perfect + similar
}
