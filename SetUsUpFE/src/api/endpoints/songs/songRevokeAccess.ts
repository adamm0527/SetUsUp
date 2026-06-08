import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse } from "#root/lib/types";


export interface SongRevokeAccessParams {
  songId: string;
  groupId: string;
}

// Revokes the target group's access to this song.
// The BE forbids revoking the creator's own group access (returns 403).
const api_SongRevokeAccess: EndpointDescriptor<
  SongRevokeAccessParams,
  void,
  null, // 204 NoContent on success
  ApiResponse
> = {
  method: 'DELETE',
  url: ({ songId, groupId }) =>
    `/songs/${encodeURIComponent(songId)}/access/${encodeURIComponent(groupId)}`,
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while revoking song access.'
    };
  }
};

export default api_SongRevokeAccess;
