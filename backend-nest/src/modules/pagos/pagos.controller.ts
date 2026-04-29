import { Body, Controller, Post, Query } from '@nestjs/common';
import { PagosService } from './pagos.service';

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post('crear-preferencia')
  crearPreferencia(@Body() data: any) {
    return this.pagosService.crearPreferencia(data);
  }

  @Post('webhook')
  async webhook(@Body() body: any, @Query() query: any) {
    console.log("🔥 WEBHOOK:", body, query);

    await this.pagosService.procesarWebhook(body, query);

    return { ok: true };
  }
}
