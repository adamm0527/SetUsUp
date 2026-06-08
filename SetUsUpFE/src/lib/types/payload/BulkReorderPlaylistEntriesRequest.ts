
/* Submitting a COMPLETE new ordering of the current playlist's entries in one shot.
   The BE applies the order in a single transaction: partial updates aren't possible for consistency. */
export default interface BulkReorderPlaylistEntriesRequest {
  orderedEntryIds: string[];
}
