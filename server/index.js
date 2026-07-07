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
import { globalLimiter, authLimiter } from './middleware/rateLimit.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Za reverzní proxy (Vercel / lokální dev proxy) je potřeba věřit
// prvnímu hopu, jinak rate-limiter vidí všechny klienty pod jednou IP.
app.set('trust proxy', 1);

// Explicit origin allowlist. Never fall back to '*' — a wildcard combined with
// `credentials: true` is invalid and unsafe. Unknown origins are rejected.
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://journeo.vorlos.eu',
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    // Allow same-origin / server-to-server requests (no Origin header) and any
    // allowlisted browser origin.
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Globální rate limit na všechny API cally.
app.use('/api', globalLimiter);

app.use('/api/public', publicRoutes);
// Přísnější limit na citlivé auth endpointy (login, register, reset…).
app.use('/api/auth', authLimiter, authRoutes);
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
