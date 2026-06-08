using SetUsUpBE.Application.DTOs.Outbound;
using SetUsUpBE.Infrastructure.DataEntities;

namespace SetUsUpBE.Infrastructure.Mapper.DataToDTO;

public static partial class SongExtensions
{
    public static ReadSongDto ToDto(this SongData data, string? spotifySongId = null,
        IEnumerable<string>? tagIds = null)
    {
        return new ReadSongDto()
        {
            Id = data.Id,
            Artist = data.Artist,
            Title = data.Title,
            Bpm = data.Bpm,
            BpmOut = data.BpmOut,
            InitKey = data.InitKey,
            SpotifySongId = spotifySongId,
            TagIds = (tagIds ?? Enumerable.Empty<string>())
                .OrderBy(id => id, StringComparer.Ordinal)
                .ToList()
        };
    }

    public static ReadSongDetailDto ToDto(this SongData data, bool canEditUI,
        string? spotifySongId = null, IEnumerable<string>? tagIds = null)
    {
        return new ReadSongDetailDto()
        {
            Id = data.Id,
            Artist = data.Artist,
            Title = data.Title,
            Duration = data.Duration,
            Bpm = data.Bpm,
            BpmOut = data.BpmOut,
            InitKey = data.InitKey,
            CanEditUI = canEditUI,
            SpotifySongId = spotifySongId,
            TagIds = (tagIds ?? Enumerable.Empty<string>())
                .OrderBy(id => id, StringComparer.Ordinal)
                .ToList()
        };
    }
}
