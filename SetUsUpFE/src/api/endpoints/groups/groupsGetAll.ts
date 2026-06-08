import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type GroupInfoList } from "#root/lib/types";


const api_GroupsGetAll: EndpointDescriptor<
  void,           // no path or query params
  void,           // request body (empty)
  GroupInfoList,  // success body
  ApiResponse     // error body
> = {
  method: 'GET',
  url: () => '/groups',
  /* graceful fallback if unexpected/malformed data is returned */
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while querying groups of user.'
    };
  }
};

export default api_GroupsGetAll;
