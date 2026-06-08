using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SetUsUpBE.Application.AppEntityInterfaces;
using SetUsUpBE.Application.DTOs.Outbound;
using SetUsUpBE.Application.ServiceInterfaces;
using SetUsUpBE.Application.Services;
using SetUsUpBE.Application.Services.Primitives;
using SetUsUpBE.Domain.Primitives;
using SetUsUpBE.Infrastructure.IdentityExtensions;
using System.Collections.Generic;

namespace SetUsUpBE.Infrastructure.Services;

public sealed class UserService : IUserService
{
    private readonly UserManager<AppIdentityUser> userManager; // identityUser "repository"
    private readonly SignInManager<AppIdentityUser> signInManager;
    private readonly IRealTimeNotifierService realTimeNotifier;
    public UserService(UserManager<AppIdentityUser> userManager, SignInManager<AppIdentityUser> signInManager, IRealTimeNotifierService realTimeNotifier)
    {
        this.userManager = userManager;
        this.signInManager = signInManager;
        this.realTimeNotifier = realTimeNotifier;
    }

    // CREATE

    public async Task<Result<IAppUser>> CreateUserAsync(string email, string userName, string password)
    {
        var newUser = new AppIdentityUser()
        {
            Email = email,
            UserName = userName,
            SecurityStamp = Guid.NewGuid().ToString()
        };

        var identityResult = await userManager.CreateAsync(newUser, password);
        if (identityResult.Errors.Any())
        { /* Potential default (but explicitly configured) Identity Password violations:
                - Passwords must have at least one non-alphanumeric character.
                - Passwords must have at least one digit ('0'-'9').
                - Passwords must have at least one uppercase ('A'-'Z'). 
                - Passwords must be at least 6 characters. */
            var errors = identityResult.Errors.Select(e => e.Description);
            return Result<IAppUser>.Failure(IdentityErrors.Create(errors));
        }

        return Result<IAppUser>.Success(newUser);
    }

    // READ

    public async Task<IAppUser?> GetUserByIdAsync(string id)
    {
        return await userManager.FindByIdAsync(id);
    }

    public async Task<IAppUser?> GetUserByEmailAsync(string email)
    {
        return await userManager.FindByEmailAsync(email);
    }

    public async Task<IAppUser?> GetUserByUserNameAsync(string userName)
    {
        return await userManager.FindByNameAsync(userName);
    }

    public async Task<ReadUserSelectionDto> GetSelectedGroupAsync(IAppUser user, MusicService musicService)
    {
        var gId = user.SelectedGroupId;
        return new ReadUserSelectionDto()
        {
            Id = gId,
            Name = await musicService.GetGroupNameByIdAsync(gId)
        };
    }

    public async Task<ReadUserSelectionDto> GetSelectedPlaylistAsync(IAppUser user, MusicService musicService)
    {
        var pId = (Guid)user.SelectedPlaylistId!;
        return new ReadUserSelectionDto()
        {
            Id = pId,
            Name = await musicService.GetPlaylistNameByIdAsync(pId)
        };
    }

    // existence of passed userId must be checked prior calling this method!
    public ReadUserProfileDto GetUserProfile(IAppUser user)
    {
        var identityUser = (AppIdentityUser)user;
        return new ReadUserProfileDto
        {
            Id = identityUser.Id,
            UserName = identityUser.UserName,
            Email = identityUser.Email,
            EmailConfirmed = identityUser.EmailConfirmed,
            InstagramAccount = identityUser.InstagramAccount,
            LastLoginAt = identityUser.LastLoginAt,
            AcceptedLegalVersion = identityUser.AcceptedLegalVersion,
            AcceptedSpotifyNoticeVersion = identityUser.AcceptedSpotifyNoticeVersion,
            DisplayedTagGroupIds = ParseDisplayedTagGroupIdsCsv_(identityUser.DisplayedTagGroupIdsCsv)
        };
    }

