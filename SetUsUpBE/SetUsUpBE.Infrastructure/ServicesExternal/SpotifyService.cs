using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using SetUsUpBE.Application.DTOs.Outbound;
using SetUsUpBE.Application.ServiceInterfaces;
using SetUsUpBE.Infrastructure.Configuration;


namespace SetUsUpBE.Infrastructure.ServicesExternal;

/* Talks to the Spotify Web API using the App's Client Credentials.
    - Caches the App's access token in memory (Spotify tokens are valid for 1h (we refresh ~5 min before expiry).
    - On a 401 from a data call (unexpected token revocation), force-refreshes once and retries.
   (Registered as Scoped via IHttpClientFactory. the HttpClient injected here is the typed client
   tied to this service in DI (see DependencyInjection.AddSpotifyServices).) */
public class SpotifyService : ISpotifyService
{
    private const string Spotify_AccountsBase = "https://accounts.spotify.com";
    private const string Spotify_ApiBase = "https://api.spotify.com";
    private readonly HttpClient HTTP_Client;
    private readonly string Client_Id;
    private readonly string Client_Secret;
    private readonly string RapidApi_Key;
    private readonly string RapidApi_Host;

    /* Single-process token cache: all application users will be using the same token.
       Semaphore locking protects against multiple clients requesting a new token at the same time.
       (Only the first client will refresh the token, the rest will wait.) */
    private static readonly SemaphoreSlim Token_Lock = new(1, 1); 
    private static string? cachedToken;
    private static DateTimeOffset cachedTokenExpiry = DateTimeOffset.MinValue;


    public SpotifyService(HttpClient httpClient, IOptions<SpotifyConfiguration> options)
    {
        this.HTTP_Client = httpClient;
        var spotifyConfig = options.Value;
        this.Client_Id = spotifyConfig.ClientId;
        this.Client_Secret = spotifyConfig.ClientSecret;
        this.RapidApi_Key = spotifyConfig.RapidApiKey;
        this.RapidApi_Host = spotifyConfig.RapidApiHost;
    }
    
    public async Task<List<ReadSpotifySongDto>> SearchTracksAsync(string query, int limit = 10, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(query))
            return new List<ReadSpotifySongDto>();

        limit = Math.Clamp(limit, 1, 50); // Spotify's hard limit

        var encoded = Uri.EscapeDataString(query.Trim());
        var url = $"{Spotify_ApiBase}/v1/search?q={encoded}&type=track&limit={limit}";

        using var doc = await SendGetWithAutoRetryAsync_(url, ct);
        if (doc is null) return new List<ReadSpotifySongDto>();

        var tracksItems = doc.RootElement
            .GetProperty("tracks")
            .GetProperty("items");

