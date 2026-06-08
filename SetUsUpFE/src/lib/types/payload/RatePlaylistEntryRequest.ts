
/* For upserting the calling user's rating (1..5) for the entry.
   Idempotent: repeating with the same value is a no-op write on the BE. */
export default interface RatePlaylistEntryRequest {
  rating: number; // 1..5 (BE validated)
}
