using SetUsUpBE.Domain.Primitives;
using SetUsUpBE.Application.AppEntityInterfaces;
using SetUsUpBE.Application.DTOs.Outbound;
using SetUsUpBE.Application.RepositoryInterfaces;
using SetUsUpBE.Application.ServiceInterfaces;
using SetUsUpBE.Application.Services.Primitives;

namespace SetUsUpBE.Application.Services;

public sealed class MembershipService
{
    private readonly IMembershipRepository mshipRepo;
    private readonly IMusicRepository musicRepo;
    private readonly IRealTimeNotifierService realTimeNotifier;

    public MembershipService(IMembershipRepository mshipRepo, IMusicRepository musicRepo, IRealTimeNotifierService realTimeNotifier)
    {
        this.mshipRepo = mshipRepo;
        this.musicRepo = musicRepo;
        this.realTimeNotifier = realTimeNotifier;
    }

    #region GroupMembership related tasks

    // CREATE

    public async Task AddAdminMembershipAsync(string userId, Guid groupId)
    {
        await mshipRepo.AddGroupMemberAsync(true, userId, groupId);

        // signalling the newly-added user (so their client joins the SignalR channel "Group")
        await RTN.SendUserAddedToGroupAsync(realTimeNotifier, groupId, userId);

        // signalling existing members so their open Group detail views refresh
        await RTN.SendGroupMembershipChangedAsync(realTimeNotifier, groupId);
    }

    public async Task AddNonAdminMembershipAsync(string userId, Guid groupId)
    {
        await mshipRepo.AddGroupMemberAsync(false, userId, groupId);

        // signalling the newly-added user (so their client joins the SignalR channel "Group")
        await RTN.SendUserAddedToGroupAsync(realTimeNotifier, groupId, userId);

        // signalling existing members so their open Group detail views refresh
        await RTN.SendGroupMembershipChangedAsync(realTimeNotifier, groupId);
    }

    // READ

    public async Task<bool> IsMemberAsync(string userId, Guid groupId)
    {
        return await mshipRepo.GetGroupMembershipAsync(userId, groupId) is not null;
    }

    public async Task<bool> IsCreatorAsync(string userId, Guid groupId)
    {
        var membership = await mshipRepo.GetGroupMembershipRoleTypeAsync(userId, groupId);
        if (membership is null)
            return false;

        return (membership == RoleType.Creator);
    }

    public async Task<Result<bool>> IsAtLeastAdminAsync(string userId, Guid groupId)
    {
        var membership = await mshipRepo.GetGroupMembershipAsync(userId, groupId);
        if (membership is null)
            return Result<bool>.Failure(QueryError.UserNonExistentId);

        return Result<bool>.Success(membership.IsAdmin);
    }

    // WARNING: comparedUserId should be checked beforehand to be a member of the group
    public async Task<Result<RoleType>> HasHigherAdminPrivilegeAsync(string userId, string comparedUserId, Guid groupId)
    {
        var userPrivilege = await mshipRepo.GetGroupMembershipRoleTypeAsync(userId, groupId);
        if (userPrivilege is null)
            return Result<RoleType>.Failure(QueryError.GroupNoAccess);

        if (userPrivilege == RoleType.Member)
            return Result<RoleType>.Failure(QueryError.UserNotAdminInGroup);

        if (userPrivilege == RoleType.Creator) // there can only be one creator per group
            return Result<RoleType>.Success(RoleType.Creator); // so the creator can always kick everyone from the group

        // now the user can only be Admin
        var comparedUserPrivilege = await mshipRepo.GetGroupMembershipRoleTypeAsync(comparedUserId, groupId);
        return (userPrivilege > comparedUserPrivilege)
            ? Result<RoleType>.Success(RoleType.Admin)
            : Result<RoleType>.Failure(QueryError.GroupForbiddenAdminKick);
    }

    // UPDATE

    public async Task UpdateUserAdminStatusAsync(string userId, Guid groupId, bool isPromotion)
    {
        await mshipRepo.UpdateGroupMembershipAdminStatusAsync(userId, groupId, isPromotion);

        // signalling all members so their open Group detail views show the new role
        await RTN.SendGroupMembershipChangedAsync(realTimeNotifier, groupId);
    }

    // DELETE

    public async Task DeleteGroupMembershipAsync(string userId, Guid groupId)
    {
        await mshipRepo.DeleteGroupMembershipAsync(userId, groupId);

        // signalling for the leaving/kicked client to leave this SignalR channel ("Group")
        await RTN.SendUserRemovedFromGroupAsync(realTimeNotifier, groupId, userId);

        // signalling remaining members so their open Group detail views drop the row
        await RTN.SendGroupMembershipChangedAsync(realTimeNotifier, groupId);
    }

    public async Task DeleteAllGroupMemberShipsByUserIdAsync(string userId)
    {
        await mshipRepo.DeleteAllGroupMemberShipsByUserIdAsync(userId);

        // signalling not needed for leaving SignalR channels ("Groups"), because their whole connection will automatically cease
    }

    #endregion

    #region SongAccess related tasks

    // CREATE

