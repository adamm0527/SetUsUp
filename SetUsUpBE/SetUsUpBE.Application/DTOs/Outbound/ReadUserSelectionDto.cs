using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Outbound;

public sealed record ReadUserSelectionDto
{
    [Required]
    public required Guid Id { get; init; }

    [Required]
    public required string Name { get; init; }
}
