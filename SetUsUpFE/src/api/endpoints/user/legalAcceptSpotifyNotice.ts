import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type AcceptLegalRequest } from "#root/lib/types";


/* Records the user's acceptance of the current Spotify notice version.
   Called by SpotifyLinkSearch's first-time modal. */
const api_UserLegalAcceptSpotifyNotice: EndpointDescriptor<
  void,
  AcceptLegalRequest,
  void,
  ApiResponse
> = {
  method: 'POST',
  url: () => '/user/legal/accept-spotify-notice',
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Could not record your acceptance.'
    };
  }
};

export default api_UserLegalAcceptSpotifyNotice;
