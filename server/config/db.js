import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Načtení .env pouze pokud nejsme v produkci
if (process.env.NODE_ENV !== 'production') {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: join(__dirname, '..', '..', '.env') });
}

console.log('--- DB CONFIG ---');
console.log('Konfiguruji pool pro:', process.env.DB_HOST || 'NEDEFINOVÁNO');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 5, // Sníženo pro serverless
  queueLimit: 0,
  connectTimeout: 10000,
});

export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Připojeno k MariaDB:', process.env.DB_HOST);
    connection.release();
  } catch (err) {
    console.error('❌ Chyba připojení k databázi:', err.message);
    // V serverless prostředí neukončujeme proces
  }
}

export default pool;
