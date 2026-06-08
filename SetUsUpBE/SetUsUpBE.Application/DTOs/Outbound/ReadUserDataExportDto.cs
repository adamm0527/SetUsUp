namespace SetUsUpBE.Application.DTOs.Outbound;

/* GDPR Article 15 (right of access) + Article 20 (portability) export bundle.
   Returned by GET /user/legal/data-export as application/json.

   Excludes (per Art. 15(4) -- "rights and freedoms of others"):
     - other group members' personal data (names, emails, Instagram handles)
     - other authors' display names on shared content
   Only group IDs and membership-role facts are exported; other members are represented with opaque ids only. */
public sealed record ReadUserDataExportDto
{
    public required DateTime ExportedAtUtc { get; init; }
    public string NoticeToReader { get; init; }
        = "This export contains only data you created or that pertains to your account. " +
          "Personal data of other users has been omitted under Art. 15(4) GDPR " +
          "(rights and freedoms of others).";

    public required ExportedUserProfile User { get; init; }
    public required List<ExportedGroupMembership> Groups { get; init; }
    public required List<ExportedSong> Songs { get; init; }
    public required List<ExportedPlaylist> Playlists { get; init; }
    public required List<ExportedPlaylistEntry> PlaylistEntries { get; init; }
    public required List<ExportedPlaylistEntryRating> PlaylistEntryRatings { get; init; }
}

public sealed record ExportedUserProfile
{
    public required string Id { get; init; }
    public required string UserName { get; init; }
    public required string Email { get; init; }
    public string? InstagramAccount { get; init; }
    public DateTime? LastLoginAt { get; init; }
    public required int AcceptedLegalVersion { get; init; }
    public required int AcceptedSpotifyNoticeVersion { get; init; }
    public required string DisplayedTagGroupIds { get; init; }
}

public sealed record ExportedGroupMembership
{
    public required Guid GroupId { get; init; }
    public required string GroupName { get; init; }
    public required string Role { get; init; }   // "Creator" | "Admin" | "Member"
    public required bool IsOwnGroup { get; init; }
}

public sealed record ExportedSong
{
    public required Guid Id { get; init; }
    public required string Artist { get; init; }
    public required string Title { get; init; }
    public required string Duration { get; init; }
    public required decimal Bpm { get; init; }
    public required decimal BpmOut { get; init; }
    public string? InitKey { get; init; }
    public string? SpotifySongId { get; init; }
    public required List<string> TagIds { get; init; }
    public required List<Guid> SharedWithGroupIds { get; init; }
}

public sealed record ExportedPlaylist
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
}

public sealed record ExportedPlaylistEntry
{
    public required Guid Id { get; init; }
    public required uint Nr { get; init; }
    public required string Start { get; init; }
    public required string End { get; init; }
    public string? Comment { get; init; }
    public required bool WithPrev { get; init; }
    public required Guid SongId { get; init; }
}

public sealed record ExportedPlaylistEntryRating
{
    public required Guid PlaylistEntryId { get; init; }
    public required int Rating { get; init; }
}
