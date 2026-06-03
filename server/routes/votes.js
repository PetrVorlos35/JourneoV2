import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

// ── POST /api/votes ─────────────────────────────────────────
// Hlasovat za výlet (upvote/downvote) — upsert logika
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { tripId, value } = req.body;

    if (!tripId || ![1, -1].includes(value)) {
      return res.status(400).json({ error: 'Neplatné hlasování. Hodnota musí být 1 nebo -1.' });
    }

    // Check that the trip exists and get the owner
    const [tripRows] = await pool.query('SELECT id, user_id FROM trips WHERE id = ?', [tripId]);
    if (tripRows.length === 0) {
      return res.status(404).json({ error: 'Výlet nenalezen.' });
    }

    const tripOwnerId = tripRows[0].user_id;

    // Verify friendship (or self)
    if (tripOwnerId !== userId) {
      const [friendship] = await pool.query(
        `SELECT id FROM friendships 
         WHERE status = 'ACCEPTED' 
         AND ((requester_id = ? AND addressee_id = ?) 
           OR (requester_id = ? AND addressee_id = ?))`,
        [userId, tripOwnerId, tripOwnerId, userId]
      );

      if (friendship.length === 0) {
        return res.status(403).json({ error: 'Hlasovat můžete jen u výletů svých přátel.' });
      }
    }

    // Upsert vote
    await pool.query(
      `INSERT INTO votes (user_id, trip_id, value) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE value = ?, updated_at = NOW()`,
      [userId, tripId, value, value]
    );

    // Get updated score
    const [scoreRows] = await pool.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END), 0) AS upvotes,
         COALESCE(SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END), 0) AS downvotes
       FROM votes WHERE trip_id = ?`,
      [tripId]
    );

    res.json({
      upvotes: parseInt(scoreRows[0].upvotes),
      downvotes: parseInt(scoreRows[0].downvotes),
      userVote: value,
    });
  } catch (err) {
    console.error('Cast vote error:', err);
    res.status(500).json({ error: 'Chyba při hlasování.' });
  }
});

// ── DELETE /api/votes/:tripId ───────────────────────────────
// Odebrat hlasování
router.delete('/:tripId', async (req, res) => {
  try {
    const userId = req.userId;
    const tripId = parseInt(req.params.tripId);

    await pool.query(
      'DELETE FROM votes WHERE user_id = ? AND trip_id = ?',
      [userId, tripId]
    );

    // Get updated score
    const [scoreRows] = await pool.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END), 0) AS upvotes,
         COALESCE(SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END), 0) AS downvotes
       FROM votes WHERE trip_id = ?`,
      [tripId]
    );

    res.json({
      upvotes: parseInt(scoreRows[0].upvotes),
      downvotes: parseInt(scoreRows[0].downvotes),
      userVote: 0,
    });
  } catch (err) {
    console.error('Remove vote error:', err);
    res.status(500).json({ error: 'Chyba při odebírání hlasu.' });
  }
});

// ── GET /api/votes/:tripId ──────────────────────────────────
// Získat souhrn hlasování (skóre + hlas uživatele)
router.get('/:tripId', async (req, res) => {
  try {
    const userId = req.userId;
    const tripId = parseInt(req.params.tripId);

    const [scoreRows] = await pool.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END), 0) AS upvotes,
         COALESCE(SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END), 0) AS downvotes
       FROM votes WHERE trip_id = ?`,
      [tripId]
    );

    const [userVoteRows] = await pool.query(
      'SELECT value FROM votes WHERE user_id = ? AND trip_id = ?',
      [userId, tripId]
    );

    res.json({
      upvotes: parseInt(scoreRows[0].upvotes),
      downvotes: parseInt(scoreRows[0].downvotes),
      userVote: userVoteRows.length > 0 ? userVoteRows[0].value : 0,
    });
  } catch (err) {
    console.error('Get vote error:', err);
    res.status(500).json({ error: 'Chyba při načítání hlasování.' });
  }
});

export default router;
