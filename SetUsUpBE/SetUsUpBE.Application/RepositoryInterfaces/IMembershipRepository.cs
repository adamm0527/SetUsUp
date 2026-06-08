using SetUsUpBE.Application.AppEntityInterfaces;
using SetUsUpBE.Application.DTOs.Outbound;
using SetUsUpBE.Application.Services.Primitives;

namespace SetUsUpBE.Application.RepositoryInterfaces;

public interface IMembershipRepository
{
    #region GroupMembership related interface methods

    // CREATE

    Task AddGroupMemberAsync(bool isAdmin, string userId, Guid groupId);

    // READ

    Task<IGroupMembership?> GetGroupMembershipAsync(string userId, Guid groupId);

    Task<RoleType?> GetGroupMembershipRoleTypeAsync(string userId, Guid groupId);

    // UPDATE

    Task UpdateGroupMembershipAdminStatusAsync(string userId, Guid groupId, bool isPromotion);

    // DELETE

    Task DeleteGroupMembershipAsync(string userId, Guid groupId);

    Task DeleteAllGroupMembershipsByGroupIdAsync(Guid groupId);

    Task DeleteAllGroupMemberShipsByUserIdAsync(string userId);

    #endregion

    #region SongAccess related interface methods

    // CREATE

    Task AddSongAccessAsync(Guid songId, Guid groupId, string creatorUserId);

    // READ

    Task<List<ISongAccess>> GetSongAccessesAsync(Guid songId);

    Task<List<ReadSongAccessDto>> GetSongAccessReadDtosAsync(Guid songId);

    // DELETE

    Task DeleteSongAccessAsync(Guid songId, Guid groupId);

    Task DeleteAllSongAccessesByGroupIdAsync(Guid groupId);

    #endregion
}
