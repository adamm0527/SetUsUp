using SetUsUpBE.Application.DTOs.Outbound;

namespace SetUsUpBE.Application.ServiceInterfaces;

public enum ChangedEntityKind
{
    Group = 0,
    GroupMembership = 1,
    Song = 2,
    Playlist = 3,
    PlaylistEntry = 4,
    User = 5
}

public enum ChangeKind
{
    Created = 0,
    Updated = 1,
    Deleted = 2,
    Reordered = 3
}

public interface IRealTimeNotifierService
{
    Task PublishToGroupAsync(Guid groupId, RealTimeNotificationDto dto, CancellationToken ct = default);
    Task PublishToUserAsync(string userId, RealTimeNotificationDto dto, CancellationToken ct = default);
}

/* Static class with factories for all real-time notifications that can be sent in the Application Layer.
   Implemented by a SignalR Hub up in WebAPI layer. */
public static class RTN // shorthand for RealTimeNotification
{
    /* --- User --- */

    public static Task SendUserAddedToGroupAsync(IRealTimeNotifierService realTimeNotifier, Guid groupId, string userId)
    {
        return realTimeNotifier.PublishToUserAsync(userId, new RealTimeNotificationDto()
        {
            EntityKind = ChangedEntityKind.GroupMembership,
            ChangeKind = ChangeKind.Created,
            GroupId = groupId,
            EntityId = Guid.Parse(userId)
        });
    }

    public static Task SendUserUpdatedAsync(IRealTimeNotifierService realTimeNotifier, Guid groupId, string userId)
    {
        return realTimeNotifier.PublishToGroupAsync(groupId, new RealTimeNotificationDto
        {
            EntityKind = ChangedEntityKind.User,
            ChangeKind = ChangeKind.Updated,
            GroupId = groupId,
            EntityId = Guid.Parse(userId)
        });
    }

    public static Task SendUserRemovedFromGroupAsync(IRealTimeNotifierService realTimeNotifier, Guid groupId, string userId)
    {
        return realTimeNotifier.PublishToUserAsync(userId, new RealTimeNotificationDto()
        {
            EntityKind = ChangedEntityKind.GroupMembership,
            ChangeKind = ChangeKind.Deleted,
            GroupId = groupId,
            EntityId = Guid.Parse(userId)
        });
    }

    public static Task SendUserDeletedAsync(IRealTimeNotifierService realTimeNotifier, Guid groupId, Guid userId)
    {
        return realTimeNotifier.PublishToGroupAsync(groupId, new RealTimeNotificationDto
        {
            EntityKind = ChangedEntityKind.User,
            ChangeKind = ChangeKind.Deleted,
            GroupId = groupId,
            EntityId = userId
        });
    }

    /* --- Group --- */

    /* signals to ALL current members of the group that a membership inside it changed (added, removed or role-promoted/demoted).
       Existing clients use this to invalidate any open Group detail view. */
    public static Task SendGroupMembershipChangedAsync(IRealTimeNotifierService realTimeNotifier, Guid groupId)
    {
        return realTimeNotifier.PublishToGroupAsync(groupId, new RealTimeNotificationDto()
        {
            EntityKind = ChangedEntityKind.GroupMembership,
            ChangeKind = ChangeKind.Updated,
            GroupId = groupId,
            EntityId = groupId
        });
    }

    public static Task SendGroupNameChangedAsync(IRealTimeNotifierService realTimeNotifier, Guid groupId)
    {
        return realTimeNotifier.PublishToGroupAsync(groupId, new RealTimeNotificationDto()
        {
            EntityKind = ChangedEntityKind.Group,
            ChangeKind = ChangeKind.Updated,
            GroupId = groupId,
            EntityId = groupId
        });
    }

    public static Task SendGroupDeletedAsync(IRealTimeNotifierService realTimeNotifier, Guid groupId)
    {
        return realTimeNotifier.PublishToGroupAsync(groupId, new RealTimeNotificationDto()
        {
            EntityKind = ChangedEntityKind.Group,
            ChangeKind = ChangeKind.Deleted,
            GroupId = groupId,
            EntityId = groupId
        });
    }

    /* --- Song --- */

    public static Task SendSongCreatedAsync(IRealTimeNotifierService realTimeNotifier, Guid groupId, Guid songId)
    {
        return realTimeNotifier.PublishToGroupAsync(groupId, new RealTimeNotificationDto()
        {
            EntityKind = ChangedEntityKind.Song,
            ChangeKind = ChangeKind.Created,
            GroupId = groupId,
            EntityId = songId
        });
    }

