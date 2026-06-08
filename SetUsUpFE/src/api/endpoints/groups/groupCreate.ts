import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type CreateGroupRequest } from "#root/lib/types";


const api_GroupCreate: EndpointDescriptor<
  void,                // no path or query params
  CreateGroupRequest,  // request body
  ApiResponse,         // success body (201 Created with Response)
  ApiResponse          // error body
> = {
  method: 'POST',
  url: () => '/groups',
  /* graceful fallback if unexpected/malformed data is returned */
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while creating group.'
    };
  }
};

export default api_GroupCreate;
