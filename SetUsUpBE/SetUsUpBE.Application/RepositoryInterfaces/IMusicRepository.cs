using SetUsUpBE.Domain.Entities;
using SetUsUpBE.Domain.ValueObjects;
using SetUsUpBE.Application.AppEntityInterfaces;
using SetUsUpBE.Application.ServiceInterfaces;
using SetUsUpBE.Application.DTOs.Outbound;

namespace SetUsUpBE.Application.RepositoryInterfaces;

public interface IMusicRepository
{
    #region Group related interface methods

    // CREATE

    Task<Guid> AddDefaultUserGroupAsync(IAppUser newUser);

    Task<Guid> AddGroupAsync(Group group, string creatorUserId);

    // READ

    Task<bool> IsExistingGroupAsync(Guid groupId);
    
    Task<bool> IsGroupNameTakenAsync(string groupName);

    Task<Group?> GetGroupByIdAsync(Guid groupId);

    Task<List<Group>> GetAllGroupsByCreatorUserIdAsync(string creatorUserId);

    Task<ReadGroupDetailDto> GetGroupReadDtoByIdAsync(Guid id, string queryUserId);

    Task<List<ReadGroupDto>> GetGroupReadDtosByUserAsync(string queryUserId);

    Task<List<Guid>> GetGroupIdsByUserAsync(string userId);

    Task<string> GetGroupNameByIdAsync(Guid id);


    // UPDATE

    Task UpdateGroupNameAsync(Guid id, string newName);

    // DELETE

    Task DeleteGroupAsync(Guid id);

    #endregion

    #region Song related interface methods

    // CREATE

    Task AddSongAsync(Song song);

    // READ

    Task<Song?> GetSongByIdAsync(Guid id);

    Task<ReadSongDetailDto?> GetSongReadDtoByIdAsync(Guid id, ISongAccess songAccess, IAppUser queryUser);

    Task<List<ReadSongDetailDto>> GetAllSongReadDtosAsync(IAppUser queryUser);

    Task<List<ReadSongDetailDto>> GetAllSongReadDtosByKeysAsync(IAppUser queryUser, List<MusicalKey> keys);

    // UPDATE

    Task<ReadSongDetailDto> UpdateSongByIdAsync(Guid id, Song song);

    // DELETE

    Task DeleteSongAsync(Guid id);

    Task DeleteAllSongsByCreatorUserIdAsync(string creatorUserId);

    #endregion

    #region SongSpotifyLink related interface methods

    /* UPSERT:
        spotifySongId == null  -> no-op (when caller doesn't want to touch the Link)
        spotifySongId == ""    -> delete the Link (unlink the Song)
        spotifySongId == "ID"  -> insert/update the Link to that ID */
    Task SetSongSpotifyLinkAsync(Guid songId, string? spotifySongId);

    Task<string?> GetSongSpotifySongIdAsync(Guid songId);

    /* Returns pair of (coverUrl, cachedAt) for the song's SongSpotifyLink, if it exists.
       Returned CoverUrl is null if the passed song isn't linked to Spotify / no cached cover exists for it yet.
       Doesn't perform cache freshness check (caller's responsibility). */
    Task<(string CoverUrl, DateTime CachedAt)?> GetCachedSpotifyCoverAsync(Guid songId);

    // No-op if no SongSpotifyLink row exists with for provided songId
    Task UpdateCachedSpotifyCoverAsync(Guid songId, string coverUrl);

    // Returns up to maxCount SongSpotifyLink entries whose cached cover is aging past the cutoff, ordered ascending from oldest
    Task<List<(Guid SongId, string SpotifySongId)>> GetCoverRefreshCandidatesAsync(DateTime cutoff, int maxCount);

    // Deletes the SongSpotifyLink row for a specific Song. Idempotent: no-op if no row exists.
    Task UnlinkSpotifyForSongIdAsync(Guid songId);

    #endregion

    #region SongTag related interface methods

    // READ

    // Returns the whole tag hierarchy in one call: categories -> groups -> tags. (Cached in Frontend.)
    Task<List<TagCategoryDto>> GetAllTagsHierarchyAsync();

