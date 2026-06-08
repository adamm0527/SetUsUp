import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse } from "#root/lib/types";


export interface EmailConfirmChangeParams {
  token: string;
  email: string;
  userId: string;
}

/* Step 2 of the email-change flow.
   Triggered automatically by EmailChangeConfirmedPage on mount, reading the params from the landing URL. */
const api_UserEmailConfirmChange: EndpointDescriptor<
  EmailConfirmChangeParams,
  void,
  ApiResponse,
  ApiResponse
> = {
  method: 'POST',
  url: ({ token, email, userId }) =>
    `/user/confirm-email-change?token=${encodeURIComponent(token)}` +
    `&email=${encodeURIComponent(email)}` +
    `&userId=${encodeURIComponent(userId)}`,
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Confirmation link invalid or expired.'
    };
  }
};

export default api_UserEmailConfirmChange;
