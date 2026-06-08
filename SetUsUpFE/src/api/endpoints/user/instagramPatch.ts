import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type UpdateUserInstagramRequest } from "#root/lib/types";


const api_UserInstagramPatch: EndpointDescriptor<
  void,
  UpdateUserInstagramRequest,
  void,
  ApiResponse
> = {
  method: 'PATCH',
  url: () => '/user/instagram',
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while updating Instagram handle.'
    };
  }
};

export default api_UserInstagramPatch;
