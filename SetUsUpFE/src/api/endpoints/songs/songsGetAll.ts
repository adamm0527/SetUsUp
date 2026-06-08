import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type SongDetailList } from "#root/lib/types";


const api_SongsGetAll: EndpointDescriptor<
  void,             // no path or query params (based on user's selected group)
  void,             // no request body
  SongDetailList,   // success body
  ApiResponse       // error body
> = {
  method: 'GET',
  url: () => '/songs',
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while querying songs.'
    };
  }
};

export default api_SongsGetAll;
