using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Outbound;

public sealed record TagCategoryDto
{
    [Required]
    [MinLength(3)]
    [MaxLength(3)]
    public required string Id { get; init; }

    [Required]
    public required string Name { get; init; }

    [Required]
    public required List<TagGroupDto> TagGroups { get; init; } // contains all downward Tag hierarchy
}
