using Microsoft.AspNetCore.SignalR;
using SetUsUpBE.Application.DTOs.Outbound;
using SetUsUpBE.Application.ServiceInterfaces;

namespace SetUsUpBE.WebAPI.Realtime;

public sealed class SignalRNotifierService : IRealTimeNotifierService
{
    private readonly IHubContext<AppHub, IAppClient> hubContext;

    public SignalRNotifierService(IHubContext<AppHub, IAppClient> hubContext)
    {
        this.hubContext = hubContext;
    }

    public Task PublishToGroupAsync(Guid groupId, RealTimeNotificationDto dto, CancellationToken ct = default)
    {
        return hubContext
            .Clients
            .Group(RealTimeRecipient.ForGroup(groupId))
            .RealTimeNotifyAsync(dto);
    }

    public Task PublishToUserAsync(string userId, RealTimeNotificationDto dto, CancellationToken ct = default)
    {
        return hubContext
            .Clients
            .User(userId)
            .RealTimeNotifyAsync(dto);
    }
}
