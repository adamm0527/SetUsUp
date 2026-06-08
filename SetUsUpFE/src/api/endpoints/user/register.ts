import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type RegisterUserRequest } from "#root/lib/types";


const api_UserRegister: EndpointDescriptor<
  void,                 // no path or query params
  RegisterUserRequest,  // request body
  ApiResponse,          // success body
  ApiResponse           // error body
> = {
  method: 'POST',
  url: () => '/user/register',
  /* graceful fallback if unexpected/malformed data is returned */
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected registration error.'
    };
  }
};

export default api_UserRegister;
