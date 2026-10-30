import { Router } from 'express';
import pool from '../config/db.js';
import { getLatestRates, getRate, isSupportedCurrency } from '../lib/rates.js';

const router = Router();

// ── GET /api/settings/exchange-rate?from=EUR&to=CZK&date=2026-10-20 ──
// Kurz ECB (frankfurter.dev) k datu výdaje; bez data nebo pro budoucí den
// poslední vyhlášený. Při výpadku API selžeme a klient nechá kurz zadat ručně,
// místo abychom tiše použili zastaralý.
router.get('/exchange-rate', async (req, res) => {
  const { from, to, date } = req.query;

  if (!isSupportedCurrency(from) || !isSupportedCurrency(to)) {
    return res.status(400).json({ error: 'Nepodporovaná měna.' });
  }

  try {
    const { rate, date: rateDate } = await getRate(from, to, date);
    res.json({ rate, from, to, date: rateDate });
  } catch (err) {
    console.error('Exchange rate fetch error:', err);
    res.status(502).json({ error: 'Aktuální kurz se nepodařilo načíst. Zkuste to prosím později.' });
  }
});

// ── GET /api/settings/exchange-rates?base=CZK ───────────────
// Poslední kurzy všech měn vůči hlavní měně — pro souhrny napříč výlety
// v různých měnách (přehled, přátelé). Jeden požadavek na celou relaci.
router.get('/exchange-rates', async (req, res) => {
  const { base } = req.query;
  if (!isSupportedCurrency(base)) {
    return res.status(400).json({ error: 'Nepodporovaná měna.' });
  }
  try {
    res.json({ base, rates: await getLatestRates(base) });
  } catch (err) {
    console.error('Exchange rates fetch error:', err);
    res.status(502).json({ error: 'Kurzy se nepodařilo načíst.' });
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
        [req.userId, 'light', 'CZK', 'cs']
      );
      return res.json({ settings: { theme: 'light', currency: 'CZK', language: 'cs' } });
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
    if (currency != null && !isSupportedCurrency(currency)) {
      return res.status(400).json({ error: 'Nepodporovaná měna.' });
    }

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
