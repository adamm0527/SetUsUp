
// GDPR Art. 15 (right of access) + Art. 20 (portability) export bundle.
// Downloaded as a file as the BE sets Content-Disposition
export interface UserDataExport {
  exportedAtUtc: string;
  noticeToReader: string;
  user: {
    id: string;
    userName: string;
    email: string;
    instagramAccount: string | null;
    lastLoginAt: string | null;
    acceptedLegalVersion: number;
    acceptedSpotifyNoticeVersion: number;
    displayedTagGroupIds: string;
  };
  groups: Array<{
    groupId: string;
    groupName: string;
    role: 'Creator' | 'Admin' | 'Member';
    isOwnGroup: boolean;
  }>;
  songs: Array<{
    id: string;
    artist: string;
    title: string;
    duration: string;
    bpm: number;
    bpmOut: number;
    initKey: string | null;
    spotifySongId: string | null;
    tagIds: string[];
    sharedWithGroupIds: string[];
  }>;
  playlists: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
  playlistEntries: Array<{
    id: string;
    nr: number;
    start: string;
    end: string;
    comment: string | null;
    withPrev: boolean;
    songId: string;
  }>;
  playlistEntryRatings: Array<{
    playlistEntryId: string;
    rating: number;
  }>;
}
