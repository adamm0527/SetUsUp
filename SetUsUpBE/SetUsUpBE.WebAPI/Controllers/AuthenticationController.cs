using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SetUsUpBE.Application.AppEntityInterfaces;
using SetUsUpBE.Application.DTOs.Inbound;
using SetUsUpBE.Application.DTOs.Outbound;
using SetUsUpBE.Application.ServiceInterfaces;
using SetUsUpBE.Application.Services;
using SetUsUpBE.Application.Services.Primitives;
using SetUsUpBE.Domain.Primitives;
using SetUsUpBE.Infrastructure.IdentityExtensions;
using SetUsUpBE.Infrastructure.ServicesExternal.Email;
using SetUsUpBE.WebAPI.Configuration;
using SetUsUpBE.WebAPI.Middleware;
using SetUsUpBE.WebAPI.Primitives;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SetUsUpBE.WebAPI.Controllers;

[Route("user")]
[ApiController]
public sealed class AuthenticationController : ControllerBase
{
    private readonly IUserService userService;
    private readonly IEmailService emailService;
    private readonly MusicService musicService;
    private readonly MembershipService mshipService;
    private readonly IConfiguration configuration;


    public AuthenticationController(IUserService userService, IEmailService emailService,
        MusicService musicService, MembershipService mshipService, IConfiguration configuration)
    {
        this.userService = userService;
        this.emailService = emailService;
        this.musicService = musicService;
        this.mshipService = mshipService;
        this.configuration = configuration;
    }

    // MUST ONLY BE CALLED from an AUTHORIZED endpoint
    public static string GetUserId(System.Security.Principal.IIdentity? userIdentity)
    {
        return (userIdentity as ClaimsIdentity)!.FindFirst(ClaimTypes.NameIdentifier)!.Value;
    }

    [HttpPost("register")]
    [ProducesResponseType<Response>(StatusCodes.Status201Created)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<Response>(StatusCodes.Status422UnprocessableEntity)]
    [ProducesResponseType<Response>(StatusCodes.Status500InternalServerError)]
    public async Task<IResult> RegisterUserAsync([FromBody] CreateUserDto dto)
    {
        // Disallow invalid looking Emails
        var emailFormatResult = IsValidLookingEmail_(dto.Email);
        if (emailFormatResult.HasFailed)
            return ApiResults.BadRequest_400(emailFormatResult.Error);

        // Disallowing duplicate Emails
        var existingUser = await userService.GetUserByEmailAsync(dto.Email);
        if (existingUser is not null)
            return ApiResults.UnprocessableEntity_422(AuthError.UserAlreadyExistsWithEmail);

        // Disallowing duplicate UserNames
        existingUser = await userService.GetUserByUserNameAsync(dto.UserName);
        if (existingUser is not null)
            return ApiResults.UnprocessableEntity_422(AuthError.UserAlreadyExistsWithUserName);

        // Disallowing too short (<3 characters) and too long (>30 characters) UserNames
        if (dto.UserName.Length < 3)
            return ApiResults.BadRequest_400(AuthError.UserNameTooShort);
        else if (dto.UserName.Length > 30)
            return ApiResults.BadRequest_400(AuthError.UserNameTooLong);
    
        // Creating and Adding User after Identity Server validations
        var newUserResult = await userService.CreateUserAsync(dto.Email, dto.UserName, dto.Password);
        if (newUserResult.HasFailed)
            return ApiResults.BadRequest_400(newUserResult.Error);
        var newUser = newUserResult.Value!; // can't be null due to previous check

        return await SendConfirmationEmailAsync_(newUser,
            new Response("User.RegisterSuccess", $"{newUser.UserName} user successfully registered."));
    }


