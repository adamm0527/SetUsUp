namespace SetUsUpBE.Infrastructure.ServicesExternal.Email;

/* Plain-string transactional email body builders.
   Each method returns (subject, content) passed to IEmailService.SendEmailAsync. */
public static class EmailTemplates
{
    /* Inactivity warning. Sent at 30 / 7 / 3 / 2 / 1 days before scheduled deletion. */
    public static (string subject, string content) BuildInactivityWarning(
        string userName, int daysRemaining, DateTime scheduledDeletionUtc)
    {
        var subject = daysRemaining == 1
            ? "SetUsUp -- your account will be deleted tomorrow"
            : $"SetUsUp -- your account will be deleted in {daysRemaining} days";

        var content =
            $"Hi {userName},\r\n\r\n" +
            $"You haven't logged in to SetUsUp for a while. Under our data retention policy, " +
            $"accounts inactive for 180 days are automatically deleted.\r\n\r\n" +
            $"Your account is scheduled for deletion on {scheduledDeletionUtc:yyyy-MM-dd} " +
            $"(in {daysRemaining} day{(daysRemaining == 1 ? "" : "s")}).\r\n\r\n" +
            $"To keep your account, simply log in at any point before then -- the inactivity " +
            $"timer resets to zero on each successful login.\r\n\r\n" +
            $"If you no longer want the account, you can also delete it yourself from your " +
            $"settings page (faster than waiting).\r\n\r\n" +
            $"-- SetUsUp";

        return (subject, content);
    }

    /* Account deletion confirmation. Sent immediately after a delete (self-request or inactivity). */
    public static (string subject, string content) BuildAccountDeleted(
        string userName, string reason /* "inactivity" | "self-request" */)
    {
        var subject = "SetUsUp -- your account has been deleted";

        var reasonLine = reason == "inactivity"
            ? "This was triggered by our 180-day inactivity policy."
            : "This was triggered by you from your settings page.";

        var content =
            $"Hi {userName},\r\n\r\n" +
            $"Your SetUsUp account has been deleted.\r\n\r\n" +
            $"{reasonLine}\r\n\r\n" +
            $"All songs, playlists, ratings and group memberships you authored have been " +
            $"removed. Anonymous comments you wrote on others' content remain (they are not " +
            $"linked to your identity).\r\n\r\n" +
            $"This is a final confirmation -- there is nothing further to do.\r\n\r\n" +
            $"-- SetUsUp";

        return (subject, content);
    }

    /* Generates a Password reset token. Sent in response to POST /user/forgot-password. */
    public static (string subject, string content) BuildPasswordResetToken(
        string userName, string resetUrl, DateTime expiresAtUtc)
    {
        var subject = "SetUsUp -- password reset";

        var content =
            $"Hi {userName},\r\n\r\n" +
            $"Someone (hopefully you) requested a password reset for your SetUsUp account.\r\n\r\n" +
            $"To set a new password, open this link:\r\n" +
            $"{resetUrl}\r\n\r\n" +
            $"The link expires at {expiresAtUtc:yyyy-MM-dd HH:mm} UTC (in about 1 hour).\r\n\r\n" +
            $"If you didn't request this, you can ignore this email -- your current password is " +
            $"unchanged and the link will simply expire.\r\n\r\n" +
            $"-- SetUsUp";

        return (subject, content);
    }

    /* Email-change confirmation. Sent to the NEW address. When the user clicks the link,
       the email change is applied and all existing JWTs for the account are invalidated (re-login needed). */
    public static (string subject, string content) BuildEmailChangeConfirmation(
        string userName, string oldEmail, string newEmail, string confirmUrl)
    {
        var subject = "SetUsUp -- confirm your new email address";

        var content =
            $"Hi {userName},\r\n\r\n" +
            $"You asked to change the email address on your SetUsUp account.\r\n\r\n" +
            $"  Old:  {oldEmail}\r\n" +
            $"  New:  {newEmail}\r\n\r\n" +
            $"To confirm the change, open this link:\r\n" +
            $"{confirmUrl}\r\n\r\n" +
            $"Your account email will NOT change until you open the link. After confirming, you'll " +
            $"need to log in again with the new email address.\r\n\r\n" +
            $"If you didn't request this, you can ignore this email -- your current email is " +
            $"unchanged.\r\n\r\n" +
            $"-- SetUsUp";

        return (subject, content);
    }
}
