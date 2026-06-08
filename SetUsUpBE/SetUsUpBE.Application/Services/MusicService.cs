using System.Drawing;
using SetUsUpBE.Domain.Primitives;
using SetUsUpBE.Domain.Entities;
using SetUsUpBE.Domain.ValueObjects;
using SetUsUpBE.Application.Services.Primitives;
using SetUsUpBE.Application.ServiceInterfaces;
using SetUsUpBE.Application.RepositoryInterfaces;
using SetUsUpBE.Application.AppEntityInterfaces;
using SetUsUpBE.Application.DTOs.Outbound;
using SetUsUpBE.Application.DTOs.Inbound;
using SetUsUpBE.Application.Mapper.DTOToDomain;

namespace SetUsUpBE.Application.Services;

public sealed class MusicService
{
    private readonly IMusicRepository musicRepo;
    private readonly IMembershipRepository mshipRepo;
    private readonly IRealTimeNotifierService realTimeNotifier;
    
    public MusicService(IMusicRepository musicRepo, IMembershipRepository mshipRepo, IRealTimeNotifierService realTimeNotifier)
    {
        this.musicRepo = musicRepo;
        this.mshipRepo = mshipRepo;
        this.realTimeNotifier = realTimeNotifier;
    }

    #region Group related tasks

    // CREATE

    public async Task AddDefaultUserGroupAsync(IAppUser newUser, IUserService userService)
    {
        Guid newGroupId = await musicRepo.AddDefaultUserGroupAsync(newUser);

        await userService.SetDefaultGroupAsync(newUser, newGroupId); // set the group as default for the user
        await mshipRepo.AddGroupMemberAsync(true, newUser.Id, newGroupId); // they became an admin for their new group
    }

    public async Task<Result<Group>> AddGroupAsync(CreateGroupDto dto, IAppUser creatorUser, List<IAppUser> newMembers, IUserService userService)
    {
        if (await musicRepo.IsGroupNameTakenAsync(dto.Name))
            return Result<Group>.Failure(QueryError.GroupNameTaken);

        var groupResult = dto.ToDomain();
        if (groupResult.HasFailed)
            return groupResult;

        Guid newGroupId = await musicRepo.AddGroupAsync(groupResult.Value!, creatorUser.Id); // can't be null due to prev check

        await userService.SetSelectedGroupAsync(creatorUser, newGroupId, this); // set the group as the currently selected for the user
        await mshipRepo.AddGroupMemberAsync(true, creatorUser.Id, newGroupId); // they became an admin for their new group
        await RTN.SendUserAddedToGroupAsync(realTimeNotifier, newGroupId, creatorUser.Id); // signalling for owner to join SignalR channel

        // adding the specified (non-creator) members to the new group
        foreach (var member in newMembers)
        {
            await mshipRepo.AddGroupMemberAsync(false, member.Id, newGroupId); // they won't be admins
            await RTN.SendUserAddedToGroupAsync(realTimeNotifier, newGroupId, member.Id); // signalling for members to join SignalR channel
        }
        
        return Result<Group>.Success(groupResult.Value);
    }

    // READ

    public async Task<bool> GroupExistsAsync(Guid groupId)
    {
        return await musicRepo.IsExistingGroupAsync(groupId);
    }

    public async Task<Result<ReadGroupDetailDto>> GetGroupDtoByIdAsync(Guid id, string queryUserId)
    {
        if (!await musicRepo.IsExistingGroupAsync(id)) // if no group exists with this ID
            return Result<ReadGroupDetailDto>.Failure(QueryError.GroupNonExistentId);

        if (await mshipRepo.GetGroupMembershipAsync(queryUserId, id) is null)
            return Result<ReadGroupDetailDto>.Failure(QueryError.GroupNoAccess);

        var groupDto = await musicRepo.GetGroupReadDtoByIdAsync(id, queryUserId);
        return Result<ReadGroupDetailDto>.Success(groupDto);
    }

    public async Task<List<ReadGroupDto>> GetGroupDtosByUserAsync(string queryUserId)
    {
        return await musicRepo.GetGroupReadDtosByUserAsync(queryUserId);
    }

    public async Task<List<Guid>> GetGroupIdsByUserAsync(string userId)
    {
        return await musicRepo.GetGroupIdsByUserAsync(userId);
    }

    public async Task<List<Group>> GetGroupsByCreatorUserAsync(string creatorUserId)
    {
        return await musicRepo.GetAllGroupsByCreatorUserIdAsync(creatorUserId);
    }

    public async Task<string> GetGroupNameByIdAsync(Guid id)
    {
        return await musicRepo.GetGroupNameByIdAsync(id);
    }

    // UPDATE
    public async Task<Result<Group>> UpdateGroupNameAsync(Guid groupId, IAppUser queryUser, string newName)
    {
        var existingGroup = await musicRepo.GetGroupByIdAsync(groupId);
        if (existingGroup is null)
            return Result<Group>.Failure(QueryError.GroupNonExistentId);

        RoleType? role = await mshipRepo.GetGroupMembershipRoleTypeAsync(queryUser.Id, groupId);
        if (role != RoleType.Creator)
            return Result<Group>.Failure(QueryError.UserNotCreatorInGroup);

        if (queryUser.OwnGroupId == groupId)
            return Result<Group>.Failure(QueryError.GroupOwnCollectionRename);

        var setNameResult = existingGroup.SetName(newName);
        if (setNameResult.HasFailed)
            return Result<Group>.Failure(setNameResult.Error);

        await musicRepo.UpdateGroupNameAsync(groupId, newName);
        await RTN.SendGroupNameChangedAsync(realTimeNotifier, groupId); // signalling for clients to revalidate
        return Result<Group>.Success(existingGroup);
    }

    // DELETE

