import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

// ── GET /api/settings/exchange-rate?from=CZK&to=EUR ─────────
// Živý kurz z ECB (frankfurter.dev). Konverze měny přepisuje částky v DB
// nevratně, takže při výpadku API radši selžeme, než abychom použili
// zastaralý kurz.
const SUPPORTED_CURRENCIES = ['CZK', 'EUR', 'USD', 'GBP'];
const RATE_TTL_MS = 60 * 60 * 1000;
const rateCache = new Map();

router.get('/exchange-rate', async (req, res) => {
  const { from, to } = req.query;

  if (!SUPPORTED_CURRENCIES.includes(from) || !SUPPORTED_CURRENCIES.includes(to)) {
    return res.status(400).json({ error: 'Nepodporovaná měna.' });
  }
  if (from === to) {
    return res.json({ rate: 1, from, to });
  }

  const key = `${from}:${to}`;
  const cached = rateCache.get(key);
  if (cached && Date.now() - cached.at < RATE_TTL_MS) {
    return res.json({ rate: cached.rate, from, to });
  }

  try {
    const r = await fetch(`https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`);
    if (!r.ok) throw new Error(`Frankfurter HTTP ${r.status}`);
    const data = await r.json();
    const rate = data?.rates?.[to];
    if (typeof rate !== 'number' || !(rate > 0)) throw new Error('Kurz chybí v odpovědi');
    rateCache.set(key, { rate, at: Date.now() });
    res.json({ rate, from, to });
  } catch (err) {
    console.error('Exchange rate fetch error:', err);
    res.status(502).json({ error: 'Aktuální kurz se nepodařilo načíst. Zkuste to prosím později.' });
  }
});

// ── GET /api/settings ───────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT theme, currency, language FROM user_settings WHERE user_id = ?',
      [req.userId]
    );

    if (rows.length === 0) {
      // Create default settings if they don't exist
      await pool.query(
        'INSERT INTO user_settings (user_id, theme, currency, language) VALUES (?, ?, ?, ?)',
        [req.userId, 'dark', 'CZK', 'cs']
      );
      return res.json({ settings: { theme: 'dark', currency: 'CZK', language: 'cs' } });
    }

    res.json({ settings: rows[0] });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Chyba při načítání nastavení.' });
  }
});

// ── PUT /api/settings ───────────────────────────────────────
router.put('/', async (req, res) => {
  try {
    const { theme, currency, language } = req.body;

    await pool.query(
      'UPDATE user_settings SET theme = COALESCE(?, theme), currency = COALESCE(?, currency), language = COALESCE(?, language) WHERE user_id = ?',
      [theme, currency, language, req.userId]
    );

    const [rows] = await pool.query(
      'SELECT theme, currency, language FROM user_settings WHERE user_id = ?',
      [req.userId]
    );

    res.json({ settings: rows[0] });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Chyba při ukládání nastavení.' });
  }
});

export default router;
