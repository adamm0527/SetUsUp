import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse } from "#root/lib/types";


export interface GroupMemberKickParams {
  groupId: string;
  userId: string; // userId of the kicked/leaving(self-kicked) member
}

const api_GroupMemberKick: EndpointDescriptor<
  GroupMemberKickParams,   // path params
  void,                    // no request body
  null,                    // success body (empty: 204 NoContent)
  ApiResponse              // error body
> = {
  method: 'DELETE',
  url: ({ groupId, userId }) => `/groups/${encodeURIComponent(groupId)}/users/${encodeURIComponent(userId)}`,
  /* graceful fallback if unexpected/malformed data is returned */
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while removing member from group.'
    };
  }
};

export default api_GroupMemberKick;
