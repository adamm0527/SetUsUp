import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse } from "#root/lib/types";


export interface GroupMemberInviteParams {
  groupId: string;
  userName: string;
}

const api_GroupMemberInvite: EndpointDescriptor<
  GroupMemberInviteParams,   // path params
  void,                      // no request body
  ApiResponse,               // success body (201 Created with Response)
  ApiResponse                // error body
> = {
  method: 'POST',
  url: ({ groupId, userName }) => `/groups/${encodeURIComponent(groupId)}/users/${encodeURIComponent(userName)}`,
  /* graceful fallback if unexpected/malformed data is returned */
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while inviting user to group.'
    };
  }
};

export default api_GroupMemberInvite;
