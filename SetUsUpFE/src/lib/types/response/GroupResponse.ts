import type NamedEntity from "../common/NamedEntity.ts";
import { type RoleType } from "../common/RoleType.ts";

export interface GroupInfo {
  id: string;
  name: string;
  role: RoleType;
  memberCount: number;
  memberNames: string[];
  isPersonal: boolean;
}

export type GroupInfoList = GroupInfo[];

export interface UserInfo extends NamedEntity {
  instagramAccount?: string | null;
}

export interface MemberInfo {
  userInfo: UserInfo,
  role: RoleType
}

export interface GroupDetail {
  id: string;
  name: string;
  role: RoleType;
  memberCount: number;
  members: MemberInfo[];
  isPersonal: boolean;
}