    public async Task<Result<bool>> DeleteGroupAsync(Guid groupId, IAppUser queryUser, IUserService userService)
    {
        var existingGroup = await musicRepo.GetGroupByIdAsync(groupId);
        if (existingGroup is null)
            return Result<bool>.Failure(QueryError.GroupNonExistentId);

        RoleType? role = await mshipRepo.GetGroupMembershipRoleTypeAsync(queryUser.Id, groupId);
        if (role != RoleType.Creator)
            return Result<bool>.Failure(QueryError.UserNotCreatorInGroup);

        if (queryUser.OwnGroupId == groupId)
            return Result<bool>.Failure(QueryError.GroupOwnCollectionDelete);


        await DeleteGroupAsync(groupId, userService);
        return Result<bool>.Success();
    }

    public async Task DeleteGroupAsync(Guid groupId, IUserService userService)
    {
        // start with the playlists the group has (also deselecting them from any users)
        var playlists = await musicRepo.GetAllPlaylistsByGroupIdAsync(groupId);
        foreach (var playlist in playlists)
        {
            // removing all contained playlist entries
            for (int i = 0; i < playlist.GetEntriesCount(); i++)
                await musicRepo.DeletePlaylistEntryAsync(playlist[i].Id);

            await userService.DeselectPlaylistForAllUsersAsync(playlist.Id); // deselecting it for all users

            playlist.ClearEntries();
            await musicRepo.DeletePlaylistAsync(playlist.Id);
        }

        // then all the song accesses belonging to this group
        await mshipRepo.DeleteAllSongAccessesByGroupIdAsync(groupId);

        // then all group memberships belonging to this group
        await mshipRepo.DeleteAllGroupMembershipsByGroupIdAsync(groupId);

        // then deselecting the group from any users
        await userService.DeselectGroupForAllUsersAsync(groupId);

        // lastly, we delete the group itself
        await musicRepo.DeleteGroupAsync(groupId);

        // signalling for clients to revalidate
        await RTN.SendGroupDeletedAsync(realTimeNotifier, groupId);
    }

    #endregion

    #region Song related tasks

    // CREATE

    public async Task<Result<Song>> AddSongAsync(CreateSongDto dto, IAppUser creatorUser)
    {
        var songResult = dto.ToDomain();
        if (songResult.HasFailed)
            return songResult;

        var song = songResult.Value!;
        await musicRepo.AddSongAsync(song);

        // adding a song also always adds a SongAccess entity for the creator user's currently selected group
        await mshipRepo.AddSongAccessAsync(song.Id, creatorUser.SelectedGroupId, creatorUser.Id);

        // the song gets added to the creator user's collection regardless if it's their currently selected group or not
        if (creatorUser.OwnGroupId != creatorUser.SelectedGroupId)
            await mshipRepo.AddSongAccessAsync(song.Id, creatorUser.OwnGroupId, creatorUser.Id);

        // Persisting the optional Spotify Link via SongSpotifyLink Application entity
        if (!string.IsNullOrEmpty(dto.SpotifySongId))
            await musicRepo.SetSongSpotifyLinkAsync(song.Id, dto.SpotifySongId);

        // signal Song.Created to every group that have just gained access
        await RTN.SendSongCreatedAsync(realTimeNotifier, creatorUser.SelectedGroupId, song.Id);
        if (creatorUser.OwnGroupId != creatorUser.SelectedGroupId)
            await RTN.SendSongCreatedAsync(realTimeNotifier, creatorUser.OwnGroupId, song.Id);

        return Result<Song>.Success(songResult.Value);
    }

    // READ

    public async Task<Result<ReadSongDetailDto>> GetSongByIdAsync(Guid id, IAppUser queryUser)
    {
        // checking if song exists (at least one group has access to it)
        var songAccesses = await mshipRepo.GetSongAccessesAsync(id);
        if (songAccesses.Count == 0)
            return Result<ReadSongDetailDto>.Failure(QueryError.SongNonExistentId);

        // checking if the queryUser's selected group has access to the song
        var songAccess = songAccesses.FirstOrDefault(sa => sa.GroupId == queryUser.SelectedGroupId);
        if (songAccess is null)
            return Result<ReadSongDetailDto>.Failure(QueryError.SongNoAccess);

        var songDto = await musicRepo.GetSongReadDtoByIdAsync(id, songAccess, queryUser);
        return Result<ReadSongDetailDto>.Success(songDto);
    }

    public async Task<List<ReadSongDetailDto>> GetAllSongsAsync(IAppUser queryUser)
    {
        return await musicRepo.GetAllSongReadDtosAsync(queryUser);
    }

    public async Task<Result<ReadSongRelatedKeysDto?>> GetSongRelatedKeysAsync(Guid id, IAppUser queryUser)
    {
        var song = await musicRepo.GetSongByIdAsync(id);

        // checking if song exists (at least one group has access to it)
        var songAccesses = await mshipRepo.GetSongAccessesAsync(id);
        if (songAccesses.Count == 0 || song is null)
            return Result<ReadSongRelatedKeysDto?>.Failure(QueryError.SongNonExistentId);

        // checking if the queryUser's selected group has access to the song
        var songAccess = songAccesses.FirstOrDefault(sa => sa.GroupId == queryUser.SelectedGroupId);
        if (songAccess is null)
            return Result<ReadSongRelatedKeysDto?>.Failure(QueryError.SongNoAccess);


        if (!song.IsKeySet())
            return Result<ReadSongRelatedKeysDto?>.Success(null);

        var key = song.GetInitKey()!;
        var diagonalKey = key.GetRelatedKey_Diagonal();
        var diagonalAtonalKey = key.GetSimilarKey_DiagonalAtonal();
        var moodShiftKey = key.GetSimilarKey_MoodShift();
        var flatFourUpKey = key.GetSimilarKey_FlatFourUp();
        var flatFourScaleKey = key.GetSimilarKey_FlatFourScale();
        return Result<ReadSongRelatedKeysDto?>.Success(new ReadSongRelatedKeysDto()
        {
            ExactMatch = key.Value,
            Boost = key.GetRelatedKey_Boost().Value,
            Drop = key.GetRelatedKey_Drop().Value,
            
            Diagonal = diagonalKey.Value,
            IsDiagonalDown = 
                (MusicalKeyTransition.Create(key, diagonalKey)!.Value == 
                 MusicalKeyTransition.MixVariant.DiagonalMinorDown.AsStringValue()),
            DiagonalAtonal = diagonalAtonalKey.Value,
            
            Scale = key.GetRelatedKey_Scale().Value,
            EnergyBoostBig = key.GetSimilarKey_EnergyBoostBig().Value,
            EnergyDropBig = key.GetSimilarKey_EnergyDropBig().Value,
            EnergyBoost = key.GetSimilarKey_EnergyBoost().Value,
            EnergyDrop = key.GetSimilarKey_EnergyDrop().Value,
            PayAttentionMinus = key.GetSimilarKey_PayAttentionMinus().Value,
            PayAttentionPlus = key.GetSimilarKey_PayAttentionPlus().Value,

            MoodShift = moodShiftKey.Value,
            IsMoodShiftMajorDown =
                (MusicalKeyTransition.Create(key, moodShiftKey)!.Value ==
                 MusicalKeyTransition.MixVariant.MoodShiftMajorDown.AsStringValue()),
            
            FlatFourUp = key.GetSimilarKey_FlatFourUp().Value,
            FlatFourScale = key.GetSimilarKey_FlatFourScale().Value,
            IsFlatFourMinorDown =
                (MusicalKeyTransition.Create(key, flatFourScaleKey)!.Value ==
                 MusicalKeyTransition.MixVariant.FlatMinorToMajorDown.AsStringValue()),
            
            HarmonicFlip = key.GetHarmonicFlip().Value,

            PerfectMatches = key.GetPerfectMatches().Select(mk => mk.Value).ToList(),
            SimilarMatches = key.GetSimilarMatches().Select(mk => mk.Value).ToList(),
            AllMatches = key.GetAllMatches().Select(mk => mk.Value).ToList()
        });
    }

