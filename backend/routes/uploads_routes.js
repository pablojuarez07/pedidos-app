const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

// configurar destino y nombre del archivo
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

// POST /upload
router.post("/add_image", upload.single("imagen"), (req, res) => {
  res.json({
    message: "Imagen subida correctamente",
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`
  });
});

module.exports = router;
