import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

// Helper: ověří, že mezi uživateli existuje přátelství ACCEPTED
async function assertFriendship(currentUserId, targetUserId) {
  if (currentUserId === targetUserId) return; // self-view is always allowed

  const [rows] = await pool.query(
    `SELECT id FROM friendships 
     WHERE status = 'ACCEPTED' 
     AND ((requester_id = ? AND addressee_id = ?) 
       OR (requester_id = ? AND addressee_id = ?))`,
    [currentUserId, targetUserId, targetUserId, currentUserId]
  );

  if (rows.length === 0) {
    const error = new Error('Přístup odepřen. Musíte být přátelé.');
    error.status = 403;
    throw error;
  }
}

// Helper: formátování data pro MariaDB
const formatDateForDb = (date) => {
  if (!date) return null;
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  if (typeof date === 'string') return date.split('T')[0].split(' ')[0];
  if (date instanceof Date) return date.toISOString().split('T')[0];
  return date;
};

// ── GET /api/profile/:userId ────────────────────────────────
// Vrátí profil uživatele a jeho výlety (jen pokud jste přátelé)
router.get('/:userId', async (req, res) => {
  try {
    const currentUserId = req.userId;
    const targetUserId = parseInt(req.params.userId);

    await assertFriendship(currentUserId, targetUserId);

    // Fetch user profile
    const [users] = await pool.query(
      'SELECT id, first_name, last_name, email, avatar_url, bio, created_at FROM users WHERE id = ?',
      [targetUserId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Uživatel nenalezen.' });
    }

    // Fetch user's trips (basic info only, no sub-data)
    const [trips] = await pool.query(
      `SELECT t.id, t.title, DATE_FORMAT(t.start_date, '%Y-%m-%d') AS startDate, DATE_FORMAT(t.end_date, '%Y-%m-%d') AS endDate, t.created_at AS createdAt,
              COALESCE(SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END), 0) AS likes
       FROM trips t
       LEFT JOIN votes v ON v.trip_id = t.id
       WHERE t.user_id = ? AND t.deleted_at IS NULL
       GROUP BY t.id
       ORDER BY t.start_date DESC`,
      [targetUserId]
    );

    // Aktivity a hlasy dotáhneme dvěma dávkovými dotazy místo dvou dotazů
    // na každý výlet (stejný vzor jako GET /api/trips).
    let tripsWithMeta = [];
    if (trips.length > 0) {
      const tripIds = trips.map(t => t.id);

      const [[activities], [userVotes]] = await Promise.all([
        pool.query(
          'SELECT trip_id AS tripId, location FROM trip_activities WHERE trip_id IN (?) ORDER BY day_index ASC',
          [tripIds]
        ),
        pool.query(
          'SELECT trip_id AS tripId, value FROM votes WHERE user_id = ? AND trip_id IN (?)',
          [currentUserId, tripIds]
        ),
      ]);

      const activitiesByTrip = new Map();
      for (const a of activities) {
        if (!activitiesByTrip.has(a.tripId)) activitiesByTrip.set(a.tripId, []);
        activitiesByTrip.get(a.tripId).push(a);
      }
      const likedTripIds = new Set(
        userVotes.filter(v => v.value === 1).map(v => v.tripId)
      );

      tripsWithMeta = trips.map(trip => {
        const tripActivities = activitiesByTrip.get(trip.id) || [];
        return {
          ...trip,
          id: trip.id.toString(),
          likes: parseInt(trip.likes),
          isLiked: likedTripIds.has(trip.id),
          activityCount: tripActivities.length,
          locations: tripActivities.filter(a => a.location).map(a => a.location),
        };
      });
    }

    res.json({
      user: users[0],
      trips: tripsWithMeta,
    });
  } catch (err) {
    if (err.status === 403) {
      return res.status(403).json({ error: err.message });
    }
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Chyba při načítání profilu.' });
  }
});

// ── GET /api/profile/:userId/trip/:tripId ───────────────────
// Vrátí detail výletu (read-only, jen pokud jste přátelé)
router.get('/:userId/trip/:tripId', async (req, res) => {
  try {
    const currentUserId = req.userId;
    const targetUserId = parseInt(req.params.userId);
    const tripId = parseInt(req.params.tripId);

    await assertFriendship(currentUserId, targetUserId);

    // Verify trip belongs to the target user
    const [trips] = await pool.query(
      "SELECT id, title, DATE_FORMAT(start_date, '%Y-%m-%d') AS startDate, DATE_FORMAT(end_date, '%Y-%m-%d') AS endDate, created_at AS createdAt FROM trips WHERE id = ? AND user_id = ? AND deleted_at IS NULL",
      [tripId, targetUserId]
    );

    if (trips.length === 0) {
      return res.status(404).json({ error: 'Výlet nenalezen.' });
    }

    const trip = trips[0];

    // Sub-data jsou na sobě nezávislá — jeden Promise.all místo sedmi
    // sekvenčních dotazů (roundtrip do DB je tu dražší než dotaz sám).
    const [
      [activities],
      [expenses],
      [packingItems],
      [documents],
      [voteScore],
      [userVote],
      [owner],
    ] = await Promise.all([
      pool.query(
        'SELECT id, day_index AS dayIndex, date, title, plan, location FROM trip_activities WHERE trip_id = ? ORDER BY day_index ASC',
        [tripId]
      ),
      pool.query(
        'SELECT id, description, amount, category, date FROM trip_expenses WHERE trip_id = ? ORDER BY created_at DESC',
        [tripId]
      ),
      pool.query(
        'SELECT id, text, checked FROM trip_packing_items WHERE trip_id = ? ORDER BY created_at ASC',
        [tripId]
      ),
      pool.query(
        'SELECT id, title, content FROM trip_documents WHERE trip_id = ? ORDER BY created_at ASC',
        [tripId]
      ),
      pool.query(
        'SELECT COUNT(*) AS likes FROM votes WHERE trip_id = ? AND value = 1',
        [tripId]
      ),
      pool.query(
        'SELECT value FROM votes WHERE user_id = ? AND trip_id = ?',
        [currentUserId, tripId]
      ),
      pool.query(
        'SELECT id, first_name, last_name, avatar_url FROM users WHERE id = ?',
        [targetUserId]
      ),
    ]);

    res.json({
      trip: {
        ...trip,
        id: trip.id.toString(),
        activities: activities.map(a => ({ ...a, id: a.id.toString() })),
        expenses: expenses.map(e => ({ ...e, id: e.id.toString(), amount: parseFloat(e.amount) })),
        packingList: packingItems.map(p => ({ id: p.id.toString(), text: p.text, checked: !!p.checked })),
        documents: documents.map(d => ({ id: d.id.toString(), title: d.title, content: d.content })),
      },
      owner: owner[0],
      likes: parseInt(voteScore[0].likes),
      isLiked: userVote.length > 0 && userVote[0].value === 1,
    });
  } catch (err) {
    if (err.status === 403) {
      return res.status(403).json({ error: err.message });
    }
    console.error('Get profile trip error:', err);
    res.status(500).json({ error: 'Chyba při načítání výletu.' });
  }
});

export default router;
