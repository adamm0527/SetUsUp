using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Outbound;

public sealed record ReadSpotifySongDto
{
    [Required]
    public required string Id { get; init; } // Spotify track ID, e.g. "11dFghVXANMlKmJXsNCbNl"

    [Required]
    public required string Artist { get; init; } // joined artist names if multiple

    [Required]
    public required string Title { get; init; }

    [Required]
    public required string Album { get; init; }

    [Required]
    public required int DurationMs { get; init; }  // raw duration in milliseconds (FE formats it)

    public string? CoverUrl { get; init; } // largest album-art URL from Spotify's CDN

    // The rest filled only by LookupTrackAsync (the per-track audio features call).

    public decimal? Bpm { get; init; }
    public string? InitKey { get; init; } // Camelot string, e.g. "05A" (D minor)
}
