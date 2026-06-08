namespace SetUsUpBE.Application.Services.Primitives;

public enum RoleType
{ 
    Member = 0,
    Admin = 1,
    Creator = 2
}

public static class RoleTypeExtensions
{
    public static string ToStringRepresentation(this RoleType role)
    {
        switch (role)
        {
            case RoleType.Member:   return "Member";
            case RoleType.Admin:    return "Admin";
            case RoleType.Creator:  return "Creator";
            default:
                throw new ArgumentException("Invalid RoleType.");
        }
    }
}
