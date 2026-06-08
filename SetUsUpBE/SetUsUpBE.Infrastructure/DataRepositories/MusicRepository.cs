using SetUsUpBE.Application.AppEntityInterfaces;
using SetUsUpBE.Application.DTOs.Outbound;
using SetUsUpBE.Application.RepositoryInterfaces;
using SetUsUpBE.Application.Services.Primitives;
using SetUsUpBE.Domain.Entities;
using SetUsUpBE.Domain.ValueObjects;
using SetUsUpBE.Infrastructure.DataEntities;
using SetUsUpBE.Infrastructure.DataRepositories.Primitives;
using SetUsUpBE.Infrastructure.DbContext;
using SetUsUpBE.Infrastructure.Mapper.DataToDTO;
using SetUsUpBE.Infrastructure.Mapper.DomainDataDuplex;
using Microsoft.EntityFrameworkCore;

namespace SetUsUpBE.Infrastructure.DataRepositories;

public sealed class MusicRepository : DataRepositoryBase<AppDbContext>, IMusicRepository
{
    public MusicRepository(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    #region Group related methods

    // CREATE

    public async Task<Guid> AddDefaultUserGroupAsync(IAppUser newUser)
    {
        using var context = new AppDbContext(options);

        /* This isn't a user-created group, cannot be replicated through the API, just by fresh registrations.
           (This group will be the automatically created personal User group, where all created Songs automatically go). */
        var groupResult = Group.Create(false, $"{newUser.UserName}'s collection");
        var groupData = groupResult.Value!.ToData(newUser.Id);
        context.Groups.Add(groupData);
        
        await context.SaveChangesAsync();
        return groupData.Id;
    }

    public async Task<Guid> AddGroupAsync(Group group, string creatorUserId)
    {
        using var context = new AppDbContext(options);

        var groupData = group.ToData(creatorUserId);
        context.Groups.Add(groupData);
        
        await context.SaveChangesAsync();
        return groupData.Id;
    }

    // READ

    public async Task<bool> IsExistingGroupAsync(Guid groupId)
    {
        using var context = new AppDbContext(options);
        return await context.Groups.AnyAsync(g => g.Id == groupId);
    }
    
    public async Task<bool> IsGroupNameTakenAsync(string groupName)
    {
        using var context = new AppDbContext(options);
        return await context.Groups.AnyAsync(g => g.Name == groupName);
    }
    
    public async Task<Group?> GetGroupByIdAsync(Guid groupId)
    {
        using var context = new AppDbContext(options);

        var groupData = await context.Groups
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == groupId);

        if (groupData is null)
            return null;

        return groupData.ToDomain();
    }

    public async Task<List<Group>> GetAllGroupsByCreatorUserIdAsync(string creatorUserId)
    {
        using var context = new AppDbContext(options);

        var groupDataList = await context.Groups
            .AsNoTracking()
            .Where(g => g.CreatorUserId == creatorUserId)
            .Select(g => g.ToDomain())
            .ToListAsync();

        return groupDataList;
    }

    // WARNING: doesn't check if the User is part of the Group (authorized), nor if the group exists, check these beforehand
    public async Task<ReadGroupDetailDto> GetGroupReadDtoByIdAsync(Guid id, string queryUserId)
    {
        using var context = new AppDbContext(options);

        var groupMemberships = await context.GroupMemberships
            .AsNoTracking()
            .Include(gm => gm.Group)
                .ThenInclude(g => g.CreatorUser)
            .Include(gm => gm.User)
            .Where(gm => gm.Group.Id == id)
            .ToListAsync();

        var group = groupMemberships[0].Group;
        var members = groupMemberships
            .OrderByDescending(gm => gm.IsAdmin)
                .ThenByDescending(gm => gm.Group.CreatorUserId == gm.UserId)
                .ThenBy(gm => gm.User.UserName)
            .Select(gm => new UserInfo(Id: gm.UserId, Name: gm.User.UserName)
            {
                InstagramAccount = gm.User.InstagramAccount
            })
            .ToList();
        
        var admins = groupMemberships.Where(gm => gm.IsAdmin)
            .Select(gm => new UserInfo(Id: gm.UserId, Name: gm.User.UserName)
            {
                InstagramAccount = gm.User.InstagramAccount
            }).ToList();
        
        RoleType role = RoleType.Member;
        if (group.CreatorUserId == queryUserId) role = RoleType.Creator;
        else if (groupMemberships.First(gm => gm.UserId == queryUserId).IsAdmin) role = RoleType.Admin;

        return group.ToDto(role, members, admins, group.CreatorUser.UserName);
    }

    public async Task<List<ReadGroupDto>> GetGroupReadDtosByUserAsync(string queryUserId)
    {
        using var context = new AppDbContext(options);

        var dtos = new List<ReadGroupDto>();
        var groupMemberships = await context.GroupMemberships
            .AsNoTracking()
            .Include(gm => gm.Group)
            .Include(gm => gm.User)
            .Where(gm => gm.UserId == queryUserId)
            .OrderByDescending(gm => gm.IsAdmin)
                .ThenByDescending(gm => gm.Group.CreatorUserId == queryUserId)
                .ThenByDescending(gm => !gm.Group.IsUserCreated)
                .ThenBy(gm => gm.Group.Name)
            .ToListAsync();

        foreach (var membership in groupMemberships)
        {
            RoleType role = RoleType.Member;
            if (membership.Group.CreatorUserId == queryUserId) role = RoleType.Creator;
            else if (membership.IsAdmin) role = RoleType.Admin;

            dtos.Add(membership.Group.ToDto(
                role: role,
                members: await context.GroupMemberships
                    .AsNoTracking()
                    .Include(gm => gm.Group)
                    .Include(gm => gm.User)
                    .Where(gm => gm.GroupId == membership.GroupId)
                    .OrderByDescending(gm => gm.IsAdmin)
                        .ThenByDescending(gm => gm.Group.CreatorUserId == gm.UserId)
                        .ThenBy(gm => gm.User.UserName)
                    .Select(gm => gm.User.UserName)
                    .ToListAsync()
            ));
        }
        return dtos;
    }

