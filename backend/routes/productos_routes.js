const express = require("express");
const router = express.Router();
const connection = require("../database/db");
const multer = require("multer");
const supabase = require("../config/supabase");

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("El archivo no es una imagen"));
    }
    cb(null, true);
  }
});

// get productos
router.get("/", async (req, res) => {
  try {
    const result = await connection.query("SELECT * FROM productos");
    const rows = result.rows

    // agregar URL de la imagen
    const productos = rows.map(p => ({
      ...p,
      imagen_url: p.imagen
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

    const file = req.file;
    const fileName = `${Date.now()}-${file.originalname}`;

    // 1️⃣ Subir a Supabase
    const { error } = await supabase.storage
      .from("productos")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype
      });

    if (error) throw error;

    // 2️⃣ Obtener URL pública
    const { data } = supabase.storage
      .from("productos")
      .getPublicUrl(fileName);

    const imageUrl = data.publicUrl;

    // 3️⃣ Guardar producto con URL
    const sql = `
      INSERT INTO productos
      (nombre, precio, descripcion, stock, category, imagen)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const { rows } = await connection.query(sql, [
      nombre,
      precio,
      descripcion,
      stock,
      categoria,
      imageUrl
    ]);

    const nuevoProducto = rows[0];

    // 4️⃣ Emitir socket
    const io = req.app.get("socketio");
    io.emit("nuevo_producto", nuevoProducto);

    res.status(201).json({
      message: "Producto creado correctamente",
      producto: nuevoProducto
    });

  } catch (error) {
    console.error("Error al agregar producto:", error);
    res.status(500).json({ error: "Error al agregar producto" });
  }
});


router.get("/categoria/:categoria", async (req, res) => {
  try {
    const categoria = req.params.categoria;

    const result = await connection.query(
      "SELECT * FROM productos WHERE category = $1",
      [categoria]
    );

    const rows = result.rows;

    // agregar URL de la imagen, igual que en la ruta principal
    const productos = rows.map(p => ({
      ...p,
      imagen_url: p.imagen
    }));

    res.json(productos);

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
