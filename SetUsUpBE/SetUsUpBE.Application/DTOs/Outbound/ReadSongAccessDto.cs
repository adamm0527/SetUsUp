using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Outbound;

// a list of these tell the Frontend that a song is "shared to the following groups: ..."
public sealed record ReadSongAccessDto
{
    [Required]
    public required Guid GroupId { get; init; }

    [Required]
    public required string GroupName { get; init; }

    // True if this is the Group through which the calling User originally created the Song.
    // (Revoking this SongAccess is forbidden by the Backend. Frontend uses this for read-only rendering).
    [Required]
    public required bool IsCreatorGroup { get; init; }
}
