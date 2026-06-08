import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse } from "#root/lib/types";


export interface GroupDeleteParams {
  groupId: string;
}

const api_GroupDelete: EndpointDescriptor<
  GroupDeleteParams,    // path params
  void,                 // no request body
  null,                 // success body (empty: 204 NoContent)
  ApiResponse           // error body
> = {
  method: 'DELETE',
  url: ({ groupId }) => `/groups/${encodeURIComponent(groupId)}`,
  /* graceful fallback if unexpected/malformed data is returned */
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while deleting group.'
    };
  }
};

export default api_GroupDelete;
