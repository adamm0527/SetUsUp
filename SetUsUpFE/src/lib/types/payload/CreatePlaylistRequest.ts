
// Creates a playlist in the user's currently selected group.
// The BE auto-sets the new playlist as the user's selected playlist after a successful create.
export default interface CreatePlaylistRequest {
  name: string;
  description?: string | null;
}
