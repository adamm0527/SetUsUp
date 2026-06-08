import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type NamedEntity } from '#root/lib/types';


const api_UserSelectedGroupGet: EndpointDescriptor<
  void,           // no path or query params
  void,           // request body (empty)
  NamedEntity,    // success body
  ApiResponse     // error body
> = {
  method: 'GET',
  url: () => '/user/selected-group',
  /* graceful fallback if unexpected/malformed data is returned */
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while querying selected group of the user.'
    };
  }
};

export default api_UserSelectedGroupGet;
