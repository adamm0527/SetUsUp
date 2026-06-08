
/* The aggregate ratings for an entry plus the calling user's own current rating (if any). */
export interface PlaylistEntryRating {
  averageRating: number | null; // null when totalRaters == 0
  totalRaters: number;
  myRating: number | null; // the calling user's own rating or null (if not rated)
}