    public async Task<List<Guid>> GetGroupIdsByUserAsync(string userId)
    {
        using var context = new AppDbContext(options);
        return await context.GroupMemberships
            .AsNoTracking()
            .Where(gm => gm.UserId == userId)
            .Select(gm => gm.GroupId)
            .ToListAsync();
    }

    public async Task<string> GetGroupNameByIdAsync(Guid id)
    {
        using var context = new AppDbContext(options);

        return await context.Groups
            .AsNoTracking()
            .Where(g => g.Id == id)
            .Select(g => g.Name)
            .FirstAsync();
    }

    // UPDATE

    // WARNING: doesn't check whether a group exists with this Id (check beforehand)
    public async Task UpdateGroupNameAsync(Guid id, string newName)
    {
        using var context = new AppDbContext(options);

        var group = await context.Groups.FirstAsync(g => g.Id == id);

        group.Name = newName;
        await context.SaveChangesAsync();
    }

    // DELETE

    public async Task DeleteGroupAsync(Guid id)
    {
        using var context = new AppDbContext(options);

        var groupData = await context.Groups
            .FirstOrDefaultAsync(g => g.Id == id);

        if (groupData is not null)
        {
            context.Groups.Remove(groupData);
            await context.SaveChangesAsync();
        }
    }

    #endregion

    #region Song related methods
    
    // CREATE

    public async Task AddSongAsync(Song song)
    {
        using var context = new AppDbContext(options);

        var songData = song.ToData();
        context.Songs.Add(songData);
        await context.SaveChangesAsync();
    }

    // READ

    public async Task<Song?> GetSongByIdAsync(Guid id)
    {
        using var context = new AppDbContext(options);

        var songData = await context.Songs
            .AsNoTracking()
            .Where(s => s.Id == id)
            .FirstOrDefaultAsync();

        if (songData is null)
            return null;

        return songData.ToDomain();
    }

    public async Task<ReadSongDetailDto?> GetSongReadDtoByIdAsync(Guid id, ISongAccess songAccess, IAppUser queryUser)
    {
        using var context = new AppDbContext(options);

        var songData = await context.Songs
            .AsNoTracking()
            .Where(s => s.Id == id)
            .FirstOrDefaultAsync();

        if (songData is null)
            return null;

        // Pull Spotify link + Tag IDs alongside (separate small queries to avoid a heavy single LEFT JOIN)
        var spotifySongId = await context.SongSpotifyLinks
            .AsNoTracking()
            .Where(l => l.SongId == id)
            .Select(l => (string?)l.SpotifySongId)
            .FirstOrDefaultAsync();

        var tagIds = await context.SongTags
            .AsNoTracking()
            .Where(st => st.SongId == id)
            .Select(st => st.TagId)
            .ToListAsync();

        return songData.ToDto(
            canEditUI: songAccess.CreatorUserId == queryUser.Id,
            spotifySongId: spotifySongId,
            tagIds: tagIds);
    }

    public async Task<List<ReadSongDetailDto>> GetAllSongReadDtosAsync(IAppUser queryUser)
    {
        using var context = new AppDbContext(options);

        // Load all SongAccess (joined with Song) for the user's selected group
        var accesses = await context.SongAccess
            .AsNoTracking()
            .Include(sa => sa.Song)
            .Where(sa => sa.GroupId == queryUser.SelectedGroupId)
            .OrderBy(sa => sa.Song.Artist)
                .ThenBy(sa => sa.Song.Title)
            .ToListAsync();

        if (accesses.Count == 0)
            return new List<ReadSongDetailDto>();

        var songIds = accesses.Select(a => a.SongId).ToList();

        // Spotify links for all these songs (id -> spotifySongId)
        var spotifyMap = await context.SongSpotifyLinks
            .AsNoTracking()
            .Where(l => songIds.Contains(l.SongId))
            .ToDictionaryAsync(l => l.SongId, l => l.SpotifySongId);

        // Tag IDs for all these Songs (songId -> list of TagIds)
        var tagRows = await context.SongTags
            .AsNoTracking()
            .Where(st => songIds.Contains(st.SongId))
            .Select(st => new { st.SongId, st.TagId })
            .ToListAsync();
        var tagMap = tagRows
            .GroupBy(r => r.SongId)
            .ToDictionary(g => g.Key, g => g.Select(r => r.TagId).ToList());

        var dtos = new List<ReadSongDetailDto>(accesses.Count);
        foreach (var sa in accesses)
        {
            dtos.Add(sa.Song.ToDto(
                canEditUI: sa.CreatorUserId == queryUser.Id,
                spotifySongId: spotifyMap.TryGetValue(sa.SongId, out var sid) ? sid : null,
                tagIds: tagMap.TryGetValue(sa.SongId, out var tids) ? tids : new List<string>()));
        }
        return dtos;
    }

