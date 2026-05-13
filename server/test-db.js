import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('--- TEST PŘIPOJENÍ ---');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('DB:', process.env.DB_NAME);
console.log('---');

async function test() {
  try {
    console.log('Zkouším se připojit...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: 3306,
      connectTimeout: 10000 // 10 sekund limit
    });
    
    console.log('✅ ÚSPĚCH! Databáze je dostupná.');
    await connection.end();
  } catch (err) {
    console.error('❌ CHYBA:', err.message);
    if (err.code === 'ETIMEDOUT') {
      console.log('\nTIP: Server neodpovídá včas. To téměř vždy znamená, že tě blokuje firewall.');
      console.log('Zkontroluj dejny.eu a povol externí přístup pro svou IP.');
    }
  }
}

test();
