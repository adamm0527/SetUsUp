import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse } from "#root/lib/types";


export interface SongShareParams {
  songId: string;
  groupId: string;
}

// Grants the target group access to this song.
const api_SongShare: EndpointDescriptor<
  SongShareParams,
  void,
  ApiResponse, // 201 Created + Response
  ApiResponse
> = {
  method: 'POST',
  url: ({ songId, groupId }) =>
    `/songs/${encodeURIComponent(songId)}/access/${encodeURIComponent(groupId)}`,
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while sharing song.'
    };
  }
};

export default api_SongShare;
