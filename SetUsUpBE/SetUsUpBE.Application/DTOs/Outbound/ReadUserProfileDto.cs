using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Outbound;

/* User's own comprehensive profile data.
   Does NOT include any auth secrets (password hash, security stamp, JWT-related fields). */
public sealed record ReadUserProfileDto
{
    [Required] public required string Id { get; init; }
    [Required] public required string UserName { get; init; }
    [Required] public required string Email { get; init; }
    [Required] public required bool EmailConfirmed { get; init; }

    public string? InstagramAccount { get; init; }

    /* For the inactivity countdown UI in settings ("your account will be deleted in ... day(s)"). */
    public DateTime? LastLoginAt { get; init; }

    /* Bumped vs LegalConstants -- the FE compares and shows the re-accept modal on mismatch. */
    [Required] public required int AcceptedLegalVersion { get; init; }
    [Required] public required int AcceptedSpotifyNoticeVersion { get; init; }

    /* Ordered list (max 5) of TagGroup IDs the user wants displayed as chips at the bottom of SongCards.
       Empty list means the FE will use the default hardcoded preference.
       The order matters: it determines chip render order on the card. */
    [Required] public required List<string> DisplayedTagGroupIds { get; init; } // item example: "ENRGY"
}
