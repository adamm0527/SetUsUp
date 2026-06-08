using SetUsUpBE.Application.ServiceInterfaces;
using SetUsUpBE.Application.Services.Primitives;
using SetUsUpBE.Application.DTOs.Outbound;
using SetUsUpBE.WebAPI.Primitives;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SetUsUpBE.WebAPI.Controllers;

/* Proxy endpoints for the Spotify Web API. They live alongside the song endpoints conceptually.
   JWT-authenticated: only logged-in users can search/lookup (rate-limit/cost protection). */
[Authorize]
[Route("songs")]
[ApiController]
public sealed class SpotifyController : ControllerBase
{
    private readonly ISpotifyService spotifyService;

    public SpotifyController(ISpotifyService spotifyService)
    {
        this.spotifyService = spotifyService;
    }


    /* Searches Spotify for tracks matching "q". Returns up to "limit" results.
       Results do NOT include bpm/initKey. Those require the lookup endpoint per track (Audio Features API). */
    [HttpGet("spotify/search")]
    [ProducesResponseType<List<ReadSpotifySongDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<Response>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IResult> SearchAsync([FromQuery] string q, [FromQuery] int limit = 10, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 1)
            return ApiResults.BadRequest_400(QueryError.SpotifyQueryEmpty);

        try
        {
            var results = await spotifyService.SearchTracksAsync(q.Trim(), limit, ct);
            return (results.Count > 0)
                ? ApiResults.Ok_200(results)
                : ApiResults.NoContent_204();
        }
        catch (HttpRequestException ex)
        {
            // Upstream Spotify error
            return ApiResults.UnprocessableEntity_422(
                QueryError.CreateSpotifyUpstreamError(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            // e.g. credentials not configured
            return ApiResults.UnprocessableEntity_422(
                QueryError.CreateSpotifyUpstreamError(ex.Message));
        }
    }


    // Fetches full metadata + audio features (bpm/initKey) for a single Spotify track.
    [HttpGet("spotify/lookup/{spotifyTrackId}")]
    [ProducesResponseType<ReadSpotifySongDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<Response>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IResult> LookupAsync(string spotifyTrackId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(spotifyTrackId))
            return ApiResults.BadRequest_400(QueryError.SpotifyQueryEmpty);

        try
        {
            var track = await spotifyService.LookupTrackAsync(spotifyTrackId, ct);
            if (track is null)
                return ApiResults.NotFound_404(QueryError.SpotifyTrackNotFound);

            return ApiResults.Ok_200(track);
        }
        catch (HttpRequestException ex)
        {
            return ApiResults.UnprocessableEntity_422(
                QueryError.CreateSpotifyUpstreamError(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return ApiResults.UnprocessableEntity_422(
                QueryError.CreateSpotifyUpstreamError(ex.Message));
        }
    }
}
