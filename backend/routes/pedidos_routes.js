const express = require("express");
const router = express.Router();
const connection = require("../database/db"); 
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// POST para agregar pedido
router.post("/add", async (req, res) => {
  const {
    nombre_comprador,
    telefono,
    producto_id,
    cantidad,
    precio_unitario,
    client_id
  } = req.body;

  if (!nombre_comprador || !producto_id || !cantidad || !precio_unitario) {
    return res.status(400).json({ message: "Datos incompletos" });
  }

  const conn = await connection.connect();

  try {
    await conn.query("BEGIN");

    // 1️⃣ Bloquear el producto y leer stock real
    const result = await conn.query(
      `SELECT stock FROM productos WHERE id = $1 FOR UPDATE`,
      [producto_id]
    );

    const rows = result.rows;

    if (rows.length === 0) {
      throw new Error("Producto no existe");
    }

    const stockActual = rows[0].stock;

    if (stockActual < cantidad) {
      await conn.query("ROLLBACK");
      return res.status(409).json({
        message: `Stock insuficiente. Disponible: ${stockActual}`
      });
    }

    const nuevoStock = stockActual - cantidad;

    // Descontar stock
    await conn.query(
      `UPDATE productos 
       SET stock = $1
       WHERE id = $2`,
      [nuevoStock, producto_id]
    );

    const total = cantidad * precio_unitario;

    // Insert en pedidos
    const pedidoResult = await conn.query(
      `INSERT INTO pedidos 
        (fecha, total, estado, nombre_comprador, telefono, client_id)
       VALUES (NOW(), $1, 'pendiente', $2, $3, $4)
       RETURNING id`,
      [total, nombre_comprador, telefono, client_id]
    );

    const pedido_id = pedidoResult.rows[0].id;

    // Insert en pedido_detalle
    await conn.query(
      `INSERT INTO pedido_detalle
        (pedido_id, producto_id, cantidad, precio_unitario)
       VALUES ($1, $2, $3, $4)`,
      [pedido_id, producto_id, cantidad, precio_unitario]
    );

    // Confirmar todo
    await conn.query("COMMIT");

    // envair socket de stock actualizado
    const io = req.app.get("socketio");
    io.emit("nuevo_stock", {producto_id: producto_id, stock: nuevoStock});

    res.status(201).json({
      message: "Pedido creado correctamente",
      pedido_id,
      stock_restante: stockActual - cantidad
    });

  } catch (error) {
    await conn.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ message: "Error al crear el pedido" });
  } finally {
    conn.release();
  }
});

// GET pedidos para planilla
router.get("/planilla", async (req, res) => {
  try {
    const result = await connection.query(`
      SELECT
        p.id AS pedido_id,
        p.fecha,
        p.estado,
        p.total,
        p.nombre_comprador,
        p.telefono,

        pd.cantidad,
        pd.precio_unitario,

        pr.nombre AS producto_nombre
      FROM pedidos p
      JOIN pedido_detalle pd ON pd.pedido_id = p.id
      JOIN productos pr ON pr.id = pd.producto_id
      ORDER BY p.fecha DESC
    `);

    const rows = result.rows;

    res.json(rows);

  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});

// GET pedidos por client_id
router.get("/:clientId", async (req, res) => {
  const { clientId } = req.params;

  try {
    const result = await connection.query(`
      SELECT 
        p.id,
        p.fecha,
        p.total,
        p.estado,
        p.nombre_comprador,
        p.telefono,
        pr.nombre,
        pr.imagen,
        pd.cantidad,
        pd.precio_unitario
      FROM pedidos p
      JOIN pedido_detalle pd ON pd.pedido_id = p.id
      JOIN productos pr ON pr.id = pd.producto_id
      WHERE p.client_id = $1
      ORDER BY p.fecha DESC;
    `, [clientId]);

    const rows = result.rows;

    const pedidos = rows.map(r => ({
      ...r,
      imagen_url: r.imagen
        ? `${BASE_URL}/uploads/${r.imagen}`
        : null
    }));

    res.json(pedidos);

  } catch (error) {
    console.error("Error al obtener pedidos del cliente:", error);
    res.status(500).json({ message: "Error al obtener pedidos" });
  }
});

router.post("/:id/estado", async (req, res) => {
  const { estado } = req.body;
  const { id } = req.params;

  if (!['pendiente','cancelado'].includes(estado)) {
    return res.status(400).json({ error: "Estado inválido" });
  }

  const conn = await connection.connect();

  try {
    await conn.query("BEGIN");

    // 1️⃣ Traer pedido y bloquearlo
    const resultPedido = await conn.query(
      "SELECT estado FROM pedidos WHERE id = $1 FOR UPDATE",
      [id]
    );

    const pedido = resultPedido.rows[0]

    if (!pedido) throw "Pedido no existe";
    if (pedido.estado === "entregado") {
      await conn.query("ROLLBACK");
      return res.status(400).json({ error: "Pedido ya entregado" });
    }

    // 2️⃣ Traer productos del pedido
    const resultItems = await conn.query(
      `SELECT producto_id, cantidad
       FROM pedido_detalle
       WHERE pedido_id = $1`,
      [id]
    );

    const items = resultItems.rows;

    // Para emitir sockets después del commit
    const stocksActualizados = [];

    // 3️⃣ Cancelar → devolver stock
    if (pedido.estado === "pendiente" && estado === "cancelado") {
      for (const item of items) {
        await conn.query(
          `UPDATE productos 
           SET stock = stock + $1
           WHERE id = $2`,
          [item.cantidad, item.producto_id]
        );

        const resultStock = await conn.query(
          `SELECT stock FROM productos WHERE id = $1`,
          [item.producto_id]
        );

        const p = resultStock.rows[0];

        stocksActualizados.push({
          producto_id: item.producto_id,
          stock: p.stock
        });
      }
    }

    // 4️⃣ Reactivar → validar y descontar stock
    if (pedido.estado === "cancelado" && estado === "pendiente") {
      // validar
      for (const item of items) {
        const resultProd = await conn.query(
          `SELECT stock FROM productos WHERE id = $1 FOR UPDATE`,
          [item.producto_id]
        );

        const prod = resultProd.rows[0];

        if (prod.stock < item.cantidad) {
          await conn.query("ROLLBACK");
          return res.status(400).json({
            error: "No hay stock suficiente para reactivar el pedido"
          });
        }
      }

      // descontar
      for (const item of items) {
        await conn.query(
          `UPDATE productos 
           SET stock = stock - $1
           WHERE id = $2`,
          [item.cantidad, item.producto_id]
        );

        const resultStock = await conn.query(
          `SELECT stock FROM productos WHERE id = $1`,
          [item.producto_id]
        );

        const p = resultStock.rows[0];

        stocksActualizados.push({
          producto_id: item.producto_id,
          stock: p.stock
        });
      }
    }

    // 5️⃣ Cambiar estado
    await conn.query(
      "UPDATE pedidos SET estado = $1 WHERE id = $2",
      [estado, id]
    );

    await conn.query("COMMIT");

    // 6️⃣ Emitir sockets (DESPUÉS del commit)
    const io = req.app.get("socketio");
    for (const s of stocksActualizados) {
      io.emit("nuevo_stock", s);
    }

    res.json({ ok: true });

  } catch (err) {
    await conn.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Error procesando el pedido" });
  } finally {
    conn.release();
  }
});



module.exports = router;