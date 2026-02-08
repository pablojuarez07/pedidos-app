import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class SocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('🟢 Cliente conectado:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('🔴 Cliente desconectado:', client.id);
  }

  // evento que envía el frontend al conectarse
  @SubscribeMessage('join_app')
  handleJoin(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Usuario se registró en socket:', data);
    client.data.user = data; // guardamos info del usuario
  }
}
