import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type TagCategoryList } from "#root/lib/types";


// Gets the full hierarchy: 11 categories x ~55 groups x ~590 tags.
// Fetched once per session, cached with TanStack Query's staleTime=Infinity.
const api_TagsGetAll: EndpointDescriptor<
  void,
  void,
  TagCategoryList,
  ApiResponse
> = {
  method: 'GET',
  url: () => '/tags',
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while querying tag hierarchy.'
    };
  }
};

export default api_TagsGetAll;
