import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type SongAccessList } from "#root/lib/types";


export interface SongAccessGetParams {
  songId: string;
}

// List of groups that currently have access to the song. Used by the Sharing block in SongDetailPanel.
const api_SongAccessGet: EndpointDescriptor<
  SongAccessGetParams,
  void,
  SongAccessList,
  ApiResponse
> = {
  method: 'GET',
  url: ({ songId }) => `/songs/${encodeURIComponent(songId)}/access`,
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while querying song access list.'
    };
  }
};

export default api_SongAccessGet;
