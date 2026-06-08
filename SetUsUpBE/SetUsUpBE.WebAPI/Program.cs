using SetUsUpBE.Infrastructure; // Not be used anywhere else in the Presentation layer following Clean Architecture!
using SetUsUpBE.WebAPI.Configuration;
using SetUsUpBE.WebAPI.Middleware;
using Serilog;

namespace SetUsUpBE.WebAPI;

public sealed class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Binding configuration to AppSettings
        builder.Services.Configure<AppSettings>(
            builder.Configuration.GetSection("AppSettings")
        );

        // Injecting Infrastructure layer services (EF, Identity, Business persistence and Email service)
        builder.Services.AddInfrastructureServices();

        // Injecting Presentation layer services (Auth, Swagger doc gen, Controllers, SignalR) 
        builder.Services.AddWebAPIServices();
        
        // Setting up logging (cross cutting service)
        builder.Host.UseSerilog((context, config) => 
            config.ReadFrom.Configuration(context.Configuration)
        );


        var app = builder.Build();

        // One-time idempotent seed of static tag data (categories/groups/tags).
        _ = Infrastructure.DependencyInjection.EnsureStaticDataSeededAsync(app.Services);

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.UseCors("DevCorsPolicy");
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseSerilogRequestLogging();
        app.UseMiddleware<JwtRevocationMiddleware>(); // before Auth, so revoked tokens are rejected early

        // Setting other Middleware options
        app.Use(async (context, next) =>
        {
            // Setting security headers
            var headers = context.Response.Headers;
            if (!headers.ContainsKey("X-Content-Type-Options")) headers["X-Content-Type-Options"] = "nosniff";
            if (!headers.ContainsKey("Referrer-Policy")) headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            if (!headers.ContainsKey("X-Frame-Options")) headers["X-Frame-Options"] = "DENY";

            /* HSTS only when served over HTTPS in production. */
            if (!app.Environment.IsDevelopment() && context.Request.IsHttps && !headers.ContainsKey("Strict-Transport-Security"))
                headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";

            if (!headers.ContainsKey("Content-Security-Policy"))
            {
                // REMOVE localhost from img-src and connect-src in PROD
                headers["Content-Security-Policy"] =
                    "default-src 'self'; " +
                    "script-src 'self'; " +
                    "style-src 'self' 'unsafe-inline'; " +              // MUI uses inline styles
                    "img-src 'self' data: https://i.scdn.co http://localhost:* https://localhost:*; " +
                    "frame-src 'self' https://open.spotify.com; " +     // Spotify Embed iframe
                    "connect-src 'self' http://localhost:* https://localhost:* wss: ws:; " +
                    "frame-ancestors 'none';";
            }

            await next();
        });

        app.UseAuthentication();
        app.UseAuthorization();

        app.UseHttpsRedirection();
        app.MapControllers();

        // Mapping SignalR hubs
        app.MapHub<Realtime.AppHub>("/hubs/app")
            .RequireAuthorization()
            .RequireCors("DevCorsPolicy");

        var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();
        lifetime.ApplicationStarted.Register(() =>
        {
            app.Logger.LogInformation(
                "SetUsUp BE started at {startedAt} UTC (JWTs issued before this moment are invalid).",
                SetUsUpBE.WebAPI.Middleware.BackendLifetime.StartedAt);
        });
        lifetime.ApplicationStopping.Register(() =>
        {
            app.Logger.LogInformation(
                "SetUsUp BE stopping (JWT revocation store will be cleared with process termination).");
        });


        app.Run();
    }
}
