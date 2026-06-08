using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Inbound;

public sealed record UpdatePlaylistEntryPositionDto
{
    [Required]
    public required int NewPosition { get; init; }
}
