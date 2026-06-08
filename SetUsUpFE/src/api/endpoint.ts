/* each endpoints should be defined according to EndpointDescriptor */
import { type ApiResponse } from '#root/lib/types';


export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export type NoContent = null | void; // Status 204

export type SuccessChecker<T> = (resp: unknown) => resp is T;

export interface EndpointDescriptor<
  Params = void,          // query/path params
  _Body = void,           // request body
  Success = unknown,      // expected success type
  ErrorBody = ApiResponse // common error shape
> {
  method: HttpMethod;
  url: (params: Params) => string; // function to build path, helps with path params
  successChecker?: SuccessChecker<Success> // provide if "success" condition differs from HTTP2xx/NoContent
  errorMapper?: (err: unknown) => ErrorBody; // optional mapper to normalize error response
}
