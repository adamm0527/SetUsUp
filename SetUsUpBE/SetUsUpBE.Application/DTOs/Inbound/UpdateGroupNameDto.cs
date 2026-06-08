using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Inbound;

public sealed record UpdateGroupNameDto
{
    [Required]
    public required string NewGroupName { get; init; }
}
