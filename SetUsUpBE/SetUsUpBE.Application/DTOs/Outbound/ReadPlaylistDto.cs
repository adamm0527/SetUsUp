using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Outbound;

public sealed record ReadPlaylistDto
{
    [Required]
    public required Guid Id { get; init; }

    [Required]
    public required string Name { get; init; }

    public string? Description { get; init; }

    [Required]
    [MinLength(3)]
    [MaxLength(30)]
    public required string CreatorUserName { get; init; }
}
