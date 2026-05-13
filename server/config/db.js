import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

console.log('--- DB CONFIG ---');
console.log('Konfiguruji pool pro:', process.env.DB_HOST);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function testConnection() {
  try {
    console.log('db.js: Zkouším pool.getConnection()...');
    const connection = await pool.getConnection();
    console.log('✅ Připojeno k MariaDB:', process.env.DB_HOST);
    connection.release();
  } catch (err) {
    console.error('❌ Chyba připojení k databázi:', err.message);
    process.exit(1);
  }
}

export default pool;
