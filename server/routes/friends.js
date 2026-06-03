import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

// ── GET /api/friends ────────────────────────────────────────
// Vrátí všechny přijaté přátele aktuálního uživatele
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;

    const [rows] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.avatar_url, u.bio, f.created_at AS friendsSince
       FROM friendships f
       JOIN users u ON (u.id = CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END)
       WHERE f.status = 'ACCEPTED'
         AND (f.requester_id = ? OR f.addressee_id = ?)
       ORDER BY u.first_name ASC`,
      [userId, userId, userId]
    );

    res.json({ friends: rows });
  } catch (err) {
    console.error('Get friends error:', err);
    res.status(500).json({ error: 'Chyba při načítání přátel.' });
  }
});

// ── GET /api/friends/requests ───────────────────────────────
// Vrátí příchozí čekající žádosti o přátelství
router.get('/requests', async (req, res) => {
  try {
    const userId = req.userId;

    const [rows] = await pool.query(
      `SELECT f.id AS friendshipId, u.id, u.first_name, u.last_name, u.email, u.avatar_url, u.bio, f.created_at
       FROM friendships f
       JOIN users u ON u.id = f.requester_id
       WHERE f.addressee_id = ? AND f.status = 'PENDING'
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json({ requests: rows });
  } catch (err) {
    console.error('Get friend requests error:', err);
    res.status(500).json({ error: 'Chyba při načítání žádostí.' });
  }
});

// ── POST /api/friends/request ───────────────────────────────
// Odeslat žádost o přátelství
router.post('/request', async (req, res) => {
  try {
    const userId = req.userId;
    const { addresseeId } = req.body;

    if (!addresseeId) {
      return res.status(400).json({ error: 'Chybí ID uživatele.' });
    }

    if (parseInt(addresseeId) === userId) {
      return res.status(400).json({ error: 'Nemůžete si poslat žádost sami sobě.' });
    }

    // Check if the addressee exists
    const [userExists] = await pool.query('SELECT id FROM users WHERE id = ?', [addresseeId]);
    if (userExists.length === 0) {
      return res.status(404).json({ error: 'Uživatel nenalezen.' });
    }

    // Check if a friendship already exists in either direction
    const [existing] = await pool.query(
      `SELECT id, status FROM friendships 
       WHERE (requester_id = ? AND addressee_id = ?) 
          OR (requester_id = ? AND addressee_id = ?)`,
      [userId, addresseeId, addresseeId, userId]
    );

    if (existing.length > 0) {
      const f = existing[0];
      if (f.status === 'ACCEPTED') {
        return res.status(409).json({ error: 'Už jste přátelé.' });
      }
      if (f.status === 'PENDING') {
        return res.status(409).json({ error: 'Žádost již byla odeslána.' });
      }
      if (f.status === 'DECLINED') {
        // Allow re-requesting after decline by updating the existing row
        await pool.query(
          `UPDATE friendships SET requester_id = ?, addressee_id = ?, status = 'PENDING', updated_at = NOW() WHERE id = ?`,
          [userId, addresseeId, f.id]
        );

        // Create notification for the addressee
        const [requester] = await pool.query('SELECT first_name, last_name FROM users WHERE id = ?', [userId]);
        const name = `${requester[0].first_name || ''} ${requester[0].last_name || ''}`.trim() || 'Někdo';
        await pool.query(
          `INSERT INTO notifications (user_id, type, reference_id, message) VALUES (?, 'FRIEND_REQUEST', ?, ?)`,
          [addresseeId, f.id, `${name} vám poslal/a žádost o přátelství.`]
        );

        return res.json({ message: 'Žádost byla znovu odeslána.', friendshipId: f.id });
      }
    }

    // Create new friendship
    const [result] = await pool.query(
      `INSERT INTO friendships (requester_id, addressee_id, status) VALUES (?, ?, 'PENDING')`,
      [userId, addresseeId]
    );

    const friendshipId = result.insertId;

    // Create notification for the addressee
    const [requester] = await pool.query('SELECT first_name, last_name FROM users WHERE id = ?', [userId]);
    const name = `${requester[0].first_name || ''} ${requester[0].last_name || ''}`.trim() || 'Někdo';
    await pool.query(
      `INSERT INTO notifications (user_id, type, reference_id, message) VALUES (?, 'FRIEND_REQUEST', ?, ?)`,
      [addresseeId, friendshipId, `${name} vám poslal/a žádost o přátelství.`]
    );

    res.status(201).json({ message: 'Žádost odeslána.', friendshipId });
  } catch (err) {
    console.error('Send friend request error:', err);
    res.status(500).json({ error: 'Chyba při odesílání žádosti.' });
  }
});

