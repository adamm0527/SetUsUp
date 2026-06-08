using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Inbound;

/* For the self-service password change from the settings page.
   Requires the current password to re-authenticate. */
public sealed record UpdateUserPasswordDto
{
    [Required]
    public required string CurrentPassword { get; init; }

    [Required]
    [MinLength(6)]
    public required string NewPassword { get; init; }
}
