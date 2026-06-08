using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Inbound;

public sealed record ActionLoginWithUserNameDto
{
    [Required]
    [MinLength(3)]
    [MaxLength(30)]
    public required string UserName { get; init; }

    [Required]
    [MinLength(6)]
    public required string Password { get; init; }
}
