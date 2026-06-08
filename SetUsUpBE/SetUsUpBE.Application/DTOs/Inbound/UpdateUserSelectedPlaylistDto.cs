using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Inbound;

public sealed record UpdateUserSelectedPlaylistDto
{
    [Required]
    public required Guid playlistId { get; init; }
}
