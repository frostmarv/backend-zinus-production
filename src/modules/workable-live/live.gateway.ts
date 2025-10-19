import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LiveService } from './live.service';
import { Logger, OnModuleInit } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/live-data', // Namespace: ws://.../live-data
})
export class LiveGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit
{
  @WebSocketServer() server: Server;

  private logger: Logger = new Logger('LiveGateway');

  constructor(private readonly liveService: LiveService) {}

  async onModuleInit() {
    await this.broadcastData();
  }

  afterInit(server: any) {
    this.logger.log('WebSocket Gateway Initialized');
    setInterval(async () => {
      await this.broadcastData();
    }, 10000); // Refresh tiap 10 detik
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.join('live-room');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  async broadcastData() {
    try {
      const data = await this.liveService.getAllWorkableData();
      this.server.to('live-room').emit('workable-data', data);
    } catch (e) {
      this.logger.error('Error broadcasting data', e);
    }
  }
}