    Task<List<string>> GetSongTagIdsAsync(Guid songId);

    // UPDATE

    // atomic replace of the Song's tag set
    Task ReplaceSongTagsAsync(Guid songId, IEnumerable<string> tagIds);

    #endregion

    #region PlaylistEntry related interface methods

    // CREATE

    Task AddPlaylistEntryAsync(PlaylistEntry playlistEntry, IAppUser creatorUser);

    // READ

    Task<bool> IsExistingPlaylistEntryAsync(Guid id);

    Task<string> GetPlaylistEntryCreatorUserIdAsync(Guid id);

    Task<PlaylistEntry?> GetPlaylistEntryByIdAsync(Guid id, IAppUser queryUser);

    Task<List<Guid>> GetAllPlaylistEntryIdsAsync(IAppUser queryUser);

    Task<List<Guid>> GetAllPlaylistEntryIdsInSelectedPlaylistAsync(IAppUser queryUser);

    Task<List<PlaylistEntry>> GetAllPlaylistEntriesBySongAccessAsync(ISongAccess access);

    Task<ReadPlaylistEntryDetailDto?> GetPlaylistEntryReadDtoByIdAsync(Guid id, IAppUser queryUser, bool isAdmin);

    Task<List<ReadPlaylistEntryDto>> GetAllPlaylistEntryReadDtosAsync(IAppUser queryUser);

    // UPDATE

    Task<ReadPlaylistEntryDetailDto> UpdatePlaylistEntryAsync(PlaylistEntry playlistEntry, IAppUser queryUser, bool isAdmin);

    Task UpdatePlaylistEntriesBySongIdAsync(Guid songId);

    // Atomically reorders every entry in the Playlist to match the supplied ordered list. Validated with Domain AggregateRoot.
    Task<List<Guid>> BulkReorderPlaylistEntriesAsync(Guid playlistId, List<Guid> orderedEntryIds);


    // DELETE

    Task DeletePlaylistEntryAsync(Guid id);

    #endregion

    #region PlaylistEntryRating related interface methods

    /* Upsert: returns true on create, false on update. */
    Task<bool> UpsertRatingAsync(Guid entryId, string raterUserId, int rating);

    // READ

    Task<int?> GetRatingForUserAsync(Guid entryId, string raterUserId);

    Task<List<(Guid,int)>> GetAllRatingsForUserAsync(IAppUser queryUser);

    Task<(decimal? averageRating, int totalRaters)> GetRatingAggregateForEntryAsync(Guid entryId);

    Task<Dictionary<Guid,(decimal? averageRating, int totalRaters)>> GetRatingAggregatesForEntriesAsync(IEnumerable<Guid> entryIds);

    // DELETE

    Task DeleteRatingAsync(Guid entryId, string raterUserId);

    #endregion

    #region Playlist related interface methods

    // CREATE

    Task AddPlaylistAsync(Playlist playlist, string creatorUserId);

    // READ

    Task<bool> IsExistingPlaylistAsync(Guid playlistId);

    Task<bool> IsPlaylistNameTakenInGroupAsync(string playlistName, Guid groupId);

    Task<bool> IsPlaylistAccessibleForGroupAsync(Guid id, Guid groupId);

    Task<string> GetPlaylistCreatorUserIdAsync(Guid id);

    Task<Playlist?> GetPlaylistByIdAsync(Guid id, Guid groupId);

    Task<List<Playlist>> GetAllPlaylistsByGroupIdAsync(Guid groupId);

    Task<ReadPlaylistDetailDto?> GetPlaylistReadDtoByIdAsync(Guid id, IAppUser queryUser, bool isAdmin);

    Task<List<ReadPlaylistDto>> GetAllPlaylistReadDtosAsync(IAppUser queryUser);

    Task<string> GetPlaylistNameByIdAsync(Guid id);

    // UPDATE

    Task<ReadPlaylistDetailDto> UpdatePlaylistAsync(Playlist playlist);

    Task UpdatePlaylistWithEntriesAsync(Playlist playlist);

    // DELETE

    Task DeletePlaylistAsync(Guid id);

    #endregion
}
