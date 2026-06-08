using SetUsUpBE.Application.Services.Primitives;
using SetUsUpBE.Domain.Primitives;

namespace SetUsUpBE.WebAPI.Primitives;

public static class AuthError
{
    public static Error CreateInvalidEmailError(IEnumerable<string> errors) =>
        new("User.InvalidEmailError",
            "The email address is invalid:\n" + string.Join('\n', errors));

    public static readonly Error UserNameTooShort =
        new("User.UserNameTooShort", "The username must be at least 3 characters long.");

    public static readonly Error UserNameTooLong =
        new("User.UserNameTooLong", "The username cannot be longer than 30 characters.");

    public static readonly Error UserAlreadyExistsWithEmail =
        new("User.AlreadyExistsWithEmail", "A user already exists with this email address.");

    public static readonly Error UserAlreadyExistsWithUserName =
        new("User.AlreadyExistsWithUserName", "A user already exists with this user name.");

    public static readonly Error UserEmailCannotSend =
        new("User.EmailCannotSend", "A confirmation email could not be sent to this email address.");

    public static readonly Error UserEmailCannotSendUnregistered =
        new("User.EmailCannotSendUnregistered", "There is no registration with this email address. Register first.");

    public static readonly Error UserEmailAlreadyConfirmed =
        new("User.EmailAlreadyConfirmed", "This email address is already confirmed.");

    public static readonly Error UserEmailNotYetConfirmed =
        new("User.EmailNotYetConfirmed", "You cannot log in until you have confirmed your email address.");

    public static readonly Error UserNonExistentEmail =
        new("User.NonExistentEmail", "No user could be found with the provided email address.");

    public static readonly Error UserNonExistentUserName =
        new("User.NonExistentUserName", "No user could be found with the provided user name.");

    public static readonly Error UserTooManyFailedLoginAttempts =
        new("User.TooManyFailedLoginAttempts", "You entered wrong credentials too many times. The lock-out timer resets after 15 minutes pass.");

    public static readonly Error UserWrongCredentials =
        new("User.WrongCredentials", "Wrong credentials. Did you enter your login and password correctly?");

    public static readonly Error UserMissingToken =
        new("User.MissingToken", "The bearer token was not provided/received.");

    public static readonly Error UserInvalidToken =
        new("User.InvalidToken", "The provided bearer token is invalid or corrupted.");

    public static readonly Error UserTokenExpiredTooLongAgo =
        new("User.TokenExpiredTooLongAgo", "The bearer token expired too long ago.");

    public static readonly Error UserDeleteOtherAccount =
        new("User.DeleteOtherAccount", "You cannot delete someone else's user account!");

    public static Error CreateUserLegalVersionMismatch(int submittedVersion, int requiredVersion) =>
        new("User.LegalVersionMismatch",
            $"Submitted version ({submittedVersion}) does not match current ({requiredVersion}).");

    public static Error CreateDataExportRateLimited(DateTime nextAllowedAt) =>
        new("User.DataExportRateLimited",
            $"You can export your data once every 24 hours. Try again after {nextAllowedAt:yyyy-MM-dd HH:mm} UTC.");
}
