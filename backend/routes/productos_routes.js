const express = require("express");
const router = express.Router();
const connection = require("../database/db");
const multer = require("multer");
const supabase = require("../config/supabase");
const isProd = process.env.NODE_ENV === "production";
const back_url = process.env.BACK_URL;

const upload = multer({
  storage: isProd
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: "uploads/",
      filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
      }
    }),
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
      imagen_url: isProd
        ? p.imagen
        : `${back_url}/uploads/${p.imagen}`
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

    let imageValue;

    if (isProd) {
      // 🟢 PRODUCCIÓN → Supabase
      const fileName = `${Date.now()}-${req.file.originalname}`;

      const { error } = await supabase.storage
        .from("productos")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from("productos")
        .getPublicUrl(fileName);

      imageValue = data.publicUrl;

    } else {
      // 🟡 DESARROLLO → carpeta local
      imageValue = req.file.filename;
    }


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
      imageValue
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
      imagen_url: isProd
        ? p.imagen
        : `${back_url}/uploads/${p.imagen}`
    }));

    res.json(productos);

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

router.put('/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, stock, category } = req.body;

  try {
    const { rows } = await connection.query(
      `
      UPDATE productos
      SET
        nombre = COALESCE($1, nombre),
        descripcion = COALESCE($2, descripcion),
        precio = COALESCE($3, precio),
        stock = COALESCE($4, stock),
        category = COALESCE($5, category)
      WHERE id = $6
      RETURNING *
      `,
      [nombre, descripcion, precio, stock, category, id]
    );

    const producto = rows[0];
    const productoConImagen = {
      ...producto,
      imagen_url: isProd
        ? producto.imagen
        : `${back_url}/uploads/${producto.imagen}`
    };

    const io = req.app.get("socketio");
    io.emit("producto_actualizado", productoConImagen);

    res.json(productoConImagen);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});


module.exports = router;
