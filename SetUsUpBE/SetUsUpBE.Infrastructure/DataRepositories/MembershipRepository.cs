using Microsoft.EntityFrameworkCore;
using SetUsUpBE.Application.AppEntityInterfaces;
using SetUsUpBE.Application.DTOs.Outbound;
using SetUsUpBE.Application.RepositoryInterfaces;
using SetUsUpBE.Application.Services.Primitives;
using SetUsUpBE.Infrastructure.DataEntities;
using SetUsUpBE.Infrastructure.DataRepositories.Primitives;
using SetUsUpBE.Infrastructure.DbContext;

namespace SetUsUpBE.Infrastructure.DataRepositories;

public sealed class MembershipRepository : DataRepositoryBase<AppDbContext>, IMembershipRepository
{
    public MembershipRepository(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    #region GroupMembership related methods

    // CREATE

    public async Task AddGroupMemberAsync(bool isAdmin, string userId, Guid groupId)
    {
        using var context = new AppDbContext(options);

        var membershipData = new GroupMembershipData()
        {
            IsAdmin = isAdmin,
            UserId = userId,
            GroupId = groupId
        };
        context.GroupMemberships.Add(membershipData);
        await context.SaveChangesAsync();
    }

    // READ

    public async Task<IGroupMembership?> GetGroupMembershipAsync(string userId, Guid groupId)
    {
        using var context = new AppDbContext(options);

        var groupMembership = await context.GroupMemberships
            .AsNoTracking()
            .FirstOrDefaultAsync(gm => gm.UserId == userId && gm.GroupId == groupId);

        return groupMembership;
    }

    public async Task<RoleType?> GetGroupMembershipRoleTypeAsync(string userId, Guid groupId)
    {
        using var context = new AppDbContext(options);

        var groupMembership = await context.GroupMemberships
            .AsNoTracking()
            .Include(gm => gm.Group)
            .FirstOrDefaultAsync(gm => gm.UserId == userId && gm.GroupId == groupId);

        if (groupMembership is null)
            return null;

        if (groupMembership.Group.CreatorUserId == userId)
            return RoleType.Creator;

        return (groupMembership.IsAdmin) ? RoleType.Admin : RoleType.Member;
    }

    // UPDATE

    // Warning: the provided user must be a member of the group (have to be previously checked before calling this function)
    public async Task UpdateGroupMembershipAdminStatusAsync(string userId, Guid groupId, bool isPromotion)
    {
        using var context = new AppDbContext(options);

        var groupMembership = await context.GroupMemberships
            .FirstAsync(gm => gm.UserId == userId && gm.GroupId == groupId);

        groupMembership.IsAdmin = isPromotion;
        await context.SaveChangesAsync();
    }

    // DELETE

    public async Task DeleteGroupMembershipAsync(string userId, Guid groupId)
    {
        using var context = new AppDbContext(options);

        var groupMembership = await context.GroupMemberships
            .FirstOrDefaultAsync(gm => gm.UserId == userId && gm.GroupId == groupId);

        if (groupMembership is not null)
        {
            context.Remove(groupMembership);
            await context.SaveChangesAsync();
        }
    }

    public async Task DeleteAllGroupMembershipsByGroupIdAsync(Guid groupId)
    {
        using var context = new AppDbContext(options);

        var memberships = await context.GroupMemberships
            .Where(gm => gm.GroupId == groupId)
            .ToListAsync();

        foreach (var membership in memberships)
        {
            context.Remove(membership);
            await context.SaveChangesAsync();
        }
    }

    public async Task DeleteAllGroupMemberShipsByUserIdAsync(string userId)
    {
        using var context = new AppDbContext(options);

        var memberships = await context.GroupMemberships
            .Where(gm => gm.UserId == userId)
            .ToListAsync();

        foreach (var membership in memberships)
        {
            context.Remove(membership);
            await context.SaveChangesAsync();
        }
    }

    #endregion

    #region SongAccess related methods

    // CREATE

    public async Task AddSongAccessAsync(Guid songId, Guid groupId, string creatorUserId)
    {
        using var context = new AppDbContext(options);

        var songAccessData = new SongAccessData()
        {
            SongId = songId,
            GroupId = groupId,
            CreatorUserId = creatorUserId
        };
        context.SongAccess.Add(songAccessData);
        await context.SaveChangesAsync();
    }

    // READ

    public async Task<List<ISongAccess>> GetSongAccessesAsync(Guid songId)
    {
        using var context = new AppDbContext(options);

        return await context.SongAccess
            .AsNoTracking()
            .Where(sa => sa.SongId == songId)
            .Select(sa => (ISongAccess)sa)
            .ToListAsync();
    }

    public async Task<List<ReadSongAccessDto>> GetSongAccessReadDtosAsync(Guid songId)
    {
        using var context = new AppDbContext(options);

        return await context.SongAccess
            .AsNoTracking()
            .Include(sa => sa.Group)
            .Where(sa => sa.SongId == songId)
            .OrderBy(sa => sa.Group.Name)
            .Select(sa => new ReadSongAccessDto
            {
                GroupId = sa.GroupId,
                GroupName = sa.Group.Name,
                /* A Group is the "Creator Group" for this Song if the Song's creator User IS the Group's creator User
                   (the default personal group created for all Users, where all their created Songs automatically go).*/
                IsCreatorGroup = sa.Group.CreatorUserId == sa.CreatorUserId && !sa.Group.IsUserCreated
            })
            .ToListAsync();
    }

    // DELETE

    public async Task DeleteSongAccessAsync(Guid songId, Guid groupId)
    {
        using var context = new AppDbContext(options);

        var songAccess = await context.SongAccess
            .FirstOrDefaultAsync(sa => sa.SongId == songId && sa.GroupId == groupId);

        if (songAccess is not null)
        {
            context.Remove(songAccess);
            await context.SaveChangesAsync();
        }
    }

    public async Task DeleteAllSongAccessesByGroupIdAsync(Guid groupId)
    { 
        using var context = new AppDbContext(options);

        var songAccesses = await context.SongAccess
            .Where(sa => sa.GroupId == groupId)
            .ToListAsync();

        foreach (var songAccess in songAccesses)
        {
            context.Remove(songAccess);
            await context.SaveChangesAsync();
        }
    }

    #endregion
}
