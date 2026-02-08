import { Module } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { PedidosController } from './pedidos.controller';
import { DatabaseModule } from 'src/common/database/database.module';
import { SocketModule } from 'src/common/socket/socket.module';

@Module({
  controllers: [PedidosController],
  providers: [PedidosService],
  imports: [DatabaseModule, SocketModule]
})
export class PedidosModule {}