    public async Task<List<ReadSongDetailDto>> GetAllSongReadDtosByKeysAsync(IAppUser queryUser, List<MusicalKey> keys)
    {
        using var context = new AppDbContext(options);

        var accesses = await context.SongAccess
            .AsNoTracking()
            .Include(sa => sa.Song)
            .Where(sa => sa.GroupId == queryUser.SelectedGroupId
                && sa.Song.InitKey != null
                && keys.Select(mk => mk.Value).Contains(sa.Song.InitKey))
            .OrderBy(sa => sa.Song.InitKey)
                .ThenBy(sa => sa.Song.Artist)
                .ThenBy(sa => sa.Song.Title)
            .ToListAsync();

        if (accesses.Count == 0)
            return new List<ReadSongDetailDto>();

        var songIds = accesses.Select(a => a.SongId).ToList();

        var spotifyMap = await context.SongSpotifyLinks
            .AsNoTracking()
            .Where(l => songIds.Contains(l.SongId))
            .ToDictionaryAsync(l => l.SongId, l => l.SpotifySongId);

        var tagRows = await context.SongTags
            .AsNoTracking()
            .Where(st => songIds.Contains(st.SongId))
            .Select(st => new { st.SongId, st.TagId })
            .ToListAsync();
        var tagMap = tagRows
            .GroupBy(r => r.SongId)
            .ToDictionary(g => g.Key, g => g.Select(r => r.TagId).ToList());

        var dtos = new List<ReadSongDetailDto>(accesses.Count);
        foreach (var sa in accesses)
        {
            dtos.Add(sa.Song.ToDto(
                canEditUI: sa.CreatorUserId == queryUser.Id,
                spotifySongId: spotifyMap.TryGetValue(sa.SongId, out var sid) ? sid : null,
                tagIds: tagMap.TryGetValue(sa.SongId, out var tids) ? tids : new List<string>()));
        }
        return dtos;
    }

    // UPDATE

    public async Task<ReadSongDetailDto> UpdateSongByIdAsync(Guid id, Song song)
    {
        using var context = new AppDbContext(options);

        var oldSongData = await context.Songs.SingleOrDefaultAsync(s => s.Id == id);
        var newSongData = song.ToData();
        context.Update(oldSongData!).CurrentValues.SetValues(newSongData);
        context.SaveChanges();

        // updating related playlists
        await UpdatePlaylistEntriesBySongIdAsync(id);
        
        await context.SaveChangesAsync();

        // re-fetch Spotify Link + Tags for the response DTO
        var spotifySongId = await context.SongSpotifyLinks
            .AsNoTracking()
            .Where(l => l.SongId == id)
            .Select(l => (string?)l.SpotifySongId)
            .FirstOrDefaultAsync();
        var tagIds = await context.SongTags
            .AsNoTracking()
            .Where(st => st.SongId == id)
            .Select(st => st.TagId)
            .ToListAsync();

        return newSongData.ToDto(true, spotifySongId, tagIds);
    }

    // DELETE

    public async Task DeleteSongAsync(Guid id)
    {
        using var context = new AppDbContext(options);

        var songData = await context.Songs
            .FirstOrDefaultAsync(s => s.Id == id);

        if (songData is not null)
        {
            context.Remove(songData);
            await context.SaveChangesAsync();
        }
    }

    public async Task DeleteAllSongsByCreatorUserIdAsync(string creatorUserId)
    {
        using var context = new AppDbContext(options);

        var songAccessList = await context.SongAccess
            .Include(sa => sa.Song)
            .Where(sa => sa.CreatorUserId == creatorUserId)
            .ToListAsync();

        var songList = songAccessList
            .Select(s => s.Song)
            .Distinct();

        // removing all given access (song-sharing to groups), and related PlaylistEntries
        foreach (var access in songAccessList)
        {
            var relatedEntryList = await GetAllPlaylistEntriesBySongAccessAsync(access);
            if (relatedEntryList.Count > 0)
            {
                var parentPlaylist = relatedEntryList[0].GetParentPlaylist();
                foreach (var entry in relatedEntryList)
                {
                    if (parentPlaylist.Id != entry.GetParentPlaylist().Id)
                        parentPlaylist = entry.GetParentPlaylist();

                    var entryNr = parentPlaylist.FindEntryNr(entry.Id);
                    await DeletePlaylistEntryAsync(entry.Id);

                    parentPlaylist.RemoveEntryAt(entryNr - 1);
                    await UpdatePlaylistWithEntriesAsync(parentPlaylist);
                }
            }

            context.Remove(access);
            await context.SaveChangesAsync();
        }

        // removing the songs in question
        foreach (var song in songList)
        {
            context.Remove(song);
            await context.SaveChangesAsync();
        }
    }

    #endregion

    #region SongSpotifyLink related methods

    public async Task SetSongSpotifyLinkAsync(Guid songId, string? spotifySongId)
    {
        // null -> no-op (caller didn't want to touch the Link)
        if (spotifySongId is null)
            return;

        using var context = new AppDbContext(options);

        var existing = await context.SongSpotifyLinks
            .FirstOrDefaultAsync(l => l.SongId == songId);

        if (spotifySongId.Length == 0)
        {
            // explicit unlink
            if (existing is not null)
            {
                context.SongSpotifyLinks.Remove(existing);
                await context.SaveChangesAsync();
            }
            return;
        }

        // upsert if SpotifySongId provided
        if (existing is null) // insert if empty
        {
            context.SongSpotifyLinks.Add(new SongSpotifyLinkData
            {
                SongId = songId,
                SpotifySongId = spotifySongId
                // CachedCoverUrl and CachedCoverAt start NULL (the next cover lookup populates them)
            });
        }
        else if (existing.SpotifySongId != spotifySongId) // update if non-empty
        {
            existing.SpotifySongId = spotifySongId;
            // cover caching is for the OLD Spotify track: don't leave it stale and let next lookup re-populate
            existing.CachedCoverUrl = null;
            existing.CachedCoverAt = null;
        }
        await context.SaveChangesAsync();
    }

