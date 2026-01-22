const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production";

const connection = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction
    ? { rejectUnauthorized: false } // Supabase
    : false                          // PostgreSQL local
});

module.exports = connection;