import { useMemo } from 'react';
import { useQuery, useMutation, type QueryKey,
  type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import { type EndpointDescriptor } from './endpoint.ts';
import callEndpoint, { type ApiResult } from './fetcher.ts';


/* constructs with all the usual query options except queryKey and queryFn (caller provided) */
type EndpointQueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, QueryKey>,
  'queryKey' | 'queryFn'
>;

/* hook for query endpoints (GET), but what matters: doesn't modifies the DB */
export function useEndpointQuery<Params, Body, SuccessBody, ErrorBody = any>(
  key: QueryKey,
  endpoint: EndpointDescriptor<Params, Body, SuccessBody, ErrorBody>,
  params?: Params,
  options?: EndpointQueryOptions<ApiResult<SuccessBody, ErrorBody>>
) {
  return useQuery<ApiResult<SuccessBody, ErrorBody>>({
    queryKey: key,
    queryFn: async () => callEndpoint(endpoint, { params }),
    ...options
  });
}

/* hook for mutation endpoints (POST/PATCH/DELETE): they DO modify the DB */
export function useEndpointMutation<Params, Body, SuccessBody, ErrorBody = any>(
  endpoint: EndpointDescriptor<Params, Body, SuccessBody, ErrorBody>,
  options?: UseMutationOptions<ApiResult<SuccessBody, ErrorBody>, unknown, {params?: Params; body?: Body}>
) {
  return useMutation<ApiResult<SuccessBody, ErrorBody>, unknown, {params?: Params; body?: Body}>({
    mutationFn: async ({ params, body }) => callEndpoint(endpoint, { params, body }),
    ...options
  });
}

/* custom hook for extracting the error message from an ApiResponse */
export function useApiErrorMessage(mutation: { data: any }, duringMsg: string) {
  const apiError = useMemo(() => {
    return getApiErrorMessage(mutation.data, duringMsg);
  }, [mutation.data]); // duringMsg only changes when mutation.data also does

  return apiError;
}

function getApiErrorMessage(errorBody: any, duringMsg: string): string {
  if (!errorBody) {
    if (duringMsg)
      return `An unknown error occurred during ${duringMsg}.`;
    else
      return 'An unknown error occurred.';
  }

  if (typeof errorBody === "string")
    return errorBody;

  if (typeof errorBody === "object") {
    if ('message' in errorBody)
      return errorBody.message as string;
    else if ('errorBody' in errorBody && 'message' in errorBody.errorBody)
      return errorBody.errorBody.message as string;
   }

   // if no there's no other choice to show "human-readable" error message
   return JSON.stringify(errorBody);
}
