using SetUsUpBE.Application.DTOs.Outbound;

namespace SetUsUpBE.Application.ServiceInterfaces;

// Thin interface for read-only Spotify Web API calls done with the App's Client Credentials access token.
public interface ISpotifyService
{
    /* Searches Spotify for tracks matching the query. Returns up to "limit" results.
       Results don't include audio features (bpm/initKey), those are fetched per-track via LookupTrackAsync. */
    Task<List<ReadSpotifySongDto>> SearchTracksAsync(string query, int limit = 10, CancellationToken ct = default);

    /* Fetches full metadata + audio features for a single Spotify track.
       Returns null if the track ID isn't found by Spotify. Throws HttpRequestException for upstream/network failures. */
    Task<ReadSpotifySongDto?> LookupTrackAsync(string spotifyTrackId, CancellationToken ct = default);

    /* Single-track lookup that ONLY returns the smallest available cover image URL.
       Returns null when Spotify reports 404 or the track has no images. */
    Task<string?> LookupTrackCoverAsync(string spotifyTrackId, CancellationToken ct = default);
}
