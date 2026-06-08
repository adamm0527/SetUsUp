import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse } from "#root/lib/types";


/* Self-service account deletion (also cascade deletes all user created content).
   The FE is responsible for clearing localStorage + redirecting to /login after a 204. */
const api_UserDelete: EndpointDescriptor<
  void,
  void,
  void,
  ApiResponse
> = {
  method: 'DELETE',
  url: () => '/user',
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Failed to delete your account.'
    };
  }
};

export default api_UserDelete;