    public async Task<List<ReadSongDetailDto>> GetAllSongsByKeysAsync(IAppUser queryUser, List<MusicalKey> keys)
    {
        return await musicRepo.GetAllSongReadDtosByKeysAsync(queryUser, keys);
    }

    // UPDATE

    public async Task<Result<ReadSongDetailDto?>> UpdateSongByIdAsync(Guid id, UpdateSongDto dto, IAppUser queryUser)
    {
        var song = await musicRepo.GetSongByIdAsync(id);

        // checking if song exists (at least one group has access to it)
        var songAccesses = await mshipRepo.GetSongAccessesAsync(id);
        if (songAccesses.Count == 0 || song is null)
            return Result<ReadSongDetailDto?>.Failure(QueryError.SongNonExistentId);

        // checking if the queryUser's selected group has access to the song
        var songAccess = songAccesses.FirstOrDefault(sa => sa.GroupId == queryUser.SelectedGroupId);
        if (songAccess is null)
            return Result<ReadSongDetailDto?>.Failure(QueryError.SongNoAccess);

        if (songAccess.CreatorUserId != queryUser.Id)
            return Result<ReadSongDetailDto?>.Failure(QueryError.SongNoWriteAccess);

        bool changed = false;
        if (dto.Artist is not null)
        {
            var setResult = song.SetArtist(dto.Artist);
            if (setResult.HasFailed)
                return Result<ReadSongDetailDto?>.Failure(setResult.Error);
            changed = true;
        }
        if (dto.Title is not null)
        {
            var setResult = song.SetTitle(dto.Title);
            if (setResult.HasFailed)
                return Result<ReadSongDetailDto?>.Failure(setResult.Error);
            changed = true;
        }
        if (dto.Duration is not null)
        {
            TimeOnly? duration = PlaylistEntryExtensions.TimeOnlyParsed(dto.Duration);
            if (duration is null)
                return Result<ReadSongDetailDto?>.Failure(Error.SongInvalidFormat);
            
            var setResult = song.SetDuration((TimeOnly)duration!);
            if (setResult.HasFailed)
                return Result<ReadSongDetailDto?>.Failure(setResult.Error);
            changed = true;
        }
        if (dto.Bpm is not null)
        {
            var setResult = song.SetBpm((decimal)dto.Bpm);
            if (setResult.HasFailed)
                return Result<ReadSongDetailDto?>.Failure(setResult.Error);
            changed = true;
        }
        if (dto.BpmOut is not null)
        {
            var setResult = song.SetBpmOut((decimal)dto.BpmOut);
            if (setResult.HasFailed)
                return Result<ReadSongDetailDto?>.Failure(setResult.Error);
            changed = true;
        }
        if (dto.InitKey is not null)
        {
            var setResult = song.SetInitKey(dto.InitKey);
            if (setResult.HasFailed)
                return Result<ReadSongDetailDto?>.Failure(setResult.Error);
            changed = true;
        }
        if (dto.SpotifySongId is not null)
        {
            // Spotify link is handled separately from the Song domain entity (strict Clean Architecture)
            await musicRepo.SetSongSpotifyLinkAsync(id, dto.SpotifySongId);
            changed = true;
        }

        if (!changed)
            return Result<ReadSongDetailDto?>.Success(null);
        
        var updatedSongDto = await musicRepo.UpdateSongByIdAsync(id, song);

        // signal Song.Updated to every group that has access to this song
        foreach (var access in songAccesses)
            await RTN.SendSongUpdatedAsync(realTimeNotifier, access.GroupId, id);

        return Result<ReadSongDetailDto?>.Success(updatedSongDto);
    }

    public async Task<Result<bool>> SetSongTagsAsync(Guid id, IEnumerable<string> tagIds, IAppUser queryUser)
    {
        // checking if Song exists (at least one Group has access to it)
        var songAccesses = await mshipRepo.GetSongAccessesAsync(id);
        if (songAccesses.Count == 0)
            return Result<bool>.Failure(QueryError.SongNonExistentId);

        // caller must be a member of a Group with access to the Song to tag it
        var callerAccess = songAccesses.FirstOrDefault(sa => sa.GroupId == queryUser.SelectedGroupId);
        if (callerAccess is null)
            return Result<bool>.Failure(QueryError.SongNoAccess);

        // only the Song's creator may modify its Tags
        if (callerAccess.CreatorUserId != queryUser.Id)
            return Result<bool>.Failure(QueryError.SongNoWriteAccess);

        await musicRepo.ReplaceSongTagsAsync(id, tagIds);

        // signal Song.Updated to every Group that has access (Tag changes are a metadata update)
        foreach (var access in songAccesses)
            await RTN.SendSongUpdatedAsync(realTimeNotifier, access.GroupId, id);

        return Result<bool>.Success(true);
    }

