import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

// ── GET /api/notifications ──────────────────────────────────
// Vrátí všechny notifikace aktuálního uživatele
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;

    const [rows] = await pool.query(
      `SELECT id, type, reference_id AS referenceId, message, is_read AS isRead, created_at AS createdAt
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({
      notifications: rows.map(n => ({
        ...n,
        isRead: !!n.isRead,
      })),
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Chyba při načítání notifikací.' });
  }
});

// ── GET /api/notifications/unread-count ──────────────────────
// Vrátí počet nepřečtených notifikací
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.userId;

    const [rows] = await pool.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    res.json({ count: rows[0].count });
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ error: 'Chyba při načítání počtu notifikací.' });
  }
});

// ── PUT /api/notifications/:id/read ─────────────────────────
// Označit notifikaci jako přečtenou
router.put('/:id/read', async (req, res) => {
  try {
    const userId = req.userId;
    const notifId = parseInt(req.params.id);

    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notifId, userId]
    );

    res.json({ message: 'Notifikace označena jako přečtená.' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Chyba při aktualizaci notifikace.' });
  }
});

// ── PUT /api/notifications/read-all ─────────────────────────
// Označit všechny notifikace jako přečtené
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.userId;

    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    res.json({ message: 'Všechny notifikace označeny jako přečtené.' });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Chyba při aktualizaci notifikací.' });
  }
});

export default router;
