using SetUsUpBE.Domain.Primitives;
using SetUsUpBE.Domain.Entities;
using SetUsUpBE.Application.DTOs.Inbound;

namespace SetUsUpBE.Application.Mapper.DTOToDomain;

public static partial class PlaylistExtensions
{
    public static Result<Playlist> ToDomain(this CreatePlaylistDto dto, Group group)
    {
        return Playlist.Create(
            ownerGroup: group,
            name: dto.Name,
            description: dto.Description
        );
    }
}
