import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type UserDataExport } from "#root/lib/types";


/* GDPR Art. 15 / Art. 20 export bundle.
   The BE rate-limits to one successful call per 24h per user. */
const api_UserDataExport: EndpointDescriptor<
  void,
  void,
  UserDataExport,
  ApiResponse
> = {
  method: 'GET',
  url: () => '/user/legal/data-export',
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Could not export your data.'
    };
  }
};

export default api_UserDataExport;
