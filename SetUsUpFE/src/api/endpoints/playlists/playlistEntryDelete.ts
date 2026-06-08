import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse } from "#root/lib/types";


export interface PlaylistEntryDeleteParams {
  entryId: string;
}

const api_PlaylistEntryDelete: EndpointDescriptor<
  PlaylistEntryDeleteParams,
  void,
  void,
  ApiResponse
> = {
  method: 'DELETE',
  url: ({ entryId }) => `/playlists/entries/${encodeURIComponent(entryId)}`,
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while deleting playlist entry.'
    };
  }
};

export default api_PlaylistEntryDelete;
