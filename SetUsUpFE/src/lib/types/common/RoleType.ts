
/* readonly map to be used as enumerators */
export const Role = {
  Member: 0,
  Admin: 1,
  Creator: 2
} as const;

/* the type to recieve the enumerators (e.g. parameters, return types) */
export type RoleType = (typeof Role)[keyof typeof Role];
