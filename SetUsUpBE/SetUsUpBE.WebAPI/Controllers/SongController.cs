using SetUsUpBE.Domain.ValueObjects;
using SetUsUpBE.Application.ServiceInterfaces;
using SetUsUpBE.Application.Services.Primitives;
using SetUsUpBE.Application.Services;
using SetUsUpBE.Application.DTOs.Inbound;
using SetUsUpBE.Application.DTOs.Outbound;
using SetUsUpBE.WebAPI.Primitives;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.AspNetCore.Mvc;

namespace SetUsUpBE.WebAPI.Controllers;

[Authorize]
[Route("songs")]
[ApiController]
public class SongController : ControllerBase
{
    private readonly MusicService musicService;
    private readonly MembershipService mshipService;
    private readonly IUserService userService;
    private readonly ISpotifyService spotifyService;

    public SongController(MusicService musicService, MembershipService mshipService,
        IUserService userService, ISpotifyService spotifyService)
    {
        this.musicService = musicService;
        this.mshipService = mshipService;
        this.userService = userService;
        this.spotifyService = spotifyService;
    }

    // CREATE

    [HttpPost]
    [ProducesResponseType<Response>(StatusCodes.Status201Created)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    public async Task<IResult> CreateSongAsync([FromBody] CreateSongDto songDto)
    {
        var userId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(userId);

        var songResult = await musicService.AddSongAsync(songDto, user!);
        if (songResult.HasFailed)
            return ApiResults.BadRequest_400(songResult.Error);

        return ApiResults.Created_201(
            location: Url.ActionContext.HttpContext.Request.GetEncodedUrl() + "/" + songResult!.Value!.Id,
            response: new Response("Song.CreateSuccess", "Song successfully created.")
        );
    }


    [HttpPost("{songId}/access/{groupId}")]
    [ProducesResponseType<Response>(StatusCodes.Status201Created)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<Response>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IResult> ShareSongWithGroupAsync(Guid songId, Guid groupId)
    {
        var userId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(userId);
        
        var addSongAccessResult = await mshipService.ShareSongAccessAsync(user!, songId, groupId);
        if (addSongAccessResult.HasFailed)
        {
            if (addSongAccessResult.Error == QueryError.SongNonExistentId)
                return ApiResults.NotFound_404(addSongAccessResult.Error);

            if (addSongAccessResult.Error == QueryError.GroupNonExistentId)
                return ApiResults.NotFound_404(addSongAccessResult.Error);

            if (addSongAccessResult.Error == QueryError.SongNoAccess)
                return ApiResults.Forbidden_403(addSongAccessResult.Error);

            if (addSongAccessResult.Error == QueryError.GroupNoAccessToShare)
                return ApiResults.Forbidden_403(addSongAccessResult.Error);

            if (addSongAccessResult.Error == QueryError.GroupAlreadyHasSongAccess)
                return ApiResults.UnprocessableEntity_422(addSongAccessResult.Error);
        }

        return ApiResults.Created_201(
            location: null!,
            response: new Response("Song.AccessShareSuccess", "Song successfully shared.")
        );
    }

    // READ

    [HttpGet("{id}")]
    [ProducesResponseType<ReadSongDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    public async Task<IResult> GetByIdAsync(Guid id)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var songDtoResult = await musicService.GetSongByIdAsync(id, user!);
        if (songDtoResult.HasFailed)
        {
            return (songDtoResult.Error == QueryError.SongNoAccess)
                ? ApiResults.Forbidden_403(songDtoResult.Error)
                : ApiResults.NotFound_404(songDtoResult.Error);
        }

        return ApiResults.Ok_200(songDtoResult.Value!);
    }


    [HttpGet]
    [ProducesResponseType<List<ReadSongDetailDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IResult> GetAllSongsAsync()
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var songDtoList = await musicService.GetAllSongsAsync(user!);
        return (songDtoList.Count > 0)
            ? ApiResults.Ok_200(songDtoList)
            : ApiResults.NoContent_204();
    }


    [HttpGet("{id}/keys")]
    [ProducesResponseType<ReadSongRelatedKeysDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    public async Task<IResult> GetSongRelatedKeys(Guid id)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var songRelatedKeysDtoResult = await musicService.GetSongRelatedKeysAsync(id, user!);
        if (songRelatedKeysDtoResult.HasFailed)
        {
            return (songRelatedKeysDtoResult.Error == QueryError.SongNoAccess)
                ? ApiResults.Forbidden_403(songRelatedKeysDtoResult.Error)
                : ApiResults.NotFound_404(songRelatedKeysDtoResult.Error);
        }

        var relatedKeysDto = songRelatedKeysDtoResult.Value!;
        if (relatedKeysDto is null)
            return ApiResults.NoContent_204();
        else
            return ApiResults.Ok_200(relatedKeysDto);
    }


    [HttpGet("filter")]
    [ProducesResponseType<List<ReadSongDetailDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    public async Task<IResult> GetAllSongsMatchingKeyAsync([FromQuery] params string[] key)
    {
        List<MusicalKey> keys = new List<MusicalKey>();
        foreach (var keyStr in key.Distinct())
        {
            var keyResult = MusicalKey.Create(keyStr);
            if (keyResult.HasFailed)
                return ApiResults.BadRequest_400(keyResult.Error);

            keys.Add(keyResult.Value!);
        }

        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var songDtoList = await musicService.GetAllSongsByKeysAsync(user!, keys);
        return (songDtoList.Count > 0)
            ? ApiResults.Ok_200(songDtoList)
            : ApiResults.NoContent_204();
    }


    [HttpGet("{id}/access")]
    [ProducesResponseType<List<ReadSongAccessDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    public async Task<IResult> GetSongAccessListAsync(Guid id)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var result = await mshipService.GetSongAccessListAsync(id, user!);
        if (result.HasFailed)
        {
            return (result.Error == QueryError.SongNoAccess)
                ? ApiResults.Forbidden_403(result.Error)
                : ApiResults.NotFound_404(result.Error);
        }
        return ApiResults.Ok_200(result.Value!);
    }


    [HttpGet("/tags")] // absolute route -- outside the /songs prefix
    [ProducesResponseType<List<TagCategoryDto>>(StatusCodes.Status200OK)]
    public async Task<IResult> GetAllTagsAsync()
    {
        var tags = await musicService.GetAllTagsAsync();
        return ApiResults.Ok_200(tags);
    }


    // UPDATE

    [HttpPatch("{id}")]
    [ProducesResponseType<ReadSongDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    public async Task<IResult> UpdateSongAsync(Guid id, [FromBody] UpdateSongDto dto)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var songUpdateResult = await musicService.UpdateSongByIdAsync(id, dto, user!);
        if (songUpdateResult.HasFailed)
        {
            if (songUpdateResult.Error == QueryError.SongNonExistentId)
                return ApiResults.NotFound_404(songUpdateResult.Error);
            else if (songUpdateResult.Error == QueryError.SongNoAccess || songUpdateResult.Error == QueryError.SongNoWriteAccess)
                return ApiResults.Forbidden_403(songUpdateResult.Error);
            else
                return ApiResults.BadRequest_400(songUpdateResult.Error);
        }

        var updatedSong = songUpdateResult.Value!;
        return (updatedSong is null)
            ? ApiResults.NoContent_204()
            : ApiResults.Ok_200(updatedSong);
    }


    [HttpPut("{id}/tags")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    public async Task<IResult> SetSongTagsAsync(Guid id, [FromBody] UpsertSongTagsDto dto)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var result = await musicService.SetSongTagsAsync(id, dto.TagIds, user!);
        if (result.HasFailed)
        {
            if (result.Error == QueryError.SongNonExistentId)
                return ApiResults.NotFound_404(result.Error);
            else if (result.Error == QueryError.SongNoAccess || result.Error == QueryError.SongNoWriteAccess)
                return ApiResults.Forbidden_403(result.Error);
            else
                return ApiResults.BadRequest_400(result.Error);
        }
        return ApiResults.NoContent_204();
    }


    // SPOTIFY-RELATED ENDPOINT

    [Authorize]
    [HttpGet("spotify/{songId}/cover")]
    [ProducesResponseType<ReadSpotifyCoverDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IResult> GetSpotifyCoverForSongAsync(Guid songId, [FromQuery] bool forceRefresh = false)
    {
        var spotifyId = await musicService.GetSongSpotifyIdAsync(songId);
        if (string.IsNullOrEmpty(spotifyId))
        {
            return ApiResults.NoContent_204(); // song (probably*) exists but isn't linked to Spotify
            // *not worth to issue potential 403/404 errors (no harm can be done from the App's perspective either way)
            // and better to avoid edge-case checks when throughput is priority (this endpoint is high-traffic)
        }

        /* Layer 1: probably it's in our DB cache. FE can request original source of truth (Spotify) with ?forceRefresh=true.
           Keep in mind FE has Layer 0: cached in localStorage for short-term storage, maximum efficiency.
           This endpoint only truly gets called when the cover isn't there (due to aging or logging in on a new client). */
        if (!forceRefresh)
        {
            var (cachedUrl, isFresh) = await musicService.GetCachedSpotifyCoverAsync(songId);
            if (isFresh && cachedUrl is not null)
            {
                return ApiResults.Ok_200(new ReadSpotifyCoverDto
                {
                    SpotifySongId = spotifyId,
                    CoverUrl = cachedUrl,
                    WasUnlinked = false,
                });
            }
        }

        /* Layer 2: Spotify API. Final destination on cache misses (missing/too old in localStorage and also in DB). */
        var coverUrl = await spotifyService.LookupTrackCoverAsync(spotifyId);
        if (coverUrl is null) // Spotify reports the track as gone
        {
            // Performing unlinking, and signal it in returned DTO.
            await musicService.UnlinkSpotifyForSongIdAsync(songId);
            return ApiResults.Ok_200(new ReadSpotifyCoverDto
            {
                SpotifySongId = spotifyId,
                CoverUrl = null,
                WasUnlinked = true,
            });
        }
        else // We've just got the up-to-date cover.
        {
            // Update the cover and its caching age, and return the (surely valid) URL.
            await musicService.UpdateCachedSpotifyCoverAsync(songId, coverUrl);
            return ApiResults.Ok_200(new ReadSpotifyCoverDto
            {
                SpotifySongId = spotifyId,
                CoverUrl = coverUrl,
                WasUnlinked = false,
            });
        }
    }


    // DELETE

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    public async Task<IResult> DeleteSongAsync(Guid id)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var songDeleteResult = await musicService.DeleteSongAsync(id, user!);
        if (songDeleteResult.HasFailed)
        {
            if (songDeleteResult.Error == QueryError.SongNonExistentId)
                return ApiResults.NotFound_404(songDeleteResult.Error);

            return ApiResults.Forbidden_403(songDeleteResult.Error);
        }

        return ApiResults.NoContent_204();
    }


    [HttpDelete("{songId}/access/{groupId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<Response>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IResult> DeleteSongAccessAsync(Guid songId, Guid groupId)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var accessDeleteResult = await mshipService.DeleteSongAccessAsync(songId, groupId, user!);
        if (accessDeleteResult.HasFailed)
        {
            if (accessDeleteResult.Error == QueryError.SongAccessCannotRevoke)
                return ApiResults.Forbidden_403(accessDeleteResult.Error);

            if (accessDeleteResult.Error == QueryError.SongNonExistentId ||
                accessDeleteResult.Error == QueryError.GroupNonExistentId)
                return ApiResults.NotFound_404(accessDeleteResult.Error);

            return ApiResults.UnprocessableEntity_422(accessDeleteResult.Error);           
        }

        return ApiResults.NoContent_204();
    }
}
