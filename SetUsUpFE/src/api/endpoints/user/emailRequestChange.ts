import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type UpdateUserEmailRequest } from "#root/lib/types";


/* Step 1 of the email-change flow. Submits the new address; the BE generates a one-time token and emails it to the new address.
   The user's current email is NOT changed yet... 
   Only step 2 (POST /user/confirm-email-change) applies it when the user clicks the link in the email. */
const api_UserEmailRequestChange: EndpointDescriptor<
  void,
  UpdateUserEmailRequest,
  void,
  ApiResponse
> = {
  method: 'PATCH',
  url: () => '/user/email',
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while requesting email change.'
    };
  }
};

export default api_UserEmailRequestChange;
