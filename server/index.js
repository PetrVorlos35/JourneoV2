import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('--- START SERVERU ---');
console.log('Port:', process.env.PORT || 3001);
console.log('DB Host:', process.env.DB_HOST);

import { testConnection } from './config/db.js';
import auth from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import tripRoutes from './routes/trips.js';
import settingsRoutes from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/trips', auth, tripRoutes);
app.use('/api/settings', auth, settingsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function start() {
  console.log('Volám testConnection()...');
  await testConnection();
  console.log('testConnection() dokončeno.');
  app.listen(PORT, () => {
    console.log(`🚀 Journeo API server běží na http://localhost:${PORT}`);
  });
}

start();
