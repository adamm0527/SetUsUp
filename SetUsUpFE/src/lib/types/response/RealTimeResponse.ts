
export const ChangedEntity = {
  Group: 0,
  GroupMembership: 1,
  Song: 2,
  Playlist: 3,
  PlaylistEntry: 4,
  User: 5
} as const;

export const Change = {
  Created: 0,
  Updated: 1,
  Deleted: 2,
  Reordered: 3
} as const;

/* the types to recieve the enumerators (e.g. parameters, return types) */
export type ChangedEntityKind = (typeof ChangedEntity)[keyof typeof ChangedEntity];
export type ChangeKind = (typeof Change)[keyof typeof Change];

/* response type of signalR communication from the backend */
export default interface RealTimeResponse {
  entityKind: ChangedEntityKind;
  changeKind: ChangeKind;
  groupId: string;
  entityId: string;
  payloadJson?: string;
}
