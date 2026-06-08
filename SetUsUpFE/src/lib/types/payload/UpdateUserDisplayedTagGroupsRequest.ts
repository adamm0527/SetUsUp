
/* Replaces the user's ordered preference of TagGroup IDs to render as chips on SongCards.
   Max 5 ids. Pass an empty list to clear selection (default to FE's default preference). */
export default interface UpdateUserDisplayedTagGroupsRequest {
  tagGroupIds: string[]; // <=5, ordered
}