    // DELETE

    public async Task<Result<bool>> DeleteSongAsync(Guid id, IAppUser queryUser)
    {
        // checking if song exists (at least one group has access to it)
        var songAccesses = await mshipRepo.GetSongAccessesAsync(id);
        if (songAccesses.Count == 0)
            return Result<bool>.Failure(QueryError.SongNonExistentId);

        // checking if the queryUser's selected group has access to the song
        var songAccess = songAccesses.FirstOrDefault(sa => sa.GroupId == queryUser.SelectedGroupId);
        if (songAccess is null)
            return Result<bool>.Failure(QueryError.SongNoAccess);

        if (songAccess.CreatorUserId != queryUser.Id)
            return Result<bool>.Failure(QueryError.SongNoWriteAccess);

        /* Capture the access list BEFORE we start mutating, so we can later broadcast
           the Song.Deleted notification to every affected group after the fact. */
        var groupIdsThatHadAccess = songAccesses.Select(a => a.GroupId).ToList();

        // removing all related playlist entries for all Song Accesses
        foreach (var access in songAccesses)
        {
            var relatedEntryList = await musicRepo.GetAllPlaylistEntriesBySongAccessAsync(access);
            if (relatedEntryList.Count > 0)
            {
                var parentPlaylist = relatedEntryList[0].GetParentPlaylist();
                foreach (var entry in relatedEntryList)
                {
                    if (parentPlaylist.Id != entry.GetParentPlaylist().Id)
                        parentPlaylist = entry.GetParentPlaylist();

                    var entryNr = parentPlaylist.FindEntryNr(entry.Id);
                    await musicRepo.DeletePlaylistEntryAsync(entry.Id);

                    parentPlaylist.RemoveEntryAt(entryNr - 1);
                    await musicRepo.UpdatePlaylistWithEntriesAsync(parentPlaylist);
                }
            }

            await mshipRepo.DeleteSongAccessAsync(id, access.GroupId);
        }

        // deleting the song itself after all entry references have been removed
        // (cascade-delete on SongSpotifyLinks and SongTags handles those rows automatically)
        await musicRepo.DeleteSongAsync(id);

        // signal Song.Deleted to every group that lost access
        foreach (var groupId in groupIdsThatHadAccess)
            await RTN.SendSongDeletedAsync(realTimeNotifier, groupId, id);

        return Result<bool>.Success(true);
    }

    public async Task DeleteAllSongsByCreatorUserIdAsync(string creatorUserId)
    {
        await musicRepo.DeleteAllSongsByCreatorUserIdAsync(creatorUserId);
    }

    // SPOTIFY COVER RELATED TASKS

    public async Task<string?> GetSongSpotifyIdAsync(Guid songId)
    {
        return await musicRepo.GetSongSpotifySongIdAsync(songId);
    }

    /* Returns the cached cover URL if it exists AND is within the 180-day (fresh)
       Returns (null, false) on miss/expired. "false" tells callers "go hit Spotify" to repopulate cache. */
    public async Task<(string? CoverUrl, bool IsFresh)> GetCachedSpotifyCoverAsync(Guid songId)
    {
        var cached = await musicRepo.GetCachedSpotifyCoverAsync(songId);
        if (cached is null)
            return (null, false);

        var (coverUrl, cachedAt) = cached.Value;
        var isFresh = (DateTime.UtcNow - cachedAt) < TimeSpan.FromDays(180);
        return (coverUrl, isFresh);
    }

    public async Task UpdateCachedSpotifyCoverAsync(Guid songId, string coverUrl)
    {
        await musicRepo.UpdateCachedSpotifyCoverAsync(songId, coverUrl);
    }

    public async Task UnlinkSpotifyForSongIdAsync(Guid songId)
    {
        await musicRepo.UnlinkSpotifyForSongIdAsync(songId);

        /* Signal to every group that has access
          (the song hasn't been removed, but spotify linking is gone, so the FE needs to refresh the rows. */
        var accesses = await mshipRepo.GetSongAccessesAsync(songId);
        foreach (var a in accesses)
            await RTN.SendSongUpdatedAsync(realTimeNotifier, a.GroupId, songId);
    }

    #endregion

    #region SongTag related tasks

    public async Task<List<TagCategoryDto>> GetAllTagsAsync()
    {
        return await musicRepo.GetAllTagsHierarchyAsync();
    }

    #endregion

    #region Playlist related tasks

    // CREATE

    public async Task<Result<Playlist>> AddPlaylistAsync(CreatePlaylistDto dto, IAppUser creatorUser)
    {
        var userAccess = await mshipRepo.GetGroupMembershipRoleTypeAsync(creatorUser.Id, creatorUser.SelectedGroupId);
        if (userAccess < RoleType.Admin)
            return Result<Playlist>.Failure(QueryError.PlaylistUnprivilegedCreation);

        var userGroup = await musicRepo.GetGroupByIdAsync(creatorUser.SelectedGroupId);
        var playlistResult = dto.ToDomain(userGroup!); // userGroup cannot be null due to DB consistency
        if (playlistResult.HasFailed)
            return Result<Playlist>.Failure(playlistResult.Error);

        var playlistNameTakenInGroup = await musicRepo.IsPlaylistNameTakenInGroupAsync(dto.Name, creatorUser.SelectedGroupId);
        if (playlistNameTakenInGroup)
            return Result<Playlist>.Failure(QueryError.PlaylistNameTakenInGroup);

        var playlist = playlistResult.Value!;
        await musicRepo.AddPlaylistAsync(playlist, creatorUser.Id);
        
        // signalling for clients to invalidate playlists
        await RTN.SendPlaylistCreatedAsync(realTimeNotifier, userGroup!.Id, playlist.Id, playlist.GetName());
        
        return Result<Playlist>.Success(playlist);
    }

