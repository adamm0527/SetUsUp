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
[Route("playlists")]
[ApiController]
public class PlaylistController : ControllerBase
{
    private readonly MusicService musicService;
    private readonly IUserService userService;

    public PlaylistController(MusicService musicService, IUserService userService)
    {
        this.musicService = musicService;
        this.userService = userService;
    }

    // CREATE

    [HttpPost]
    [ProducesResponseType<Response>(StatusCodes.Status201Created)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    public async Task<IResult> CreatePlaylistAsync([FromBody] CreatePlaylistDto dto)
    {
        var userId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(userId);

        var playlistResult = await musicService.AddPlaylistAsync(dto, user!);
        if (playlistResult.HasFailed)
        {
            if (playlistResult.Error == QueryError.PlaylistUnprivilegedCreation)
                return ApiResults.Forbidden_403(playlistResult.Error);
            else
                return ApiResults.BadRequest_400(playlistResult.Error);
        }

        var playlist = playlistResult!.Value!;
        await userService.SetSelectedPlaylistAsync(user!, playlist.Id); // the new playlist becomes selected for the user

        return ApiResults.Created_201(
            location: Url.ActionContext.HttpContext.Request.GetEncodedUrl() + "/" + playlist.Id,
            response: new Response("Playlist.CreateSuccess", "Playlist successfully created.")
        );
    }


    [HttpPost("entries")]
    [ProducesResponseType<Response>(StatusCodes.Status201Created)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    public async Task<IResult> CreatePlaylistEntryAsync([FromBody] CreatePlaylistEntryDto dto)
    {
        var userId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(userId);

        var playlistEntryResult = await musicService.AddPlaylistEntryAsync(dto, user!);
        if (playlistEntryResult.HasFailed)
        {
            if (playlistEntryResult.Error == QueryError.SongNonExistentId)
                return ApiResults.NotFound_404(playlistEntryResult.Error);
            else if (playlistEntryResult.Error == QueryError.SongNoAccess)
                return ApiResults.Forbidden_403(playlistEntryResult.Error);
            else
                return ApiResults.BadRequest_400(playlistEntryResult.Error);
        }
        
        return ApiResults.Created_201(
            location: Url.ActionContext.HttpContext.Request.GetEncodedUrl() + "/" + playlistEntryResult!.Value!.Id,
            response: new Response("PlaylistEntry.CreateSuccess", "PlaylistEntry successfully created.")
        );
    }

    // READ

    [HttpGet]
    [ProducesResponseType<List<ReadPlaylistDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IResult> GetAllPlaylistsAsync()
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var playlistDtoList = await musicService.GetAllPlaylistsAsync(user!);
        return (playlistDtoList.Count > 0)
            ? ApiResults.Ok_200(playlistDtoList)
            : ApiResults.NoContent_204();
    }


    [HttpGet("{id}")]
    [ProducesResponseType<ReadPlaylistDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    public async Task<IResult> GetPlaylistByIdAsync(Guid id)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var playlistDtoResult = await musicService.GetPlaylistByIdAsync(id, user!);
        if (playlistDtoResult.HasFailed)
        {
            return (playlistDtoResult.Error == QueryError.PlaylistNonExistentId)
                ? ApiResults.NotFound_404(playlistDtoResult.Error)
                : ApiResults.Forbidden_403(playlistDtoResult.Error);
        }

        return ApiResults.Ok_200(playlistDtoResult.Value!);
    }


    [HttpGet("entries")]
    [ProducesResponseType<List<ReadSongDetailDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    public async Task<IResult> GetAllPlaylistEntriesAsync()
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var playlistEntryDtoList = await musicService.GetAllPlaylistEntriesAsync(user!);
        if (playlistEntryDtoList is null)
            return ApiResults.BadRequest_400(QueryError.PlaylistNoneSelected);

        return (playlistEntryDtoList.Count > 0)
            ? ApiResults.Ok_200(playlistEntryDtoList)
            : ApiResults.NoContent_204();
    }


    [HttpGet("entries/{id}")]
    [ProducesResponseType<ReadSongDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    public async Task<IResult> GetPlaylistEntryByIdAsync(Guid id)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var playlistEntryDtoResult = await musicService.GetPlaylistEntryByIdAsync(id, user!);
        if (playlistEntryDtoResult.HasFailed)
        {
            if (playlistEntryDtoResult.Error == QueryError.PlaylistEntryNonExistentId)
                return ApiResults.NotFound_404(playlistEntryDtoResult.Error);

            if (playlistEntryDtoResult.Error == QueryError.PlaylistEntryNoAccess)
                return ApiResults.Forbidden_403(playlistEntryDtoResult.Error);

            return ApiResults.BadRequest_400(playlistEntryDtoResult.Error);
        }

        return ApiResults.Ok_200(playlistEntryDtoResult.Value!);
    }


    [HttpGet("entries/{id}/rating")]
    [ProducesResponseType<ReadPlaylistEntryRatingDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    public async Task<IResult> GetPlaylistEntryRatingAsync(Guid id)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var ratingResult = await musicService.GetPlaylistEntryRatingAsync(id, user!);
        if (ratingResult.HasFailed)
        {
            if (ratingResult.Error == QueryError.PlaylistEntryNonExistentId)
                return ApiResults.NotFound_404(ratingResult.Error);
            if (ratingResult.Error == QueryError.PlaylistEntryNoAccess)
                return ApiResults.Forbidden_403(ratingResult.Error);
            return ApiResults.BadRequest_400(ratingResult.Error);
        }

        return ApiResults.Ok_200(ratingResult.Value!);
    }

    // UPDATE

    [HttpPatch("{id}")]
    [ProducesResponseType<ReadPlaylistDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    public async Task<IResult> UpdatePlaylistAsync(Guid id, [FromBody] UpdatePlaylistDto dto)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var playlistUpdateResult = await musicService.UpdatePlaylistByIdAsync(id, dto, user!);
        if (playlistUpdateResult.HasFailed)
        {
            if (playlistUpdateResult.Error == QueryError.PlaylistNonExistentId)
                return ApiResults.NotFound_404(playlistUpdateResult.Error);

            if (playlistUpdateResult.Error == QueryError.PlaylistNoAccess ||
                playlistUpdateResult.Error == QueryError.PlaylistNoWriteAccess)
                return ApiResults.Forbidden_403(playlistUpdateResult.Error);

            return ApiResults.BadRequest_400(playlistUpdateResult.Error);
        }

        var updatedPlaylist = playlistUpdateResult.Value!;
        return (updatedPlaylist is null)
            ? ApiResults.NoContent_204()
            : ApiResults.Ok_200(updatedPlaylist);
    }


    [HttpPatch("entries/{id}")]
    [ProducesResponseType<ReadPlaylistEntryDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    public async Task<IResult> UpdatePlaylistEntryAsync(Guid id, [FromBody] UpdatePlaylistEntryDto dto)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var playlistEntryUpdateResult = await musicService.UpdatePlaylistEntryByIdAsync(id, dto, user!);
        if (playlistEntryUpdateResult.HasFailed)
        {
            if (playlistEntryUpdateResult.Error == QueryError.PlaylistEntryNonExistentId)
                return ApiResults.NotFound_404(playlistEntryUpdateResult.Error);

            if (playlistEntryUpdateResult.Error == QueryError.PlaylistEntryNoWriteAccess)
                return ApiResults.Forbidden_403(playlistEntryUpdateResult.Error);

            return ApiResults.BadRequest_400(playlistEntryUpdateResult.Error);
        }

        var updatedPlaylistEntry = playlistEntryUpdateResult.Value!;
        return (updatedPlaylistEntry is null)
            ? ApiResults.NoContent_204()
            : ApiResults.Ok_200(updatedPlaylistEntry);
    }


    [HttpPatch("entries/{id}/position")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    public async Task<IResult> UpdatePlaylistEntryPositionAsync(Guid id, [FromBody] UpdatePlaylistEntryPositionDto dto)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var playlistEntryPosResult = await musicService.UpdatePlaylistEntryPositionAsync(id, dto, user!);
        if (playlistEntryPosResult.HasFailed)
        {
            if (playlistEntryPosResult.Error == QueryError.PlaylistEntryNonExistentId)
                return ApiResults.NotFound_404(playlistEntryPosResult.Error);

            return ApiResults.BadRequest_400(playlistEntryPosResult.Error);
        }

        return ApiResults.NoContent_204();
    }


    [HttpPatch("entries/reorder")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    public async Task<IResult> BulkReorderPlaylistEntriesAsync([FromBody] UpdatePlaylistEntryPositionInBulkDto dto)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var bulkResult = await musicService.BulkReorderPlaylistEntriesAsync(dto, user!);
        if (bulkResult.HasFailed)
        {
            if (bulkResult.Error == QueryError.PlaylistEntryNoWriteAccess)
                return ApiResults.Forbidden_403(bulkResult.Error);

            return ApiResults.BadRequest_400(bulkResult.Error);
        }

        return ApiResults.NoContent_204();
    }


    [HttpPut("entries/{id}/rating")]
    [ProducesResponseType<ReadPlaylistEntryRatingDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    public async Task<IResult> SetPlaylistEntryRatingAsync(Guid id, [FromBody] UpsertPlaylistEntryRatingDto dto)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var ratingResult = await musicService.SetPlaylistEntryRatingAsync(id, dto.Rating, user!);
        if (ratingResult.HasFailed)
        {
            if (ratingResult.Error == QueryError.PlaylistEntryNonExistentId)
                return ApiResults.NotFound_404(ratingResult.Error);
            if (ratingResult.Error == QueryError.PlaylistEntryNoAccess)
                return ApiResults.Forbidden_403(ratingResult.Error);
            return ApiResults.BadRequest_400(ratingResult.Error);
        }

        return ApiResults.Ok_200(ratingResult.Value!);
    }

    // DELETE

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    public async Task<IResult> DeletePlaylistAsync(Guid id)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var playlistDeleteResult = await musicService.DeletePlaylistAsync(id, user!, userService);
        if (playlistDeleteResult.HasFailed)
        {
            if (playlistDeleteResult.Error == QueryError.PlaylistNonExistentId)
                return ApiResults.NotFound_404(playlistDeleteResult.Error);

            return ApiResults.Forbidden_403(playlistDeleteResult.Error);
        }

        return ApiResults.NoContent_204();
    }


    [HttpDelete("entries/{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    public async Task<IResult> DeletePlaylistEntryAsync(Guid id)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var playlistEntryDeleteResult = await musicService.DeletePlaylistEntryAsync(id, user!);
        if (playlistEntryDeleteResult.HasFailed)
        {
            if (playlistEntryDeleteResult.Error == QueryError.PlaylistEntryNonExistentId)
                return ApiResults.NotFound_404(playlistEntryDeleteResult.Error);

            if (playlistEntryDeleteResult.Error == QueryError.PlaylistEntryNoWriteAccess)
                return ApiResults.Forbidden_403(playlistEntryDeleteResult.Error);

            return ApiResults.BadRequest_400(playlistEntryDeleteResult.Error);
        }

        return ApiResults.NoContent_204();
    }


    [HttpDelete("entries/{id}/rating")]
    [ProducesResponseType<ReadPlaylistEntryRatingDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    public async Task<IResult> DeletePlaylistEntryRatingAsync(Guid id)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var ratingResult = await musicService.DeletePlaylistEntryRatingAsync(id, user!);
        if (ratingResult.HasFailed)
        {
            if (ratingResult.Error == QueryError.PlaylistEntryNonExistentId)
                return ApiResults.NotFound_404(ratingResult.Error);
            if (ratingResult.Error == QueryError.PlaylistEntryNoAccess)
                return ApiResults.Forbidden_403(ratingResult.Error);
            return ApiResults.BadRequest_400(ratingResult.Error);
        }

        return ApiResults.Ok_200(ratingResult.Value!);
    }
}