    public async Task<ReadUserDataExportDto> GetUserDataExportAsync(IAppUser user, MusicService musicService, MembershipService mshipService)
    {
        var identityUser = (AppIdentityUser)user;
        var groups = await musicService.GetGroupDtosByUserAsync(user.Id);
        var songs = await musicService.GetAllSongsAsync(user);
        var playlists = await musicService.GetAllPlaylistsAsync(user);
        var playlistEntryIds = await musicService.GetAllPlaylistEntryIdsAsync(user);
        var playlistEntries = (await Task.WhenAll(
            playlistEntryIds
                .Select(async pid => (await musicService.GetPlaylistEntryByIdAsync(pid, user)).Value!)
                .ToList()
        ));
        var playlistEntryRatings = await musicService.GetAllPlaylistEntryRatingsAsync(user);

        var dataExport = new ReadUserDataExportDto()
        {
            ExportedAtUtc = DateTime.UtcNow,
            User = new ExportedUserProfile()
            {
                Id = identityUser.Id,
                UserName = identityUser.UserName,
                Email = identityUser.Email,
                InstagramAccount = identityUser.InstagramAccount,
                LastLoginAt = DateTime.UtcNow,
                AcceptedLegalVersion = identityUser.AcceptedLegalVersion,
                AcceptedSpotifyNoticeVersion = identityUser.AcceptedSpotifyNoticeVersion,
                DisplayedTagGroupIds = identityUser.DisplayedTagGroupIdsCsv ?? ""
            },
            Groups = groups.Select(g => new ExportedGroupMembership()
            {
                GroupId = g.Id,
                GroupName = g.Name,
                Role = g.Role.ToStringRepresentation(),
                IsOwnGroup = g.IsPersonal
            }).ToList(),
            Songs = (await Task.WhenAll(
                songs.Select(async (s) => new ExportedSong()
                {
                    Id = s.Id,
                    Artist = s.Artist,
                    Title = s.Title,
                    Duration = s.Duration.ToString("HH:mm:ss"),
                    Bpm = s.Bpm,
                    BpmOut = s.BpmOut,
                    InitKey = s.InitKey,
                    SpotifySongId = s.SpotifySongId,
                    TagIds = s.TagIds,
                    SharedWithGroupIds = (await mshipService.GetSongAccessListAsync(s.Id, user)).Value!
                        .Select(sa => sa.GroupId)
                        .ToList(),
                })
            )).ToList(),
            Playlists = playlists.Select(p => new ExportedPlaylist()
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description
            }).ToList(),
            PlaylistEntries = playlistEntries.Select(pe => new ExportedPlaylistEntry()
            {
                Id = pe.Id,
                Nr = pe.Nr,
                Start = pe.Start.ToString("HH:mm:ss"),
                End = pe.End.ToString("HH:mm:ss"),
                Comment = pe.Comment,
                WithPrev = pe.WithPrev,
                SongId = pe.Song.Id
            }).ToList(),
            PlaylistEntryRatings = playlistEntryRatings.Select(per => new ExportedPlaylistEntryRating()
            {
                PlaylistEntryId = per.Item1,
                Rating = per.Item2
            }).ToList(),
        };

        identityUser.LastDataExportAt = DateTime.UtcNow;
        await userManager.UpdateAsync(identityUser);

