import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

// ── GET /api/admin/dashboard ────────────────────────────────
// Platform-wide statistics for admin dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [
      [totalUsersRows],
      [totalTripsRows],
      [totalExpensesRows],
      [totalFriendshipsRows],
      [newUsersWeekRows],
      [newUsersMonthRows],
      [recentUsersRows],
      [topUsersRows],
      [totalExpenseAmountRows],
      [tripsPerMonthRows],
    ] = await Promise.all([
      // Total users
      pool.query('SELECT COUNT(*) AS count FROM users'),
      // Total trips
      pool.query('SELECT COUNT(*) AS count FROM trips'),
      // Total expenses
      pool.query('SELECT COUNT(*) AS count FROM trip_expenses'),
      // Total friendships (accepted)
      pool.query("SELECT COUNT(*) AS count FROM friendships WHERE status = 'ACCEPTED'"),
      // New users last 7 days
      pool.query('SELECT COUNT(*) AS count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'),
      // New users last 30 days
      pool.query('SELECT COUNT(*) AS count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'),
      // 10 most recent users
      pool.query(`
        SELECT u.id, u.email, u.first_name, u.last_name, u.avatar_url, u.role, u.created_at,
          (SELECT COUNT(*) FROM trips t WHERE t.user_id = u.id) AS trip_count
        FROM users u
        ORDER BY u.created_at DESC
        LIMIT 10
      `),
      // Top 5 users by trip count
      pool.query(`
        SELECT u.id, u.email, u.first_name, u.last_name, u.avatar_url,
          COUNT(t.id) AS trip_count
        FROM users u
        LEFT JOIN trips t ON t.user_id = u.id
        GROUP BY u.id
        ORDER BY trip_count DESC
        LIMIT 5
      `),
      // Total expense amount
      pool.query('SELECT COALESCE(SUM(amount), 0) AS total FROM trip_expenses'),
      // Trips created per month (last 6 months)
      pool.query(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') AS month,
          COUNT(*) AS count
        FROM trips
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
      `),
    ]);

    res.json({
      dashboard: {
        totalUsers: parseInt(totalUsersRows[0].count),
        totalTrips: parseInt(totalTripsRows[0].count),
        totalExpenses: parseInt(totalExpensesRows[0].count),
        totalFriendships: parseInt(totalFriendshipsRows[0].count),
        newUsersWeek: parseInt(newUsersWeekRows[0].count),
        newUsersMonth: parseInt(newUsersMonthRows[0].count),
        totalExpenseAmount: parseFloat(totalExpenseAmountRows[0].total),
        recentUsers: recentUsersRows.map(u => ({
          id: u.id,
          email: u.email,
          firstName: u.first_name,
          lastName: u.last_name,
          avatarUrl: u.avatar_url,
          role: u.role,
          createdAt: u.created_at,
          tripCount: parseInt(u.trip_count),
        })),
        topUsers: topUsersRows.map(u => ({
          id: u.id,
          email: u.email,
          firstName: u.first_name,
          lastName: u.last_name,
          avatarUrl: u.avatar_url,
          tripCount: parseInt(u.trip_count),
        })),
        tripsPerMonth: tripsPerMonthRows.map(r => ({
          month: r.month,
          count: parseInt(r.count),
        })),
      }
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ error: 'Chyba při načítání admin dashboardu.' });
  }
});


// ── GET /api/admin/users ────────────────────────────────────
// List all users with pagination and search
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const sort = ['created_at', 'email', 'first_name'].includes(req.query.sort) ? req.query.sort : 'created_at';
    const order = req.query.order === 'asc' ? 'ASC' : 'DESC';

    let whereClause = '';
    const params = [];

    if (search) {
      whereClause = 'WHERE u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    // Get total count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM users u ${whereClause}`,
      params
    );
    const total = parseInt(countRows[0].total);

    // Get users with stats
    const [users] = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.avatar_url, u.bio, u.role, u.created_at,
        (SELECT COUNT(*) FROM trips t WHERE t.user_id = u.id) AS trip_count,
        (SELECT COUNT(*) FROM friendships f WHERE (f.requester_id = u.id OR f.addressee_id = u.id) AND f.status = 'ACCEPTED') AS friend_count
      FROM users u
      ${whereClause}
      ORDER BY u.${sort} ${order}
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.first_name,
        lastName: u.last_name,
        avatarUrl: u.avatar_url,
        bio: u.bio,
        role: u.role || 'user',
        createdAt: u.created_at,
        tripCount: parseInt(u.trip_count),
        friendCount: parseInt(u.friend_count),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Chyba při načítání uživatelů.' });
  }
});


