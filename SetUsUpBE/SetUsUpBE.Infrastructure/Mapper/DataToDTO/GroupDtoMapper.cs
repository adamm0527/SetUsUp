using SetUsUpBE.Application.Services.Primitives;
using SetUsUpBE.Application.DTOs.Outbound;
using SetUsUpBE.Infrastructure.DataEntities;

namespace SetUsUpBE.Infrastructure.Mapper.DataToDTO;

public static partial class GroupExtensions
{
    public static ReadGroupDto ToDto(this GroupData data, RoleType role, List<string> members)
    {
        return new ReadGroupDto()
        {
            Id = data.Id,
            Name = data.Name,
            Role = role,
            MemberCount = members.Count,
            MemberNames = members,
            IsPersonal = !data.IsUserCreated
        };
    }

    public static ReadGroupDetailDto ToDto(this GroupData data, RoleType role,
        List<UserInfo> allMembers, List<UserInfo> admins, string creatorName)
    {
        List<RolePair> rolePairs = new List<RolePair>();
        foreach (var userInfo in allMembers)
        {
            if (userInfo.Name == creatorName)
                rolePairs.Add(new RolePair(UserInfo: userInfo, Role: RoleType.Creator));
            else if (admins.Contains(userInfo))
                rolePairs.Add(new RolePair(UserInfo: userInfo, Role: RoleType.Admin));
            else
                rolePairs.Add(new RolePair(UserInfo: userInfo, Role: RoleType.Member));
        }

        return new ReadGroupDetailDto()
        {
            Id = data.Id,
            Name = data.Name,
            Role = role,
            MemberCount = allMembers.Count,
            Members = rolePairs,
            IsPersonal = !data.IsUserCreated
        };
    }
}
