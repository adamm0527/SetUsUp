using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Outbound;

public sealed record ReadSongRelatedKeysDto
{
    [Required]
    public required string ExactMatch { get; init; }

    [Required]
    public required string Boost { get; init; }

    [Required]
    public required string Drop { get; init; }

    [Required]
    public required string Diagonal { get; init; }

    [Required]
    public required bool IsDiagonalDown { get; init; }

    [Required]
    public required string DiagonalAtonal { get; init; }

    [Required]
    public required string Scale { get; init; }

    [Required]
    public required string EnergyBoostBig { get; init; }

    [Required]
    public required string EnergyDropBig { get; init; }

    [Required]
    public required string EnergyBoost { get; init; }

    [Required]
    public required string EnergyDrop { get; init; }

    [Required]
    public required string PayAttentionMinus { get; init; }

    [Required]
    public required string PayAttentionPlus { get; init; }

    [Required]
    public required string MoodShift { get; init; }

    [Required]
    public required bool IsMoodShiftMajorDown { get; init; }

    [Required]
    public required string FlatFourUp { get; init; }

    [Required]
    public required string FlatFourScale { get; init; }

    [Required]
    public required bool IsFlatFourMinorDown { get; init; }

    [Required]
    public required string HarmonicFlip { get; init; }

    [Required]
    public required List<string> PerfectMatches { get; init; }

    [Required]
    public required List<string> SimilarMatches { get; init; }

    [Required]
    public required List<string> AllMatches { get; init; }
}
