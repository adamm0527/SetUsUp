using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Outbound;

public sealed record ReadPlaylistEntryDetailDto
{
    [Required]
    public required Guid Id { get; init; }

    [Required]
    public required uint Nr { get; init; }

    public string? TransitionToNext { get; init; }

    [Required]
    public required TimeOnly Start { get; init; }

    [Required]
    public required TimeOnly End { get; init; }

    [Required]
    public required string Duration { get; init; }

    public string? HexColour { get; init; }

    public string? Comment { get; init; }

    [Required]
    [MinLength(3)]
    [MaxLength(30)]
    public required string CreatorUserName { get; init; }

    [Required]
    public required bool CanEditUI { get; init; }

    [Required]
    public required bool CanDeleteUI { get; init; }

    /* When true, the entry shares the previous entry's Nr slot (rendered as "w/" in the FE).
       Always false for the first entry of a playlist (domain invariant). */
    [Required]
    public required bool WithPrev { get; init; }

    // Signed BPM delta applied on top of the source song's BPM.
    [Required]
    public required decimal BpmChange { get; init; }

    public decimal? AverageRating { get; init; }

    [Required]
    public required int TotalRaters { get; init; }

    // The calling user's own rating for this entry (null if not rated)
    public int? MyRating { get; init; }

    [Required]
    public required ReadSongDetailDto Song { get; init; }
}
