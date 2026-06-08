using System.ComponentModel.DataAnnotations;
using SetUsUpBE.Application.ServiceInterfaces;

namespace SetUsUpBE.Application.DTOs.Outbound;

// Generic RealTime notification to clients, used to invalidate certain parts of the UI
public sealed record RealTimeNotificationDto
{
    [Required]
    public required ChangedEntityKind EntityKind { get; init; } // Group | GroupMembership | Song | Playlist | PlaylistEntry | User

    [Required]
    public required ChangeKind ChangeKind { get; init; } // Created | Updated | Deleted | Reordered

    [Required]
    public required Guid GroupId { get; init; } // destination SignalR "channel" for the broadcast

    [Required]
    public required Guid EntityId { get; init; } // ID of the changed entity

    public string? PayloadJson { get; init; } = null; // extra context if needed
}
