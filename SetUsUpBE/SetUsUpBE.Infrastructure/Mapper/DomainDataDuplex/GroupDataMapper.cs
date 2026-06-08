using SetUsUpBE.Domain.Entities;
using SetUsUpBE.Infrastructure.DataEntities;

namespace SetUsUpBE.Infrastructure.Mapper.DomainDataDuplex;

public static partial class GroupExtension
{
    public static GroupData ToData(this Group group, string creatorUserId)
    {
        return new GroupData()
        {
            Id = group.Id,
            Name = group.GetName(),
            IsUserCreated = group.IsUserCreated,
            CreatorUserId = creatorUserId
        };
    }

    public static Group ToDomain(this GroupData groupData)
    {
        return Group.Create(
            isUserCreated: groupData.IsUserCreated,
            name: groupData.Name,
            id: groupData.Id
        ).Value!;
    }
}