    public async Task<string?> GetSongSpotifySongIdAsync(Guid songId)
    {
        using var context = new AppDbContext(options);
        return await context.SongSpotifyLinks
            .AsNoTracking()
            .Where(l => l.SongId == songId)
            .Select(l => l.SpotifySongId)
            .FirstOrDefaultAsync();
    }

    public async Task<(string CoverUrl, DateTime CachedAt)?> GetCachedSpotifyCoverAsync(Guid songId)
    {
        using var context = new AppDbContext(options);

        var row = await context.SongSpotifyLinks
            .AsNoTracking()
            .Where(l => l.SongId == songId)
            .Select(l => new { l.CachedCoverUrl, l.CachedCoverAt })
            .FirstOrDefaultAsync();

        if (row?.CachedCoverUrl is null || row.CachedCoverAt is null)
            return null;

        return (row.CachedCoverUrl, row.CachedCoverAt.Value);
    }

    public async Task UpdateCachedSpotifyCoverAsync(Guid songId, string coverUrl)
    {
        using var context = new AppDbContext(options);

        var existing = await context.SongSpotifyLinks
            .FirstOrDefaultAsync(l => l.SongId == songId);
        if (existing is null)
            return; // no link row -> nothing to cache on

        existing.CachedCoverUrl = coverUrl;
        existing.CachedCoverAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
    }

    public async Task<List<(Guid SongId, string SpotifySongId)>> GetCoverRefreshCandidatesAsync(DateTime cutoff, int maxCount)
    {
        using var context = new AppDbContext(options);

        return await context.SongSpotifyLinks
            .AsNoTracking()
            .Where(l => l.CachedCoverAt != null && l.CachedCoverAt < cutoff)
            .OrderBy(l => l.CachedCoverAt)
            .Take(maxCount)
            .Select(l => ValueTuple.Create(l.SongId, l.SpotifySongId))
            .ToListAsync();
    }

    public async Task UnlinkSpotifyForSongIdAsync(Guid songId)
    {
        using var context = new AppDbContext(options);

        var songLink = await context.SongSpotifyLinks
            .FirstOrDefaultAsync(l => l.SongId == songId);
        
        if (songLink is null)
            return; // idempotent

        context.SongSpotifyLinks.Remove(songLink);
        await context.SaveChangesAsync();
    }

    #endregion

    #region SongTag related methods

    public async Task<List<TagCategoryDto>> GetAllTagsHierarchyAsync()
    {
        using var context = new AppDbContext(options);

        var categories = await context.TagCategories
            .Include(c => c.TagGroups.OrderBy(g => g.Id))
                .ThenInclude(g => g.Tags.OrderBy(t => t.Id))
            .OrderBy(c => c.Id)
            .AsNoTracking()
            .ToListAsync();

        return categories.Select(c => c.ToDto()).ToList();
    }

    public async Task<List<string>> GetSongTagIdsAsync(Guid songId)
    {
        using var context = new AppDbContext(options);
        return await context.SongTags
            .AsNoTracking()
            .Where(st => st.SongId == songId)
            .Select(st => st.TagId)
            .OrderBy(id => id)
            .ToListAsync();
    }

    public async Task ReplaceSongTagsAsync(Guid songId, IEnumerable<string> tagIds)
    {
        using var context = new AppDbContext(options);

        // remove songLink assignments
        var existing = await context.SongTags
            .Where(st => st.SongId == songId)
            .ToListAsync();
        context.SongTags.RemoveRange(existing);

        // insert the new set (deduplicated)
        var newIds = tagIds.Distinct(StringComparer.Ordinal);
        foreach (var tagId in newIds)
        {
            context.SongTags.Add(new SongTagData { SongId = songId, TagId = tagId });
        }

        await context.SaveChangesAsync();
    }

    #endregion

    #region PlaylistEntry related methods

    // CREATE

    public async Task AddPlaylistEntryAsync(PlaylistEntry playlistEntry, IAppUser creatorUser)
    {
        using var context = new AppDbContext(options);

        var playlistEntryData = playlistEntry.ToData((Guid)creatorUser.SelectedPlaylistId!, creatorUser.Id);
        context.PlaylistEntries.Add(playlistEntryData);

        await context.SaveChangesAsync();
    }

    // READ

    public async Task<bool> IsExistingPlaylistEntryAsync(Guid id)
    {
        using var context = new AppDbContext(options);
        return await context.PlaylistEntries.AnyAsync(pe => pe.Id == id);
    }

    public async Task<string> GetPlaylistEntryCreatorUserIdAsync(Guid id)
    {
        using var context = new AppDbContext(options);

        return await context.PlaylistEntries
             .AsNoTracking()
             .Where(pe => pe.Id == id)
             .Select(pe => pe.CreatorUserId)
             .FirstAsync();
    }

    public async Task<PlaylistEntry?> GetPlaylistEntryByIdAsync(Guid id, IAppUser queryUser)
    {
        using var context = new AppDbContext(options);

        var playlistData = await context.Playlists
            .AsNoTracking()
            .Include(p => p.Group)
            .Include(p => p.Entries)
                .ThenInclude(pe => pe.Song)
            .FirstOrDefaultAsync(p => p.Id == queryUser.SelectedPlaylistId && p.GroupId == queryUser.SelectedGroupId);

        if (playlistData is null)
            return null;

        var playlistEntryData = playlistData.Entries.FirstOrDefault(pe => pe.Id == id);
        if (playlistEntryData is null)
            return null;
        
        var playlist = playlistData.ToDomain();
        var playlistEntry = playlistEntryData.ToDomain(playlist);
        return playlistEntry;
    }

