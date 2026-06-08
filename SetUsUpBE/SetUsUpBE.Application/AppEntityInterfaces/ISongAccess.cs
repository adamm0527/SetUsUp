namespace SetUsUpBE.Application.AppEntityInterfaces;

public interface ISongAccess
{
    string CreatorUserId { get; set; }
    Guid SongId { get; set; }
    Guid GroupId { get; set; }
}