    [HttpPost("resend-confirm-email")]
    [ProducesResponseType<Response>(StatusCodes.Status201Created)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<Response>(StatusCodes.Status422UnprocessableEntity)]
    [ProducesResponseType<Response>(StatusCodes.Status500InternalServerError)]
    public async Task<IResult> ConfirmEmailResendAsync([FromBody] string email)
    {
        // Disallow invalid looking Emails
        var emailFormatResult = IsValidLookingEmail_(email);
        if (emailFormatResult.HasFailed)
            return ApiResults.BadRequest_400(emailFormatResult.Error);

        // Disallow sending confirmation links to unregistered emails
        var user = await userService.GetUserByEmailAsync(email);
        if (user is null)
            return ApiResults.BadRequest_400(AuthError.UserEmailCannotSendUnregistered);

        // Disallow resending confirmation emails to already registered users 
        if (user.EmailConfirmed)
            return ApiResults.UnprocessableEntity_422(AuthError.UserEmailAlreadyConfirmed);

        return await SendConfirmationEmailAsync_(user,
            new Response("User.ResendConfirmEmailSuccess", $"Confirmation email successfully resent to {email}."));
    }


    [HttpGet("confirm-email")]
    [ProducesResponseType<Response>(StatusCodes.Status308PermanentRedirect)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<Response>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IResult> ConfirmEmailAsync(string token, string email,
        [FromServices] IOptions<AppSettings> options)
    {
        var user = await userService.GetUserByEmailAsync(email);
        if (user is null)
            return ApiResults.NotFound_404(AuthError.UserNonExistentEmail);

        if (user.EmailConfirmed) // if email is already confirmed
            return ApiResults.UnprocessableEntity_422(AuthError.UserEmailAlreadyConfirmed);

        var confirmResult = await userService.ConfirmEmailAsync(user, token);
        if (confirmResult.HasFailed)
            return ApiResults.BadRequest_400(confirmResult.Error);


        // successful confirmation: now we create a group for the user
        await musicService.AddDefaultUserGroupAsync(user, userService);
        
        // redirecting user after now that they clicked on the confirmation link
        var appSettings = options.Value;
        var redirectUrl = $"{appSettings.FrontendBaseUrl}{appSettings.FrontendRegRedirectRoute}";
        return ApiResults.Redirect_308(redirectUrl);
    }


    [HttpPost("login-w-username")]
    [ProducesResponseType<JwtResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<Response>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<Response>(StatusCodes.Status423Locked)]
    public async Task<IResult> LoginWithUserNameAsync([FromBody] ActionLoginWithUserNameDto dto)
    {
        var user = await userService.GetUserByUserNameAsync(dto.UserName);
        if (user is null)
            return ApiResults.BadRequest_400(AuthError.UserNonExistentUserName);

        return await LoginUserAsync_(user, dto.Password);
    }


    [HttpPost("login-w-email")]
    [ProducesResponseType<JwtResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<Response>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<Response>(StatusCodes.Status423Locked)]
    public async Task<IResult> LoginWithEmailAsync([FromBody] ActionLoginWithEmailDto dto)
    {
        var user = await userService.GetUserByEmailAsync(dto.Email);
        if (user is null)
            return ApiResults.BadRequest_400(AuthError.UserNonExistentEmail);

        return await LoginUserAsync_(user, dto.Password);
    }


    [HttpPost("refresh-session")]
    [ProducesResponseType<JwtResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<Response>(StatusCodes.Status401Unauthorized)]
    public async Task<IResult> RefreshTokenAsync([FromServices] ITokenRevocationStore revocationStore)
    {
        // Validating structure
        string? token = null;
        try
        {
            JwtSecurityToken? jwt = AuthHeaderToJwt_(Request);
            token = Request.Headers.Authorization
                .FirstOrDefault()?.Replace("Bearer", string.Empty).Trim();

            // Check if payload jwt empty/not received
            if (jwt is not null && string.IsNullOrWhiteSpace(token))
                return ApiResults.BadRequest_400(AuthError.UserMissingToken);
        }
        catch (Exception)
        {
            return ApiResults.Unauthorized_401(AuthError.UserInvalidToken);
        }

        
        // Validate signature but ignore lifetime (in this check)
        var tokenHandler = new JwtSecurityTokenHandler();
        TokenValidationParameters validationParams = new TokenValidationParameters()
        {
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtConfiguration.Secret)),
            ValidateIssuerSigningKey = true,
            ValidateIssuer = false, // WHILE TESTING ONLY
            ValidateAudience = false, // WHILE TESTING ONLY
            ValidateLifetime = false, // we first check signature only
            ClockSkew = TimeSpan.Zero
        };

