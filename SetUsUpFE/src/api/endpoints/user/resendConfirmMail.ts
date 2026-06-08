import { type EndpointDescriptor, type NoContent } from '../../endpoint.ts';
import { type ApiResponse } from '#root/lib/types';


const api_UserResendConfirmMail: EndpointDescriptor<
  void,                      // no path or query params
  string,                    // request body (email as plain string)
  NoContent,                 // success body
  ApiResponse                // error body
> = {
  method: 'POST',
  url: () => '/user/resend-confirm-email',
  /* graceful fallback if unexpected/malformed data is returned */
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected confirm email resending error.'
    };
  }
};

export default api_UserResendConfirmMail;
