using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Inbound;

public sealed record CreateGroupDto
{
    [Required]
    public required string Name { get; init; }

    public List<string> MemberNames { get; init; } = [];
}
