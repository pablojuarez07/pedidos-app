import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { CrearPedidoDto } from './dto/create-pedido.dto';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';

@Controller('pedidos')
export class PedidosController {
  constructor(private pedidosService: PedidosService) {}

  @Post('add')
  crear(@Body() dto: CrearPedidoDto) {
    return this.pedidosService.crearPedido(dto);
  }

  @Get('planilla')
  planilla() {
    return this.pedidosService.getPlanilla();
  }

  @Get(':clientId')
  porCliente(@Param('clientId') id: string) {
    return this.pedidosService.getPedidosCliente(id);
  }

  @Post(':id/estado')
  cambiarEstado(@Param('id') id: string, @Body() dto: CambiarEstadoDto) {
    return this.pedidosService.cambiarEstado(Number(id), dto.estado);
  }
}
