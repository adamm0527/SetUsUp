
// The logged-in user's own profile data.
// Used by the UserSettingsPage and the NavBar avatar dropdown (for the username header).
export interface UserProfile {
  id: string;
  userName: string;
  email: string;
  emailConfirmed: boolean;
  instagramAccount: string | null;
  lastLoginAt: string | null; // UTC
  acceptedLegalVersion: number;
  acceptedSpotifyNoticeVersion: number;
  /* Ordered list (max 5) of TagGroup IDs the user wants displayed as chips on SongCards.
     If empty, the default preference will be applied in FE. */
  displayedTagGroupIds: string[];
}
