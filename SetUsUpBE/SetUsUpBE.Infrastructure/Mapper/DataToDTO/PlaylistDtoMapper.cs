using SetUsUpBE.Application.DTOs.Outbound;
using SetUsUpBE.Infrastructure.DataEntities;

namespace SetUsUpBE.Infrastructure.Mapper.DataToDTO;

public static partial class PlaylistExtensions
{
    public static ReadPlaylistDto ToDto(this PlaylistData data)
    {
        return new ReadPlaylistDto()
        {
            Id = data.Id,
            Name = data.Name,
            Description = data.Description,
            CreatorUserName = data.CreatorUser.UserName
        };
    }

    public static ReadPlaylistDetailDto ToDto(this PlaylistData data, int entryCount, bool canEditUI)
    {
        return new ReadPlaylistDetailDto()
        {
            Id = data.Id,
            Name = data.Name,
            Description = data.Description,
            CreatorUserName = data.CreatorUser.UserName,
            Duration = data.Duration.ToString(@"hh\:mm\:ss"),
            EntryCount = entryCount,
            CanEditUI = canEditUI
        };
    }
}
