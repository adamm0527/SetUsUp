using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Inbound;

public sealed class ActionRefreshTokenDto
{
    [Required]
    public required string Token { get; init; }
}
