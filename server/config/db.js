import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Načtení .env pouze pokud nejsme v produkci
if (process.env.NODE_ENV !== 'production') {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: join(__dirname, '..', '..', '.env') });
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  // Serverless: každá warm lambda má vlastní pool, takže reálný počet spojení
  // je limit × počet instancí. Držíme ho nízko, ať N instancí nevyčerpá
  // max_connections MariaDB; jedna instance stejně obsluhuje jen pár
  // souběžných requestů.
  connectionLimit: parseInt(process.env.DB_POOL_LIMIT) || 5,
  queueLimit: 0,
  connectTimeout: 10000,
});

export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Připojeno k MariaDB');
    connection.release();
  } catch (err) {
    console.error('❌ Chyba připojení k databázi:', err.message);
    // V serverless prostředí neukončujeme proces
  }
}

export default pool;
