import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse } from "#root/lib/types";


const api_UserLogout: EndpointDescriptor<
  void,           // no path or query params
  void,           // request body (empty)
  null,           // success body (empty: returns 204_NoContent)
  ApiResponse     // error body (in case 400_BadRequest)
> = {
  method: 'POST',
  url: () => '/user/logout',
  /* graceful fallback if unexpected/malformed data is returned */
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while logging out.'
    };
  }
};

export default api_UserLogout;
