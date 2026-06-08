using SetUsUpBE.Application.DTOs.Outbound;
using SetUsUpBE.Infrastructure.DataEntities;

namespace SetUsUpBE.Infrastructure.Mapper.DataToDTO;

public static class TagExtensions
{
    public static TagDto ToDto(this TagData data) => new()
    {
        Id = data.Id,
        Name = data.Name,
        Description = data.Description
    };

    public static TagGroupDto ToDto(this TagGroupData data) => new()
    {
        Id = data.Id,
        Name = data.Name,
        Type = data.Type,
        // tags ordered by ID so the FE's "01..09 = radio, 10+ = checkbox" OXC split is deterministic
        Tags = (data.Tags ?? new List<TagData>())
            .OrderBy(t => t.Id, StringComparer.Ordinal)
            .Select(t => t.ToDto())
            .ToList()
    };

    public static TagCategoryDto ToDto(this TagCategoryData data) => new()
    {
        Id = data.Id,
        Name = data.Name,
        TagGroups = (data.TagGroups ?? new List<TagGroupData>())
            .OrderBy(g => g.Id, StringComparer.Ordinal)
            .Select(g => g.ToDto())
            .ToList()
    };
}
