import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse } from "#root/lib/types";


export interface SongDeleteParams {
  songId: string;
}

const api_SongDelete: EndpointDescriptor<
  SongDeleteParams,
  void,
  null, // 204 NoContent on success
  ApiResponse
> = {
  method: 'DELETE',
  url: ({ songId }) => `/songs/${encodeURIComponent(songId)}`,
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while deleting song.'
    };
  }
};

export default api_SongDelete;
