using SetUsUpBE.Domain.Primitives;

namespace SetUsUpBE.Application.Services.Primitives;

public static class QueryError
{
    /* --- User related Errors --- */

    public static Error CreateUserNonExistentError(string nonExistentUserName) =>
        new("User.NonExistentUserName", $"No user exists with the name \"{nonExistentUserName}\"");

    public static readonly Error UserNonExistentId =
        new("User.NonExistentId", "No user could be found with the provided ID.");

    public static readonly Error UserNonExistentEmail =
        new("User.NonExistentEmail", "No user could be found with the provided Email address.");

    public static readonly Error UserCreatorDuplicateMembership =
        new("User.CreatorDuplicateMembership", "Creator user cannot be included in the list of non-admin members.");

    public static readonly Error UserNotAdminInGroup =
        new("User.NotAdminInGroup", "You are not an admin of this group, thus cannot perform this action.");

    public static readonly Error UserNotCreatorInGroup =
        new("User.NotCreatorInGroup", "You are not the creator of this group, thus cannot perform this action.");

    public static readonly Error UserPwChangeCurrentIncorrect =
        new("User.PwChangeCurrentIncorrect", "Password change failed: the current password is incorrect.");

    public static readonly Error UserPwChangeUnmetRequirements =
        new("User.PwChangeUnmetRequirements", "Password change failed: the new password did not meet the requirements.");

    public static readonly Error UserPwChangeIdentical =
        new("User.PwChangeIdentical", "Password change failed: the passwords are identical.");

    public static readonly Error UserEmailChangeIdentical =
        new("User.EmailChangeIdentical", "The new email matches your current one.");

    public static readonly Error UserEmailChangeInUse =
        new("User.EmailChangeInUse", "This email is already used by another user.");

    public static readonly Error UserEmailChangeMalformedLink =
        new("User.EmailChangeMalformedLink", "Malformed email-change link.");

    public static readonly Error UserSelectedTagGroupsTooMany =
        new("User.SelectedTagGroupsTooMany", "At most 5 tag groups can be displayed on song cards.");

    /* --- Group (and membership) related Errors --- */

    public static readonly Error GroupNameTaken =
        new("Group.NameTaken", "This name is already taken by another group. Please try a different group name.");

    public static readonly Error GroupNonExistentId =
        new("Group.NonExistentId", "No group exists with the provided ID.");

    public static readonly Error GroupNoAccess =
        new("Group.NoAccess", "You are not a member of the group that owns this resource.");

    public static readonly Error GroupNoAccessToShare =
        new("Group.NoAccessToShare", "You cannot share a song with a group you're not a member of.");

    public static readonly Error GroupOneUserOnlyInvitation =
        new("Group.OneUserOnlyInvitation", "You cannot add members to your own private collection.");

    public static readonly Error GroupMemberAlreadyAdded =
        new("Group.MemberAlreadyAdded", "The provided user is already a member of this group.");

    public static readonly Error GroupAlreadyHasSongAccess =
        new("Group.AlreadyHasSongAccess", "The provided group already has access to this song.");

    public static readonly Error GroupNonExistentMember =
        new("Group.NonExistentMember", "The provided user is not a member of this group.");

    public static readonly Error GroupNonExistentSongAccess =
        new("Group.NonExistentSongAccess", "The provided group has no access to this song.");

    public static readonly Error GroupForbiddenAdminKick =
        new("Group.ForbiddenAdminKick", "Only the Creator can kick an Admin from their group.");

    public static readonly Error GroupCreatorLeaving =
        new("Group.CreatorLeaving", "You cannot leave a group you're a creator of. Try deleting it instead.");

    public static readonly Error GroupCreatorAdminRevoke =
        new("Group.CreatorAdminRevoke", "You cannot revoke your own Admin role in a group you're a creator of.");

    public static readonly Error GroupOwnCollectionRename =
        new("Group.OwnCollectionRename", "You cannot rename your own default group.");

    public static readonly Error GroupOwnCollectionDelete =
        new("Group.OwnCollectionDelete", "You cannot delete your own default group.");

    /* --- Song (and access) related Errors --- */

    public static readonly Error SongNonExistentId =
        new("Song.NonExistentId", "No song exists with the provided ID.");

    public static readonly Error SongNoAccess =
        new("Song.NoAccess", "Your currently selected group has no access to this song.");

    public static readonly Error SongNoWriteAccess =
        new("Song.NoWriteAccess", "You cannot edit this song as you're not the creator of it.");

    public static readonly Error SongAccessCannotRevoke =
        new("SongAccess.CannotRevoke", "You cannot revoke access to this song, as you aren't the creator of it.");

    public static readonly Error SongAccessCannotRevokeOwn =
        new("SongAccess.CannotRevokeOwn", "You cannot revoke your own access to a song. Try deleting the song instead.");

    /* --- Playlist related Errors --- */

    public static readonly Error PlaylistUnprivilegedCreation =
        new("Playlist.UnprivilegedCreation", "You cannot create a playlist unless you're an admin in this group.");

    public static readonly Error PlaylistNameTakenInGroup =
        new("Playlist.NameTakenInGroup", "There's already a playlist with this name in this group. Please use a name.");

    public static readonly Error PlaylistNoneSelected =
        new("Playlist.NoneSelected", "You don't have a playlist selected to perform this action on.");

    public static readonly Error PlaylistNonExistentId =
        new("Playlist.NonExistentId", "No playlist exists with the provided ID.");

    public static readonly Error PlaylistNoAccess =
        new("Playlist.NoAccess", "Your currently selected group has no access to this playlist.");

    public static readonly Error PlaylistNoWriteAccess =
        new("Playlist.NoWriteAccess", "You cannot edit this playlist as you're not the creator of it, nor are you an admin in this group.");

    /* --- PlaylistEntry related Errors --- */

    public static readonly Error PlaylistEntryNonExistentId =
        new("PlaylistEntry.NonExistentId", "No playlist entry exists with the provided ID.");

    public static readonly Error PlaylistEntryNoAccess =
        new("PlaylistEntry.NoAccess", "Your currently selected group has no access to this playlist entry.");

    public static readonly Error PlaylistEntryNoWriteAccess =
        new("PlaylistEntry.NoWriteAccess", "You cannot edit this entry as you're not the creator of it, nor are you an admin in this group.");

    public static readonly Error PlaylistEntryWrongPlaylist =
        new("PlaylistEntry.WrongPlaylist", "This entry belongs to a different playlist. Select that playlist first before editing.");

    public static readonly Error PlaylistEntryReorderSetMismatch =
        new("PlaylistEntry.ReorderSetMismatch", "The submitted entry-id set does not match the playlist's current entries. Refresh and retry.");

    public static readonly Error PlaylistEntryRatingOutOfRange =
        new("PlaylistEntryRating.OutOfRange", "Rating must be between 1 and 5.");

    /* --- Spotify related Errors --- */

    public static readonly Error SpotifyQueryEmpty =
        new("Spotify.QueryEmpty", "Search query cannot be empty.");

    public static readonly Error SpotifyTrackNotFound =
        new("Spotify.TrackNotFound", "No Spotify track exists with the provided ID.");

    public static Error CreateSpotifyUpstreamError(string detail) =>
        new("Spotify.UpstreamError", $"Spotify request failed: {detail}");
}