    public async Task<Result<PlaylistEntry>> AddPlaylistEntryAsync(CreatePlaylistEntryDto dto, IAppUser creatorUser)
    {
        var selectedPlaylistId = creatorUser.SelectedPlaylistId;
        if (selectedPlaylistId is null)
            return Result<PlaylistEntry>.Failure(QueryError.PlaylistNoneSelected);

        var selectedPlaylist = await musicRepo.GetPlaylistByIdAsync((Guid)selectedPlaylistId!, creatorUser.SelectedGroupId);
        if (selectedPlaylist is null)
            return Result<PlaylistEntry>.Failure(QueryError.GroupNoAccess);

        var song = await musicRepo.GetSongByIdAsync(dto.SongId);
        if (song is null)
            return Result<PlaylistEntry>.Failure(QueryError.SongNonExistentId);

        var songAccessList = await mshipRepo.GetSongAccessesAsync(dto.SongId);
        var songAccess = songAccessList.FirstOrDefault(sa => sa.GroupId == creatorUser.SelectedGroupId);
        if (songAccess is null)
            return Result<PlaylistEntry>.Failure(QueryError.SongNoAccess);

        var playlistEntryResult = dto.ToDomain(song, selectedPlaylist);
        if (playlistEntryResult.HasFailed)
            return Result<PlaylistEntry>.Failure(playlistEntryResult.Error);

        var entry = playlistEntryResult.Value!;
        await musicRepo.AddPlaylistEntryAsync(entry, creatorUser);

        // revalidating the order/transitions in the Playlist
        if (dto.InsertionIndex is null)
            selectedPlaylist.AddEntryAt(entry);
        else selectedPlaylist.AddEntryAt(entry, (int)dto.InsertionIndex);

        await musicRepo.UpdatePlaylistWithEntriesAsync(selectedPlaylist);

        // signal PlaylistEntry.Created to every member of the playlist's group
        await RTN.SendPlaylistEntryCreatedAsync(realTimeNotifier,
            creatorUser.SelectedGroupId, (Guid)selectedPlaylistId!, entry.Id);

        return Result<PlaylistEntry>.Success(entry);
    }

    // READ

    public async Task<bool> PlaylistExistsAsync(Guid playlistId)
    {
        return await musicRepo.IsExistingPlaylistAsync(playlistId);
    }

    public async Task<bool> PlaylistAccessibleAsync(Guid playlistId, IAppUser queryUser)
    {
        return await musicRepo.IsPlaylistAccessibleForGroupAsync(playlistId, queryUser.SelectedGroupId);
    }

    public async Task<List<ReadPlaylistDto>> GetAllPlaylistsAsync(IAppUser queryUser)
    {
        return await musicRepo.GetAllPlaylistReadDtosAsync(queryUser);
    }

    public async Task<Result<ReadPlaylistDetailDto>> GetPlaylistByIdAsync(Guid id, IAppUser queryUser)
    {
        if (!await musicRepo.IsExistingPlaylistAsync(id))
            return Result<ReadPlaylistDetailDto>.Failure(QueryError.PlaylistNonExistentId);

        var isAdmin = await mshipRepo.GetGroupMembershipRoleTypeAsync(queryUser.Id, queryUser.SelectedGroupId) >= RoleType.Admin;
        var playlistDto = await musicRepo.GetPlaylistReadDtoByIdAsync(id, queryUser, isAdmin);
        if (playlistDto is null)
            return Result<ReadPlaylistDetailDto>.Failure(QueryError.PlaylistNoAccess);

        return Result<ReadPlaylistDetailDto>.Success(playlistDto);
    }

    public async Task<Result<ReadPlaylistEntryDetailDto>> GetPlaylistEntryByIdAsync(Guid id, IAppUser queryUser)
    {
        var selectedPlaylistId = queryUser.SelectedPlaylistId;
        if (selectedPlaylistId is null)
            return Result<ReadPlaylistEntryDetailDto>.Failure(QueryError.PlaylistNoneSelected);

        if (!await musicRepo.IsExistingPlaylistEntryAsync(id))
            return Result<ReadPlaylistEntryDetailDto>.Failure(QueryError.PlaylistEntryNonExistentId);

        var isAdmin = await mshipRepo.GetGroupMembershipRoleTypeAsync(queryUser.Id, queryUser.SelectedGroupId) >= RoleType.Admin;
        var playlistEntryDto = await musicRepo.GetPlaylistEntryReadDtoByIdAsync(id, queryUser, isAdmin);
        if (playlistEntryDto is null)
            return Result<ReadPlaylistEntryDetailDto>.Failure(QueryError.PlaylistEntryNoAccess);

        return Result<ReadPlaylistEntryDetailDto>.Success(playlistEntryDto);
    }

    public async Task<List<ReadPlaylistEntryDto>?> GetAllPlaylistEntriesAsync(IAppUser queryUser)
    {
        var selectedPlaylistId = queryUser.SelectedPlaylistId;
        if (selectedPlaylistId is null)
            return null;

        return await musicRepo.GetAllPlaylistEntryReadDtosAsync(queryUser);
    }

    public async Task<List<Guid>> GetAllPlaylistEntryIdsAsync(IAppUser queryUser)
    {
        return await musicRepo.GetAllPlaylistEntryIdsAsync(queryUser);
    }

    public async Task<string> GetPlaylistNameByIdAsync(Guid id)
    {
        return await musicRepo.GetPlaylistNameByIdAsync(id);
    }

    // UPDATE