    public async Task<List<Guid>> GetAllPlaylistEntryIdsAsync(IAppUser queryUser)
    {
        using var context = new AppDbContext(options);

        return await context.PlaylistEntries
            .AsNoTracking()
            .Where(pe => pe.CreatorUserId == queryUser.Id)
            .Select(pe => pe.Id)
            .ToListAsync();
    }

    public async Task<List<Guid>> GetAllPlaylistEntryIdsInSelectedPlaylistAsync(IAppUser queryUser)
    {
        using var context = new AppDbContext(options);

        // returns every entry id regardless of which member created it
        return await context.PlaylistEntries
            .AsNoTracking()
            .Where(pe => pe.PlaylistId == queryUser.SelectedPlaylistId)
            .Select(pe => pe.Id)
            .ToListAsync();
    }

    public async Task<List<PlaylistEntry>> GetAllPlaylistEntriesBySongAccessAsync(ISongAccess access)
    {
        using var context = new AppDbContext(options);

        var containingPlaylists = await context.Playlists
            .AsNoTracking()
            .Include(p => p.Group)
            .Include(p => p.Entries)
                .ThenInclude(pe => pe.Song)
            .Where(p => p.GroupId == access.GroupId && p.Entries.Any(pe => pe.SongId == access.SongId))
            .ToListAsync();

        var relatedEntryList = new List<PlaylistEntry>();
        foreach (var playlistData in containingPlaylists)
        {
            foreach (var entryData in playlistData.Entries)
            {
                if (entryData.SongId == access.SongId)
                {
                    var playlist = playlistData.ToDomain();
                    relatedEntryList.Add(entryData.ToDomain(playlist));
                }
            }
        }
        return relatedEntryList;
    }

    public async Task<ReadPlaylistEntryDetailDto?> GetPlaylistEntryReadDtoByIdAsync(Guid id, IAppUser queryUser, bool isAdmin)
    {
        using var context = new AppDbContext(options);

        var playlistEntryData = await context.PlaylistEntries
            .AsNoTracking()
            .Include(pe => pe.Song)
            .Include(pe => pe.Playlist)
            .Include(pe => pe.CreatorUser)
            .FirstOrDefaultAsync(pe => pe.Id == id);

        if (playlistEntryData is null)
            return null;

        var song = playlistEntryData.Song;
        var songAccess = await context.SongAccess
            .AsNoTracking()
            .FirstAsync(sa => sa.GroupId == queryUser.SelectedGroupId && sa.SongId == song.Id);
        
        // attach Spotify Link + Tags for the nested SongDetailDto
        var spotifySongId = await context.SongSpotifyLinks
            .AsNoTracking()
            .Where(l => l.SongId == song.Id)
            .Select(l => (string?)l.SpotifySongId)
            .FirstOrDefaultAsync();
        var tagIds = await context.SongTags
            .AsNoTracking()
            .Where(st => st.SongId == song.Id)
            .Select(st => st.TagId)
            .ToListAsync();

        ReadSongDetailDto songDto = song.ToDto(
            canEditUI: songAccess.CreatorUserId == queryUser.Id,
            spotifySongId: spotifySongId,
            tagIds: tagIds);

        var (avgRating, totalRaters) = await GetRatingAggregateForEntryAsync(id);
        var myRating = await GetRatingForUserAsync(id, queryUser.Id);

        var canDeleteUI = playlistEntryData.CreatorUser.Id == queryUser.Id || isAdmin;
        return playlistEntryData.ToDto(songDto, canEditUI: true, canDeleteUI, playlistEntryData.BpmChange,
            avgRating, totalRaters, myRating);
    }

    public async Task<List<ReadPlaylistEntryDto>> GetAllPlaylistEntryReadDtosAsync(IAppUser queryUser)
    {
        using var context = new AppDbContext(options);

        var selectedPlaylistId = queryUser.SelectedPlaylistId;
        if (selectedPlaylistId is null)
            return new List<ReadPlaylistEntryDto>();

        var playlistEntryDataList = await context.PlaylistEntries
            .AsNoTracking()
            .Where(pe => pe.PlaylistId == queryUser.SelectedPlaylistId)
            .Include(pe => pe.Song)
            .Include(pe => pe.CreatorUser)
            .Include(pe => pe.Playlist)
            .OrderBy(pe => pe.Nr)
            .ThenBy(pe => pe.WithPrev ? 1 : 0)
            .ToListAsync();

        if (playlistEntryDataList.Count == 0)
            return new List<ReadPlaylistEntryDto>();

        var songIds = playlistEntryDataList.Select(pe => pe.SongId).Distinct().ToList();

        // Spotify-link lookup so the embedded ReadSongDto renders covers
        var spotifyMap = await context.SongSpotifyLinks
            .AsNoTracking()
            .Where(l => songIds.Contains(l.SongId))
            .ToDictionaryAsync(l => l.SongId, l => l.SpotifySongId);

        // Tag-IDs lookup so the embedded ReadSongDto can render Tag chips
        var tagRows = await context.SongTags
            .AsNoTracking()
            .Where(st => songIds.Contains(st.SongId))
            .Select(st => new { st.SongId, st.TagId })
            .ToListAsync();
        var tagMap = tagRows
            .GroupBy(r => r.SongId)
            .ToDictionary(g => g.Key, g => g.Select(r => r.TagId).ToList());

        // Load Rating stat aggregates for all entries
        var aggregates = await GetRatingAggregatesForEntriesAsync(playlistEntryDataList.Select(r => r.Id));

        var dtoList = new List<ReadPlaylistEntryDto>();
        foreach (var pe in playlistEntryDataList)
        {
            string? spotifySongId = spotifyMap.TryGetValue(pe.SongId, out var sid) ? sid : null;
            var songTagIds = tagMap.TryGetValue(pe.SongId, out var tids) ? tids : new List<string>();
            ReadSongDto songDto = pe.Song.ToDto(spotifySongId, songTagIds);

            var (avg, count) = aggregates.TryGetValue(pe.Id, out var agg) ? agg : ((decimal?)null, 0);
            dtoList.Add(pe.ToDto(songDto, avg, count));
        }

        return dtoList;
    }

