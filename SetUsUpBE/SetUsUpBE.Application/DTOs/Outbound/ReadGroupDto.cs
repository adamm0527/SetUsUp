using System.ComponentModel.DataAnnotations;
using SetUsUpBE.Application.Services.Primitives;

namespace SetUsUpBE.Application.DTOs.Outbound;

public sealed record ReadGroupDto
{
    [Required]
    public required Guid Id { get; init; }

    [Required]
    public required string Name { get; init; }

    [Required]
    public required RoleType Role { get; init; } // not used for actual validation, just for offering UI options

    [Required]
    public required int MemberCount { get; init; }

    [Required]
    public required List<string> MemberNames { get; init; }

    [Required]
    public required bool IsPersonal { get; init; } // true if it's the user's auto-created default group (IsUserCreated=false)
}
