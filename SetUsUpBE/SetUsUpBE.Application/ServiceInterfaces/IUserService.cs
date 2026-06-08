using SetUsUpBE.Domain.Primitives;
using SetUsUpBE.Application.AppEntityInterfaces;
using SetUsUpBE.Application.DTOs.Outbound;
using SetUsUpBE.Application.Services;

namespace SetUsUpBE.Application.ServiceInterfaces;

public interface IUserService
{
    // CREATE

    Task<Result<IAppUser>> CreateUserAsync(string email, string userName, string password);

    // READ

    Task<IAppUser?> GetUserByIdAsync(string id);
    
    Task<IAppUser?> GetUserByEmailAsync(string email);
    
    Task<IAppUser?> GetUserByUserNameAsync(string userName);
    
    Task<ReadUserSelectionDto> GetSelectedGroupAsync(IAppUser user, MusicService musicService);

    Task<ReadUserSelectionDto> GetSelectedPlaylistAsync(IAppUser user, MusicService musicService);

    ReadUserProfileDto GetUserProfile(IAppUser user);

    Task<ReadUserDataExportDto> GetUserDataExportAsync(IAppUser user, MusicService musicService, MembershipService mshipService);

    // UPDATE

    Task SetDefaultGroupAsync(IAppUser user, Guid groupId);

    Task SetLastLoginAsync(IAppUser user, DateTime at);

    Task SetSelectedGroupAsync(IAppUser user, Guid groupId, MusicService musicService);

    Task SetSelectedPlaylistAsync(IAppUser user, Guid playlistId);

    Task<Result<bool>> SetNewPasswordAsync(IAppUser user, string currPw, string newPw);

    Task<Result<bool>> ResetPasswordAsync(IAppUser user, string token, string newPw);

    Task SetInstagramHandleAsync(IAppUser user, string? igUserName, MusicService musicService);

    Task SetAcceptedLegalVersionAsync(IAppUser user, int version);

    Task SetAcceptedSpotifyNoticeVersionAsync(IAppUser user, int version);

    Task<Result<bool>> SetDisplayedTagGroupsAsync(IAppUser user, List<string> tagGroupIds);

    // DELETE

    Task DeleteUserAsync(IAppUser user, MusicService musicService, MembershipService mshipService);

    // Misc (Identity related)

    Task<string> GenerateEmailConfirmationTokenAsync(IAppUser user);

    Task<string> GenerateEmailChangeTokenAsync(IAppUser user, string newEmail);

    Task<string> GeneratePasswordResetTokenAsync(IAppUser user);

    Task<Result<IAppUser>> ConfirmEmailAsync(IAppUser user, string token);

    Task<Result<bool>> ConfirmEmailChangeAsync(IAppUser user, string token, string newEmail);

    Task<LoginOutcome> PasswordSignInAsync(IAppUser user, string password);

    Task<bool> IsLockedOutAsync(IAppUser user);

    Task<bool> IsSecurityStampUpToDateAsync(IAppUser user, string? tokenStamp);

    bool IsDataExportRateLimited(IAppUser user);

    (DateTime, int) GetDataExportAllowedAtAndSecondsRemaining(IAppUser user);

    Task RevokeAllPreviousTokensAsync(IAppUser user);

    Task DeselectGroupForAllUsersAsync(Guid groupId);

    Task DeselectPlaylistForAllUsersAsync(Guid playlistId);
}

public enum LoginOutcome
{
    EmailUnconfirmed,
    LockedOut,
    WrongCredentials,
    Success
}
