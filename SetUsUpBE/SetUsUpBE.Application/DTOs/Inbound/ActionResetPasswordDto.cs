using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Inbound;

public sealed record ActionResetPasswordDto
{
    [Required]
    [EmailAddress]
    public required string Email { get; init; }

    [Required]
    public required string Token { get; init; }

    [Required]
    [MinLength(6)]
    public required string NewPassword { get; init; }
}
