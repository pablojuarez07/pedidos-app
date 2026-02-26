import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { PedidosService } from '../pedidos/pedidos.service';

@Controller('chat')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly pedidosService: PedidosService,
  ) {}

  @Post('')
  async chat( @Body() body: { mensaje: string; client_id: string }) {
    const { mensaje, client_id } = body;

    if (!client_id) {
      return { error: 'client_id requerido' };
    }

    const interpretacion = await this.aiService.interpretarMensaje(mensaje);

    console.log("--- INTERPRETACIÓN DEL MENSAJE ---");
    console.log(interpretacion);

    if ( !interpretacion || !Array.isArray(interpretacion.acciones) || interpretacion.acciones.length === 0) {
      return { error: 'No se pudo interpretar la pregunta' };
    }

    const resultadoFinal = {
      respuestas: [] as string[],
      pedidos: [] as {
        lista: any[];
        filtros: any;
      }[],
      resultados: [] as {
        tipo: string;
        valor: number;
        filtros: any;
      }[],
    };

    for (const accion of interpretacion.acciones) {
      const filtros = accion.filtros || {};

      switch (accion.intencion) {

        case 'listar_pedidos': {
          const pedidos =
            await this.pedidosService.getPedidosClienteFiltrado(
              client_id,
              filtros,
            );

          resultadoFinal.pedidos.push({
            lista: pedidos,
            filtros,
          });
          break;
        }

        case 'cantidad_pedidos': {
          const cantidad =
            await this.pedidosService.contarPedidosClienteFiltrado(
              client_id,
              filtros,
            );

          resultadoFinal.resultados.push({
            tipo: 'cantidad_pedidos',
            valor: cantidad,
            filtros,
          });

          break;
        }

        case 'total_gastado': {
          const total =
            await this.pedidosService.sumarTotalPedidosClienteFiltrado(
              client_id,
              filtros,
            );

          resultadoFinal.resultados.push({
            tipo: 'total_gastado',
            valor: total,
            filtros,
          });

          break;
        }

        default:
          console.warn(`Intención no reconocida: ${accion.intencion}`);
          break;
      }
    }
    let respuesta = interpretacion.respuesta_template || '';

    for (const resultado of resultadoFinal.resultados) {
      respuesta = respuesta.replace(
        new RegExp(`{{${resultado.tipo}}}`, 'g'),
        String(resultado.valor)
      );
    }

    respuesta = respuesta.replace(/{{\w+}}/g, '0');

    resultadoFinal.respuestas = [respuesta];
    return resultadoFinal;
  }

  @Get('modelos')
  async listarModelos() {
    await this.aiService.listarModelos();
  }
}
