import { Router } from 'express';
import pool from '../config/db.js';
import { getLatestRates, getRate, isSupportedCurrency } from '../lib/rates.js';
import { EMAIL_PREFS } from '../lib/emailPrefs.js';

const router = Router();

// API posílá e-mailové předvolby jako objekt { friendRequests: true, … },
// v DB jsou to sloupce email_*.
const SETTINGS_COLUMNS = ['theme', 'currency', 'language', ...Object.values(EMAIL_PREFS)].join(', ');
const DEFAULT_EMAILS = Object.fromEntries(Object.keys(EMAIL_PREFS).map((key) => [key, true]));

const toSettings = ({ theme, currency, language, ...rest }) => ({
  theme,
  currency,
  language,
  emails: Object.fromEntries(
    Object.entries(EMAIL_PREFS).map(([key, column]) => [key, rest[column] == null ? true : Boolean(rest[column])])
  ),
});

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
      `SELECT ${SETTINGS_COLUMNS} FROM user_settings WHERE user_id = ?`,
      [req.userId]
    );

    if (rows.length === 0) {
      // Create default settings if they don't exist
      await pool.query(
        'INSERT INTO user_settings (user_id, theme, currency, language) VALUES (?, ?, ?, ?)',
        [req.userId, 'light', 'CZK', 'cs']
      );
      return res.json({ settings: { theme: 'light', currency: 'CZK', language: 'cs', emails: DEFAULT_EMAILS } });
    }

    res.json({ settings: toSettings(rows[0]) });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Chyba při načítání nastavení.' });
  }
});

// ── PUT /api/settings ───────────────────────────────────────
router.put('/', async (req, res) => {
  try {
    const { theme, currency, language, emails } = req.body;
    if (currency != null && !isSupportedCurrency(currency)) {
      return res.status(400).json({ error: 'Nepodporovaná měna.' });
    }

    // Jen známé klíče s booleanem, ostatní ignorujeme.
    const emailEntries = Object.entries(emails && typeof emails === 'object' ? emails : {})
      .filter(([key, value]) => EMAIL_PREFS[key] && typeof value === 'boolean');
    const emailSql = emailEntries.map(([key]) => `, ${EMAIL_PREFS[key]} = ?`).join('');
    const emailValues = emailEntries.map(([, value]) => (value ? 1 : 0));

    await pool.query(
      `UPDATE user_settings SET theme = COALESCE(?, theme), currency = COALESCE(?, currency), language = COALESCE(?, language)${emailSql} WHERE user_id = ?`,
      [theme, currency, language, ...emailValues, req.userId]
    );

    const [rows] = await pool.query(
      `SELECT ${SETTINGS_COLUMNS} FROM user_settings WHERE user_id = ?`,
      [req.userId]
    );

    res.json({ settings: rows[0] ? toSettings(rows[0]) : null });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Chyba při ukládání nastavení.' });
  }
});

export default router;
