import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type GroupDetail } from "#root/lib/types";


export interface GroupGetParams {
  groupId: string;
}

const api_GroupGet: EndpointDescriptor<
  GroupGetParams, // path param: id of the group to fetch
  void,           // request body (empty)
  GroupDetail,    // success body
  ApiResponse     // error body
> = {
  method: 'GET',
  url: ({ groupId }) => `/groups/${encodeURIComponent(groupId)}`,
  /* graceful fallback if unexpected/malformed data is returned */
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while querying group details.'
    };
  }
};

export default api_GroupGet;
