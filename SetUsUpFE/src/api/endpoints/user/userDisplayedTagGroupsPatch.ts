import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type UpdateUserDisplayedTagGroupsRequest } from "#root/lib/types";


/* Replaces the user's ordered preference of TagGroup IDs (max 5) to render as chips on SongCards.
   Empty list = clear (the FE then defaults to its default preference set). */
const api_UserDisplayedTagGroupsPatch: EndpointDescriptor<
  void,
  UpdateUserDisplayedTagGroupsRequest,
  void,
  ApiResponse
> = {
  method: 'PATCH',
  url: () => '/user/displayed-tag-groups',
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Failed to update your displayed tag groups.'
    };
  }
};

export default api_UserDisplayedTagGroupsPatch;
