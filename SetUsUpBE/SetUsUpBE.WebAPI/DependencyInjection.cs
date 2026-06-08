using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SetUsUpBE.Application.ServiceInterfaces;
using SetUsUpBE.Infrastructure.IdentityExtensions;
using SetUsUpBE.WebAPI.Configuration;
using SetUsUpBE.WebAPI.Middleware;
using SetUsUpBE.WebAPI.Realtime;
using SetUsUpBE.WebAPI.Services;
using System.Security.Claims;
using System.Text;

namespace SetUsUpBE.WebAPI;

public static class DependencyInjection
{
    public static IServiceCollection AddWebAPIServices(this IServiceCollection services)
    {
        services.AddDevCorsServices();
        services.AddTokenRevocationServices();
        services.AddInactiveUsersCleanupService();
        services.AddSpotifyCoverRefreshService();
        services.AddAuthServices();
        services.AddSwaggerDocGen();
        
        services.AddControllers(); // Adding WebAPI Controllers
        
        services.AddSignalR(); // Adding SignalR for bi-directional real-time communication
        services.AddScoped<IRealTimeNotifierService, SignalRNotifierService>();

        return services;
    }

    private static IServiceCollection AddDevCorsServices(this IServiceCollection services)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("DevCorsPolicy", policy =>
            {
                policy
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials() // required for SingalR
                    .WithOrigins(JwtConfiguration.ReactAudience);
            });
        });
        return services;
    }

    private static IServiceCollection AddTokenRevocationServices(this IServiceCollection services)
    {
        services.AddSingleton<ITokenRevocationStore, InMemoryTokenRevocationStore>();
        services.AddHostedService<JwtRevocationCleanUpService>(); // clean-up worker
        return services;
    }

    private static IServiceCollection AddInactiveUsersCleanupService(this IServiceCollection services)
    {
        services.AddHostedService<InactivityCleanupService>(); // clean-up worker
        return services;
    }

    private static IServiceCollection AddSpotifyCoverRefreshService(this IServiceCollection services)
    {
        services.AddHostedService<SpotifyCoverRefreshService>();
        return services;
    }

    private static IServiceCollection AddAuthServices(this IServiceCollection services)
    {
        // Adding Authentication
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
        }).AddJwtBearer(options =>
        {
            options.SaveToken = true;
            options.RequireHttpsMetadata = false;
            options.TokenValidationParameters = new TokenValidationParameters()
            {
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtConfiguration.Secret)),
                ValidateIssuerSigningKey = true,
                ValidateIssuer = false, // WHILE TESTING ONLY
                ValidateAudience = false, // WHILE TESTING ONLY
                ValidAudiences = new List<string>
                {
                    JwtConfiguration.SwaggerAudience,
                    JwtConfiguration.ReactAudience
                }
            };
            options.Events = new JwtBearerEvents
            {
                /* let SignalR pass tokens via query string (?access_token=...) */
                OnMessageReceived = context =>
                {
                    var accessToken = context.Request.Query["access_token"];

                    // only applied to hub endpoints for security
                    var path = context.HttpContext.Request.Path;
                    if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/app"))
                        context.Token = accessToken;

                    return Task.CompletedTask;
                },

                /* revocation / security stamp validation */
                OnTokenValidated = async context =>
                {
                    var userManager = context.HttpContext.RequestServices
                        .GetRequiredService<UserManager<AppIdentityUser>>();
                    
                    var userId = context.Principal!.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (userId is null)
                    {
                        context.Fail("UserID not found.");
                        return;
                    }

                    var user = await userManager.FindByIdAsync(userId);
                    if (user is null)
                    {
                        context.Fail("User not found.");
                        return;
                    }

                    // validating security stamp
                    var stampFromToken = context.Principal!.FindFirstValue("AspNet.Identity.SecurityStamp");
                    if (stampFromToken != user.SecurityStamp)
                    {
                        context.Fail("Token revoked: security stamp mismatch.");
                    }
                }
            };
        });
        
        // Adding Authorization
        services.AddAuthorization();

        return services;
    }

    private static IServiceCollection AddSwaggerDocGen(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo { Title = "SetUsUpBE", Version = "v1" });
            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                In = ParameterLocation.Header,
                Description = "Please enter a valid token",
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                BearerFormat = "JWT",
                Scheme = "Bearer"
            });
            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    new string[]{ }
                }
            });
        });

        return services;
    }
}