        try
        {
            var principal = tokenHandler.ValidateToken(token, validationParams, out var validatedToken);
            
            // Ensure the token is still a JWT and not tampered with
            if (validatedToken is not JwtSecurityToken jwtToken ||
                !jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return ApiResults.Unauthorized_401(AuthError.UserInvalidToken);
            }

            // Is this jti already revoked?
            if (!string.IsNullOrEmpty(jwtToken.Id) && revocationStore.IsRevoked(jwtToken.Id))
                return ApiResults.Unauthorized_401(AuthError.UserInvalidToken); // cannot refresh already revoked

            // user matches to jwt?
            var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId is null)
                return ApiResults.Unauthorized_401(AuthError.UserInvalidToken);
            var user = await userService.GetUserByIdAsync(userId);
            if (user is null)
                return ApiResults.Unauthorized_401(AuthError.UserInvalidToken);

            // Is Security Stamp the newest? -- resolves deadlock when 2 session alternatively refresh themselves
            var tokenStamp = principal.FindFirst("AspNet.Identity.SecurityStamp")?.Value;
            if (!await userService.IsSecurityStampUpToDateAsync(user, tokenStamp))
                return ApiResults.Unauthorized_401(AuthError.UserInvalidToken);

            // Was token already expired too long ago?
            var oldValidTo = jwtToken.ValidTo;
            if (oldValidTo < DateTime.UtcNow.AddHours(-1))
                return ApiResults.Unauthorized_401(AuthError.UserTokenExpiredTooLongAgo);

            // Everything valid — we can issue a new token
            var newClaims = IssueClaims_(user);
            var newJwt = GetJWT_(newClaims);
            var newToken = new JwtSecurityTokenHandler().WriteToken(newJwt);

            // IMPORTANT: revoke old token, so attacker can't dupe tokens.
            if (!RevokeJWT_(Request, revocationStore))
                return ApiResults.BadRequest_400(AuthError.UserInvalidToken);

