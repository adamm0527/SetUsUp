import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type ForgotPasswordRequest } from "#root/lib/types";


/* Public endpoint: the BE looks up the user by email and emails them a /reset-password?token=... link.
   The reset token TTL is 1h */
const api_UserPasswordForgot: EndpointDescriptor<
  void,
  ForgotPasswordRequest,
  void,
  ApiResponse
> = {
  method: 'POST',
  url: () => '/user/forgot-password',
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while sending reset email.'
    };
  }
};

export default api_UserPasswordForgot;
