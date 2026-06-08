
// Moves an entry to a new 1-based index-position within the playlist.
// The BE recomputes Nr and TransitionToNext for all affected rows (Aggregate Root).
export default interface UpdatePlaylistEntryPositionRequest {
  newPosition: number;  // first slot is 1 (can't be 0)
}