    public async Task<Result<ReadPlaylistDetailDto?>> UpdatePlaylistByIdAsync(Guid id, UpdatePlaylistDto dto, IAppUser queryUser)
    {
        if (!await musicRepo.IsExistingPlaylistAsync(id))
            return Result<ReadPlaylistDetailDto?>.Failure(QueryError.PlaylistNonExistentId);

        var playlist = await musicRepo.GetPlaylistByIdAsync(id, queryUser.SelectedGroupId);
        if (playlist is null)
            return Result<ReadPlaylistDetailDto?>.Failure(QueryError.PlaylistNoAccess);

        if (queryUser.Id != await musicRepo.GetPlaylistCreatorUserIdAsync(id) &&
            await mshipRepo.GetGroupMembershipRoleTypeAsync(queryUser.Id, queryUser.SelectedGroupId) < RoleType.Admin)
            return Result<ReadPlaylistDetailDto?>.Failure(QueryError.PlaylistNoWriteAccess);


        bool changed = false;
        if (dto.Name is not null)
        {
            var setResult = playlist.SetName(dto.Name);
            if (setResult.HasFailed)
                return Result<ReadPlaylistDetailDto?>.Failure(setResult.Error);
            changed = true;
        }
        if (dto.Description is not null)
        {
            // Playlist.SetDescription accepts null/empty/non-empty and normalises internally in the Domain
            playlist.SetDescription(dto.Description);
            changed = true;
        }

        if (!changed)
            return Result<ReadPlaylistDetailDto?>.Success(null);

        var updatedPlaylistDto = await musicRepo.UpdatePlaylistAsync(playlist);
        
        // signalling for clients to invalidate playlists
        await RTN.SendPlaylistMetaDataChangedAsync(realTimeNotifier, 
            queryUser.SelectedGroupId, updatedPlaylistDto.Id, updatedPlaylistDto.Name);
        
        return Result<ReadPlaylistDetailDto?>.Success(updatedPlaylistDto);
    }

    public async Task<Result<ReadPlaylistEntryDetailDto?>> UpdatePlaylistEntryByIdAsync(Guid id, UpdatePlaylistEntryDto dto, IAppUser queryUser)
    {
        var selectedPlaylistId = queryUser.SelectedPlaylistId;
        if (selectedPlaylistId is null)
            return Result<ReadPlaylistEntryDetailDto?>.Failure(QueryError.PlaylistNoneSelected);

        if (!await musicRepo.IsExistingPlaylistEntryAsync(id))
            return Result<ReadPlaylistEntryDetailDto?>.Failure(QueryError.PlaylistEntryNonExistentId);

        if (await mshipRepo.GetGroupMembershipRoleTypeAsync(queryUser.Id, queryUser.SelectedGroupId) < RoleType.Member)
            return Result<ReadPlaylistEntryDetailDto?>.Failure(QueryError.PlaylistEntryNoWriteAccess); // any member can edit entries

        var playlistEntry = await musicRepo.GetPlaylistEntryByIdAsync(id, queryUser);
        if (playlistEntry is null)
            return Result<ReadPlaylistEntryDetailDto?>.Failure(QueryError.PlaylistEntryWrongPlaylist);

        bool changed = false;
        if (dto.StartTime is not null)
        {
            TimeOnly? duration = PlaylistEntryExtensions.TimeOnlyParsed(dto.StartTime);
            if (duration is null)
                return Result<ReadPlaylistEntryDetailDto?>.Failure(Error.SongInvalidFormat);

            var setResult = playlistEntry!.SetStart((TimeOnly)duration!);
            if (setResult.HasFailed)
                return Result<ReadPlaylistEntryDetailDto?>.Failure(setResult.Error);
            changed = true;
        }
        if (dto.EndTime is not null)
        {
            TimeOnly? duration = PlaylistEntryExtensions.TimeOnlyParsed(dto.EndTime);
            if (duration is null)
                return Result<ReadPlaylistEntryDetailDto?>.Failure(Error.SongInvalidFormat);

            var setResult = playlistEntry!.SetEnd((TimeOnly)duration!);
            if (setResult.HasFailed)
                return Result<ReadPlaylistEntryDetailDto?>.Failure(setResult.Error);
            changed = true;
        }
        if (dto.Comment is not null)
        {
            playlistEntry!.SetComment(dto.Comment);
            changed = true;
        }
        if (dto.HexColour is not null)
        {
            System.Drawing.Color? clr = null;
            if (dto.HexColour.Length > 0)
                clr = System.Drawing.ColorTranslator.FromHtml($"#{dto.HexColour}");

            playlistEntry!.SetColour(clr);
            changed = true;
        }
        if (dto.WithPrev is not null)
        {
            var setResult = playlistEntry!.SetWithPrev((bool)dto.WithPrev);
            if (setResult.HasFailed)
                return Result<ReadPlaylistEntryDetailDto?>.Failure(setResult.Error);
            changed = true;
        }
        if (dto.BpmChange is not null)
        {
            var setResult = playlistEntry!.SetBpmChange((decimal)dto.BpmChange);
            if (setResult.HasFailed)
                return Result<ReadPlaylistEntryDetailDto?>.Failure(setResult.Error);
            changed = true;
        }


        if (!changed)
            return Result<ReadPlaylistEntryDetailDto?>.Success(null);

        var isAdmin = await mshipRepo.GetGroupMembershipRoleTypeAsync(queryUser.Id, queryUser.SelectedGroupId) >= RoleType.Admin;
        await musicRepo.UpdatePlaylistEntryAsync(playlistEntry, queryUser, isAdmin);

        // playlist aggregate root validation (in case duration / withPrev changed)
        var playlist = await musicRepo.GetPlaylistByIdAsync((Guid)selectedPlaylistId!, queryUser.SelectedGroupId);
        await musicRepo.UpdatePlaylistWithEntriesAsync(playlist!); // playlist cannot be null due to SelectPlaylist endpoint validations

        // signal PlaylistEntry.Updated to every member of the playlist's group
        await RTN.SendPlaylistEntryUpdatedAsync(realTimeNotifier,
            queryUser.SelectedGroupId, (Guid)selectedPlaylistId!, id);

        var dtoResult = await musicRepo.GetPlaylistEntryReadDtoByIdAsync(id, queryUser, isAdmin);
        return Result<ReadPlaylistEntryDetailDto?>.Success(dtoResult!);
    }

