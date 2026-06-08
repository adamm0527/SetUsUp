using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Outbound;

public sealed record ReadSongDto
{
    [Required]
    public required Guid Id { get; init; }

    [Required]
    public required string Artist { get; init; }

    [Required]
    public required string Title { get; init; }

    [Required]
    [Range(0, 300)]
    public required decimal Bpm { get; init; }

    [Required]
    [Range(0, 300)]
    public required decimal BpmOut { get; init; }

    public string? InitKey { get; init; }

    public string? SpotifySongId { get; init; } // used by Frontend to fetch cover/preview

    /* Tags assigned to this song. Always serialised (empty list if none). FE render them on SongCards.
       Sorted lexicographically by ID for stable rendering. */
    [Required]
    public required List<string> TagIds { get; init; }
}
