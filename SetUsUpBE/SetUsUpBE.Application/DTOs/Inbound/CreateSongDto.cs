using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Inbound;

public sealed record CreateSongDto
{
    [Required]
    public required string Artist { get; init; }

    [Required]
    public required string Title { get; init; }

    [Required]
    public required string Duration { get; init; }

    [Required]
    [Range(0, 300)]
    public required decimal Bpm { get; init; }

    [Range(0, 300)]
    public decimal? BpmOut { get; init; }
    
    public string? InitKey { get; init; }

    public string? SpotifySongId { get; init; } // when non-null and non-empty, a SongSpotifyLink will be created
}
