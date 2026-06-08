import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type UpdateGroupUserAdminStatusRequest } from "#root/lib/types";


export interface GroupMemberRoleParams {
  groupId: string;
  userId: string; // userId of an existing member (we already have it from ReadGroupDetailDto)
}

const api_GroupMemberRole: EndpointDescriptor<
  GroupMemberRoleParams,              // path params
  UpdateGroupUserAdminStatusRequest,  // request body (isPromotion)
  null,                               // success body (empty: 204 NoContent)
  ApiResponse                         // error body
> = {
  method: 'PATCH',
  url: ({ groupId, userId }) => `/groups/${encodeURIComponent(groupId)}/users/${encodeURIComponent(userId)}`,
  /* graceful fallback if unexpected/malformed data is returned */
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while updating member role.'
    };
  }
};

export default api_GroupMemberRole;
