const express = require("express");
const router = express.Router();
const connection = require("../database/db");
const multer = require("multer");
const path = require("path");

// Configuración de multer (mismo estilo que uploads_routes)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// get productos
router.get("/", async (req, res) => {
  try {
    const [rows] = await connection.query("SELECT * FROM productos");

    // agregar URL de la imagen
    const productos = rows.map(p => ({
      ...p,
      imagen_url: p.imagen 
        ? `http://localhost:3000/uploads/${p.imagen}`
        : null
    }));

    res.json(productos);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

// post producto
router.post("/add", upload.single("imagen"), async (req, res) => {
  try {
    const { nombre, precio, descripcion, stock, categoria } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Falta la imagen" });
    }

    const imagen = req.file.filename;

    const sql = `
      INSERT INTO productos (nombre, precio, descripcion, stock, category, imagen)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await connection.query(sql, [
      nombre,
      precio,
      descripcion,
      stock,
      categoria,
      imagen
    ]);

    const nuevoProducto = {
      nombre,
      precio,
      descripcion,
      stock,
      categoria,
      imagen,
      imagen_url: `http://localhost:3000/uploads/${imagen}`
    };

    // EMITIR EVENTO A TODOS LOS CLIENTES
    const io = req.app.get("socketio");
    io.emit("nuevo_producto", nuevoProducto);

    res.json({
      message: "Producto creado correctamente",
      imagen: imagen,
      url_imagen: `/uploads/${imagen}`,
    });

  } catch (error) {
    console.error("Error al agregar producto:", error);
    res.status(500).json({ error: "Error al agregar producto" });
  }
});

router.get("/categoria/:categoria", async (req, res) => {
  try {
    const categoria = req.params.categoria;

    const [rows] = await connection.query(
      "SELECT * FROM productos WHERE category = ?",
      [categoria]
    );

    // agregar URL de la imagen, igual que en la ruta principal
    const productos = rows.map(p => ({
      ...p,
      imagen_url: p.imagen
        ? `http://localhost:3000/uploads/${p.imagen}`
        : null
    }));

    res.json(productos);

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