    public static Task SendSongUpdatedAsync(IRealTimeNotifierService realTimeNotifier, Guid groupId, Guid songId)
    {
        return realTimeNotifier.PublishToGroupAsync(groupId, new RealTimeNotificationDto()
        {
            EntityKind = ChangedEntityKind.Song,
            ChangeKind = ChangeKind.Updated,
            GroupId = groupId,
            EntityId = songId
        });
    }

    public static Task SendSongDeletedAsync(IRealTimeNotifierService realTimeNotifier, Guid groupId, Guid songId)
    {
        return realTimeNotifier.PublishToGroupAsync(groupId, new RealTimeNotificationDto()
        {
            EntityKind = ChangedEntityKind.Song,
            ChangeKind = ChangeKind.Deleted,
            GroupId = groupId,
            EntityId = songId
        });
    }

    /* --- Playlist --- */

    public static Task SendPlaylistCreatedAsync(IRealTimeNotifierService realTimeNotifier, Guid groupId, Guid playlistId, string playlistName)
    {
        return realTimeNotifier.PublishToGroupAsync(groupId, new RealTimeNotificationDto()
        {
            EntityKind = ChangedEntityKind.Playlist,
            ChangeKind = ChangeKind.Created,
            GroupId = groupId,
            EntityId = playlistId,
            PayloadJson = playlistName
        });
    }

    public static Task SendPlaylistMetaDataChangedAsync(IRealTimeNotifierService realTimeNotifier, Guid groupId, Guid playlistId, string playlistName)
    {
        return realTimeNotifier.PublishToGroupAsync(groupId, new RealTimeNotificationDto()
        {
            EntityKind = ChangedEntityKind.Playlist,
            ChangeKind = ChangeKind.Updated,
            GroupId = groupId,
            EntityId = playlistId,
            PayloadJson = playlistName
        });
    }

    public static Task SendPlaylistDeletedAsync(IRealTimeNotifierService realTimeNotifier, Guid groupId, Guid playlistId)
    {
        return realTimeNotifier.PublishToGroupAsync(groupId, new RealTimeNotificationDto()
        {
            EntityKind = ChangedEntityKind.Playlist,
            ChangeKind = ChangeKind.Deleted,
            GroupId = groupId,
            EntityId = playlistId
        });
    }

    /* --- PlaylistEntry ---

       For each event, PayloadJson carries the parent playlist's id as a string so the FE can scope
       invalidations to a specific playlist. EntityId is the PlaylistEntry itself. */

    public static Task SendPlaylistEntryCreatedAsync(IRealTimeNotifierService realTimeNotifier,
        Guid groupId, Guid playlistId, Guid entryId)
    {
        return realTimeNotifier.PublishToGroupAsync(groupId, new RealTimeNotificationDto()
        {
            EntityKind = ChangedEntityKind.PlaylistEntry,
            ChangeKind = ChangeKind.Created,
            GroupId = groupId,
            EntityId = entryId,
            PayloadJson = playlistId.ToString()
        });
    }

    /* Used for both metadata edits (PATCH entries/{id}) AND reorders (PATCH entries/{id}/position).
       Reorders use ChangeKind.Reordered specifically so the FE can distinguish if it wants to. */
    public static Task SendPlaylistEntryUpdatedAsync(IRealTimeNotifierService realTimeNotifier,
        Guid groupId, Guid playlistId, Guid entryId)
    {
        return realTimeNotifier.PublishToGroupAsync(groupId, new RealTimeNotificationDto()
        {
            EntityKind = ChangedEntityKind.PlaylistEntry,
            ChangeKind = ChangeKind.Updated,
            GroupId = groupId,
            EntityId = entryId,
            PayloadJson = playlistId.ToString()
        });
    }

    public static Task SendPlaylistEntryReorderedAsync(IRealTimeNotifierService realTimeNotifier,
        Guid groupId, Guid playlistId, Guid entryId)
    {
        return realTimeNotifier.PublishToGroupAsync(groupId, new RealTimeNotificationDto()
        {
            EntityKind = ChangedEntityKind.PlaylistEntry,
            ChangeKind = ChangeKind.Reordered,
            GroupId = groupId,
            EntityId = entryId,
            PayloadJson = playlistId.ToString()
        });
    }

    public static Task SendPlaylistEntryDeletedAsync(IRealTimeNotifierService realTimeNotifier,
        Guid groupId, Guid playlistId, Guid entryId)
    {
        return realTimeNotifier.PublishToGroupAsync(groupId, new RealTimeNotificationDto()
        {
            EntityKind = ChangedEntityKind.PlaylistEntry,
            ChangeKind = ChangeKind.Deleted,
            GroupId = groupId,
            EntityId = entryId,
            PayloadJson = playlistId.ToString()
        });
    }
}

// helper for group names
public static class RealTimeRecipient
{
    public static string ForGroup(Guid groupId) => $"group:{groupId}";
}
