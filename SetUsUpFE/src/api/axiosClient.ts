import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios';
import { BASE_URL, AUTH_REFRESH_URL, AUTH_TOKEN_ERROR_STATUS,
   BACKEND_ROUTES_PUBLIC_AUTH, ROUTES_PUBLIC } from '#root/lib/constants';
import { type ApiResponse, type JwtResponse } from '#root/lib/types';
import { useAuthTokenStore } from '#root/clientdata/stores';
import { Router } from '#root/providers';


const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

/* automatic token attachment */
axiosInstance.interceptors.request.use((config) => {
  const { token } = useAuthTokenStore.getState();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


/* represents a completed jwt refresh (or the lack thereof),
   used for async completion signalling to avoid concurrent token refreshes */
let refreshPromise: Promise<void> | null = null;

/* graceful 401 handling + token refreshing (on-demand, not pre-emptively) */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (err: AxiosError & { config: AxiosRequestConfig }) => {
    const originalRequest = err.config as AxiosRequestConfigWithRetry;

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // mark this request as already retried to prevent loops

      /* check if public route */
      if ([...BACKEND_ROUTES_PUBLIC_AUTH.values()].includes(originalRequest.url!))
          return Promise.reject(err); // public routes giving 401 are not because invalid token (unresolvable user auth error)

      /* if a refresh is already running, wait for it */
      if (!refreshPromise) {
        refreshPromise = refreshToken().finally(() => {
          refreshPromise = null;
        });
      }

      try {
        await refreshPromise;
        // console.log("refreshing expired jwt token...");
        return axiosInstance(originalRequest); // retry original request with new token
      
      } catch (refreshErr) {
        useAuthTokenStore.getState().clearJwt(); // refresh failed: clear auth and propagate error
        Router.navigate({ to: ROUTES_PUBLIC.get('LOGIN') }); // rescuing user: they can re-log in
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(err); // re-throwing, so original caller (e.g. Tanstack Query) also gets it
  }
);

export default axiosInstance;


/* token refreshing implementation details follow... */

/* gets a newly issued token to the store from the API using the current token */
async function refreshToken(): Promise<void> {
  const { token, setAuth } = useAuthTokenStore.getState();
  if (!token)
    throw new Error('No token to refresh');

  try {
    /* call to the token refreshing endpoint */
    const res = await axios.post<JwtResponse>(
      `${BASE_URL}${AUTH_REFRESH_URL}`, {}, // empty body: sending it in header
      { headers: { Authorization: `Bearer ${token}` }}
    );
    
    /* if received, we persist it to localStorage */
    const { token: newToken, validTo } = res.data;
    if (newToken && newToken.trim() !== '' && validTo)
      setAuth(newToken, validTo);
    else
      throw new Error(`${AUTH_TOKEN_ERROR_STATUS}: Malformed refresh response.`);
    // console.log("refreshing jwt complited successfully!");
  
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const data = err.response?.data as ApiResponse | undefined;
      if (data?.message) {
        throw new Error(`${data.status}: ${data.message}`);
      }
    }
    throw err; // if not an axios error (e.g. more serious network error): throw-on downstream
  }
}

interface AxiosRequestConfigWithRetry extends AxiosRequestConfig {
  _retry?: boolean;
}
