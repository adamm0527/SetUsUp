using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Outbound;

// Returns the aggregate ratings for a PlaylistEntry plus the calling user's own current rating.
public sealed record ReadPlaylistEntryRatingDto
{
    // Null when TotalRaters == 0. Otherwise the arithmetic mean (decimal with 2 fractional)
    public decimal? AverageRating { get; init; }

    [Required]
    public required int TotalRaters { get; init; }

    // The calling user's own rating, or null if they have not rated this entry yet.
    public int? MyRating { get; init; }
}
