import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CrearPedidoDto } from './dto/create-pedido.dto';
import { SocketGateway } from 'src/common/socket/socket.gateway';
import { DatabaseService } from 'src/common/database/database.service';


@Injectable()
export class PedidosService {
  constructor(
    private readonly database: DatabaseService,
    private readonly socketGateway: SocketGateway,
  ) {}

  private construirFiltrosQuery(
    filtros: { fecha_desde?: string; fecha_hasta?: string; estado?: string },
    params: any[],
    startIndex: number,
  ) {
    let queryExtra = '';
    let paramIndex = startIndex;

    // 🔹 Filtro por estado
    if (filtros.estado && filtros.estado !== 'null') {
      queryExtra += ` AND p.estado = $${paramIndex}`;
      params.push(filtros.estado);
      paramIndex++;
    }

    if (filtros.fecha_desde) {
      queryExtra += ` AND DATE(p.fecha) >= $${paramIndex}`;
      params.push(filtros.fecha_desde);
      paramIndex++;
    }

    if (filtros.fecha_hasta) {
      queryExtra += ` AND DATE(p.fecha) <= $${paramIndex}`;
      params.push(filtros.fecha_hasta);
      paramIndex++;
    }

    return queryExtra;
  }

  async crearPedido(dto: CrearPedidoDto) {
    const conn = await this.database.getClient();

    try {
      await conn.query('BEGIN');

      const result = await conn.query(
        `SELECT stock FROM productos WHERE id = $1 FOR UPDATE`,
        [dto.producto_id],
      );

      if (!result.rows.length) throw new NotFoundException('Producto no existe');

      const stockActual = result.rows[0].stock;

      if (stockActual < dto.cantidad) {
        throw new ConflictException(`Stock insuficiente. Disponible: ${stockActual}`);
      }

      const nuevoStock = stockActual - dto.cantidad;

      await conn.query(
        `UPDATE productos SET stock = $1 WHERE id = $2`,
        [nuevoStock, dto.producto_id],
      );

      const total = dto.cantidad * dto.precio_unitario;
      const pagadoFinal = dto.pagado ?? false;

      const pedidoResult = await conn.query(
        `INSERT INTO pedidos 
        (fecha, total, estado, nombre_comprador, telefono, client_id, tipo_pago, pagado, fecha_pago, payment_id)
        VALUES (NOW(), $1, 'pendiente', $2, $3, $4, $5, $6,
          CASE 
            WHEN $6 = true THEN NOW() 
            ELSE NULL 
          END,
          $7
        )
        RETURNING id`,
        [total, dto.nombre_comprador, dto.telefono, dto.client_id, dto.tipo_pago, pagadoFinal, dto.payment_id ?? null ],
      );

      const pedido_id = pedidoResult.rows[0].id;

      await conn.query(
        `INSERT INTO pedido_detalle (pedido_id, producto_id, cantidad, precio_unitario)
        VALUES ($1, $2, $3, $4)`,
        [pedido_id, dto.producto_id, dto.cantidad, dto.precio_unitario],
      );

      await conn.query('COMMIT');

      this.socketGateway.server.emit('nuevo_stock', {
        producto_id: dto.producto_id,
        stock: nuevoStock,
      });

      return { ok: true, pedido_id };

    } catch (err) {
      await conn.query('ROLLBACK');
      throw err;
    } finally {
      conn.release();
    }
  }

  async getPlanilla() {
    const { rows } = await this.database.query(`
      SELECT
        p.id AS pedido_id,
        p.fecha,
        p.estado,
        p.total,
        p.nombre_comprador,
        p.telefono,
        p.pagado,
        p.tipo_pago,
        pd.cantidad,
        pd.precio_unitario,
        pr.nombre AS producto_nombre

      FROM pedidos p
      JOIN pedido_detalle pd ON pd.pedido_id = p.id
      JOIN productos pr ON pr.id = pd.producto_id
      ORDER BY p.fecha DESC
    `);

    return rows;
  }

  async getPedidosCliente(clientId: string) {
    const isProd = process.env.NODE_ENV === 'production';
    const back_url = process.env.BACK_URL;

    const { rows } = await this.database.query(
      `SELECT 
        p.id, p.fecha, p.total, p.estado,
        p.nombre_comprador, p.telefono,
        p.pagado, p.tipo_pago,
        pr.nombre, pr.imagen,
        pd.cantidad, pd.precio_unitario
      FROM pedidos p
      JOIN pedido_detalle pd ON pd.pedido_id = p.id
      JOIN productos pr ON pr.id = pd.producto_id
      WHERE p.client_id = $1
      ORDER BY p.fecha DESC`,
      [clientId],
    );

    return rows.map(r => ({
      ...r,
      imagen_url: isProd ? r.imagen : `${back_url}/uploads/${r.imagen}`,
    }));
  }

  // para IA
  async getPedidosClienteFiltrado(
    clientId: string,
    filtros: { fecha_desde?: string; fecha_hasta?: string; estado?: string },
  ) {
    const isProd = process.env.NODE_ENV === 'production';
    const back_url = process.env.BACK_URL;

    let query = `
      SELECT 
        p.id, p.fecha, p.total, p.estado,
        p.nombre_comprador, p.telefono,
        p.pagado, p.tipo_pago,
        pr.nombre, pr.imagen,
        pd.cantidad, pd.precio_unitario
      FROM pedidos p
      JOIN pedido_detalle pd ON pd.pedido_id = p.id
      JOIN productos pr ON pr.id = pd.producto_id
      WHERE p.client_id = $1
    `;

    const params: any[] = [clientId];

    query += this.construirFiltrosQuery(filtros, params, 2);

    query += ` ORDER BY p.fecha DESC`;

    const { rows } = await this.database.query(query, params);

    return rows.map(r => ({
      ...r,
      imagen_url: isProd ? r.imagen : `${back_url}/uploads/${r.imagen}`,
    }));
  }

