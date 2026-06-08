using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Outbound;

public sealed record ReadSongDetailDto
{
    [Required]
    public required Guid Id { get; init; }

    [Required]
    public required string Artist { get; init; }

    [Required]
    public required string Title { get; init; }

    [Required]
    public required TimeOnly Duration { get; init; }

    [Required]
    [Range(0,300)]
    public required decimal Bpm { get; init; }

    [Required]
    [Range(0, 300)]
    public required decimal BpmOut { get; init; }
    
    public string? InitKey { get; init; }

    [Required]
    public required bool CanEditUI { get; init; } // not used for actual validation, just for offering UI options

    public string? SpotifySongId { get; init; } // Optional SpotifySongId for cover/preview. Null means "not linked".

    [Required]
    public required List<string> TagIds { get; init; } // the full (sorted) list of Tag IDs currently assigned to this Song
}
