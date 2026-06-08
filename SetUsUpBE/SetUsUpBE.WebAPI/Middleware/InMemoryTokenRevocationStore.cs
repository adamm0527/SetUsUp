using System.Collections.Concurrent;

namespace SetUsUpBE.WebAPI.Middleware;

public interface ITokenRevocationStore
{
    void Revoke(string jti, DateTime validTo);
    bool IsRevoked(string jti);
    void CleanUp();
}

public class InMemoryTokenRevocationStore : ITokenRevocationStore
{
    // Collects the revoked jwt-s (identified by their jti-s) until their eventual expiration
    private readonly ConcurrentDictionary<string, DateTime> revoked = new();
    
    // Revokes a jwt (identified by its jti) = puts it into the revoked store
    public void Revoke(string jti, DateTime validTo)
    {
        revoked[jti] = validTo;
    }
    
    // Whether the jwt (identified by it's jti) has been already revoked (can be found in the revoked store)
    public bool IsRevoked(string jti)
    {
        CleanUp();
        return revoked.ContainsKey(jti);
    }
    
    // This should be called periodically to remove the already expired jwt-s, so that the store doesn't grow indefinitely
    public void CleanUp()
    {
        var now = DateTime.UtcNow;
        foreach (var pair in revoked)
        {
            // Removing every expired pair
            if (pair.Value < now)
                revoked.TryRemove(pair.Key, out _);
        }
    }
}
