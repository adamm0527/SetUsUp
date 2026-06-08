import * as SignalR from '@microsoft/signalr';
import { BASE_URL } from '#root/lib/constants';
import { type RealTimeResponse } from '#root/lib/types';


export default function createAppHubConnection(
  getAccessToken: () => string | null,
  onResponse: (response: RealTimeResponse) => void
) {
  const connection = new SignalR.HubConnectionBuilder()
    .withUrl(`${BASE_URL}/hubs/app`, {
      accessTokenFactory: () => getAccessToken() ?? '',
      withCredentials: false // needed for CORS setup
    })
    .withAutomaticReconnect()
    .configureLogging(SignalR.LogLevel.Error)
    .build();

  connection.on('RealTimeNotifyAsync', (dto: RealTimeResponse) => {
    onResponse(dto);
  })

  return connection;
}
