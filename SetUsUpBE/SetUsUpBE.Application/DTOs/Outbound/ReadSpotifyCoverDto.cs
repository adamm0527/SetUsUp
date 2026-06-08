namespace SetUsUpBE.Application.DTOs.Outbound;

// Used be FE to render album cover arts for Spotify-linked Songs.
public sealed record ReadSpotifyCoverDto
{
    public required string SpotifySongId { get; init; }
    public string? CoverUrl { get; init; } // Spotify CDN url for smallest-sized thumbnail, or null when unavailable
    public bool WasUnlinked { get; init; } = false; // true means the SongSpotifyLink was removed during lookup -> FE should re-fetch
}
