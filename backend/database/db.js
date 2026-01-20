const { Pool } = require("pg");

const connection = new Pool({
  connectionString: process.env.DATABASE_URL, // tu URL completa de Supabase
  ssl: { rejectUnauthorized: false }         // obligatorio para Supabase
});

module.exports = connection;