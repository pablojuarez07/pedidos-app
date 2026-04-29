import { Module } from '@nestjs/common';
import { PagosController } from './pagos.controller';
import { PagosService } from './pagos.service';
import { PedidosModule } from '../pedidos/pedidos.module';

@Module({
  imports: [PedidosModule],
  controllers: [PagosController],
  providers: [PagosService]
})
export class PagosModule {}