        return dataExport;
    }

    // UPDATE

    public async Task SetDefaultGroupAsync(IAppUser user, Guid groupId)
    {
        user.OwnGroupId = groupId;
        user.SelectedGroupId = groupId;
        await userManager.UpdateAsync((AppIdentityUser)user);
    }

    public async Task SetLastLoginAsync(IAppUser user, DateTime at)
    {
        user.LastLoginAt = DateTime.UtcNow;
        user.LastInactivityWarningMilestone = null;
        await userManager.UpdateAsync((AppIdentityUser)user);
    }

    public async Task SetSelectedGroupAsync(IAppUser user, Guid groupId, MusicService musicService)
    {
        user.SelectedGroupId = groupId;

        var playlists = await musicService.GetAllPlaylistsAsync(user);
        if (!playlists.Any(p => p.Id == user.SelectedPlaylistId))
        {
            // playlist has to be changed, because the newly selected group has no access to the current
            Guid? newlySelectedPlaylistId = null;
            if (playlists.Count > 0)
                newlySelectedPlaylistId = playlists[0].Id;
            user.SelectedPlaylistId = newlySelectedPlaylistId;
        }

        await userManager.UpdateAsync((AppIdentityUser)user);
    }

    public async Task SetSelectedPlaylistAsync(IAppUser user, Guid playlistId)
    {
        user.SelectedPlaylistId = playlistId;
        await userManager.UpdateAsync((AppIdentityUser)user);
    }

    public async Task<Result<bool>> SetNewPasswordAsync(IAppUser user, string currPw, string newPw)
    {
        var identityUser = (AppIdentityUser)user;

        var successfulAuth = await userManager.CheckPasswordAsync(identityUser, currPw);
        if (!successfulAuth)
            return Result<bool>.Failure(QueryError.UserPwChangeCurrentIncorrect);

        if (currPw == newPw)
            return Result<bool>.Failure(QueryError.UserPwChangeIdentical);

        var changeResult = await userManager.ChangePasswordAsync(identityUser, currPw, newPw);
        if (changeResult.Errors.Any())
        {
            var errors = changeResult.Errors.Select(e => e.Description);
            var identityErrors = IdentityErrors.Create(errors);
            var unmetReqError = QueryError.UserPwChangeUnmetRequirements;
            return Result<bool>.Failure(new Error(
                unmetReqError.Code,
                unmetReqError.Description + "\n" + identityErrors.Description));
        }

        // invalidating existing JWT for this User via SecurityStamp rotation
        await userManager.UpdateSecurityStampAsync(identityUser);
        return Result<bool>.Success();
    }

    public async Task<Result<bool>> ResetPasswordAsync(IAppUser user, string token, string newPw)
    {
        var identityUser = (AppIdentityUser)user;
        
        var resetResult = await userManager.ResetPasswordAsync(identityUser, token, newPw);
        if (resetResult.Errors.Any())
        {
            var errors = resetResult.Errors.Select(e => e.Description);
            return Result<bool>.Failure(IdentityErrors.Create(errors));
        }

        // invalidating existing JWT for this User via SecurityStamp rotation
        await userManager.UpdateSecurityStampAsync(identityUser);
        return Result<bool>.Success();
    }

    public async Task SetInstagramHandleAsync(IAppUser user, string? igUserName, MusicService musicService)
    {
        var identityUser = (AppIdentityUser)user;

        /* Empty/whitespace -> clear */
        var newIgUserName = string.IsNullOrWhiteSpace(igUserName) ? null : igUserName.Trim().TrimStart('@');
        if (newIgUserName == identityUser.InstagramAccount)
            return; // no change

        identityUser.InstagramAccount = newIgUserName;
        await userManager.UpdateAsync(identityUser);

        /* Real-time signalling: notify every group the user is a member of, so other clients can refresh group details pane. */
        var groupIds = await musicService.GetGroupIdsByUserAsync(identityUser.Id);
        foreach (var gid in groupIds)
            await RTN.SendUserUpdatedAsync(realTimeNotifier, gid, identityUser.Id);
    }

    public async Task SetAcceptedLegalVersionAsync(IAppUser user, int version)
    {
        var identityUser = (AppIdentityUser)user;
        
        identityUser.AcceptedLegalVersion = version;
        await userManager.UpdateAsync(identityUser);
    }

    public async Task SetAcceptedSpotifyNoticeVersionAsync(IAppUser user, int version)
    {
        var identityUser = (AppIdentityUser)user;

        identityUser.AcceptedSpotifyNoticeVersion = version;
        await userManager.UpdateAsync(identityUser);
    }

    public async Task<Result<bool>> SetDisplayedTagGroupsAsync(IAppUser user, List<string> tagGroupIds)
    {
        if (tagGroupIds.Count > 5)
            return Result<bool>.Failure(QueryError.UserSelectedTagGroupsTooMany);

        var identityUser = (AppIdentityUser)user;

        /* Normalize: trim each, drop empties and duplicates while preserving order. */
        var seen = new HashSet<string>();
        var normalized = new List<string>(tagGroupIds.Count);
        foreach (var raw in tagGroupIds)
        {
            if (string.IsNullOrWhiteSpace(raw))
                continue;
            var trimmed = raw.Trim();
            if (seen.Add(trimmed))
                normalized.Add(trimmed);
        }

        var newCsv = (normalized.Count == 0) ? null : string.Join(',', normalized);
        if (newCsv == identityUser.DisplayedTagGroupIdsCsv)
            return Result<bool>.Success(); // no change

        identityUser.DisplayedTagGroupIdsCsv = newCsv;
        await userManager.UpdateAsync(identityUser);

        return Result<bool>.Success();
    }

    // DELETE

    public async Task DeleteUserAsync(IAppUser user, MusicService musicService, MembershipService mshipService)
    {
        var userEntity = await userManager.Users
            .FirstOrDefaultAsync(u => u.Id == user.Id);

        if (userEntity is null)
            return;

        // removing all possible foreign keys (which could make some later deletes impossible)
        userEntity.SelectedPlaylistId = null;
        userEntity.selectedGroupId = null;
        userEntity.ownGroupId = null;
        await userManager.UpdateAsync(userEntity);

        // removing all the songs the identityUser created (together with all song accesses for them)
        await musicService.DeleteAllSongsByCreatorUserIdAsync(user.Id);

        // capture groupIds that will need to be notified that the user will no longer be a member
        var groupIdsToNotify = await musicService.GetGroupIdsByUserAsync(user.Id);

        // removing all group memberships for this identityUser
        await mshipService.DeleteAllGroupMemberShipsByUserIdAsync(user.Id);

        // removing all the groups the identityUser created (also their default group)
        var groups = await musicService.GetGroupsByCreatorUserAsync(user.Id);
        foreach (var group in groups)
        {
            groupIdsToNotify.Remove(group.Id); // no need to notify to-be-deleted groups
            await musicService.DeleteGroupAsync(group.Id, this);
        }

        // signal remaining groups from which the user got deleted
        foreach (var gid in groupIdsToNotify)
            await RTN.SendUserDeletedAsync(realTimeNotifier, gid, Guid.Parse(user.Id));

        // invalidating identityUser's JWT token
        await userManager.UpdateSecurityStampAsync(userEntity);

        // lastly, deleting the identityUser itself
        await userManager.DeleteAsync(userEntity);
    }

    // Misc (Identity related)

    public async Task<string> GenerateEmailConfirmationTokenAsync(IAppUser user)
    {
        return await userManager.GenerateEmailConfirmationTokenAsync((AppIdentityUser)user);
    }

    public async Task<string> GenerateEmailChangeTokenAsync(IAppUser user, string newEmail)
    {
        return await userManager.GenerateChangeEmailTokenAsync((AppIdentityUser)user, newEmail);
    }

    public async Task<string> GeneratePasswordResetTokenAsync(IAppUser user)
    {
        return await userManager.GeneratePasswordResetTokenAsync((AppIdentityUser)user);
    }

    public async Task<Result<IAppUser>> ConfirmEmailAsync(IAppUser user, string token)
    {
        var identityResult = await userManager.ConfirmEmailAsync((AppIdentityUser)user, token);
        if (identityResult.Errors.Any())
        {
            var errors = identityResult.Errors.Select(e => e.Description);
            return Result<IAppUser>.Failure(IdentityErrors.Create(errors));
        }
        
        return Result<IAppUser>.Success(user);
    }

    public async Task<Result<bool>> ConfirmEmailChangeAsync(IAppUser user, string token, string newEmail)
    {
        var identityUser = (AppIdentityUser)user;
        var identityResult = await userManager.ChangeEmailAsync(identityUser, newEmail, token);
        if (identityResult.Errors.Any())
        {
            var errors = identityResult.Errors.Select(e => e.Description);
            return Result<bool>.Failure(IdentityErrors.Create(errors));
        }

        // Invalidate JWT for this user (the old token is now bound to a stale email)
        await userManager.UpdateSecurityStampAsync(identityUser);
        
        return Result<bool>.Success();
    }

    public async Task<LoginOutcome> PasswordSignInAsync(IAppUser user, string password)
    {
        var signInResult = await signInManager.PasswordSignInAsync((AppIdentityUser)user, password, isPersistent: false, lockoutOnFailure: true);
        if (signInResult.IsNotAllowed)
            return LoginOutcome.EmailUnconfirmed;
        if (signInResult.IsLockedOut)
            return LoginOutcome.LockedOut;
        
        return signInResult.Succeeded ? LoginOutcome.Success : LoginOutcome.WrongCredentials;
    }

    public async Task<bool> IsLockedOutAsync(IAppUser user)
    {
        return await userManager.IsLockedOutAsync((AppIdentityUser)user);
    }

    public async Task<bool> IsSecurityStampUpToDateAsync(IAppUser user, string? tokenStamp)
    {
        if (string.IsNullOrEmpty(tokenStamp))
            return false;

        // if they differ: account had a new login / explicit stamp rotation
        string currentStamp = await userManager.GetSecurityStampAsync((AppIdentityUser)user);
        return (tokenStamp == currentStamp);
    }

    public bool IsDataExportRateLimited(IAppUser user)
    {
        return
            user.LastDataExportAt != null &&
            user.LastDataExportAt > DateTime.UtcNow.AddDays(-1);
    }

    public (DateTime, int) GetDataExportAllowedAtAndSecondsRemaining(IAppUser user)
    {
        var lastExportAt = user.LastDataExportAt;
        var nextAllowedAt = (lastExportAt != null) ? lastExportAt.Value.AddDays(1) : DateTime.UtcNow;
        int secondsLeft = (int)Math.Ceiling((nextAllowedAt - DateTime.UtcNow).TotalSeconds);
        return (nextAllowedAt, secondsLeft);
    }

    public async Task RevokeAllPreviousTokensAsync(IAppUser user)
    {
        await userManager.UpdateSecurityStampAsync((AppIdentityUser)user);
    }
    
    public async Task DeselectGroupForAllUsersAsync(Guid groupId)
    {
        var affectedUsersList = await userManager.Users
            .Where(user => user.selectedGroupId == groupId)
            .ToListAsync();

        foreach (var user in affectedUsersList)
        {
            user.selectedGroupId = user.OwnGroupId;
            await userManager.UpdateAsync(user);
        }
    }

    public async Task DeselectPlaylistForAllUsersAsync(Guid playlistId)
    {
        var affectedUsersList = await userManager.Users
            .Where(user => user.SelectedPlaylistId == playlistId)
            .ToListAsync();

        foreach (var user in affectedUsersList)
        {
            user.SelectedPlaylistId = null;
            await userManager.UpdateAsync(user);
        }
    }

    // private helpers

    // Parses the persisted CSV column into a clean ordered List<string>.
    private static List<string> ParseDisplayedTagGroupIdsCsv_(string? csv)
    {
        // NULL/empty -> empty list
        if (string.IsNullOrWhiteSpace(csv))
            return new List<string>();

        var result = new List<string>();
        foreach (var part in csv.Split(',', StringSplitOptions.RemoveEmptyEntries)) // preserving order but dropping empties
        {
            var trimmed = part.Trim();
            if (trimmed.Length > 0) result.Add(trimmed);
        }
        return result;
    }
}
