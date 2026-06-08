using SetUsUpBE.Application.RepositoryInterfaces;
using SetUsUpBE.Application.ServiceInterfaces;
using SetUsUpBE.Application.Services;

namespace SetUsUpBE.WebAPI.Services;

/* Background service responsible for periodically refreshing Spotify cover URLs in the BE DB cache.
   Aim: threefold
      - conforming to Spotify Developer Terms (reasonable caching: ALLOWED, indefinite storage: PROHIBITED)
      - aiding UX of long-gone returning users (their old tracks will have up-to-date covers straight after logging back in)
      - safe boundary setting against hitting Spotify's API rate limits (cover fetches distributed over long time to avoid intense bursts)

   How it works: ran nightly to find cached covers that are no longer fresh (defined by TimeSpan constant: REFRESH_START_AGE),
     and re-validates them at a pretty patient (rate-safe) pace (defined by another TimeSpan constant: INTER_REFRESH_DELAY).
     Max number of re-validations per job run is capped by a constant (MAX_REFRESHES_PER_TICK)
       ---> job starts at DAILY_RUN_AT, and runs for a maximum of approx. INTER_REFRESH_DELAY * MAX_REFRESHES_PER_TICK seconds.
     When a Spotify track can't be found anymore, we delete (unlink) the SongSpotifyLink.

   Similarly to to my other services, this is designed with one instance in mind. */
public sealed class SpotifyCoverRefreshService : BackgroundService
{
    private readonly IServiceScopeFactory scopeFactory;
    private readonly ILogger<SpotifyCoverRefreshService> logger;

    /* Covers older than this will be re-validated.
       Keep it SMALLER than the freshness check in MusicService.GetCachedSpotifyCoverAsync */
    private static readonly TimeSpan REFRESH_START_AGE = TimeSpan.FromDays(150);

    /* A comfortable upper cap for how many re-validations can happen / job run. */
    private const int MAX_REFRESHES_PER_TICK = 500;

    /* Time that needs to elapse between re-validations. Comfortable enough to never trigger Spotify rate limit. */
    private static readonly TimeSpan INTER_REFRESH_DELAY = TimeSpan.FromSeconds(5);

    /* Wake-up time of day, server-local. 04:00 chosen so this runs AFTER InactivityCleanupService (03:00). */
    private static readonly TimeOnly DAILY_RUN_AT = new TimeOnly(4, 0);


    public SpotifyCoverRefreshService(IServiceScopeFactory scopeFactory,
        ILogger<SpotifyCoverRefreshService> logger)
    {
        this.scopeFactory = scopeFactory;
        this.logger = logger;
    }


    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation(
            "SpotifyCoverRefreshService started. Daily run at {time} (server local). " +
            "REFRESH_START_AGE={age} days, MAX_REFRESHES_PER_TICK={max}, INTER_REFRESH_DELAY={delay}s.",
            DAILY_RUN_AT, REFRESH_START_AGE.TotalDays, MAX_REFRESHES_PER_TICK, INTER_REFRESH_DELAY.TotalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            var delay = TimeUntilNextRun_();
            logger.LogInformation("Next cover-refresh tick in {delay}.", delay);
            try
            {
                await Task.Delay(delay, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                break; // shutdown
            }

            try
            {
                await RunTickAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                /* A single bad tick should not crash the host: log and try again tomorrow. Plenty of time available to us. */
                logger.LogError(ex, "Cover-refresh tick failed; will retry tomorrow.");
            }
        }
    }


    /* We can set this to public for testability (so we can trigger it from code). */
    private async Task RunTickAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var musicService = scope.ServiceProvider.GetRequiredService<MusicService>();
        var musicRepo = scope.ServiceProvider.GetRequiredService<IMusicRepository>();
        var spotifyService = scope.ServiceProvider.GetRequiredService<ISpotifyService>();

        var cutoff = DateTime.UtcNow - REFRESH_START_AGE;
        var candidates = await musicRepo.GetCoverRefreshCandidatesAsync(cutoff, MAX_REFRESHES_PER_TICK);

        logger.LogInformation(
            "Cover-refresh tick: found {count} candidates aging past {cutoff} ({age} days threshold).",
            candidates.Count, cutoff, REFRESH_START_AGE.TotalDays);

        int refreshed = 0, detached = 0, failed = 0;

        foreach (var (songId, spotifyId) in candidates)
        {
            if (ct.IsCancellationRequested)
            {
                logger.LogInformation("Cover-refresh tick interrupted by shutdown after {refreshed} refreshes.", refreshed);
                break;
            }

            try
            {
                var coverUrl = await spotifyService.LookupTrackCoverAsync(spotifyId);
                if (coverUrl is null)
                {
                    /* Spotify reported the track as gone --> detach the link entirely so the FE stops asking. */
                    await musicService.UnlinkSpotifyForSongIdAsync(songId);
                    detached++;
                    logger.LogInformation(
                        "Cover refresh: song {SongId} (Spotify {SpotifyId}) detached -- Spotify reports gone.",
                        songId, spotifyId);
                }
                else
                {
                    await musicService.UpdateCachedSpotifyCoverAsync(songId, coverUrl);
                    refreshed++;
                }
            }
            catch (Exception ex)
            {
                /* A single song failing doesn't stop the tick. The entry stays a candidate at the next tick.
                   It's not a problem even if Spotify is down entirely: all entries fail but they all retry tomorrow. */
                failed++;
                logger.LogWarning(ex,
                    "Cover refresh failed for song {SongId} (Spotify {SpotifyId}); will retry next tick.",
                    songId, spotifyId);
            }

            try
            {
                await Task.Delay(INTER_REFRESH_DELAY, ct);
            }
            catch (TaskCanceledException)
            {
                break;
            }
        }

        logger.LogInformation(
            "Cover-refresh tick complete. refreshed={refreshed}, detached={detached}, failed={failed}.",
            refreshed, detached, failed);
    }


    private static TimeSpan TimeUntilNextRun_()
    {
        var now = DateTime.Now;
        var todayRun = now.Date + DAILY_RUN_AT.ToTimeSpan();
        var next = (now < todayRun) ? todayRun : todayRun.AddDays(1);
        return next - now;
    }
}
