namespace SetUsUpBE.Application.AppEntityInterfaces;

public interface IAppUser
{
    Guid OwnGroupId { get; set; }
    Guid SelectedGroupId { get; set; }
    Guid? SelectedPlaylistId { get; set; }
    string Id { get; set; }
    string UserName { get; set; }
    string Email { get; set; }
    bool EmailConfirmed { get; set; }
    string? SecurityStamp { get; set; }

    /* Voluntarily shared with other members of the same group(s) for messaging outside the app. */
    string? InstagramAccount { get; set; }

    /* Updated on every successful login. InactivityCleanupService uses it to make (regulatory) account deletions */
    DateTime? LastLoginAt { get; set; }

    /* The lowest milestone (in days remaining until deletion) for which a warning email has already been sent.
       Resets to null on every successful login. Values used: 30, 7, 3, 2, 1. */
    int? LastInactivityWarningMilestone { get; set; }

    /* Set when the user successfully downloads their data export.
       Used to rate-limit /user/legal/data-export to once per 24 hours (see GDPR Art. 12(5)). */
    DateTime? LastDataExportAt { get; set; }

    /* The legal-document version the user has acknowledged.
       When corresponding version constant in LegalConstants class is increased, the FE will force re-acknowledgement. */
    int AcceptedLegalVersion { get; set; }

    /* Same pattern for the Spotify-auto-fill notice (0 = never shown, 1+ = acknowledged version). */
    int AcceptedSpotifyNoticeVersion { get; set; }

    /* Comma-separated string value, representing an ordered list (max 5) of TagGroup IDs,
       that the user wants displayed as chips at the bottom of SongCards.
       Null value or empty string means the FE will use the default hardcoded preference.
       The order matters: it determines chip render order on the card. */
    string? DisplayedTagGroupIdsCsv { get; set; }
}
