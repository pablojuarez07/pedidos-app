const { Pool } = require("pg");

const connection = new Pool({
  user: process.env.DB_USER,       // ej: 'postgres'
  host: process.env.DB_HOST,       // ej: 'localhost'
  database: process.env.DB_NAME,   // ej: 'ventas'
  password: process.env.DB_PASS,   // tu contraseña
  port: process.env.DB_PORT || 5432 // normalmente 5432
  // ssl: no lo ponemos para local
});

module.exports = connection;