// ── GET /api/admin/users/:id ────────────────────────────────
// Get detailed user info
router.get('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const [users] = await pool.query(
      'SELECT id, email, first_name, last_name, avatar_url, bio, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Uživatel nenalezen.' });
    }

    const user = users[0];

    // Get user's trips
    const [trips] = await pool.query(
      `SELECT t.id, t.title, DATE_FORMAT(t.start_date, '%Y-%m-%d') AS startDate, 
        DATE_FORMAT(t.end_date, '%Y-%m-%d') AS endDate, t.created_at,
        COALESCE((SELECT SUM(e.amount) FROM trip_expenses e WHERE e.trip_id = t.id), 0) AS totalExpenses,
        (SELECT COUNT(*) FROM votes v WHERE v.trip_id = t.id AND v.value = 1) AS likes
      FROM trips t WHERE t.user_id = ? ORDER BY t.created_at DESC`,
      [userId]
    );

    // Get user's friends
    const [friends] = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.avatar_url
      FROM friendships f
      JOIN users u ON (u.id = CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END)
      WHERE (f.requester_id = ? OR f.addressee_id = ?) AND f.status = 'ACCEPTED'`,
      [userId, userId, userId]
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        role: user.role || 'user',
        createdAt: user.created_at,
        trips: trips.map(t => ({
          id: t.id.toString(),
          title: t.title,
          startDate: t.startDate,
          endDate: t.endDate,
          createdAt: t.created_at,
          totalExpenses: parseFloat(t.totalExpenses),
          likes: parseInt(t.likes),
        })),
        friends: friends.map(f => ({
          id: f.id,
          email: f.email,
          firstName: f.first_name,
          lastName: f.last_name,
          avatarUrl: f.avatar_url,
        })),
      }
    });
  } catch (err) {
    console.error('Admin user detail error:', err);
    res.status(500).json({ error: 'Chyba při načítání detailu uživatele.' });
  }
});


// ── PUT /api/admin/users/:id/role ───────────────────────────
// Update user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Neplatná role. Povolené: user, admin.' });
    }

    // Don't allow removing own admin role
    if (userId === req.userId && role === 'user') {
      return res.status(400).json({ error: 'Nemůžete si odebrat vlastní admin práva.' });
    }

    const [result] = await pool.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Uživatel nenalezen.' });
    }

    res.json({ message: 'Role byla aktualizována.', role });
  } catch (err) {
    console.error('Admin update role error:', err);
    res.status(500).json({ error: 'Chyba při změně role.' });
  }
});


// ── DELETE /api/admin/users/:id ─────────────────────────────
// Delete user and all their data (cascading)
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Don't allow deleting yourself
    if (userId === req.userId) {
      return res.status(400).json({ error: 'Nemůžete smazat svůj vlastní účet z admin panelu.' });
    }

    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Uživatel nenalezen.' });
    }

    res.json({ message: 'Uživatel a všechna jeho data byly smazány.' });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ error: 'Chyba při mazání uživatele.' });
  }
});


// ── GET /api/admin/trips ────────────────────────────────────
// List all trips with pagination and search
router.get('/trips', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const userId = req.query.userId || '';
    const sort = ['created_at', 'title', 'start_date'].includes(req.query.sort) ? req.query.sort : 'created_at';
    const order = req.query.order === 'asc' ? 'ASC' : 'DESC';

    let whereConditions = [];
    const params = [];

    if (search) {
      whereConditions.push('t.title LIKE ?');
      params.push(`%${search}%`);
    }

    if (userId) {
      whereConditions.push('t.user_id = ?');
      params.push(parseInt(userId));
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM trips t ${whereClause}`,
      params
    );
    const total = parseInt(countRows[0].total);

    // Get trips
    const [trips] = await pool.query(
      `SELECT t.id, t.title, 
        DATE_FORMAT(t.start_date, '%Y-%m-%d') AS startDate,
        DATE_FORMAT(t.end_date, '%Y-%m-%d') AS endDate,
        t.created_at,
        u.id AS userId, u.email AS userEmail, u.first_name AS userFirstName, u.last_name AS userLastName, u.avatar_url AS userAvatar,
        (SELECT COUNT(*) FROM trip_activities a WHERE a.trip_id = t.id) AS activityCount,
        COALESCE((SELECT SUM(e.amount) FROM trip_expenses e WHERE e.trip_id = t.id), 0) AS totalExpenses,
        (SELECT COUNT(*) FROM votes v WHERE v.trip_id = t.id AND v.value = 1) AS likes,
        DATEDIFF(t.end_date, t.start_date) AS durationDays
      FROM trips t
      JOIN users u ON u.id = t.user_id
      ${whereClause}
      ORDER BY t.${sort} ${order}
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      trips: trips.map(t => ({
        id: t.id.toString(),
        title: t.title,
        startDate: t.startDate,
        endDate: t.endDate,
        createdAt: t.created_at,
        user: {
          id: t.userId,
          email: t.userEmail,
          firstName: t.userFirstName,
          lastName: t.userLastName,
          avatarUrl: t.userAvatar,
        },
        activityCount: parseInt(t.activityCount),
        totalExpenses: parseFloat(t.totalExpenses),
        likes: parseInt(t.likes),
        durationDays: parseInt(t.durationDays),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (err) {
    console.error('Admin trips error:', err);
    res.status(500).json({ error: 'Chyba při načítání výletů.' });
  }
});


// ── DELETE /api/admin/trips/:id ─────────────────────────────
// Delete any trip (admin override, no ownership check)
router.delete('/trips/:id', async (req, res) => {
  try {
    const tripId = parseInt(req.params.id);

    const [result] = await pool.query('DELETE FROM trips WHERE id = ?', [tripId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Výlet nenalezen.' });
    }

    res.json({ message: 'Výlet byl smazán.' });
  } catch (err) {
    console.error('Admin delete trip error:', err);
    res.status(500).json({ error: 'Chyba při mazání výletu.' });
  }
});


// ── GET /api/admin/trips/:id ────────────────────────────────
// Get full trip detail (read-only view for admin)
router.get('/trips/:id', async (req, res) => {
  try {
    const tripId = parseInt(req.params.id);

    // Get trip with owner info
    const [trips] = await pool.query(
      `SELECT t.id, t.title, 
        DATE_FORMAT(t.start_date, '%Y-%m-%d') AS startDate,
        DATE_FORMAT(t.end_date, '%Y-%m-%d') AS endDate,
        t.created_at,
        u.id AS userId, u.email AS userEmail, u.first_name AS userFirstName, 
        u.last_name AS userLastName, u.avatar_url AS userAvatar,
        DATEDIFF(t.end_date, t.start_date) AS durationDays
      FROM trips t
      JOIN users u ON u.id = t.user_id
      WHERE t.id = ?`,
      [tripId]
    );

    if (trips.length === 0) {
      return res.status(404).json({ error: 'Výlet nenalezen.' });
    }

    const trip = trips[0];

    // Get all sub-data in parallel
    const [
      [activities],
      [expenses],
      [packingItems],
      [documents],
      [voteScore],
    ] = await Promise.all([
      pool.query(
        `SELECT id, day_index AS dayIndex, DATE_FORMAT(date, '%Y-%m-%d') AS date, 
          title, plan, location 
        FROM trip_activities WHERE trip_id = ? ORDER BY day_index ASC`,
        [tripId]
      ),
      pool.query(
        `SELECT id, description, amount, category, DATE_FORMAT(date, '%Y-%m-%d') AS date 
        FROM trip_expenses WHERE trip_id = ? ORDER BY created_at DESC`,
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
    ]);

    res.json({
      trip: {
        id: trip.id.toString(),
        title: trip.title,
        startDate: trip.startDate,
        endDate: trip.endDate,
        createdAt: trip.created_at,
        durationDays: parseInt(trip.durationDays),
        likes: parseInt(voteScore[0].likes),
        user: {
          id: trip.userId,
          email: trip.userEmail,
          firstName: trip.userFirstName,
          lastName: trip.userLastName,
          avatarUrl: trip.userAvatar,
        },
        activities: activities.map(a => ({
          id: a.id.toString(),
          dayIndex: a.dayIndex,
          date: a.date,
          title: a.title,
          plan: a.plan,
          location: a.location,
        })),
        expenses: expenses.map(e => ({
          id: e.id.toString(),
          description: e.description,
          amount: parseFloat(e.amount),
          category: e.category,
          date: e.date,
        })),
        packingList: packingItems.map(p => ({
          id: p.id.toString(),
          text: p.text,
          checked: !!p.checked,
        })),
        documents: documents.map(d => ({
          id: d.id.toString(),
          title: d.title,
          content: d.content,
        })),
      }
    });
  } catch (err) {
    console.error('Admin trip detail error:', err);
    res.status(500).json({ error: 'Chyba při načítání detailu výletu.' });
  }
});


export default router;
