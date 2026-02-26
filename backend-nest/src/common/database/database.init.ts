import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

export async function ensureDatabaseExists() {
  if (process.env.NODE_ENV === 'production') return;

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL no está definida');
  }

  const dbName = 'ventas-pg';

  // 🔹 Conectar a la base "postgres" del mismo servidor
  const systemUrl = databaseUrl.replace(/\/[^/]+$/, '/postgres');

  const systemClient = new Client({
    connectionString: systemUrl,
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

  // 🔹 Ahora conectar a ventas-pg usando DATABASE_URL directamente
  const appClient = new Client({
    connectionString: databaseUrl,
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