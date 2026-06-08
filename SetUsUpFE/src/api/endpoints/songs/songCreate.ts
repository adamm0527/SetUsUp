import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type CreateSongRequest } from "#root/lib/types";


const api_SongCreate: EndpointDescriptor<
  void,
  CreateSongRequest,
  ApiResponse, // BE returns 201 + Response
  ApiResponse
> = {
  method: 'POST',
  url: () => '/songs',
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while creating song.'
    };
  }
};

export default api_SongCreate;
