using SetUsUpBE.Application.DTOs.Inbound;
using SetUsUpBE.Application.DTOs.Outbound;
using SetUsUpBE.Domain.Entities;
using SetUsUpBE.Domain.Primitives;
using System.Drawing;

namespace SetUsUpBE.Application.Mapper.DTOToDomain;

public static partial class PlaylistEntryExtensions
{
    public static Result<PlaylistEntry> ToDomain(this CreatePlaylistEntryDto dto, Song song, Playlist playlist)
    {
        TimeOnly? startTime = TimeOnlyParsed(dto.StartTime);
        TimeOnly? endTime = TimeOnlyParsed(dto.EndTime);
        if (startTime is null || endTime is null)
            return Result<PlaylistEntry>.Failure(Error.SongInvalidFormat);

        Color? clr = null;
        if (dto.HexColour is not null)
            clr = ColorTranslator.FromHtml($"#{dto.HexColour}");

        return PlaylistEntry.Create(
            songRef: song,
            parentPlaylist: playlist,
            start: (TimeOnly)startTime!,
            end: (TimeOnly)endTime!,
            comment: dto.Comment,
            colour: clr
        );
    }

    public static ReadPlaylistEntryRatingDto BuildRatingDto(decimal? averageRating, int totalRaters, int? myRating)
    {
        return new ReadPlaylistEntryRatingDto()
        {
            AverageRating = averageRating,
            TotalRaters = totalRaters,
            MyRating = myRating
        };
    }

    public static TimeOnly? TimeOnlyParsed(string timeStr)
    {
        TimeOnly timeOnly;
        if (!TimeOnly.TryParse(timeStr, out timeOnly))
            return null;

        return timeOnly;
    }
}
