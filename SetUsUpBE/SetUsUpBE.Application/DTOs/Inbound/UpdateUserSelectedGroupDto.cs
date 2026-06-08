using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Inbound;

public sealed record UpdateUserSelectedGroupDto
{
    [Required]
    public required Guid groupId { get; init; }
}
