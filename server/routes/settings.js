import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

// ── GET /api/settings ───────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT theme, currency FROM user_settings WHERE user_id = ?',
      [req.userId]
    );

    if (rows.length === 0) {
      // Create default settings if they don't exist
      await pool.query(
        'INSERT INTO user_settings (user_id, theme, currency) VALUES (?, ?, ?)',
        [req.userId, 'dark', 'CZK']
      );
      return res.json({ settings: { theme: 'dark', currency: 'CZK' } });
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
    const { theme, currency } = req.body;

    await pool.query(
      'UPDATE user_settings SET theme = COALESCE(?, theme), currency = COALESCE(?, currency) WHERE user_id = ?',
      [theme, currency, req.userId]
    );

    const [rows] = await pool.query(
      'SELECT theme, currency FROM user_settings WHERE user_id = ?',
      [req.userId]
    );

    res.json({ settings: rows[0] });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Chyba při ukládání nastavení.' });
  }
});

export default router;
