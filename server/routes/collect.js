import { Router } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { insertEvents } from '../lib/analytics.js';
import { reportError } from '../lib/errorTracking.js';

// Veřejný sběr z prohlížeče: zobrazení stránek, akce v UI a chyby.
// Přihlášení je volitelné — platný token jen přiřadí událost k uživateli.
const router = Router();

router.use(rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Příliš mnoho požadavků.' },
}));

const optionalUserId = (req) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(header.slice(7), process.env.JWT_SECRET).userId ?? null;
  } catch {
    return null;
  }
};

// ── POST /api/collect/events  { events: [{ name, path, referrer, utm, standalone, props }] }
router.post('/events', async (req, res) => {
  const events = Array.isArray(req.body?.events) ? req.body.events.slice(0, 20) : [];
  try {
    await insertEvents(req, events, optionalUserId(req));
  } catch (err) {
    console.warn('Collect events error:', err.message);
  }
  // Klient na odpověď nečeká; i chyba sběru je pro něj „ok“.
  res.status(204).end();
});

// ── POST /api/collect/error  { message, stack, path }
router.post('/error', async (req, res) => {
  const { message, stack, path } = req.body || {};
  if (typeof message === 'string' && message.trim()) {
    try {
      await reportError({
        source: 'client',
        message: message.slice(0, 500),
        stack: typeof stack === 'string' ? stack : null,
        path: typeof path === 'string' ? path : null,
        userId: optionalUserId(req),
        userAgent: req.headers['user-agent'],
      });
    } catch (err) {
      console.warn('Collect error failed:', err.message);
    }
  }
  res.status(204).end();
});

export default router;