        var results = new List<ReadSpotifySongDto>(limit);
        foreach (var t in tracksItems.EnumerateArray())
        {
            results.Add(MapTrack_(t, bpm: null, initKey: null));
        }
        return results;
    }

    public async Task<ReadSpotifySongDto?> LookupTrackAsync(string spotifyTrackId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(spotifyTrackId))
            return null;

        var id = spotifyTrackId.Trim();

        // Spotify track details (cover, artist, title, album, duration)
        var trackUrl = $"{Spotify_ApiBase}/v1/tracks/{Uri.EscapeDataString(id)}";
        using var trackDoc = await SendGetWithAutoRetryAsync_(trackUrl, ct);
        if (trackDoc is null) return null; // 404 from Spotify -> not linked

        // RapidAPI track-analysis augmentation (bpm + camelot key)
        // Best-effort: any failure leaves both fields null.
        (decimal? bpm, string? initKey) = await FetchTrackAnalysisAsync_(id, ct);

        return MapTrack_(trackDoc.RootElement, bpm, initKey);
    }

    public async Task<string?> LookupTrackCoverAsync(string spotifyTrackId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(spotifyTrackId))
            return null;
        
        var id = spotifyTrackId.Trim();
        var trackUrl = $"{Spotify_ApiBase}/v1/tracks/{Uri.EscapeDataString(id)}";
        using var trackDoc = await SendGetWithAutoRetryAsync_(trackUrl, ct, throwOnNonSuccess: false);
        if (trackDoc is null)
            return null; // 404 -> caller will auto-unlink

        return SmallestImageUrl_(trackDoc.RootElement);
    }


    /* Returns the SMALLEST `album.images[]` URL of a Spotify track element, or null when there are no images.
       Spotify orders images largest-first, so the last entry is the smallest. */
    private static string? SmallestImageUrl_(JsonElement track)
    {
        if (!track.TryGetProperty("album", out var album))
            return null;
        if (!album.TryGetProperty("images", out var images)
            || images.ValueKind != JsonValueKind.Array || images.GetArrayLength() == 0)
            return null;

        var last = images[images.GetArrayLength() - 1];
        if (!last.TryGetProperty("url", out var urlEl) || urlEl.ValueKind != JsonValueKind.String)
            return null;
        
        return urlEl.GetString();
    }


    /* GET helper that automatically attaches a fresh Bearer token.
       Retries once on 401 (in case the cached token was revoked), and parses the JSON response.
       Returns null on 404 (caller decides if treated as error or "not found"). */
    private async Task<JsonDocument?> SendGetWithAutoRetryAsync_(string url, CancellationToken ct, bool throwOnNonSuccess = true)
    {
        var token = await GetAppTokenAsync_(ct);
        var resp = await SendGetAsync_(url, token, ct);

        if (resp.StatusCode == HttpStatusCode.Unauthorized)
        {
            // force-refresh the token and retry once
            InvalidateCachedToken_();
            token = await GetAppTokenAsync_(ct);
            resp.Dispose();
            resp = await SendGetAsync_(url, token, ct);
        }

        if (resp.StatusCode == HttpStatusCode.NotFound)
        {
            resp.Dispose();
            return null;
        }

        if (!resp.IsSuccessStatusCode)
        {
            if (!throwOnNonSuccess)
            {
                resp.Dispose();
                return null;
            }
            var body = await resp.Content.ReadAsStringAsync(ct);
            resp.Dispose();
            throw new HttpRequestException(
                $"Spotify API call to {url} failed with status {(int)resp.StatusCode}: {body}");
        }

        var stream = await resp.Content.ReadAsStreamAsync(ct);
        return await JsonDocument.ParseAsync(stream, default, ct);
    }

    private async Task<HttpResponseMessage> SendGetAsync_(string url, string token, CancellationToken ct)
    {
        var req = new HttpRequestMessage(HttpMethod.Get, url);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return await HTTP_Client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);
    }

    /* Returns a valid Spotify app access token. Refreshes when within 5 minutes of expiry.
       Thread-safe: concurrent callers wait on the same in-progress refresh request. */
    private async Task<string> GetAppTokenAsync_(CancellationToken ct)
    {
        // fast path: returning cached (not near expiry)
        if (cachedToken is not null && DateTimeOffset.UtcNow + TimeSpan.FromMinutes(5) < cachedTokenExpiry)
            return cachedToken;

        // refresh token (within 5 mins of expiry)
        await Token_Lock.WaitAsync(ct); // SemaphoreSlim lock
        try
        {
            // defensive double-check after acquiring the lock
            if (cachedToken is not null && DateTimeOffset.UtcNow + TimeSpan.FromMinutes(5) < cachedTokenExpiry)
                return cachedToken;

            if (string.IsNullOrWhiteSpace(Client_Id) || string.IsNullOrWhiteSpace(Client_Secret))
                throw new InvalidOperationException("Spotify ClientId/ClientSecret are not configured!");

            using var req = new HttpRequestMessage(HttpMethod.Post, $"{Spotify_AccountsBase}/api/token");
            var basicAuth = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{Client_Id}:{Client_Secret}"));
            req.Headers.Authorization = new AuthenticationHeaderValue("Basic", basicAuth);
            req.Content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("grant_type", "client_credentials")
            });

            using var resp = await HTTP_Client.SendAsync(req, ct);
            if (!resp.IsSuccessStatusCode)
            {
                var body = await resp.Content.ReadAsStringAsync(ct);
                throw new HttpRequestException(
                    $"Spotify Client-Credentials token request failed with status {(int)resp.StatusCode}: {body}");
            }

            var stream = await resp.Content.ReadAsStreamAsync(ct);
            using var doc = await JsonDocument.ParseAsync(stream, default, ct);
            var accessToken = doc.RootElement.GetProperty("access_token").GetString();
            var expiresIn = doc.RootElement.GetProperty("expires_in").GetInt32();

            if (string.IsNullOrEmpty(accessToken))
                throw new HttpRequestException("Spotify returned an empty access_token.");

            cachedToken = accessToken;
            cachedTokenExpiry = DateTimeOffset.UtcNow + TimeSpan.FromSeconds(expiresIn);
            return accessToken;
        }
        finally
        {
            Token_Lock.Release();
        }
    }

    private static void InvalidateCachedToken_()
    {
        cachedToken = null;
        cachedTokenExpiry = DateTimeOffset.MinValue;
    }

    /* Maps Spotify key notation to Domain. ((chromaticKey 0-11, mode 0/1) pair to a Camelot wheel string like "05A" or "12B".)
       Returns null if key is -1 (Spotify "undetermined") or out of range. */
    private static string? ChromaticToCamelot_(int key, int mode)
    {
        if (key < 0 || key > 11) return null;
        if (mode != 0 && mode != 1) return null;

        /* Standard Camelot wheel mapping
           Index = chromatic key (0=C, 1=C#/Db, ..., 11=B). Value = Camelot number 1..12
           Minor (mode=0) uses suffix 'A', Major (mode=1) uses 'B'. */
        int[] minorMap = { 5, 12, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10 };
        int[] majorMap = { 8, 3, 10, 5, 12, 7, 2, 9, 4, 11, 6, 1 };

        int nr; char lt;
        if (mode == 0)
        {
            nr = minorMap[key];
            lt = 'A';
        }
        else
        {
            nr = majorMap[key];
            lt = 'B';
        }
        
        return $"{nr:D2}{lt}";
    }

    /* Normalizes camelot strings like "8B" -> "08B" so they match the Domain's "DDL" / "0DL" rule.
       Returns null on anything that doesn't parse cleanly. */
    private static string? NormalizeCamelot_(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        raw = raw.Trim().ToUpperInvariant();
        if (raw.Length < 2 || raw.Length > 3) return null;

        char suffix = raw[^1];
        if (suffix != 'A' && suffix != 'B') return null;

        var numPart = raw[..^1];
        if (!int.TryParse(numPart, out var n)) return null;
        if (n < 1 || n > 12) return null;

        return $"{n:D2}{suffix}";  // -> "01A" .. "12B"
    }

    /* Builds a ReadSpotifySongDto from a Spotify track JSON element.
       Handles multi-artist tracks by joining artist names with ", ". */
    private static ReadSpotifySongDto MapTrack_(JsonElement track, decimal? bpm, string? initKey)
    {
        var artistsJoined = string.Join(", ",
            track.GetProperty("artists").EnumerateArray()
                .Select(a => a.GetProperty("name").GetString())
                .Where(n => !string.IsNullOrEmpty(n)));

        string? coverUrl = null;
        var images = track.GetProperty("album").GetProperty("images");
        if (images.ValueKind == JsonValueKind.Array && images.GetArrayLength() > 0)
        {
            // Spotify returns images largest-first. We pick the largest.
            coverUrl = images[0].GetProperty("url").GetString();
        }

        return new ReadSpotifySongDto
        {
            Id = track.GetProperty("id").GetString() ?? string.Empty,
            Artist = string.IsNullOrEmpty(artistsJoined) ? "(unknown)" : artistsJoined,
            Title = track.GetProperty("name").GetString() ?? string.Empty,
            Album = track.GetProperty("album").GetProperty("name").GetString() ?? string.Empty,
            DurationMs = track.GetProperty("duration_ms").GetInt32(),
            CoverUrl = coverUrl,
            Bpm = bpm,
            InitKey = initKey
        };
    }


    /* Hits the RapidAPI track-analysis endpoint for the given Spotify track ID.
       Returns (null, null) on any failure. No exceptions escape this method. */
    private async Task<(decimal? Bpm, string? InitKey)> FetchTrackAnalysisAsync_(string spotifyTrackId, CancellationToken ct)
    {
        // soft-fail if not configured (e.g. local dev without a RapidAPI key)
        if (string.IsNullOrWhiteSpace(RapidApi_Key) || string.IsNullOrWhiteSpace(RapidApi_Host))
            return (null, null);

        var url = $"https://{RapidApi_Host}/pktx/spotify/{Uri.EscapeDataString(spotifyTrackId)}";

        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Get, url);
            req.Headers.Add("X-RapidAPI-Key", RapidApi_Key);
            req.Headers.Add("X-RapidAPI-Host", RapidApi_Host);

            using var resp = await HTTP_Client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);
            if (!resp.IsSuccessStatusCode)
                return (null, null); // 404, 429 (rate-limited), 5xx, etc. all degrade silently

            using var stream = await resp.Content.ReadAsStreamAsync(ct);
            using var doc = await JsonDocument.ParseAsync(stream, default, ct);

            // tempo: usually a number, but defensively allow string form too
            decimal? bpm = null;
            if (doc.RootElement.TryGetProperty("tempo", out var tempoEl))
            {
                switch (tempoEl.ValueKind)
                {
                    case JsonValueKind.Number:
                        if (tempoEl.TryGetDecimal(out var d) && d > 0)
                            bpm = Math.Round(d, 2);
                        break;
                    case JsonValueKind.String:
                        if (decimal.TryParse(tempoEl.GetString(),
                                System.Globalization.NumberStyles.Float,
                                System.Globalization.CultureInfo.InvariantCulture,
                                out var parsed) && parsed > 0)
                            bpm = Math.Round(parsed, 2);
                        break;
                }
            }

            // Camelot already in display form (e.g. "8B"); normalize to "DDL" to conform Domain rule
            string? initKey = null;
            if (doc.RootElement.TryGetProperty("camelot", out var camEl) && camEl.ValueKind == JsonValueKind.String)
                initKey = NormalizeCamelot_(camEl.GetString());

            return (bpm, initKey);
        }
        catch
        {
            // any transport/parse/cancellation issue -> degrade gracefully
            return (null, null);
        }
    }
}