            return ApiResults.Ok_200(new JwtResponse(
                Token: newToken,
                ValidTo: newJwt.ValidTo
            ));
        }
        catch (SecurityTokenException)
        {
            return ApiResults.Unauthorized_401(AuthError.UserInvalidToken);
        }
        catch (Exception)
        {
            return ApiResults.BadRequest_400(AuthError.UserInvalidToken);
        }
    }


    [Authorize]
    [HttpGet("selected-group")]
    [ProducesResponseType<ReadUserSelectionDto>(StatusCodes.Status200OK)]
    public async Task<IResult> GetSelectedGroupAsync()
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);
        var selectedGroupDto = await userService.GetSelectedGroupAsync(user!, musicService);
        return ApiResults.Ok_200(selectedGroupDto);
    }


    [Authorize]
    [HttpPatch("selected-group")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    public async Task<IResult> UpdateSelectedGroupAsync([FromBody] UpdateUserSelectedGroupDto dto)
    {
        if (!await musicService.GroupExistsAsync(dto.groupId))
            return ApiResults.NotFound_404(QueryError.GroupNonExistentId);

        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        if (!await mshipService.IsMemberAsync(queryUserId, dto.groupId))
            return ApiResults.Forbidden_403(QueryError.GroupNoAccess);
        
        var user = await userService.GetUserByIdAsync(queryUserId);
        await userService.SetSelectedGroupAsync(user!, dto.groupId, musicService);
        return ApiResults.NoContent_204();
    }


    [Authorize]
    [HttpGet("selected-playlist")]
    [ProducesResponseType<ReadUserSelectionDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IResult> GetSelectedPlaylistAsync()
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        if (user!.SelectedPlaylistId is null)
            return ApiResults.NoContent_204();

        var selectedPlaylistDto = await userService.GetSelectedPlaylistAsync(user!, musicService);
        return ApiResults.Ok_200(selectedPlaylistDto);
    }


    [Authorize]
    [HttpPatch("selected-playlist")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    public async Task<IResult> UpdateSelectedPlaylistAsync([FromBody] UpdateUserSelectedPlaylistDto dto)
    {
        if (!await musicService.PlaylistExistsAsync(dto.playlistId))
            return ApiResults.NotFound_404(QueryError.PlaylistNonExistentId);

        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);
        if (!await musicService.PlaylistAccessibleAsync(dto.playlistId, user!))
            return ApiResults.Forbidden_403(QueryError.PlaylistNoAccess);

        await userService.SetSelectedPlaylistAsync(user!, dto.playlistId);
        return ApiResults.NoContent_204();
    }


    [Authorize]
    [HttpGet("profile")]
    [ProducesResponseType<ReadUserProfileDto>(StatusCodes.Status200OK)]
    public async Task<IResult> GetProfileAsync()
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);
        var profileDto = userService.GetUserProfile(user!);
        return ApiResults.Ok_200(profileDto);
    }


    [Authorize]
    [HttpPatch("password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    public async Task<IResult> UpdatePasswordAsync([FromBody] UpdateUserPasswordDto dto)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        var changeResult = await userService.SetNewPasswordAsync(user!, dto.CurrentPassword, dto.NewPassword);
        return (changeResult.HasSucceeded)
            ? ApiResults.NoContent_204()
            : ApiResults.BadRequest_400(changeResult.Error);
    }


    [HttpPost("forgot-password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<Response>(StatusCodes.Status500InternalServerError)]
    public async Task<IResult> ForgotPasswordAsync([FromBody] ActionForgotPasswordDto dto,
        [FromServices] IOptions<AppSettings> options)
    {
        var user = await userService.GetUserByEmailAsync(dto.Email);
        if (user is null)
            return ApiResults.NotFound_404(QueryError.UserNonExistentEmail);

        return await SendForgotPasswordEmailAsync_(user, options.Value);
    }


    [HttpPost("reset-password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    public async Task<IResult> ResetPasswordAsync([FromBody] ActionResetPasswordDto dto)
    {
        var user = await userService.GetUserByEmailAsync(dto.Email);
        if (user is null)
            return ApiResults.NotFound_404(QueryError.UserNonExistentEmail);

        var resetResult = await userService.ResetPasswordAsync(user, dto.Token, dto.NewPassword);
        if (resetResult.HasFailed)
            return ApiResults.BadRequest_400(resetResult.Error);

        return ApiResults.NoContent_204();
    }


    [Authorize]
    [HttpPatch("email")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<Response>(StatusCodes.Status500InternalServerError)]
    public async Task<IResult> RequestEmailChangeAsync([FromBody] UpdateUserEmailRequestDto dto,
        [FromServices] IOptions<AppSettings> options)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = (await userService.GetUserByIdAsync(queryUserId))!;

        var newEmail = dto.NewEmail.Trim().ToLowerInvariant();
        if (newEmail.Equals(user.Email, StringComparison.OrdinalIgnoreCase))
            return ApiResults.BadRequest_400(QueryError.UserEmailChangeIdentical);

        var userWithNewEmail = await userService.GetUserByEmailAsync(newEmail);
        if (userWithNewEmail != null)
            return ApiResults.BadRequest_400(QueryError.UserEmailChangeInUse);

        return await SendEmailChangeEmailAsync_(user, newEmail, options.Value);
    }


    [HttpPost("confirm-email-change")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<Response>(StatusCodes.Status404NotFound)]
    public async Task<IResult> ConfirmEmailChangeAsync(string token, string userId, string newEmail)
    {
        if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(newEmail))
            return ApiResults.BadRequest_400(QueryError.UserEmailChangeMalformedLink);

        var user = await userService.GetUserByEmailAsync(newEmail);
        if (user != null) // user's email is already changed - treated as idempotent success
            return ApiResults.Ok_200(new Response("User.EmailChangeAlreadyApplied", "Email already updated."));

        user = await userService.GetUserByIdAsync(userId);
        if (user is null)
            return ApiResults.NotFound_404(QueryError.UserNonExistentId);

        var confirmEmailChangeResult = await userService.ConfirmEmailChangeAsync(user, token, newEmail);
        if (confirmEmailChangeResult.HasFailed)
            return ApiResults.BadRequest_400(confirmEmailChangeResult.Error); // link invalid or expired

        return ApiResults.Ok_200(new Response("User.EmailChangeApplied", "Email changed. Please log in again."));
    }


    [Authorize]
    [HttpPatch("instagram")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IResult> UpdateInstagramAsync([FromBody] UpdateUserInstagramDto dto)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);
        await userService.SetInstagramHandleAsync(user!, dto.InstagramAccount, musicService);
        return ApiResults.NoContent_204();
    }


    [Authorize]
    [HttpPatch("displayed-tag-groups")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    public async Task<IResult> UpdateDisplayedTagGroupsAsync([FromBody] UpdateUserDisplayedTagGroupsDto dto)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = (await userService.GetUserByIdAsync(queryUserId))!;

        var setResult = await userService.SetDisplayedTagGroupsAsync(user, dto.TagGroupIds);
        if (setResult.HasFailed)
            return ApiResults.BadRequest_400(setResult.Error);

        return ApiResults.NoContent_204();
    }


    [Authorize]
    [HttpPost("legal/accept")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    public async Task<IResult> AcceptLegalAsync([FromBody] ActionAcceptLegalDto dto)
    {
        if (dto.Version != LegalConstants.CURRENT_LEGAL_VERSION)
            return ApiResults.BadRequest_400(AuthError.CreateUserLegalVersionMismatch(dto.Version, LegalConstants.CURRENT_LEGAL_VERSION));

        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        await userService.SetAcceptedLegalVersionAsync(user!, dto.Version);
        return ApiResults.NoContent_204();
    }


    [Authorize]
    [HttpPost("legal/accept-spotify-notice")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    public async Task<IResult> AcceptSpotifyNoticeAsync([FromBody] ActionAcceptLegalDto dto)
    {
        if (dto.Version != LegalConstants.CURRENT_SPOTIFY_NOTICE_VERSION)
            return ApiResults.BadRequest_400(AuthError.CreateUserLegalVersionMismatch(dto.Version, LegalConstants.CURRENT_SPOTIFY_NOTICE_VERSION));

        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = await userService.GetUserByIdAsync(queryUserId);

        await userService.SetAcceptedSpotifyNoticeVersionAsync(user!, dto.Version);
        return ApiResults.NoContent_204();
    }


    [Authorize]
    [HttpGet("legal/data-export")]
    [ProducesResponseType<ReadUserDataExportDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<Response>(StatusCodes.Status429TooManyRequests)]
    public async Task<IResult> GetDataExportAsync()
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = (await userService.GetUserByIdAsync(queryUserId))!;

        // refusing "manifestly excessive" requests once per 24 hrs/user (GDPR Art. 12(5))
        if (userService.IsDataExportRateLimited(user))
        {
            (var nextAllowedAt, int secondsLeft) = userService.GetDataExportAllowedAtAndSecondsRemaining(user);
            Response.Headers.RetryAfter = secondsLeft.ToString();
            
            return ApiResults.TooManyRequests_429(AuthError.CreateDataExportRateLimited(nextAllowedAt));
        }

        var dataExport = await userService.GetUserDataExportAsync(user, musicService, mshipService);
        Response.Headers.ContentDisposition = 
            $"attachment; filename=\"setusup-export-{user.UserName}-{DateTime.UtcNow:yyyyMMdd}.json\"";
        return ApiResults.Ok_200(dataExport);
    }


    [Authorize]
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    public IResult Logout([FromServices] ITokenRevocationStore revocationStore)
    {
        // The only thing needed to be done in the Backend is JWT revocation. Everything else is client-side.
        if (!RevokeJWT_(Request, revocationStore))
            return ApiResults.BadRequest_400(AuthError.UserInvalidToken);

        return ApiResults.NoContent_204();
    }


    [Authorize]
    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<Response>(StatusCodes.Status400BadRequest)]
    public async Task<IResult> DeleteUserAsync([FromServices] ITokenRevocationStore revocationStore)
    {
        var queryUserId = AuthenticationController.GetUserId(this.User.Identity);
        var user = (await userService.GetUserByIdAsync(queryUserId))!;

        if (!RevokeJWT_(Request, revocationStore))
            return ApiResults.BadRequest_400(AuthError.UserInvalidToken);

        await userService.DeleteUserAsync(user, musicService, mshipService);

        // don't wait for the email to be sent here - this is just info the user no longer has to act upon
        var (subject, content) = EmailTemplates.BuildAccountDeleted(user.UserName, "self-request");
        _ = emailService.SendEmailAsync([user.Email], subject, content);

        return ApiResults.NoContent_204();
    }


    private static Result<bool> IsValidLookingEmail_(string email)
    {
        var emailChecker = new System.ComponentModel.DataAnnotations.EmailAddressAttribute();
        if (!emailChecker.IsValid(email) || email.Length > 254)
            return Result<bool>.Failure(AuthError.CreateInvalidEmailError([emailChecker.ErrorMessage!]));

        return Result<bool>.Success(true);
    }

    private async Task<IResult> SendConfirmationEmailAsync_(IAppUser user, Response successResponse)
    {
        // Creating a token to be sent in the registration confirmation email
        string token = await userService.GenerateEmailConfirmationTokenAsync(user);

        // Constructing the link for the registration confirmation email
        var req = Url.ActionContext.HttpContext.Request;
        var confirmUrl = $"{req.Scheme}://{req.Host.Value}/user/confirm-email" +
            $"?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(user.Email)}";

        // Sending the email with the confirmation link
        var emailResult = await emailService.SendEmailAsync([user.Email], "Email Confirmation",
            $"Hey {user.UserName}, welcome to SetUsUp!\n" +
            "Please confirm your email by clicking the following link:\n\n" + confirmUrl);
        if (emailResult.HasFailed)
            return ApiResults.InternalServerError_500(AuthError.UserEmailCannotSend);

        return ApiResults.Created_201(null!, successResponse);
    }

    private async Task<IResult> SendEmailChangeEmailAsync_(IAppUser user, string newEmail, AppSettings appSettings)
    {
        // Creating a token to be sent to the new email address
        var token = await userService.GenerateEmailChangeTokenAsync(user, newEmail);
        
        // Constructing the link for the email change confirmation
        var req = Url.ActionContext.HttpContext.Request;
        var FE_BASE = appSettings.FrontendBaseUrl ?? $"{req.Scheme}://{req.Host.Value}";
        var confirmUrl = $"{FE_BASE}/email-changed" +
            $"?token={Uri.EscapeDataString(token)}&userId={user.Id}&newEmail={Uri.EscapeDataString(newEmail)}";

        // Sending the email with the confirmation link
        var (subject, content) = EmailTemplates.BuildEmailChangeConfirmation(user.UserName, user.Email, newEmail, confirmUrl);
        var emailResult = await emailService.SendEmailAsync([newEmail], subject, content);
        if (emailResult.HasFailed)
            return ApiResults.InternalServerError_500(AuthError.UserEmailCannotSend);

        return ApiResults.NoContent_204();
    }

    private async Task<IResult> SendForgotPasswordEmailAsync_(IAppUser user, AppSettings appSettings)
    {
        // Creating a token to be sent in the forgot-password email
        var token = await userService.GeneratePasswordResetTokenAsync(user);

        // Constructing the link for the password reset confirmation
        var req = Url.ActionContext.HttpContext.Request;
        var FE_BASE = appSettings.FrontendBaseUrl ?? $"{req.Scheme}://{req.Host.Value}";
        var resetUrl = $"{FE_BASE}/reset-password" +
            $"?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(user.Email)}";

        var (subject, content) = EmailTemplates.BuildPasswordResetToken(user.UserName, resetUrl, DateTime.UtcNow.AddHours(1));
        var emailResult = await emailService.SendEmailAsync([user.Email], subject, content);
        if (emailResult.HasFailed)
            return ApiResults.InternalServerError_500(AuthError.UserEmailCannotSend);

        return ApiResults.NoContent_204();
    }

    private async Task<IResult> LoginUserAsync_(IAppUser user, string password)
    {
        var loginOutcome = await userService.PasswordSignInAsync(user, password);
        switch (loginOutcome)
        {
            case LoginOutcome.EmailUnconfirmed:
                return ApiResults.Unauthorized_401(AuthError.UserEmailNotYetConfirmed);
            case LoginOutcome.LockedOut:
                return ApiResults.Locked_423(AuthError.UserTooManyFailedLoginAttempts);
            case LoginOutcome.WrongCredentials:
                return ApiResults.Unauthorized_401(AuthError.UserWrongCredentials);
            default:
                /* successful login! */ break;
        }

        // rotating SecurityStamp, so that the user's previous jwt-s become invalid
        await userService.RevokeAllPreviousTokensAsync(user);

        // issuing new JWT
        var authClaims = IssueClaims_(user);
        var jwt = GetJWT_(authClaims);
        var result = ApiResults.Ok_200(new JwtResponse(
            Token: new JwtSecurityTokenHandler().WriteToken(jwt),
            ValidTo: jwt.ValidTo
        ));

        // maintaining fields for InactivityCleanupService
        await userService.SetLastLoginAsync(user, DateTime.UtcNow);
        
        return result;
    }

    private static List<Claim> IssueClaims_(IAppUser user) =>
    [
        new(ClaimTypes.NameIdentifier, user.Id),
        new(ClaimTypes.Name, user.UserName),
        new(ClaimTypes.Email, user.Email),
        new Claim("AspNet.Identity.SecurityStamp", user.SecurityStamp!),
        new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
    ];

    private static JwtSecurityToken GetJWT_(List<Claim> authClaims)
    {
        var authSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(JwtConfiguration.Secret)
        );

        return new JwtSecurityToken(
            // TODO: set in PROD
            //issuer: // WHILE TESTING ONLY
            //audience: // WHILE TESTING ONLY
            expires: DateTime.Now.AddHours(4),
            claims: authClaims,
            signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
        );
    }

    private static JwtSecurityToken? AuthHeaderToJwt_(HttpRequest request)
    {
        var authHeader = request.Headers["Authorization"].FirstOrDefault();
        if (authHeader?.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) != true)
            return null;

        var handler = new JwtSecurityTokenHandler();
        return handler.ReadJwtToken(authHeader["Bearer ".Length..]);
    }

    private static bool RevokeJWT_(HttpRequest request, ITokenRevocationStore revocationStore)
    {
        /* Revoking the user's jwt token, so it cannot be reused by anyone later.
           (When they log back again, they'll get a new one.) */
        JwtSecurityToken? jwt = AuthHeaderToJwt_(request);
        if (jwt is null)
            return false;

        if (!string.IsNullOrEmpty(jwt!.Id))
            revocationStore.Revoke(jwt!.Id, jwt!.ValidTo);
        return true;
    }
}
