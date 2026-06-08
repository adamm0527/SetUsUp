using SetUsUpBE.Application.Services;
using SetUsUpBE.Application.ServiceInterfaces;
using SetUsUpBE.Application.RepositoryInterfaces;
using SetUsUpBE.Infrastructure.Configuration;
using SetUsUpBE.Infrastructure.DbContext;
using SetUsUpBE.Infrastructure.DataRepositories;
using SetUsUpBE.Infrastructure.Seeding;
using SetUsUpBE.Infrastructure.Services;
using SetUsUpBE.Infrastructure.ServicesExternal;
using SetUsUpBE.Infrastructure.IdentityExtensions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Http;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.DependencyInjection;
using SetUsUpBE.Infrastructure.ServicesExternal.Email;

namespace SetUsUpBE.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        services.AddEntityFramework();
        services.AddIdentityServices();
        services.AddBusinessPersistence();
        services.AddEmailServices();
        services.AddSpotifyServices();

        return services;
    }


    private static IServiceCollection AddEntityFramework(this IServiceCollection services)
    {
        // Setting up EF Core with DbContext
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(
                DbConfiguration.ConnectionString,
                sqlOptions => sqlOptions.MigrationsAssembly(DbConfiguration.MigrationsAssembly))
        );

        return services;
    }

    private static IServiceCollection AddIdentityServices(this IServiceCollection services)
    {
        // Configuring Identity
        services.Configure<IdentityOptions>(options =>
        {
            options.User.RequireUniqueEmail = true;
            options.SignIn.RequireConfirmedEmail = true;
            options.Lockout.AllowedForNewUsers = true;
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            options.Password.RequireNonAlphanumeric = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireDigit = true;
            options.Password.RequiredLength = 6;
        });

        // Tightening password-reset token lifespan
        services.Configure<DataProtectionTokenProviderOptions>(o =>
        {
            o.TokenLifespan = TimeSpan.FromHours(1);
        });

        // Setting up Identity
        services.AddIdentity<AppIdentityUser, IdentityRole>()
            .AddSignInManager<AppSignInManager>()
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        // Injecting UserService for Application layer
        services.AddScoped<IUserService, UserService>();

        return services;
    }

    private static IServiceCollection AddBusinessPersistence(this IServiceCollection services)
    {
        // Setting up DbContext options for the Repository implementations
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(
                DbConfiguration.ConnectionString,
                sqlOptions => sqlOptions.MigrationsAssembly(DbConfiguration.MigrationsAssembly)));

        // Injecting Repositories
        services.AddScoped<IMusicRepository, MusicRepository>();
        services.AddScoped<IMembershipRepository, MembershipRepository>();

        // Injecting MusicService and MembershipService (Business Logic)
        services.AddScoped<MusicService>();
        services.AddScoped<MembershipService>();

        return services;
    }

    private static IServiceCollection AddEmailServices(this IServiceCollection services)
    {
        // Configuring and adding Email Service
        services.AddSingleton(new EmailConfiguration());
        services.AddScoped<IEmailService, EmailService>();

        return services;
    }

    /* Registers the Spotify Client-Credentials proxy.
       Reads ClientId/ClientSecret from the "Spotify" configuration section (appsettings.json). */
    private static IServiceCollection AddSpotifyServices(this IServiceCollection services)
    {
        services.AddOptions<SpotifyConfiguration>()
            .BindConfiguration(SpotifyConfiguration.SectionName);

        // Typed HttpClient with sensible defaults. Scoped lifetime per request.
        services.AddHttpClient<ISpotifyService, SpotifyService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(15);
            client.DefaultRequestHeaders.UserAgent.ParseAdd("SetUsUp/1.0 (+spotify-proxy)");
        });

        return services;
    }


    // Idempotent one-time seeding of static reference data (TagCategories/-Groups/Tags).
    public static async Task EnsureStaticDataSeededAsync(IServiceProvider serviceProvider, CancellationToken ct = default)
    {
        /* We resolve the DbContextOptions and hand them to TagSeeder,
           so it can open its own short-lived context (consistent with how DataRepositoryBase<AppDbContext> works). */
        using var scope = serviceProvider.CreateScope();
        var options = scope.ServiceProvider.GetRequiredService<DbContextOptions<AppDbContext>>();
        await TagSeeder.EnsureSeededAsync(options, ct);
    }
}
