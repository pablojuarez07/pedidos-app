import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { PedidosModule } from '../pedidos/pedidos.module';

@Module({
  providers: [AiService],
  controllers: [AiController],
  imports: [PedidosModule]
})
export class AiModule {}
