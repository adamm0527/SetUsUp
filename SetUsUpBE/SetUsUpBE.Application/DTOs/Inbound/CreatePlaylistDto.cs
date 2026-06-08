using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Inbound;

public sealed record CreatePlaylistDto
{
    [Required]
    public required string Name { get; init; }
    
    public string? Description { get; init; }
}
