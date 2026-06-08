using System.IdentityModel.Tokens.Jwt;

namespace SetUsUpBE.WebAPI.Middleware;

public class JwtRevocationMiddleware
{
    private readonly RequestDelegate next; // something to be done after the interception
    private readonly ITokenRevocationStore revokedStore;

    public JwtRevocationMiddleware(RequestDelegate next, ITokenRevocationStore revokedStore)
    {
        this.next = next;
        this.revokedStore = revokedStore;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        /* Interception of sent tokens.
           Two reasons a token is rejected here (both return 401):
             (a) its jti is in the in-memory revocation store (explicit logout / refresh-rotation /
                 SecurityStamp invalidation)
             (b) its iat (issued-at) predates the current backend process startup -- meaning the
                 token was issued by a previous instance of this BE and is now considered dead.
                 See BackendLifetime.cs for the rationale. */
        var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
        if (authHeader?.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) == true)
        {
            var token = authHeader["Bearer ".Length..];
            var handler = new JwtSecurityTokenHandler();
            try
            {
                var jwt = handler.ReadJwtToken(token);

                /* (a) jti revocation check */
                if (!string.IsNullOrEmpty(jwt.Id) && revokedStore.IsRevoked(jwt.Id))
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    await context.Response.WriteAsync("Token has been revoked.");
                    return;
                }

                /* (b) iat-vs-backend-startup check */
                var iatClaim = jwt.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Iat);
                if (iatClaim != null && long.TryParse(iatClaim.Value, out var iatUnix))
                {
                    var iat = DateTimeOffset.FromUnixTimeSeconds(iatUnix).UtcDateTime;
                    if (iat < BackendLifetime.StartedAt)
                    {
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        await context.Response.WriteAsync("Backend restarted; please log in again.");
                        return;
                    }
                }
            }
            catch
            {
                // Invalid token: let downstream handle
            }
        }

        await next(context);
    }
}
