import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type SongDetail } from "#root/lib/types";


export interface SongGetParams {
  songId: string;
}

const api_SongGet: EndpointDescriptor<
  SongGetParams,
  void,
  SongDetail,
  ApiResponse
> = {
  method: 'GET',
  url: ({ songId }) => `/songs/${encodeURIComponent(songId)}`,
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while querying song details.'
    };
  }
};

export default api_SongGet;
