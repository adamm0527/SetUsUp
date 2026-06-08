
// Represents a group that has access to a song. 
export interface SongAccess {
  groupId: string;
  groupName: string;
  isCreatorGroup: boolean; // when true, can't be unshared (it's the creator's personal collection).
}

export type SongAccessList = SongAccess[];
