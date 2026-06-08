import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type ResetPasswordRequest } from "#root/lib/types";


// Consumed by ResetPasswordPage after the user clicks the link in the forgot-password email.
const api_UserPasswordReset: EndpointDescriptor<
  void,
  ResetPasswordRequest,
  void,
  ApiResponse
> = {
  method: 'POST',
  url: () => '/user/reset-password',
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Reset link invalid or expired.'
    };
  }
};

export default api_UserPasswordReset;
