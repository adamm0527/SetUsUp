using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Outbound;

public sealed record ReadPlaylistEntryDto
{
    [Required]
    public required Guid Id { get; init; }

    [Required]
    public required uint Nr { get; init; }

    public string? TransitionToNext { get; init; }

    [Required]
    public required string Duration { get; init; }

    public string? HexColour { get; init; }

    [Required]
    [MinLength(3)]
    [MaxLength(30)]
    public required string CreatorUserName { get; init; }

    /* When true, the entry shares the previous entry's Nr slot (rendered as "w/" in the FE).
       Always false for the first entry of a playlist (domain invariant). */
    [Required]
    public required bool WithPrev { get; init; }

    public decimal? AverageRating { get; init; }

    [Required]
    public required int TotalRaters { get; init; }

    [Required]
    public required ReadSongDto Song { get; init; }
}
