using SetUsUpBE.Domain.Primitives;
using SetUsUpBE.Domain.Entities;
using SetUsUpBE.Application.DTOs.Inbound;

namespace SetUsUpBE.Application.Mapper.DTOToDomain;

public static partial class GroupExtensions
{
    public static Result<Group> ToDomain(this CreateGroupDto dto)
    {
        return Group.Create(
            isUserCreated: true, // hardcoded true: users can only create groups with IsUserCreated set to true
            name: dto.Name
        );
    }
}