// ── PUT /api/friends/:id/accept ─────────────────────────────
router.put('/:id/accept', async (req, res) => {
  try {
    const userId = req.userId;
    const friendshipId = parseInt(req.params.id);

    const [rows] = await pool.query(
      `SELECT id, requester_id, addressee_id, status FROM friendships WHERE id = ?`,
      [friendshipId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Žádost nenalezena.' });
    }

    const f = rows[0];

    if (f.addressee_id !== userId) {
      return res.status(403).json({ error: 'Nemáte oprávnění přijmout tuto žádost.' });
    }

    if (f.status !== 'PENDING') {
      return res.status(400).json({ error: 'Tato žádost již byla zpracována.' });
    }

    await pool.query(
      `UPDATE friendships SET status = 'ACCEPTED', updated_at = NOW() WHERE id = ?`,
      [friendshipId]
    );

    // Notify the requester that the request was accepted
    const [accepter] = await pool.query('SELECT first_name, last_name FROM users WHERE id = ?', [userId]);
    const name = `${accepter[0].first_name || ''} ${accepter[0].last_name || ''}`.trim() || 'Někdo';
    await pool.query(
      `INSERT INTO notifications (user_id, type, reference_id, message) VALUES (?, 'FRIEND_ACCEPTED', ?, ?)`,
      [f.requester_id, friendshipId, `${name} přijal/a vaši žádost o přátelství.`]
    );

    res.json({ message: 'Žádost přijata.' });
  } catch (err) {
    console.error('Accept friend request error:', err);
    res.status(500).json({ error: 'Chyba při přijímání žádosti.' });
  }
});

// ── PUT /api/friends/:id/decline ────────────────────────────
router.put('/:id/decline', async (req, res) => {
  try {
    const userId = req.userId;
    const friendshipId = parseInt(req.params.id);

    const [rows] = await pool.query(
      `SELECT id, addressee_id, status FROM friendships WHERE id = ?`,
      [friendshipId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Žádost nenalezena.' });
    }

    if (rows[0].addressee_id !== userId) {
      return res.status(403).json({ error: 'Nemáte oprávnění odmítnout tuto žádost.' });
    }

    if (rows[0].status !== 'PENDING') {
      return res.status(400).json({ error: 'Tato žádost již byla zpracována.' });
    }

    await pool.query(
      `UPDATE friendships SET status = 'DECLINED', updated_at = NOW() WHERE id = ?`,
      [friendshipId]
    );

    res.json({ message: 'Žádost odmítnuta.' });
  } catch (err) {
    console.error('Decline friend request error:', err);
    res.status(500).json({ error: 'Chyba při odmítání žádosti.' });
  }
});

// ── DELETE /api/friends/:id ─────────────────────────────────
// Odebrat přítele
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const friendshipId = parseInt(req.params.id);

    const [result] = await pool.query(
      `DELETE FROM friendships WHERE id = ? AND (requester_id = ? OR addressee_id = ?)`,
      [friendshipId, userId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Přátelství nenalezeno.' });
    }

    res.json({ message: 'Přítel odebrán.' });
  } catch (err) {
    console.error('Remove friend error:', err);
    res.status(500).json({ error: 'Chyba při odebírání přítele.' });
  }
});

// ── GET /api/friends/search?q=query ─────────────────────────
// Hledání uživatelů podle jména nebo emailu
router.get('/search', async (req, res) => {
  try {
    const userId = req.userId;
    const query = req.query.q;

    if (!query || query.trim().length < 2) {
      return res.json({ users: [] });
    }

    const searchTerm = `%${query.trim()}%`;

    const [rows] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.avatar_url, u.bio,
              f.status AS raw_status, f.requester_id
       FROM users u
       LEFT JOIN friendships f ON (f.requester_id = ? AND f.addressee_id = u.id) OR (f.requester_id = u.id AND f.addressee_id = ?)
       WHERE u.id != ?
         AND (u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR CONCAT(u.first_name, ' ', u.last_name) LIKE ?)
       LIMIT 20`,
      [userId, userId, userId, searchTerm, searchTerm, searchTerm, searchTerm]
    );

    const usersWithStatus = rows.map(u => {
      let status = 'NONE';
      if (u.raw_status === 'ACCEPTED') status = 'ACCEPTED';
      else if (u.raw_status === 'PENDING') {
        status = u.requester_id === userId ? 'PENDING_SENT' : 'PENDING_RECEIVED';
      }
      return {
        id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        avatar_url: u.avatar_url,
        bio: u.bio,
        friendshipStatus: status,
      };
    });

    res.json({ users: usersWithStatus });
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ error: 'Chyba při hledání uživatelů.' });
  }
});

// ── GET /api/friends/status/:userId ─────────────────────────
// Zjistit stav přátelství s konkrétním uživatelem
router.get('/status/:userId', async (req, res) => {
  try {
    const currentUserId = req.userId;
    const targetUserId = parseInt(req.params.userId);

    if (currentUserId === targetUserId) {
      return res.json({ status: 'SELF', friendshipId: null });
    }

    const [rows] = await pool.query(
      `SELECT id, requester_id, addressee_id, status FROM friendships 
       WHERE (requester_id = ? AND addressee_id = ?) 
          OR (requester_id = ? AND addressee_id = ?)`,
      [currentUserId, targetUserId, targetUserId, currentUserId]
    );

    if (rows.length === 0) {
      return res.json({ status: 'NONE', friendshipId: null });
    }

    const f = rows[0];
    // Determine direction for PENDING status
    let status = f.status;
    if (f.status === 'PENDING') {
      status = f.requester_id === currentUserId ? 'PENDING_SENT' : 'PENDING_RECEIVED';
    }

    res.json({ status, friendshipId: f.id });
  } catch (err) {
    console.error('Get friendship status error:', err);
    res.status(500).json({ error: 'Chyba při zjišťování stavu přátelství.' });
  }
});

export default router;
