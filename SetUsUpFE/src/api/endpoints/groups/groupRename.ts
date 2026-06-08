import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type UpdateGroupNameRequest } from "#root/lib/types";


export interface GroupRenameParams {
  groupId: string;
}

const api_GroupRename: EndpointDescriptor<
  GroupRenameParams,        // path params
  UpdateGroupNameRequest,   // request body
  null,                     // success body (empty: 204 NoContent)
  ApiResponse               // error body
> = {
  method: 'PATCH',
  url: ({ groupId }) => `/groups/${encodeURIComponent(groupId)}`,
  /* graceful fallback if unexpected/malformed data is returned */
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while renaming group.'
    };
  }
};

export default api_GroupRename;