    // UPDATE
    public async Task<ReadPlaylistEntryDetailDto> UpdatePlaylistEntryAsync(PlaylistEntry playlistEntry, IAppUser queryUser, bool isAdmin)
    {
        using var context = new AppDbContext(options);
        
        var oldPlaylistEntryData = await context.PlaylistEntries
            .Include(pe => pe.Song)
            .Include(pe => pe.CreatorUser)
            .FirstAsync(p => p.Id == playlistEntry.Id);
        
        var newPlaylistEntryData = playlistEntry.ToData(oldPlaylistEntryData.PlaylistId, oldPlaylistEntryData.CreatorUserId);

        context.Update(oldPlaylistEntryData).CurrentValues.SetValues(newPlaylistEntryData);
        await context.SaveChangesAsync();

        var songAccess = await context.SongAccess
            .AsNoTracking()
            .FirstAsync(sa => sa.GroupId == queryUser.SelectedGroupId &&
                        sa.SongId == oldPlaylistEntryData.SongId);

        var spotifySongId = await context.SongSpotifyLinks
            .AsNoTracking()
            .Where(l => l.SongId == oldPlaylistEntryData.SongId)
            .Select(l => (string?)l.SpotifySongId)
            .FirstOrDefaultAsync();
        var tagIds = await context.SongTags
            .AsNoTracking()
            .Where(st => st.SongId == oldPlaylistEntryData.SongId)
            .Select(st => st.TagId)
            .ToListAsync();

        var songDetailDto = oldPlaylistEntryData.Song.ToDto(
            canEditUI: songAccess.CreatorUserId == queryUser.Id,
            spotifySongId: spotifySongId,
            tagIds: tagIds);

        var (avgRating, totalRaters) = await GetRatingAggregateForEntryAsync(playlistEntry.Id);
        var myRating = await GetRatingForUserAsync(playlistEntry.Id, queryUser.Id);

        bool canDeleteUI = oldPlaylistEntryData.CreatorUserId == queryUser.Id || isAdmin;
        return oldPlaylistEntryData.ToDto(songDetailDto, canEditUI: true, canDeleteUI,
            oldPlaylistEntryData.BpmChange, avgRating, totalRaters, myRating);
    }

    public async Task UpdatePlaylistEntriesBySongIdAsync(Guid songId)
    {
        using var context = new AppDbContext(options);
        context.SaveChanges(); // so that the Song gets updated first, when called from UpdateSongByIdAsync

        var relatedPlaylists = await context.Playlists
            .AsNoTracking()
            .Include(p => p.Group)
            .Include(p => p.Entries)
                .ThenInclude(pe => pe.Song)
            .Where(p => p.Entries.Any(pe => pe.SongId == songId))
            .ToListAsync();

        foreach (var playlistData in relatedPlaylists)
        {
            var playlist = playlistData.ToDomain();
            await UpdatePlaylistWithEntriesAsync(playlist);
        }
    }

    public async Task<List<Guid>> BulkReorderPlaylistEntriesAsync(Guid playlistId, List<Guid> orderedEntryIds)
    {
        using var context = new AppDbContext(options);

        var playlistData = await context.Playlists
            .Include(p => p.Group)
            .Include(p => p.Entries)
                .ThenInclude(pe => pe.Song)
            .FirstAsync(p => p.Id == playlistId);

        /* Domain AggregateRoot does the actual heavy work (Nr + TransitionToNext re-computation). */
        var playlist = playlistData.ToDomain();

        // constructing a helper map to lookup entryId --> current position
        var currentOrderById = new Dictionary<Guid, int>();
        for (int i = 0; i < playlist.GetEntriesCount(); i++)
            currentOrderById[playlist[i].Id] = i;

        // building a fresh ordered list of the domain entries matching the passed order (no insertion/removal yet).
        var reorderedDomainEntries = orderedEntryIds
            .Select(id => playlist[currentOrderById[id]])
            .ToList();

        // Removing all entries and re-adding in target order. Domain's PlaylistOrderChanged recomputes Nr + TransitionToNext.
        while (playlist.GetEntriesCount() > 0)
            playlist.RemoveEntryAt(playlist.GetEntriesCount() - 1);
        foreach (var domainEntry in reorderedDomainEntries)
            playlist.AddEntryAt(domainEntry);

        // persistence: updating every PlaylistEntryData with the new domain state via SetValues
        var dataById = playlistData.Entries.ToDictionary(pe => pe.Id);
        for (int i = 0; i < playlist.GetEntriesCount(); i++)
        {
            var domainEntry = playlist[i];
            var oldData = dataById[domainEntry.Id];
            var newData = domainEntry.ToData(oldData.PlaylistId, oldData.CreatorUserId);
            context.Update(oldData).CurrentValues.SetValues(newData);
        }

        /* Mirror playlist-level state too (duration etc). */
        var newPlaylistData = playlist.ToData(playlistData.CreatorUserId, playlistData.Entries);
        context.Update(playlistData).CurrentValues.SetValues(newPlaylistData);

        await context.SaveChangesAsync();
        return orderedEntryIds;
    }

