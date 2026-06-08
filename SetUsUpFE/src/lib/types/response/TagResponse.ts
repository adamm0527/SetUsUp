
// Full mirror of Backend Tag hierarchy. See BE for details.
export const TagGroupTypes = {
  MX:  0,
  OX:  1,
  OM:  2,
  MXP: 3,
  OMC: 4,
  OXC: 5
} as const;
export type TagGroupType = (typeof TagGroupTypes)[keyof typeof TagGroupTypes];


export interface TagInfo {
  id: string; // 7-char code, e.g. "ENRGY04"
  name: string;
  description: string;
}

export interface TagGroupInfo {
  id: string; // 5-char code, e.g. "ENRGY"
  name: string;
  type: TagGroupType;
  tags: TagInfo[]; // sorted by id
}

export interface TagCategoryInfo {
  id: string; // 3-char code, e.g. "ENR"
  name: string;
  tagGroups: TagGroupInfo[];
}

export type TagCategoryList = TagCategoryInfo[];
