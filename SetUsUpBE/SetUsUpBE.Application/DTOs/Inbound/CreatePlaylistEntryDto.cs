using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Inbound;

public sealed record CreatePlaylistEntryDto
{
    [Required]
    public required Guid SongId { get; init; }
    
    [Required]
    public required string StartTime { get; init; }

    [Required]
    public required string EndTime { get; init; }
    
    public string? Comment { get; init; }

    public string? HexColour { get; init; }

    public int? InsertionIndex { get; init; }
}
