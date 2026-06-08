namespace SetUsUpBE.Domain.Primitives;

public sealed record Error(string Code, string? Description = null)
{
    public static readonly Error None = new(string.Empty);

    /* --- 'Group' aggregate root errors --- */

    public static readonly Error GroupNameEmpty =
        new("Group.NameEmpty", "The group must have a name.");

    /* --- 'Song' aggregate root errors --- */

    public static readonly Error SongArtistEmpty =
        new("Song.ArtistEmpty", "The song must have an artist.");

    public static readonly Error SongTitleEmpty =
        new("Song.TitleEmpty", "The song must have a title.");

    public static readonly Error SongInvalidFormat =
        new("Song.InvalidFormat", "Duration is not in the valid format of hh:mm:ss.");

    public static readonly Error SongDurationDomainError =
        new("Song.DurationDomainError", "Song duration must be at least 1 second and less than 24 hours.");

    public static readonly Error SongBpmDomainError =
        new("Song.BpmDomainError", "The BPM of the song must range from 0 to 300.");

    public static readonly Error SongBpmBeatlessMismatch =
        new("Song.BpmBeatlessMismatch",
            "The beginning and ending BPM both must be simultaneously zero or non-zero.");

    /* --- 'PlaylistEntry' entity errors --- */

    public static readonly Error PlaylistEntryDurationTooLong =
        new("PlaylistEntry.DurationTooLong",
            "The duration of the selection cannot be longer than the duration of the song.");

    public static readonly Error PlaylistEntryDurationTooSmall =
        new("PlaylistEntry.DurationTooSmall",
            "The duration of the selection must be at least 1 second.");

    public static readonly Error PlaylistEntryEndBeforeStart =
        new("PlaylistEntry.EndBeforeStart",
            "The endpoint of the selection must be after the starting point.");

    public static readonly Error PlaylistEntryBpmDomainError =
        new("PlaylistEntry.BpmDomainError",
            "The resulting song's BPM must range from 0 to 300.");

    public static readonly Error PlaylistEntryFirstNotMaster =
        new("PlaylistEntry.FirstNotMaster",
            "The very first entry of a playlist cannot be played with" +
            " a (non-existing) previous entry, as it should be the first entry.");

    /* --- 'Playlist' aggregate root errors --- */

    public static readonly Error PlaylistNameEmpty =
        new("Playlist.NameEmpty", "The playlist must have a name.");

    public static readonly Error PlaylistNewEntryDuplicate =
        new("Playlist.NewEntryDuplicate", "Cannot create entry: the playlist already has this entry.");

    public static readonly Error PlaylistNewEntryParentMismatch =
        new("Playlist.NewEntryParentMismatch", "Cannot create entry: it already belongs to a different playlist.");

    /* --- 'MusicalKey' value object errors --- */

    public static readonly Error MusicalKeyInvalidFormat =
        new("MusicalKey.InvalidFormat", "Key is not in the form of 1B or 01B.");

    public static readonly Error MusicalKeyDomainError =
        new("MusicalKey.DomainError", 
            "Number part of Key must range from 1 to 12," +
            "and the letter part can only be Minor (A) or Major (B).");
}
