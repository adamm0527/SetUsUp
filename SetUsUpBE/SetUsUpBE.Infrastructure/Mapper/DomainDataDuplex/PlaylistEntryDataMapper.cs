using System.Drawing;
using SetUsUpBE.Domain.Entities;
using SetUsUpBE.Infrastructure.DataEntities;

namespace SetUsUpBE.Infrastructure.Mapper.DomainDataDuplex;

public static partial class PlaylistEntryExtensions
{
    public static PlaylistEntryData ToData(this PlaylistEntry playlistEntry, Guid playlistId, string creatorUserId)
    {
        string? transitionStr = null;
        if (playlistEntry.GetTransitionToNext() is not null)
            transitionStr = playlistEntry.GetTransitionToNext()!.Value;

        string? hexColourStr = null;
        if (playlistEntry.GetColour() is not null)
        {
            Color c = (Color)playlistEntry.GetColour()!;
            hexColourStr = $"{c.A:X2}{c.R:X2}{c.G:X2}{c.B:X2}";
        }

        return new PlaylistEntryData()
        {
            Id = playlistEntry.Id,
            Nr = playlistEntry.GetNr(),
            Start = playlistEntry.GetStart(),
            End = playlistEntry.GetEnd(),
            TransitionToNext = transitionStr,
            HexColour = hexColourStr,
            Comment = playlistEntry.GetComment(),
            WithPrev = playlistEntry.GetWithPrev(),
            BpmChange = playlistEntry.GetBpmChange(),
            SongId = playlistEntry.GetSong().Id,
            PlaylistId = playlistId,
            CreatorUserId = creatorUserId
        };
    }

    public static PlaylistEntry ToDomain(this PlaylistEntryData playlistEntryData, Playlist playlist)
    {
        var song = playlistEntryData.Song.ToDomain();

        Color? clr = null;
        if (playlistEntryData.HexColour is not null)
            clr = ColorTranslator.FromHtml($"#{playlistEntryData.HexColour}");

        var playlistEntryResult = PlaylistEntry.Create(
            songRef: song,
            parentPlaylist: playlist,
            start: playlistEntryData.Start,
            end: playlistEntryData.End,
            comment: playlistEntryData.Comment,
            colour: clr,
            id: playlistEntryData.Id,
            nr: playlistEntryData.Nr,
            withPrev: playlistEntryData.WithPrev,
            bpmChange: playlistEntryData.BpmChange
        );

        if (playlistEntryResult.HasFailed) // this can happen when the referenced song's duration is reduced
        {
            playlistEntryResult = PlaylistEntry.Create(
                songRef: song,
                parentPlaylist: playlist,
                start: TimeOnly.FromDateTime(DateTime.MinValue),
                end: song.GetDuration(), // setting safe duration when Song duration was reduced
                comment: playlistEntryData.Comment,
                colour: clr,
                id: playlistEntryData.Id,
                nr: playlistEntryData.Nr,
                withPrev: playlistEntryData.WithPrev,
                bpmChange: playlistEntryData.BpmChange
            );
        }

        return playlistEntryResult.Value!;
    }
}
