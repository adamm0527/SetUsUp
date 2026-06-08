using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Outbound;

// Leaf Tag in the Tag hierarchy. This "gets tagged" to actual Songs.
public sealed record TagDto
{
    [Required]
    [MinLength(7)]
    [MaxLength(7)]
    public required string Id { get; init; }

    [Required]
    public required string Name { get; init; }

    [Required]
    public required string Description { get; init; }
}
