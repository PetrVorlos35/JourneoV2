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
import friendRoutes from './routes/friends.js';
import profileRoutes from './routes/profile.js';
import voteRoutes from './routes/votes.js';
import notificationRoutes from './routes/notifications.js';
import statsRoutes from './routes/stats.js';
import adminRoutes from './routes/admin.js';
import adminAuth from './middleware/adminAuth.js';
import publicRoutes from './routes/public.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173'] : '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/trips', auth, tripRoutes);
app.use('/api/settings', auth, settingsRoutes);
app.use('/api/friends', auth, friendRoutes);
app.use('/api/profile', auth, profileRoutes);
app.use('/api/votes', auth, voteRoutes);
app.use('/api/notifications', auth, notificationRoutes);
app.use('/api/stats', auth, statsRoutes);
app.use('/api/admin', adminAuth, adminRoutes);


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

if (process.env.NODE_ENV !== 'production') {
  start();
}

export default app;
