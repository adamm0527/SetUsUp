import { type EndpointDescriptor } from '../../endpoint.ts';
import { type ApiResponse, type UserProfile } from "#root/lib/types";


// Returns the logged-in user's own profile data.
const api_UserProfileGet: EndpointDescriptor<
  void,
  void,
  UserProfile,
  ApiResponse
> = {
  method: 'GET',
  url: () => '/user/profile',
  errorMapper: (err: unknown): ApiResponse => {
    const e = err as Partial<ApiResponse>;
    return {
      status: e?.status ?? 'ERROR',
      message: e?.message ?? 'Unexpected error while loading user profile.'
    };
  }
};

export default api_UserProfileGet;
