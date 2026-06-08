using Microsoft.EntityFrameworkCore;
using SetUsUpBE.Application.ServiceInterfaces;
using SetUsUpBE.Application.Services;
using SetUsUpBE.Infrastructure.DbContext;
using SetUsUpBE.Infrastructure.IdentityExtensions;
using SetUsUpBE.Infrastructure.ServicesExternal.Email;

namespace SetUsUpBE.WebAPI.Services;

/* Background service: enforces the 180-day inactivity retention policy.
   - Runs once a day. Start time default: at 03:00 server local.
   - Steps per tick:
       (1) Hard-delete users whose LastLoginAt < now - 180d (uses MusicService's user-deletion
           cascade, same path the self-delete endpoint uses).
       (2) Send inactivity-warning emails to users approaching the threshold,
           at milestones {30, 7, 3, 2, 1} days remaining, tracked via LastInactivityWarningMilestone so we don't re-send.

   DEPLOY NOTE: implemented with single instance in mind. Locking would be required in multi-instance setup. */
public sealed class InactivityCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory scopeFactory;
    private readonly ILogger<InactivityCleanupService> logger;

    private static readonly TimeSpan INACTIVITY_THRESHOLD = TimeSpan.FromDays(180);
    private static readonly int[] WARNING_MILESTONES_DAYS = new[] { 30, 7, 3, 2, 1 };
    private static readonly TimeOnly DAILY_RUN_AT = new TimeOnly(3, 0);

    public InactivityCleanupService(IServiceScopeFactory scopeFactory,
        ILogger<InactivityCleanupService> logger)
    {
        this.scopeFactory = scopeFactory;
        this.logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("InactivityCleanupService started. Daily run at {time}.", DAILY_RUN_AT);

        while (!stoppingToken.IsCancellationRequested)
        {
            var delay = TimeUntilNextRun_();
            logger.LogInformation("Next inactivity tick in {delay}.", delay);
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
                await RunTickAsync_(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "InactivityCleanupService tick failed; will retry on next schedule.");
            }
        }

        logger.LogInformation("InactivityCleanupService stopped.");
    }

    private static TimeSpan TimeUntilNextRun_()
    {
        var now = DateTime.Now;
        var nextRun = now.Date.Add(DAILY_RUN_AT.ToTimeSpan());
        if (nextRun <= now) nextRun = nextRun.AddDays(1);
        return nextRun - now;
    }

    private async Task RunTickAsync_(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var userService = scope.ServiceProvider.GetRequiredService<IUserService>();
        var musicService = scope.ServiceProvider.GetRequiredService<MusicService>();
        var mshipService = scope.ServiceProvider.GetRequiredService<MembershipService>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var nowUtc = DateTime.UtcNow;

        /* --- (1) Hard-delete expired accounts --- */
        var deletionThreshold = nowUtc - INACTIVITY_THRESHOLD;
        var expiredUsers = await context.Users
            .Where(u => u.LastLoginAt != null && u.LastLoginAt < deletionThreshold)
            .ToListAsync(ct);

        foreach (var user in expiredUsers)
        {
            try
            {
                /* Reuse the existing DeleteUserAsync cascade, as if it were a self-service deletion.
                   (It removes all groups they own, their songs, playlists, memberships, etc.) */
                await userService.DeleteUserAsync(user, musicService, mshipService);
                logger.LogInformation("Inactivity-deleted user {userId} (last login {lastLogin}).",
                    user.Id, user.LastLoginAt);

                // courtesy notification (best-effort, ignore failures)
                var (subject, content) = EmailTemplates.BuildAccountDeleted(user.UserName!, "inactivity");
                _ = emailService.SendEmailAsync(new[] { user.Email! }, subject, content);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to delete inactive user {userId}.", user.Id);
            }
        }

        /* --- (2) Send warning emails to users approaching the threshold --- */
        foreach (var milestone in WARNING_MILESTONES_DAYS)
        {
            var warningThresholdLow  = nowUtc - INACTIVITY_THRESHOLD + TimeSpan.FromDays(milestone - 1);
            var warningThresholdHigh = nowUtc - INACTIVITY_THRESHOLD + TimeSpan.FromDays(milestone);

            /* Users whose deletion date falls within [today, today+1) for this milestone AND
               haven't already received a warning for this (or earlier) milestone. */
            var candidates = await context.Users
                .Where(u => u.LastLoginAt != null
                         && u.LastLoginAt > deletionThreshold  // not already eligible for delete
                         && u.LastLoginAt >= warningThresholdLow
                         && u.LastLoginAt <  warningThresholdHigh
                         && (u.LastInactivityWarningMilestone == null
                             || u.LastInactivityWarningMilestone > milestone))
                .ToListAsync(ct);

            foreach (var user in candidates)
            {
                try
                {
                    var deletionDate = user.LastLoginAt!.Value + INACTIVITY_THRESHOLD;
                    var (subject, content) = EmailTemplates.BuildInactivityWarning(
                        user.UserName!, milestone, deletionDate);

                    var result = await emailService.SendEmailAsync(new[] { user.Email! }, subject, content);
                    if (result.HasSucceeded)
                    {
                        user.LastInactivityWarningMilestone = milestone;
                        await context.SaveChangesAsync(ct);
                        logger.LogInformation("Sent {days}-day inactivity warning to user {userId}.",
                            milestone, user.Id);
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Failed to send inactivity warning to user {userId}.", user.Id);
                }
            }
        }
    }
}
