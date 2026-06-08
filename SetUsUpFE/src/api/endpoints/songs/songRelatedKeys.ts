import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type SongRelatedKeys } from "#root/lib/types";


export interface SongRelatedKeysParams {
  songId: string;
}

// 204 NoContent when the song has no key set on the BE --> caller renders the section empty.
const api_SongRelatedKeys: EndpointDescriptor<
  SongRelatedKeysParams,
  void,
  SongRelatedKeys | null,
  ApiResponse
> = {
  method: 'GET',
  url: ({ songId }) => `/songs/${encodeURIComponent(songId)}/keys`,
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while querying related keys.'
    };
  }
};

export default api_SongRelatedKeys;
