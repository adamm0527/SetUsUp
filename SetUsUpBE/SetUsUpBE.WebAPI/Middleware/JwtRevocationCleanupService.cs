namespace SetUsUpBE.WebAPI.Middleware;

public sealed class JwtRevocationCleanUpService : BackgroundService
{
    private readonly ITokenRevocationStore revocationStore;
    private readonly ILogger<JwtRevocationCleanUpService> logger;

    private static readonly TimeSpan cleanUpInterval = TimeSpan.FromMinutes(5);

    public JwtRevocationCleanUpService(ITokenRevocationStore revocationStore, ILogger<JwtRevocationCleanUpService> logger)
    {
        this.revocationStore = revocationStore;
        this.logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Revocation clean-up service started.");
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                revocationStore.CleanUp();
                logger.LogInformation("Revocation store cleaned up successfully at {Time}", DateTime.UtcNow);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error while cleaning up revoked tokens.");
            }

            // Wait until next interval
            await Task.Delay(cleanUpInterval, stoppingToken);
        }
        logger.LogInformation("Revocation clean-up service stopped.");
    }
}
