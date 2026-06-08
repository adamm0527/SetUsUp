using SetUsUpBE.Domain.Primitives;
using SetUsUpBE.Domain.Entities;
using SetUsUpBE.Application.DTOs.Inbound;

namespace SetUsUpBE.Application.Mapper.DTOToDomain;

public static partial class SongExtension
{
    public static Result<Song> ToDomain(this CreateSongDto dto)
    {
        TimeOnly? duration = PlaylistEntryExtensions.TimeOnlyParsed(dto.Duration);
        if (duration is null)
            return Result<Song>.Failure(Error.SongInvalidFormat);

        return Song.Create(
            artist: dto.Artist,
            title: dto.Title,
            duration: (TimeOnly)duration!,
            bpm: dto.Bpm,
            bpmOut: dto.BpmOut,
            initKeyStr: dto.InitKey
        );
    }
}
