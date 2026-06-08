using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Inbound;

public sealed record ActionForgotPasswordDto
{
    [Required]
    [EmailAddress]
    public required string Email { get; init; }
}
