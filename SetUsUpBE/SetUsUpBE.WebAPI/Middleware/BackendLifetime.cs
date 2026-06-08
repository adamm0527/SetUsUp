namespace SetUsUpBE.WebAPI.Middleware;

/* Static record of when the current backend process started.
   JwtRevocationMiddleware uses it to reject any JWT whose `iat` (issued-at) claim predates this timestamp
   (tokens issued before the current process started are dead).

   Rationale: the InMemoryTokenRevocationStore loses its entries on restart
   (intentional: it's a cache of "revoked but not yet naturally expired" jti's).
   Without this cutoff, a pre-restart-revoked-but-pre-expiry token would become silently valid again after restart.
   The cutoff bumps the entire revoked-token set to "rejected" instantly,
   (at the price of forcing every user to re-log in after every BE restart - but this is also defensively good). */
public static class BackendLifetime
{
    public static readonly DateTime StartedAt = DateTime.UtcNow;
}
