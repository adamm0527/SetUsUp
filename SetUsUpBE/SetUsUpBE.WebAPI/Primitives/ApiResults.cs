using SetUsUpBE.Domain.Primitives;
using Microsoft.AspNetCore.Http.HttpResults;

namespace SetUsUpBE.WebAPI.Primitives;

public static class ApiResults
{
    // success 200, OK: for successful Read, Update, Delete operations
    public static Ok<TData> Ok_200<TData>(TData data)
        => TypedResults.Ok(data);


    // success 201, Created: for successful Create operations
    public static Created<Response> Created_201(string location, Response response)
        => TypedResults.Created(location, response);


    // success 204, No Content: when there is nothing to return
    public static NoContent NoContent_204()
        => TypedResults.NoContent();


    public static RedirectHttpResult Redirect_308(string url)
        => TypedResults.Redirect(url, true);


    // error 400, BadRequest: used for invalid syntax or nonsensical actions
    public static BadRequest<Response> BadRequest_400(Error error)
        => TypedResults.BadRequest(new Response(error));


    // error 401, Unauthorized: used for unsuccessful login or actions performed without being logged in
    public static JsonHttpResult<Response> Unauthorized_401(Error error)
        => TypedResults.Json(
                data: new Response(error),
                statusCode: StatusCodes.Status401Unauthorized
           );


    // error 403, Forbidden: used when not being authorized to perform an action, despite being logged in
    public static JsonHttpResult<Response> Forbidden_403(Error error)
        => TypedResults.Json(
                data: new Response(error),
                statusCode: StatusCodes.Status403Forbidden
            );


    // error 404, Not Found: when the asked resource could not be found
    public static NotFound<Response> NotFound_404(Error error)
        => TypedResults.NotFound(new Response(error));


    // error 422, Unprocessable Entity: when the request is syntactically correct, but cannot be performed due to semantic reasons
    public static UnprocessableEntity<Response> UnprocessableEntity_422(Error error)
        => TypedResults.UnprocessableEntity(new Response(error));

    // error 423, Locked: when too many (5+) login request were performed (in the last 15 mins)
    public static JsonHttpResult<Response> Locked_423(Error error)
        => TypedResults.Json(
                data: new Response(error),
                statusCode: StatusCodes.Status423Locked
            );

    // error 429, Too Many Requests: when request fails because user hit our imposed rate limits
    public static JsonHttpResult<Response> TooManyRequests_429(Error error)
        => TypedResults.Json(
                data: new Response(error),
                statusCode: StatusCodes.Status429TooManyRequests
            );

    // error 500, Internal Server Error: when the server (or its dependencies) are at fault
    public static JsonHttpResult<Response> InternalServerError_500(Error error)
        => TypedResults.Json(
                data: new Response(error),
                statusCode: StatusCodes.Status500InternalServerError
           );
}
