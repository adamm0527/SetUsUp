using System.Threading.Tasks;
using SetUsUpBE.Application.DTOs.Outbound;

namespace SetUsUpBE.WebAPI.Realtime;

// Strongly-typed client interface for SignalR communication
public interface IAppClient
{
    Task RealTimeNotifyAsync(RealTimeNotificationDto dto);
}
