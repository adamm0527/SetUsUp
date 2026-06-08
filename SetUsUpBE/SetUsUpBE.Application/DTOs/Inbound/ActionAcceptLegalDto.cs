using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Inbound;

public sealed record ActionAcceptLegalDto
{
    /* Must equal LegalConstants.CURRENT_LEGAL_VERSION (or .CURRENT_SPOTIFY_NOTICE_VERSION).
       The BE rejects mismatched versions so a stale FE cache can't accidentally mark a user as
       having accepted a future doc revision. */
    [Required]
    public required int Version { get; init; }
}
