using SetUsUpBE.Domain.Entities;
using SetUsUpBE.Infrastructure.DataEntities;

namespace SetUsUpBE.Infrastructure.Mapper.DomainDataDuplex;

public static partial class SongExtension
{
    public static SongData ToData(this Song song)
    {
        return new SongData()
        {
            Id = song.Id,
            Artist = song.GetArtist(),
            Title = song.GetTitle(),
            Duration = song.GetDuration(),
            Bpm = song.GetBpm(),
            BpmOut = song.GetBpmOut(),
            InitKey = song.IsKeySet() ? song.GetInitKey()!.Value : null,
        };
    }

    public static Song ToDomain(this SongData songData)
    {
        return Song.Create(
            artist: songData.Artist,
            title: songData.Title,
            duration: songData.Duration,
            bpm: songData.Bpm,
            bpmOut: songData.BpmOut,
            initKeyStr: songData.InitKey,
            id: songData.Id
        ).Value!;
    }
}
