using SetUsUpBE.Domain.Entities;
using SetUsUpBE.Infrastructure.DataEntities;

namespace SetUsUpBE.Infrastructure.Mapper.DomainDataDuplex;

public static partial class PlaylistExtensions
{
    public static PlaylistData ToData(this Playlist playlist, string creatorUserId, List<PlaylistEntryData> entries)
    {
        var playlistData = new PlaylistData()
        {
            Id = playlist.Id,
            Name = playlist.GetName(),
            Description = playlist.GetDescription(),
            Duration = playlist.GetDuration(),
            GroupId = playlist.GetOwnerGroup().Id,
            CreatorUserId = creatorUserId,
            Entries = new List<PlaylistEntryData>()
        };

        for (int i = 0; i < entries.Count; i++)
        {
            playlistData.Entries.Add(entries[i]);
        }

        return playlistData;
    }

    public static Playlist ToDomain(this PlaylistData playlistData)
    {
        var group = playlistData.Group.ToDomain();

        var playlist = Playlist.Create(
            ownerGroup: group,
            name: playlistData.Name,
            description: playlistData.Description,
            id: playlistData.Id
        ).Value!;

        foreach (var entry in playlistData.Entries.OrderBy(e => e.Nr))
        {
            playlist.AddEntryAt(entry.ToDomain(playlist));
        }

        return playlist;
    }
}