    public async Task<Result<PlaylistEntry>> UpdatePlaylistEntryPositionAsync(Guid id, UpdatePlaylistEntryPositionDto dto, IAppUser queryUser)
    {
        var selectedPlaylistId = queryUser.SelectedPlaylistId;
        if (selectedPlaylistId is null)
            return Result<PlaylistEntry>.Failure(QueryError.PlaylistNoneSelected);

        if (!await musicRepo.IsExistingPlaylistEntryAsync(id))
            return Result<PlaylistEntry>.Failure(QueryError.PlaylistEntryNonExistentId);

        var playlistEntry = await musicRepo.GetPlaylistEntryByIdAsync(id, queryUser);
        if (playlistEntry is null)
            return Result<PlaylistEntry>.Failure(QueryError.PlaylistEntryWrongPlaylist);

        var playlist = await musicRepo.GetPlaylistByIdAsync((Guid)selectedPlaylistId!, queryUser.SelectedGroupId);
        // playlist cannot be null due to SelectPlaylist endpoint validations

        // dto.NewPosition follows 1-based indexing as sent by the FE, but MoveEntry expects 0-based indices, so we convert.
        int movedIndex = (int)playlistEntry.GetNr() - 1;
        int destIndex = dto.NewPosition - 1;

        // clamp the destination index inside the valid domain
        if (destIndex < 0) destIndex = 0;
        if (destIndex >= playlist!.GetEntriesCount()) destIndex = playlist!.GetEntriesCount() - 1;

        /* Pre-validate the move so we never allow a WithPrev entry to end up at position 1.
           (the domain layer already rejects construction of such a state, but this is a "free" defensive pre-check. */
        if (destIndex == 0 && playlistEntry.GetWithPrev())
            return Result<PlaylistEntry>.Failure(Error.PlaylistEntryFirstNotMaster);

        /* Another check for the same invariant: if the CURRENT first entry is being moved away and the entry that
           would slide up into first position is a WithPrev row, the move is also rejected. */
        if (movedIndex == 0 && destIndex > 0 && playlist!.GetEntriesCount() > 1)
        {
            if (playlist![1].GetWithPrev())
                return Result<PlaylistEntry>.Failure(Error.PlaylistEntryFirstNotMaster);
        }

        playlist!.MoveEntry(movedIndex, destIndex);
        await musicRepo.UpdatePlaylistWithEntriesAsync(playlist!);

        // signal PlaylistEntry.Reordered to every member of the playlist's group
        await RTN.SendPlaylistEntryReorderedAsync(realTimeNotifier,
            queryUser.SelectedGroupId, (Guid)selectedPlaylistId!, id);

        return Result<PlaylistEntry>.Success(playlistEntry);
    }

    public async Task<Result<bool>> BulkReorderPlaylistEntriesAsync(UpdatePlaylistEntryPositionInBulkDto dto, IAppUser queryUser)
    {
        var selectedPlaylistId = queryUser.SelectedPlaylistId;
        if (selectedPlaylistId is null)
            return Result<bool>.Failure(QueryError.PlaylistNoneSelected);

        /* Checking that the destination order has exactly the same PlaylistEntry IDs as the current one.
           (This method is strictly for reordering: if destination has new entries, or dropped entries, we mustn't proceed.) */
        var existingEntryIds = await musicRepo.GetAllPlaylistEntryIdsInSelectedPlaylistAsync(queryUser);
        var existingSet = existingEntryIds.ToHashSet();
        var submittedSet = dto.OrderedEntryIds.ToHashSet();
        if (existingSet.Count != submittedSet.Count || !existingSet.SetEquals(submittedSet))
            return Result<bool>.Failure(QueryError.PlaylistEntryReorderSetMismatch);

        /* Membership check: the user must be a member of the group that owns this playlist, in order to reorder it. */
        if (await mshipRepo.GetGroupMembershipRoleTypeAsync(queryUser.Id, queryUser.SelectedGroupId) < RoleType.Member)
            return Result<bool>.Failure(QueryError.PlaylistEntryNoWriteAccess);

        /* Doing the actual reordering (domain validation, then persisted on success). This is atomic and can't fail. */
        var resultOrder = await musicRepo.BulkReorderPlaylistEntriesAsync((Guid)selectedPlaylistId, dto.OrderedEntryIds);

        /* Emitting a single Reordered real-time event for the playlist.
           EntityId = first entry's id is just a placeholder: what matters is the PayloadJson carrying the playlist id,
           so subscribers know which playlist to invalidate. */
        if (resultOrder.Count > 0)
        {
            await RTN.SendPlaylistEntryReorderedAsync(realTimeNotifier,
                queryUser.SelectedGroupId, (Guid)selectedPlaylistId, resultOrder[0]);
        }

        return Result<bool>.Success();
    }

    // DELETE

    public async Task<Result<bool>> DeletePlaylistAsync(Guid id, IAppUser queryUser, IUserService userService)
    {
        if (!await musicRepo.IsExistingPlaylistAsync(id))
            return Result<bool>.Failure(QueryError.PlaylistNonExistentId);

        var playlist = await musicRepo.GetPlaylistByIdAsync(id, queryUser.SelectedGroupId);
        if (playlist is null)
            return Result<bool>.Failure(QueryError.PlaylistNoAccess);

        if (queryUser.Id != await musicRepo.GetPlaylistCreatorUserIdAsync(id) &&
            await mshipRepo.GetGroupMembershipRoleTypeAsync(queryUser.Id, queryUser.SelectedGroupId) < RoleType.Admin)
            return Result<bool>.Failure(QueryError.PlaylistNoWriteAccess);


        // removing all contained playlist entries
        for (int i = 0; i < playlist.GetEntriesCount(); i++)
            await musicRepo.DeletePlaylistEntryAsync(playlist[i].Id);

        // deselecting it for all users
        await userService.DeselectPlaylistForAllUsersAsync(id);

        playlist.ClearEntries();
        await musicRepo.DeletePlaylistAsync(id);
        
        // signalling for clients to invalidate playlists
        await RTN.SendPlaylistDeletedAsync(realTimeNotifier, queryUser.SelectedGroupId, playlist.Id);
        
        return Result<bool>.Success();
    }

