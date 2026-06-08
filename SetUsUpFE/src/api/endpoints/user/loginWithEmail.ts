import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type JwtResponse, type LoginEmailRequest } from "#root/lib/types";
import { BACKEND_ROUTES_PUBLIC_AUTH } from '#root/lib/constants.ts';


const api_UserLoginWithEmail: EndpointDescriptor<
  void,                 // no path or query params
  LoginEmailRequest,    // request body
  JwtResponse,          // success body
  ApiResponse           // error body
> = {
  method: 'POST',
  url: () => BACKEND_ROUTES_PUBLIC_AUTH.get('LOGIN_W_EMAIL')!,
  /* graceful fallback if unexpected/malformed data is returned */
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while logging in with email address.'
    };
  }
};

export default api_UserLoginWithEmail;
