using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Inbound;

public sealed record UpdateGroupUserAdminStatusDto
{
    // if true, target user is promoted to Admin,
    // if false, target user's Admin role is revoked
    [Required]
    public required bool IsPromotion { get; init; }
}
