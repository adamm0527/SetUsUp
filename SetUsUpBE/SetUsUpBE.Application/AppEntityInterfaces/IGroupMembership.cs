namespace SetUsUpBE.Application.AppEntityInterfaces;

public interface IGroupMembership
{
    bool IsAdmin { get; set; }
    string UserId { get; set; }
    Guid GroupId { get; set; }
}
