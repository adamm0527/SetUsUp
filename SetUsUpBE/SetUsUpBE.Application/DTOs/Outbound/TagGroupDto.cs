using System.ComponentModel.DataAnnotations;
using SetUsUpBE.Application.AppEntityInterfaces;

namespace SetUsUpBE.Application.DTOs.Outbound;

// Sits middle in the Tag hierarchy: TagCategory -> TagGroups -> Tags.
public sealed record TagGroupDto
{
    [Required]
    [MinLength(5)]
    [MaxLength(5)]
    public required string Id { get; init; }

    [Required]
    public required string Name { get; init; }

    // Sets validation rules inside this TagGroup (e.g. if only one Tag can be applied from this TagGroup).
    [Required]
    public required TagGroupType Type { get; init; }

    [Required]
    public required List<TagDto> Tags { get; init; } // all leaf Tags that belong to this TagGroup
}