    // DELETE

    public async Task DeletePlaylistEntryAsync(Guid id)
    {
        using var context = new AppDbContext(options);

        var playlistEntryData = await context.PlaylistEntries
            .FirstOrDefaultAsync(pe => pe.Id == id);

        if (playlistEntryData is not null)
        {
            context.Remove(playlistEntryData);
            await context.SaveChangesAsync();
        }
    }

    #endregion

    #region PlaylistEntryRating related methods

    /* Upsert: returns true on create, false on update. */
    public async Task<bool> UpsertRatingAsync(Guid entryId, string raterUserId, int rating)
    {
        using var context = new AppDbContext(options);

        /* Cast the int into the Rating enum (1..5 validated at the DTO level). */
        var ratingEnum = (Rating)rating;

        var entryRating = await context.PlaylistEntryRatings
            .FirstOrDefaultAsync(r => r.PlaylistEntryId == entryId && r.RaterUserId == raterUserId);

        if (entryRating != null) // user actually rated this entry with this request (instead of resetting it)
        {
            if (entryRating.Rating == ratingEnum)
                return false; // no actual change (avoiding unnecessary write)
            
            entryRating.Rating = ratingEnum;
            await context.SaveChangesAsync();
            return false; // updated, not created
        }

        var newRow = new PlaylistEntryRatingData
        {
            Id = Guid.NewGuid(),
            PlaylistEntryId = entryId,
            RaterUserId = raterUserId,
            Rating = ratingEnum
        };
        context.PlaylistEntryRatings.Add(newRow);
        await context.SaveChangesAsync();
        return true; // created
    }

    // READ

    public async Task<int?> GetRatingForUserAsync(Guid entryId, string raterUserId)
    {
        using var context = new AppDbContext(options);

        var entryRating = await context.PlaylistEntryRatings
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.PlaylistEntryId == entryId && r.RaterUserId == raterUserId);
        