    // WARNING: existence of the song and the group must be checked before calling this function
    public async Task<Result<ISongAccess>> ShareSongAccessAsync(IAppUser queryUser, Guid songId, Guid groupId)
    {
        var songAccessList = await mshipRepo.GetSongAccessesAsync(songId);
        if (songAccessList.Count == 0)
            return Result<ISongAccess>.Failure(QueryError.SongNonExistentId);

        var alreadyExistingAccess = songAccessList.FirstOrDefault(sa => sa.GroupId == groupId);
        if (alreadyExistingAccess is not null)
            return Result<ISongAccess>.Failure(QueryError.GroupAlreadyHasSongAccess);

        var userAccess = songAccessList.FirstOrDefault(sa => sa.GroupId == queryUser.SelectedGroupId);
        if (userAccess is null)
            return Result<ISongAccess>.Failure(QueryError.SongNoAccess);

        var groupExists = await musicRepo.IsExistingGroupAsync(groupId);
        if (!groupExists)
            return Result<ISongAccess>.Failure(QueryError.GroupNonExistentId);

        var userGroupMembership = await mshipRepo.GetGroupMembershipAsync(queryUser.Id, groupId);
        if (userGroupMembership is null)
            return Result<ISongAccess>.Failure(QueryError.GroupNoAccessToShare);


        await mshipRepo.AddSongAccessAsync(songId, groupId, userAccess.CreatorUserId);

        // signal: the song APPEARED in the target group, and OTHER groups (already with access)
        // need to refresh their sharing UI to show the new group in the "currently shared with" list.
        await RTN.SendSongCreatedAsync(realTimeNotifier, groupId, songId);
        foreach (var other in songAccessList) // snapshot is from BEFORE the new access (everyone of them is "other")
        {
            await RTN.SendSongUpdatedAsync(realTimeNotifier, other.GroupId, songId);
        }

        return Result<ISongAccess>.Success();
    }

    // UPDATE

    public async Task<Result<List<ReadSongAccessDto>>> GetSongAccessListAsync(Guid songId, IAppUser queryUser)
    {
        var accesses = await mshipRepo.GetSongAccessesAsync(songId);
        if (accesses.Count == 0)
            return Result<List<ReadSongAccessDto>>.Failure(QueryError.SongNonExistentId);

        // only members of one of the groups that have access may see this list
        var callerAccess = accesses.FirstOrDefault(sa => sa.GroupId == queryUser.SelectedGroupId);
        if (callerAccess is null)
            return Result<List<ReadSongAccessDto>>.Failure(QueryError.SongNoAccess);

        var list = await mshipRepo.GetSongAccessReadDtosAsync(songId);
        return Result<List<ReadSongAccessDto>>.Success(list);
    }

    // DELETE

    public async Task<Result<bool>> DeleteSongAccessAsync(Guid songId, Guid groupId, IAppUser queryUser)
    {
        var songAccessList = await mshipRepo.GetSongAccessesAsync(songId);
        if (songAccessList.Count == 0)
            return Result<bool>.Failure(QueryError.SongNonExistentId);

        var groupExists = await musicRepo.IsExistingGroupAsync(groupId);
        if (!groupExists)
            return Result<bool>.Failure(QueryError.GroupNonExistentId);

        var groupAccess = songAccessList.FirstOrDefault(sa => sa.GroupId == groupId);
        if (groupAccess is null)
            return Result<bool>.Failure(QueryError.GroupNonExistentSongAccess);

        var userAccess = songAccessList.FirstOrDefault(sa => sa.CreatorUserId == queryUser.Id);
        if (userAccess is null)
            return Result<bool>.Failure(QueryError.SongAccessCannotRevoke);

        if (groupId == queryUser.OwnGroupId)
            return Result<bool>.Failure(QueryError.SongAccessCannotRevokeOwn);


        // removing all related playlist entries
        var relatedEntryList = await musicRepo.GetAllPlaylistEntriesBySongAccessAsync(groupAccess);
        if (relatedEntryList.Count > 0)
        {
            var parentPlaylist = relatedEntryList[0].GetParentPlaylist();
            foreach (var entry in relatedEntryList)
            {
                if (parentPlaylist.Id != entry.GetParentPlaylist().Id)
                    parentPlaylist = entry.GetParentPlaylist();

                var entryNr = parentPlaylist.FindEntryNr(entry.Id);
                await musicRepo.DeletePlaylistEntryAsync(entry.Id);

                parentPlaylist.RemoveEntryAt(entryNr - 1);
                await musicRepo.UpdatePlaylistWithEntriesAsync(parentPlaylist);
            }
        }

        await mshipRepo.DeleteSongAccessAsync(songId, groupId);

        // signal: the song DISAPPEARED for the revoked group, and OTHER groups (still with access)
        // need to refresh their sharing UI to drop the revoked group from the "currently shared with" list.
        await RTN.SendSongDeletedAsync(realTimeNotifier, groupId, songId);
        foreach (var other in songAccessList) // snapshot is from BEFORE the deletion, so WE SKIP the REVOKED group
        {
            if (other.GroupId == groupId) continue;
            await RTN.SendSongUpdatedAsync(realTimeNotifier, other.GroupId, songId);
        }

        return Result<bool>.Success(true);
    }

    #endregion
}
