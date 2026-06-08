using SetUsUpBE.Application.DTOs.Outbound;
using SetUsUpBE.Infrastructure.DataEntities;

namespace SetUsUpBE.Infrastructure.Mapper.DataToDTO;

public static partial class PlaylistEntryExtensions
{
    public static ReadPlaylistEntryDto ToDto(this PlaylistEntryData data, ReadSongDto songDto,
        decimal? averageRating, int totalRaters)
    {
        return new ReadPlaylistEntryDto()
        {
            Id = data.Id,
            Nr = data.Nr,
            TransitionToNext = data.TransitionToNext,
            Duration = (data.End - data.Start).ToString(@"hh\:mm\:ss"),
            HexColour = data.HexColour,
            CreatorUserName = data.CreatorUser.UserName,
            WithPrev = data.WithPrev,
            AverageRating = averageRating,
            TotalRaters = totalRaters,
            Song = songDto
        };
    }

    public static ReadPlaylistEntryDetailDto ToDto(this PlaylistEntryData data, ReadSongDetailDto songDto,
        bool canEditUI, bool canDeleteUI, decimal bpmChange, decimal? averageRating, int totalRaters, int? myRating)
    {
        return new ReadPlaylistEntryDetailDto()
        {
            Id = data.Id,
            Nr = data.Nr,
            TransitionToNext = data.TransitionToNext,
            Start = data.Start,
            End = data.End,
            Duration = (data.End - data.Start).ToString(@"hh\:mm\:ss"),
            HexColour = data.HexColour,
            Comment = data.Comment,
            CreatorUserName = data.CreatorUser.UserName,
            CanEditUI = canEditUI,
            CanDeleteUI = canDeleteUI,
            WithPrev = data.WithPrev,
            BpmChange = bpmChange,
            AverageRating = averageRating,
            TotalRaters = totalRaters,
            MyRating = myRating,
            Song = songDto
        };
    }
}
