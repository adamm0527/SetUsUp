import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type AcceptLegalRequest } from "#root/lib/types";


/* Records the user's acceptance of the current Privacy Notice + ToS version.
   Called by AcceptLegalGate when the user ticks the checkbox in the first-login/version-bump modal. */
const api_UserLegalAccept: EndpointDescriptor<
  void,
  AcceptLegalRequest,
  void,
  ApiResponse
> = {
  method: 'POST',
  url: () => '/user/legal/accept',
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Could not record your acceptance.'
    };
  }
};

export default api_UserLegalAccept;
