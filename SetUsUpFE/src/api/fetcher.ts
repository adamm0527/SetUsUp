import { type AxiosRequestConfig } from 'axios';
import axiosInstance from './axiosClient.ts';
import { type EndpointDescriptor } from './endpoint.ts';
import { type ApiResponse } from '#root/lib/types';


export type ApiResult<SuccessBody, ErrorBody> =
  | { success: true; data: SuccessBody }
  | { success: false; status: number; errorBody: ErrorBody | ApiResponse }

export default async function callEndpoint<Params, Body, SuccessBody, ErrorBody = ApiResponse>(
  endpoint: EndpointDescriptor<Params, Body, SuccessBody, ErrorBody>,
  args?: {
    params?: Params;
    body?: Body;
    config?: AxiosRequestConfig;
  }
): Promise<ApiResult<SuccessBody, ErrorBody>> {
  const { params, body, config } = args ?? {};
  const url = endpoint.url(params as Params);

  try {
    const axiosConfig: AxiosRequestConfig = { ...config };
    const res = await axiosInstance.request({
      url,
      method: endpoint.method,
      data: body,
      ...axiosConfig,
    });

    let payload = res.data;
    /* normalize 204 No Content */
    if (res.status === 204 || payload === '') {
      payload = null;
    }

    /* custom success logic */
    if (endpoint.successChecker) {
      if (endpoint.successChecker(payload)) {
        return { success: true, data: payload as SuccessBody };
      } else {
        const err = endpoint.errorMapper?.(payload) ?? (payload as ErrorBody);
        return { success: false, status: res.status, errorBody: err };
      }
    }

    /* default: 2xx is success */
    if (res.status >= 200 && res.status < 300) {
      /* for NoContent endpoints `null` or `undefined` could be returned as Success */
      return { success: true, data: (payload as SuccessBody) };
    }

    return {
      success: false,
      status: res.status,
      errorBody: (payload as ErrorBody) ?? { status: 'UNKNOWN ERROR', message: 'Unknown error' }
    };
  } catch (err: any) {
    /* axios error normalization */
    if (err?.isAxiosError) {
      const axiosErr = err;
      const status = axiosErr.response?.status ?? 0;
      const payload = axiosErr.response?.data;
      const mapped = endpoint.errorMapper?.(payload) ?? (payload as ErrorBody | ApiResponse);
      return { success: false, status, errorBody: mapped ?? { status: 'UNKNOWN ERROR', message: axiosErr.message } };
    }

    return { success: false, status: 0, errorBody: { message: String(err) } as any };
  }
}
