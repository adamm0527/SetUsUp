import type { SongInfo, SongDetail } from './SongResponse';


// For the basic entry card view inside playlists.
// Excludes Start/End/Comment (those live on the Detail variant fetched per-entry, see below).
export interface PlaylistEntryInfo {
  id: string;
  nr: number; // 1-based index-position. WithPrev rows reuse the previous Nr.
  transitionToNext: string | null; // 3-char atomic code (e.g. "+1X", "-3C"). Null on the last entry.
  duration: string; // hh:mm:ss
  hexColour: string | null; // AARRGGBB hex
  creatorUserName: string;
  withPrev: boolean; // true -> rendered as "w/" instead of "{nr}." in the list
  averageRating: number | null; // average rating aggregate
  totalRaters: number; // count of raters aggreate  
  song: SongInfo;
}

export type PlaylistEntryInfoList = PlaylistEntryInfo[];


// The per-entry detail used when a row is expanded.
// Adds Start, End, Comment, CanEditUI, and uses the full SongDetail variant.
export interface PlaylistEntryDetail {
  id: string;
  nr: number;
  transitionToNext: string | null;
  start: string; // hh:mm:ss within the song
  end: string; // hh:mm:ss within the song
  duration: string; // hh:mm:ss (computed: end - start)
  hexColour: string | null;
  comment: string | null;
  creatorUserName: string;
  canEditUI: boolean;
  canDeleteUI: boolean;
  withPrev: boolean;
  bpmChange: number; // signed BPM delta applied on top of the song's BPM, affecting duration
  averageRating: number | null; // average rating aggregate
  totalRaters: number; // count of raters aggreate
  myRating: number | null; // the calling user's own rating (null if not rated)
  song: SongDetail;
}
