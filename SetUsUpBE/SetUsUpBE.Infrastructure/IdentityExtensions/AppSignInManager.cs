using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;

namespace SetUsUpBE.Infrastructure.IdentityExtensions;

public sealed class AppSignInManager : SignInManager<AppIdentityUser>
{
    public AppSignInManager(
        UserManager<AppIdentityUser> userManager,
        IHttpContextAccessor contextAccessor,
        IUserClaimsPrincipalFactory<AppIdentityUser> claimsFactory,
        IOptions<IdentityOptions> optionsAccessor,
        ILogger<SignInManager<AppIdentityUser>> logger,
        IAuthenticationSchemeProvider schemes,
        IUserConfirmation<AppIdentityUser> confirmation)
        : base(userManager, contextAccessor, claimsFactory, optionsAccessor, logger, schemes, confirmation)
    {
    }

    public override async Task<bool> CanSignInAsync(AppIdentityUser user)
    {
        // user should only be able to sign in, if they've already confirmed their email address
        return await UserManager.IsEmailConfirmedAsync(user);
    }
}
