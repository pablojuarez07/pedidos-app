import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

export async function ensureDatabaseExists() {
  if (process.env.NODE_ENV === 'production') return;

  const dbName = 'ventas-pg';

  const systemClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: process.env.DB_PASS,
    database: 'postgres',
  });

  await systemClient.connect();

  const res = await systemClient.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`,
    [dbName]
  );

  const dbJustCreated = res.rowCount === 0;

  if (dbJustCreated) {
    console.log(`🟡 Creando base ${dbName}...`);
    await systemClient.query(`CREATE DATABASE "${dbName}"`);
    console.log(`🟢 Base creada`);
  }

  await systemClient.end();

  // 🔥 Ahora conectar a ventas-pg
  const appClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: process.env.DB_PASS,
    database: dbName,
  });

  await appClient.connect();

  if (dbJustCreated) {
    console.log('🟡 Ejecutando schema.sql...');

    const schemaPath = path.join(__dirname, '../schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await appClient.query(schema);

    console.log('🟢 Tablas creadas');
  } else {
    console.log('🟢 DB ya existía, schema no ejecutado');
  }

  await appClient.end();
}