        return (entryRating is null) ? null : (int)entryRating.Rating;
    }

    public async Task<List<(Guid,int)>> GetAllRatingsForUserAsync(IAppUser queryUser)
    {
        using var context = new AppDbContext(options);

        return await context.PlaylistEntryRatings
            .AsNoTracking()
            .Where(r => r.RaterUserId == queryUser.Id)
            .Select(r => ValueTuple.Create(r.PlaylistEntryId, (int)r.Rating))
            .ToListAsync();
    }

    public async Task<(decimal? averageRating, int totalRaters)> GetRatingAggregateForEntryAsync(Guid entryId)
    {
        using var context = new AppDbContext(options);

        // aggregating in SQL (no materialization of the rating rows)
        var stats = await context.PlaylistEntryRatings
            .AsNoTracking()
            .Where(r => r.PlaylistEntryId == entryId)
            .GroupBy(_ => 1) // group by PlaylistEntry (it's ID)
            .Select(g => new
            {
                Count = g.Count(), // total raters
                Avg = g.Average(r => (decimal)(int)r.Rating) // avg rating
            })
            .FirstOrDefaultAsync();

        if (stats is null || stats.Count == 0)
            return (null, 0); // no raters yet

        var avg = Math.Round(stats.Avg, 2);
        return (avg, stats.Count);
    }

    public async Task<Dictionary<Guid,(decimal? averageRating, int totalRaters)>> GetRatingAggregatesForEntriesAsync(IEnumerable<Guid> entryIds)
    {
        using var context = new AppDbContext(options);
        var idList = entryIds.Distinct().ToList();
        if (idList.Count == 0)
            return new Dictionary<Guid,(decimal?, int)>(); // no ratings yet for this entry

        // aggregating in SQL (no materialization of the rating rows)
        var rows = await context.PlaylistEntryRatings
            .AsNoTracking()
            .Where(r => idList.Contains(r.PlaylistEntryId))
            .GroupBy(r => r.PlaylistEntryId)
            .Select(g => new
            {
                EntryId = g.Key,
                Count = g.Count(),
                Avg = g.Average(r => (decimal)(int)r.Rating)
            })
            .ToListAsync();

        var dict = new Dictionary<Guid,(decimal? averageRating, int totalRaters)>(rows.Count);
        foreach (var r in rows)
            dict[r.EntryId] = (Math.Round(r.Avg, 2), r.Count);
        return dict;
    }

    // DELETE

    public async Task DeleteRatingAsync(Guid entryId, string raterUserId)
    {
        using var context = new AppDbContext(options);

        var existing = await context.PlaylistEntryRatings
            .FirstOrDefaultAsync(r => r.PlaylistEntryId == entryId && r.RaterUserId == raterUserId);
        
        if (existing is null)
            return;

        context.PlaylistEntryRatings.Remove(existing);
        await context.SaveChangesAsync();
    }

    #endregion

    #region Playlist related methods

    // CREATE

    public async Task AddPlaylistAsync(Playlist playlist, string creatorUserId)
    {
        using var context = new AppDbContext(options);

        var playlistData = playlist.ToData(creatorUserId, []);
        context.Playlists.Add(playlistData);

        await context.SaveChangesAsync();
    }

    // READ

    public async Task<bool> IsExistingPlaylistAsync(Guid id)
    {
        using var context = new AppDbContext(options);
        return await context.Playlists
            .AnyAsync(p => p.Id == id);
    }

    public async Task<bool> IsPlaylistNameTakenInGroupAsync(string playlistName, Guid groupId)
    {
        using var context = new AppDbContext(options);
        return await context.Playlists
            .AnyAsync(p => p.GroupId == groupId &&  p.Name == playlistName);
    }

    public async Task<bool> IsPlaylistAccessibleForGroupAsync(Guid id, Guid groupId)
    {
        using var context = new AppDbContext(options);
        return await context.Playlists
            .AnyAsync(p => p.Id == id && p.GroupId == groupId);
    }

    public async Task<string> GetPlaylistCreatorUserIdAsync(Guid id)
    {
        using var context = new AppDbContext(options);

        return await context.Playlists
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => p.CreatorUserId)
            .FirstAsync();
    }

    public async Task<Playlist?> GetPlaylistByIdAsync(Guid id, Guid groupId)
    {
        using var context = new AppDbContext(options);
        var playlistData = await context.Playlists
            .AsNoTracking()
            .Include(p => p.Group)
            .Include(p => p.Entries)
                .ThenInclude(pe => pe.Song)
            .FirstOrDefaultAsync(p => p.Id == id && p.GroupId == groupId);

        if (playlistData is null)
            return null;

        return playlistData.ToDomain();
    }

    public async Task<List<Playlist>> GetAllPlaylistsByGroupIdAsync(Guid groupId)
    {
        using var context = new AppDbContext(options);
        var playlistDataList = await context.Playlists
            .AsNoTracking()
            .Include(p => p.Group)
            .Include(p => p.Entries)
                .ThenInclude(pe => pe.Song)
            .Where(p => p.GroupId == groupId)
            .Select(p => p.ToDomain())
            .ToListAsync();

        return playlistDataList;
    }

    public async Task<ReadPlaylistDetailDto?> GetPlaylistReadDtoByIdAsync(Guid id, IAppUser queryUser, bool isAdmin)
    {
        using var context = new AppDbContext(options);

        var playlistData = await context.Playlists
            .AsNoTracking()
            .Include(p => p.Group)
            .Include(p => p.Entries)
            .Include(p => p.CreatorUser)
            .FirstOrDefaultAsync(p => p.Id == id && p.GroupId == queryUser.SelectedGroupId);

        if (playlistData is null)
            return null;

        bool canEditUI = playlistData.CreatorUser.Id == queryUser.Id || isAdmin;
        return playlistData.ToDto(playlistData.Entries.Count, canEditUI);
    }

    public async Task<List<ReadPlaylistDto>> GetAllPlaylistReadDtosAsync(IAppUser queryUser)
    {
        using var context = new AppDbContext(options);

        return await context.Playlists
            .AsNoTracking()
            .Include(p => p.CreatorUser)
            .Where(p => p.GroupId == queryUser.SelectedGroupId)
            .OrderBy(p => p.CreatorUser.UserName == queryUser.UserName)
                .ThenBy(p => p.Name)
            .Select(p => p.ToDto())
            .ToListAsync();
    }

    public async Task<string> GetPlaylistNameByIdAsync(Guid id)
    {
        using var context = new AppDbContext(options);

        return await context.Playlists
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => p.Name)
            .FirstAsync();
    }

    // UPDATE

    public async Task<ReadPlaylistDetailDto> UpdatePlaylistAsync(Playlist playlist)
    {
        using var context = new AppDbContext(options);

        var oldPlaylistData = await context.Playlists
            .Include(p => p.CreatorUser)
            .Include(p => p.Entries)
            .FirstAsync(p => p.Id == playlist.Id);

        var newPlaylistData = playlist.ToData(oldPlaylistData.CreatorUserId, oldPlaylistData.Entries);

        context.Update(oldPlaylistData).CurrentValues.SetValues(newPlaylistData);
        await context.SaveChangesAsync();
        return oldPlaylistData.ToDto(oldPlaylistData.Entries.Count, canEditUI: true); // if they could edit it, they surely can again
    }

    public async Task UpdatePlaylistWithEntriesAsync(Playlist playlist)
    {
        using var context = new AppDbContext(options);

        var oldEntryDataList = await context.PlaylistEntries
            .Where(pe => pe.PlaylistId == playlist.Id)
            .OrderBy(pe => pe.Nr)
            .ToListAsync();

        // updating all entries
        for (int i = 0; i < playlist.GetEntriesCount(); i++)
        {
            var oldDataEntry = oldEntryDataList.First(pe => pe.Id == playlist[i].Id);
            var newDataEntry = playlist[i].ToData(oldDataEntry.PlaylistId, oldDataEntry.CreatorUserId);
            context.Update(oldDataEntry).CurrentValues.SetValues(newDataEntry);
        }
        context.SaveChanges();

        var newEntryDataList = await context.PlaylistEntries
            .Where(pe => pe.PlaylistId == playlist.Id)
            .OrderBy(pe => pe.Nr)
            .ToListAsync();

        // updating the PlaylistData itself

        var oldPlaylistData = await context.Playlists
            .FirstAsync(p => p.Id == playlist.Id);

        var newPlaylistData = playlist.ToData(oldPlaylistData.CreatorUserId, newEntryDataList);
        context.Update(oldPlaylistData).CurrentValues.SetValues(newPlaylistData);
        await context.SaveChangesAsync();
    }

    // DELETE

    public async Task DeletePlaylistAsync(Guid id)
    {
        using var context = new AppDbContext(options);

        var playlistData = await context.Playlists
            .FirstOrDefaultAsync(p => p.Id == id);

        if (playlistData is not null)
        {
            context.Remove(playlistData);
            await context.SaveChangesAsync();
        }
    }

    #endregion
}
