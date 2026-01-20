const express = require("express");
const router = express.Router();
const connection = require("../database/db");
const bcrypt = require("bcrypt");

// login admin
router.post("/login", async (req, res) => {
  const {email, password} = req.body;

  try {
    // validar datos
    if(!email || !password) {
      return res.status(400).json({ error: "faltan datos"});
    }

    // buscar admin
    const result = await connection.query(
      "SELECT * FROM admin WHERE email = $1",
      [email]
    );

    const rows = result.rows;

    if(rows.length === 0){
      return res.status(401).json({ error: "Usuario o contraseña incorrectos"});
    }

    const admin = rows[0];

    // comparar password
    const coincide = await bcrypt.compare(password, admin.password);

    if (!coincide) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    // login correcto
    res.json({
      message: "Login correcto",
      admin: {
        id: admin.id,
        email: admin.email
      }
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/change-password", async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    const result = await connection.query(
      "SELECT password FROM admin LIMIT 1"
    );

    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(500).json({ error: "Admin no encontrado" });
    }

    const coincide = await bcrypt.compare(oldPassword, rows[0].password);
    if (!coincide) {
      return res.status(401).json({ error: "Contraseña actual incorrecta" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await connection.query(
      "UPDATE admin SET password = $1",
      [hashed]
    );

    res.json({ ok: true, message: "Contraseña actualizada" });

  } catch (err) {
    console.error("change-password:", err);
    res.status(500).json({ error: "Error interno" });
  }
});


router.post("/change-email", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email requerido" });
  }

  try {
    await connection.query(
      "UPDATE admin SET email = $1",
      [email]
    );

    res.json({ ok: true, message: "Email actualizado" });

  } catch (err) {
    // Email único
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email ya en uso" });
    }

    console.error("change-email:", err);
    res.status(500).json({ error: "Error interno" });
  }
});


router.post("/change-cierre", async (req, res) => {
  const { cierreCampania } = req.body;

  if (!cierreCampania) {
    return res.status(400).json({ error: "Fecha requerida" });
  }

  try {
    await connection.query(
      "UPDATE admin SET cierre_campania = $1",
      [cierreCampania]
    );

    const io = req.app.get("socketio");
    io.emit("nueva_fecha", cierreCampania);

    res.json({
      ok: true,
      message: "Fecha de cierre actualizada"
    });

  } catch (err) {
    console.error("change-cierre:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

router.get("/admin", async (req, res) => {
  try {
    const result = await connection.query(
      "SELECT email, cierre_campania FROM admin LIMIT 1"
    );

    const rows = result.rows;

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});


module.exports = router;