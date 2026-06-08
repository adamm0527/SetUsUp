using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SetUsUpBE.Application.ServiceInterfaces;
using SetUsUpBE.Application.Services;
using System.Security.Claims;

namespace SetUsUpBE.WebAPI.Realtime;

[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public sealed class AppHub : Hub<IAppClient>
{
    private readonly MusicService musicService;

    public AppHub(MusicService musicService)
    {
        this.musicService = musicService;
    }

    /* called when User comes online (logs in, or resumes a stale session) */
    public override async Task OnConnectedAsync()
    {
        var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdClaim, out var userId))
        {
            // joining all signalR groups corresponding to the groups the user is a member of
            foreach (var readGroupDto in await musicService.GetGroupDtosByUserAsync(userId.ToString()))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, RealTimeRecipient.ForGroup(readGroupDto.Id));
            }
        }
        await base.OnConnectedAsync();
    }

    /* called when (by subscribed clients from frontend)
        - upon domain group creation (by creator and also by added initial members if online)
        - upon invitation from other user to a domain group */
    public Task JoinGroupAsync(Guid groupId)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, RealTimeRecipient.ForGroup(groupId));
    }

    /* called when (by subscribed clients from frontend):
        - upon domain group deletion
        - upon client being kicked from a domain group by another user (or voluntary leaving) */
    public Task LeaveGroupAsync(Guid groupId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, RealTimeRecipient.ForGroup(groupId));
    }
}
