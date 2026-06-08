import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type UpdateUserPasswordRequest } from "#root/lib/types";


const api_UserPasswordPatch: EndpointDescriptor<
  void,
  UpdateUserPasswordRequest,
  void,
  ApiResponse
> = {
  method: 'PATCH',
  url: () => '/user/password',
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while updating password.'
    };
  }
};

export default api_UserPasswordPatch;
