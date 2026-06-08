
// Full snapshot of all Tags that the target Song (URL param) should have.
export default interface UpdateSongTagsRequest {
  tagIds: string[]; // Empty array means "untag everything".
}