    public async Task<Result<bool>> DeletePlaylistEntryAsync(Guid id, IAppUser queryUser)
    {
        var selectedPlaylistId = queryUser.SelectedPlaylistId;
        if (selectedPlaylistId is null)
            return Result<bool>.Failure(QueryError.PlaylistNoneSelected);

        if (!await musicRepo.IsExistingPlaylistEntryAsync(id))
            return Result<bool>.Failure(QueryError.PlaylistEntryNonExistentId);

        if (queryUser.Id != await musicRepo.GetPlaylistEntryCreatorUserIdAsync(id) &&
            await mshipRepo.GetGroupMembershipRoleTypeAsync(queryUser.Id, queryUser.SelectedGroupId) < RoleType.Admin)
            return Result<bool>.Failure(QueryError.PlaylistEntryNoWriteAccess);

        var playlistEntry = await musicRepo.GetPlaylistEntryByIdAsync(id, queryUser);
        if (playlistEntry is null)
            return Result<bool>.Failure(QueryError.PlaylistEntryWrongPlaylist);

        // capture the group + playlist IDs BEFORE we delete so the RTN broadcast can still reference them after the entry row is gone
        var groupIdForBroadcast = queryUser.SelectedGroupId;
        var playlistIdForBroadcast = (Guid)selectedPlaylistId!;

        await musicRepo.DeletePlaylistEntryAsync(id);
        var playlist = playlistEntry.GetParentPlaylist();
        playlist.RemoveEntryAt((int)playlistEntry.GetNr() - 1);
        await musicRepo.UpdatePlaylistWithEntriesAsync(playlist);

        // signal PlaylistEntry.Deleted to every member of the playlist's group
        await RTN.SendPlaylistEntryDeletedAsync(realTimeNotifier,
            groupIdForBroadcast, playlistIdForBroadcast, id);

        return Result<bool>.Success();
    }

    // PlaylistEntryRating related tasks

    public async Task<Result<ReadPlaylistEntryRatingDto>> GetPlaylistEntryRatingAsync(Guid entryId, IAppUser queryUser)
    {
        if (!await musicRepo.IsExistingPlaylistEntryAsync(entryId))
            return Result<ReadPlaylistEntryRatingDto>.Failure(QueryError.PlaylistEntryNonExistentId);

        // Read-access only: the user must at least see the entry to know how others rate it.
        var entryAccessible = await musicRepo.GetPlaylistEntryByIdAsync(entryId, queryUser);
        if (entryAccessible is null)
            return Result<ReadPlaylistEntryRatingDto>.Failure(QueryError.PlaylistEntryNoAccess);

        var (avg, count) = await musicRepo.GetRatingAggregateForEntryAsync(entryId);
        var myRating = await musicRepo.GetRatingForUserAsync(entryId, queryUser.Id);

        return Result<ReadPlaylistEntryRatingDto>.Success(
            PlaylistEntryExtensions.BuildRatingDto(avg, count, myRating));
    }

    public async Task<List<(Guid,int)>> GetAllPlaylistEntryRatingsAsync(IAppUser queryUser)
    {
        return await musicRepo.GetAllRatingsForUserAsync(queryUser);
    }

    public async Task<Result<ReadPlaylistEntryRatingDto>> SetPlaylistEntryRatingAsync(Guid entryId, int rating, IAppUser queryUser)
    {
        if (rating < 1 || rating > 5)
            return Result<ReadPlaylistEntryRatingDto>.Failure(QueryError.PlaylistEntryRatingOutOfRange);

        if (!await musicRepo.IsExistingPlaylistEntryAsync(entryId))
            return Result<ReadPlaylistEntryRatingDto>.Failure(QueryError.PlaylistEntryNonExistentId);

        // Read-access only: the user must at least see the entry to know how others rate it.
        var entryAccessible = await musicRepo.GetPlaylistEntryByIdAsync(entryId, queryUser);
        if (entryAccessible is null)
            return Result<ReadPlaylistEntryRatingDto>.Failure(QueryError.PlaylistEntryNoAccess);

        await musicRepo.UpsertRatingAsync(entryId, queryUser.Id, rating);

        var (avg, count) = await musicRepo.GetRatingAggregateForEntryAsync(entryId);

        // Signal every member of the playlist's group so they see the results of the modification.
        var parentPlaylistId = entryAccessible.GetParentPlaylist().Id;
        await RTN.SendPlaylistEntryUpdatedAsync(realTimeNotifier,
            queryUser.SelectedGroupId, parentPlaylistId, entryId);

        return Result<ReadPlaylistEntryRatingDto>.Success(
            PlaylistEntryExtensions.BuildRatingDto(avg, count, rating));
    }

    public async Task<Result<ReadPlaylistEntryRatingDto>> DeletePlaylistEntryRatingAsync(Guid entryId, IAppUser queryUser)
    {
        if (!await musicRepo.IsExistingPlaylistEntryAsync(entryId))
            return Result<ReadPlaylistEntryRatingDto>.Failure(QueryError.PlaylistEntryNonExistentId);

        // Read-access only: the user must at least see the entry to know how others rate it.
        var entryAccessible = await musicRepo.GetPlaylistEntryByIdAsync(entryId, queryUser);
        if (entryAccessible is null)
            return Result<ReadPlaylistEntryRatingDto>.Failure(QueryError.PlaylistEntryNoAccess);

        await musicRepo.DeleteRatingAsync(entryId, queryUser.Id);

        var (avg, count) = await musicRepo.GetRatingAggregateForEntryAsync(entryId);

        // Signal every member of the playlist's group so they see the results of the modification.
        var parentPlaylistId = entryAccessible.GetParentPlaylist().Id;
        await RTN.SendPlaylistEntryUpdatedAsync(realTimeNotifier,
            queryUser.SelectedGroupId, parentPlaylistId, entryId);

        return Result<ReadPlaylistEntryRatingDto>.Success(
            PlaylistEntryExtensions.BuildRatingDto(avg, count, myRating: null));
    }

    #endregion
}