  async sumarTotalPedidosClienteFiltrado(
    clientId: string,
    filtros: { periodo?: string; estado?: string },
  ) {
    let query = `
      SELECT COALESCE(SUM(p.total), 0) as total
      FROM pedidos p
      WHERE p.client_id = $1
    `;

    const params: any[] = [clientId];

    query += this.construirFiltrosQuery(filtros, params, 2);

    const { rows } = await this.database.query(query, params);

    return Number(rows[0].total);
  }

  async contarPedidosClienteFiltrado(
    clientId: string,
    filtros: { periodo?: string; estado?: string },
  ) {
    let query = `
      SELECT COUNT(*) as total
      FROM pedidos p
      WHERE p.client_id = $1
    `;

    const params: any[] = [clientId];

    query += this.construirFiltrosQuery(filtros, params, 2);

    const { rows } = await this.database.query(query, params);

    return Number(rows[0].total);
  }

  async cambiarEstado(id: number, nuevoEstado: string) {
    const conn = await this.database.getClient();
    const stocksActualizados: any[] = [];

    try {
      await conn.query('BEGIN');

      // 🔒 1. Traer pedido y bloquearlo
      const resultPedido = await conn.query(
        'SELECT estado FROM pedidos WHERE id = $1 FOR UPDATE',
        [id],
      );

      if (resultPedido.rows.length === 0) {
        throw new NotFoundException('Pedido no existe');
      }

      const estadoActual = resultPedido.rows[0].estado;

      // 📦 2. Traer items
      const resultItems = await conn.query(
        `SELECT producto_id, cantidad
         FROM pedido_detalle
         WHERE pedido_id = $1`,
        [id],
      );

      const items = resultItems.rows;

      // 🔄 devolver stock
      const devolverStock = async () => {
        for (const item of items) {
          await conn.query(
            `UPDATE productos SET stock = stock + $1 WHERE id = $2`,
            [item.cantidad, item.producto_id],
          );

          const resultStock = await conn.query(
            `SELECT stock FROM productos WHERE id = $1`,
            [item.producto_id],
          );

          stocksActualizados.push({
            producto_id: item.producto_id,
            stock: resultStock.rows[0].stock,
          });
        }
      };

      // ➖ descontar stock
      const descontarStock = async () => {
        for (const item of items) {
          const resultProd = await conn.query(
            `SELECT stock FROM productos WHERE id = $1 FOR UPDATE`,
            [item.producto_id],
          );

          if (resultProd.rows[0].stock < item.cantidad) {
            throw new BadRequestException('No hay stock suficiente');
          }
        }

        for (const item of items) {
          await conn.query(
            `UPDATE productos SET stock = stock - $1 WHERE id = $2`,
            [item.cantidad, item.producto_id],
          );

          const resultStock = await conn.query(
            `SELECT stock FROM productos WHERE id = $1`,
            [item.producto_id],
          );

          stocksActualizados.push({
            producto_id: item.producto_id,
            stock: resultStock.rows[0].stock,
          });
        }
      };

      // 3. Lógica de transición
      if (
        (estadoActual === 'pendiente' || estadoActual === 'entregado') &&
        nuevoEstado === 'cancelado'
      ) {
        await devolverStock();
      } else if (
        estadoActual === 'cancelado' &&
        (nuevoEstado === 'pendiente' || nuevoEstado === 'entregado')
      ) {
        await descontarStock();
      }

      // 4. Update estado
      await conn.query('UPDATE pedidos SET estado = $1 WHERE id = $2', [
        nuevoEstado,
        id,
      ]);

      await conn.query('COMMIT');

      // 5. Emitir sockets después del commit
      for (const s of stocksActualizados) {
        this.socketGateway.server.emit('nuevo_stock', s);
      }

      return { ok: true };
    } catch (error) {
      await conn.query('ROLLBACK');
      console.error(error);
      throw new InternalServerErrorException('Error procesando el pedido');
    } finally {
      conn.release();
    }
  }

  async marcarPagado(id: number, pagado: boolean) {
    const conn = await this.database.getClient();

    try {
      await conn.query('BEGIN');

      // Verificar pedido
      const resultPedido = await conn.query(
        'SELECT estado, pagado FROM pedidos WHERE id = $1 FOR UPDATE',
        [id]
      );

      if (!resultPedido.rows.length) {
        throw new NotFoundException('Pedido no existe');
      }

      const pedido = resultPedido.rows[0];

      // Reglas de negocio
      if (pedido.estado === 'cancelado' && pagado) {
        throw new BadRequestException('No se puede pagar un pedido cancelado');
      }

      // Evitar updates innecesarios
      if (pedido.pagado === pagado) {
        return { ok: true };
      }

      // Actualizar
      await conn.query(
        `UPDATE pedidos 
        SET pagado = $1,
            fecha_pago = CASE 
              WHEN $1 = true THEN NOW() 
              ELSE NULL 
            END
        WHERE id = $2`,
        [pagado, id]
      );

      await conn.query('COMMIT');

      // Socket
      this.socketGateway.server.emit('pedido_actualizado', {
        pedido_id: id,
        pagado,
      });

      return { ok: true };

    } catch (error) {
      await conn.query('ROLLBACK');
      console.error(error);
      throw new InternalServerErrorException('Error actualizando pago');
    } finally {
      conn.release();
    }
  }

  async buscarPorPaymentId(paymentId?: string) {
    const { rows } = await this.database.query(
      `SELECT id FROM pedidos WHERE payment_id = $1`,
      [paymentId]
    );

    return rows[0] || null;
  }
}
