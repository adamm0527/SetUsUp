import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse } from "#root/lib/types";


// For the MusicLibrary bulk-add we send StartTime=0 and EndTime=full song duration as defaults.
export interface CreatePlaylistEntryRequest {
  songId: string;
  startTime: string; // "hh:mm:ss"
  endTime: string; // "hh:mm:ss"
  comment?: string | null;
  hexColour?: string | null; // 6-digit hex without '#'
  insertionIndex?: number | null; // null/undefined -> append to end
}


const api_PlaylistEntryCreate: EndpointDescriptor<
  void,
  CreatePlaylistEntryRequest,
  ApiResponse,
  ApiResponse
> = {
  method: 'POST',
  url: () => '/playlists/entries',
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while adding a playlist entry.'
    };
  }
};

export default api_PlaylistEntryCreate;
