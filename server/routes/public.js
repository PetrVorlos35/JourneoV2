import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

// ── GET /api/public/trips/:token ────────────────────────────
// Returns trip data for anyone with the share link — no auth required
router.get('/trips/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || token.length !== 64) {
      return res.status(404).json({ error: 'Odkaz není platný.' });
    }

    const [[trip]] = await pool.query(
      `SELECT t.id, t.title,
         DATE_FORMAT(t.start_date, '%Y-%m-%d') AS startDate,
         DATE_FORMAT(t.end_date, '%Y-%m-%d') AS endDate,
         t.user_id AS ownerId
       FROM trips t
       WHERE t.share_token = ?`,
      [token]
    );

    if (!trip) return res.status(404).json({ error: 'Výlet nenalezen nebo odkaz byl zrušen.' });

    const [[owner]] = await pool.query(
      'SELECT first_name, last_name, avatar_url FROM users WHERE id = ?',
      [trip.ownerId]
    );

    const [activities] = await pool.query(
      "SELECT id, day_index AS dayIndex, DATE_FORMAT(date, '%Y-%m-%d') AS date, title, plan, location FROM trip_activities WHERE trip_id = ? ORDER BY day_index ASC",
      [trip.id]
    );

    const [packingList] = await pool.query(
      'SELECT id, text, checked FROM trip_packing_items WHERE trip_id = ? ORDER BY created_at ASC',
      [trip.id]
    );

    const [documents] = await pool.query(
      'SELECT id, title, content FROM trip_documents WHERE trip_id = ? ORDER BY created_at ASC',
      [trip.id]
    );

    const [[{ likes }]] = await pool.query(
      'SELECT COUNT(*) AS likes FROM votes WHERE trip_id = ? AND value = 1',
      [trip.id]
    );

    res.json({
      trip: {
        id: trip.id,
        title: trip.title,
        startDate: trip.startDate,
        endDate: trip.endDate,
        activities,
        packingList,
        documents,
      },
      owner: owner || null,
      likes: parseInt(likes),
    });
  } catch (err) {
    console.error('Public trip error:', err);
    res.status(500).json({ error: 'Chyba serveru.' });
  }
});

// ── GET /api/public/profile/:token ──────────────────────────
// Minimal public profile data for share/OG previews — no auth required
router.get('/profile/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || token.length !== 64) {
      return res.status(404).json({ error: 'Odkaz není platný.' });
    }

    const [[user]] = await pool.query(
      'SELECT first_name, last_name, avatar_url, bio FROM users WHERE invite_token = ?',
      [token]
    );

    if (!user) return res.status(404).json({ error: 'Profil nenalezen nebo odkaz byl zrušen.' });

    res.json({
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url,
      bio: user.bio || null,
    });
  } catch (err) {
    console.error('Public profile error:', err);
    res.status(500).json({ error: 'Chyba serveru.' });
  }
});

export default router;
