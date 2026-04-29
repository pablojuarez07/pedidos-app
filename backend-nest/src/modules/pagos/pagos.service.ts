import { Injectable } from '@nestjs/common';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { PedidosService } from '../pedidos/pedidos.service';

@Injectable()
export class PagosService {
  constructor(
    private readonly pedidosService: PedidosService
  ) {}

  private client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
  });

  async crearPreferencia(dto: any) {
    const preference = new Preference(this.client);

    const response = await preference.create({
      body: {
        items: [
          {
            id: String(dto.producto_id),
            title: dto.product_name || "Producto",
            quantity: dto.cantidad,
            unit_price: dto.precio_unitario,
          },
        ],
        metadata: {
          product_name: dto.product_name,
          producto_id: dto.producto_id,
          cantidad: dto.cantidad,
          nombre_comprador: dto.nombre_comprador,
          telefono: dto.telefono,
          client_id: dto.client_id,
          precio_unitario: dto.precio_unitario
        },
        back_urls: {
          success: process.env.FRONTEND_URL || "https://cuatro-coronas-alpha.vercel.app/",
          failure: process.env.FRONTEND_URL || "https://cuatro-coronas-alpha.vercel.app/",
          pending: process.env.FRONTEND_URL || "https://cuatro-coronas-alpha.vercel.app/"
        },
        notification_url: process.env.MP_WEBHOOK_URL,
      }
    });

    return {
      init_point: response.init_point
    };
  }

  async procesarWebhook(body: any, query: any) {
    try {
      const paymentId = query['data.id'] || body?.data?.id;

      if (!paymentId) {
        console.log("No hay paymentId");
        return;
      }

      const paymentClient = new Payment(this.client);

      const payment = await paymentClient.get({ id: paymentId });

      if (payment.status !== 'approved') return;

      const existente = await this.pedidosService.buscarPorPaymentId(paymentId);

      if (existente) {
        console.log("⚠️ Pedido ya procesado");
        return;
      }

      console.log("Payment:", payment);

      // SOLO si está aprobado
      if (payment.status === 'approved') {
        const data = payment.metadata;

        console.log("Pago aprobado, creando pedido...");

        await this.pedidosService.crearPedido({
          product_name: data.product_name,
          producto_id: data.producto_id,
          cantidad: data.cantidad,
          nombre_comprador: data.nombre_comprador,
          telefono: data.telefono,
          client_id: data.client_id,
          precio_unitario: data.precio_unitario,
          tipo_pago: 'Mercado Pago',
          pagado: true,
          payment_id: paymentId
        });

        console.log("Pedido creado correctamente");
      }

    } catch (error) {
      console.error("Error webhook:", error);
    }
}
}