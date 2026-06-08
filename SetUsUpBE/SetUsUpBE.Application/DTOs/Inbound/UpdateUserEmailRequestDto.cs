using System.ComponentModel.DataAnnotations;

namespace SetUsUpBE.Application.DTOs.Inbound;

/* Step 1 of the email-change flow: user submits the new address. The BE generates a
   confirmation token signed for (currentUserId + newEmail), stores nothing yet on the user row,
   and emails the new address with a link to /user/confirm-email-change?token=...&newEmail=...
   The actual email-swap happens only when the user clicks the link. */
public sealed record UpdateUserEmailRequestDto
{
    [Required]
    [EmailAddress]
    public required string NewEmail { get; init; }
}
