import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

// Pomocná funkce pro formátování data pro MariaDB (YYYY-MM-DD)
const formatDateForDb = (date) => {
  if (!date) return null;
  // Pokud je to už ve formátu YYYY-MM-DD, nešahej na to
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  // Pokud je to string s T (ISO), nebo cokoliv jiného, usekni to
  if (typeof date === 'string') return date.split('T')[0].split(' ')[0];
  // Pokud je to Date objekt
  if (date instanceof Date) return date.toISOString().split('T')[0];
  return date;
};

// ── GET /api/trips ──────────────────────────────────────────
// Vrátí všechny výlety uživatele včetně všech vnořených dat
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;

    // Get all trips
    const [trips] = await pool.query(
      'SELECT id, title, start_date AS startDate, end_date AS endDate, created_at AS createdAt FROM trips WHERE user_id = ? ORDER BY start_date DESC',
      [userId]
    );

    // For each trip, load sub-data
    const fullTrips = await Promise.all(trips.map(async (trip) => {
      const [activities] = await pool.query(
        'SELECT id, day_index AS dayIndex, date, title, plan, location FROM trip_activities WHERE trip_id = ? ORDER BY day_index ASC',
        [trip.id]
      );

      const [expenses] = await pool.query(
        'SELECT id, description, amount, category, date FROM trip_expenses WHERE trip_id = ? ORDER BY created_at DESC',
        [trip.id]
      );

      const [packingItems] = await pool.query(
        'SELECT id, text, checked FROM trip_packing_items WHERE trip_id = ? ORDER BY created_at ASC',
        [trip.id]
      );

      const [documents] = await pool.query(
        'SELECT id, title, content FROM trip_documents WHERE trip_id = ? ORDER BY created_at ASC',
        [trip.id]
      );

      return {
        ...trip,
        id: trip.id.toString(),
        activities: activities.map(a => ({
          ...a,
          id: a.id.toString(),
        })),
        expenses: expenses.map(e => ({
          ...e,
          id: e.id.toString(),
          amount: parseFloat(e.amount),
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
      };
    }));

    res.json({ trips: fullTrips });
  } catch (err) {
    console.error('Get trips error:', err);
    res.status(500).json({ error: 'Chyba při načítání výletů.' });
  }
});

// ── POST /api/trips ─────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { title, startDate, endDate } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ error: 'Název, datum od a datum do jsou povinné.' });
    }

    const [result] = await pool.query(
      'INSERT INTO trips (user_id, title, start_date, end_date) VALUES (?, ?, ?, ?)',
      [userId, title, formatDateForDb(startDate), formatDateForDb(endDate)]
    );

    const tripId = result.insertId;

    res.status(201).json({
      trip: {
        id: tripId.toString(),
        title,
        startDate,
        endDate,
        activities: [],
        expenses: [],
        packingList: [],
        documents: [],
      }
    });
  } catch (err) {
    console.error('Create trip error:', err);
    res.status(500).json({ error: 'Chyba při vytváření výletu.' });
  }
});

// ── PUT /api/trips/:id ──────────────────────────────────────
// Full update: replaces all sub-data (activities, expenses, packing, documents)
router.put('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.userId;
    const tripId = parseInt(req.params.id);
    const { title, startDate, endDate, activities, expenses, packingList, documents } = req.body;

    // Verify ownership
    const [owned] = await connection.query(
      'SELECT id FROM trips WHERE id = ? AND user_id = ?',
      [tripId, userId]
    );
    if (owned.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Výlet nenalezen.' });
    }

    // Update trip basic info
    if (title || startDate || endDate) {
      await connection.query(
        'UPDATE trips SET title = COALESCE(?, title), start_date = COALESCE(?, start_date), end_date = COALESCE(?, end_date) WHERE id = ?',
        [title, formatDateForDb(startDate), formatDateForDb(endDate), tripId]
      );
    }

    // Replace activities
    if (activities !== undefined) {
      await connection.query('DELETE FROM trip_activities WHERE trip_id = ?', [tripId]);
      for (let i = 0; i < activities.length; i++) {
        const a = activities[i];
        await connection.query(
          'INSERT INTO trip_activities (trip_id, day_index, date, title, plan, location) VALUES (?, ?, ?, ?, ?, ?)',
          [tripId, i, formatDateForDb(a.date), a.title || `Den ${i + 1}`, a.plan || '', a.location || '']
        );
      }
    }

    // Replace expenses
    if (expenses !== undefined) {
      await connection.query('DELETE FROM trip_expenses WHERE trip_id = ?', [tripId]);
      for (const e of expenses) {
        await connection.query(
          'INSERT INTO trip_expenses (trip_id, description, amount, category, date) VALUES (?, ?, ?, ?, ?)',
          [tripId, e.description, e.amount, e.category || 'other', formatDateForDb(e.date)]
        );
      }
    }

    // Replace packing list
    if (packingList !== undefined) {
      await connection.query('DELETE FROM trip_packing_items WHERE trip_id = ?', [tripId]);
      for (const p of packingList) {
        await connection.query(
          'INSERT INTO trip_packing_items (trip_id, text, checked) VALUES (?, ?, ?)',
          [tripId, p.text, p.checked ? 1 : 0]
        );
      }
    }

    // Replace documents
    if (documents !== undefined) {
      await connection.query('DELETE FROM trip_documents WHERE trip_id = ?', [tripId]);
      for (const d of documents) {
        await connection.query(
          'INSERT INTO trip_documents (trip_id, title, content) VALUES (?, ?, ?)',
          [tripId, d.title, d.content]
        );
      }
    }

    await connection.commit();

    // Return the updated trip
    const [updatedTrips] = await pool.query(
      'SELECT id, title, start_date AS startDate, end_date AS endDate FROM trips WHERE id = ?',
      [tripId]
    );
    const [updatedActivities] = await pool.query(
      'SELECT id, day_index AS dayIndex, date, title, plan, location FROM trip_activities WHERE trip_id = ? ORDER BY day_index ASC',
      [tripId]
    );
    const [updatedExpenses] = await pool.query(
      'SELECT id, description, amount, category, date FROM trip_expenses WHERE trip_id = ? ORDER BY created_at DESC',
      [tripId]
    );
    const [updatedPacking] = await pool.query(
      'SELECT id, text, checked FROM trip_packing_items WHERE trip_id = ? ORDER BY created_at ASC',
      [tripId]
    );
    const [updatedDocs] = await pool.query(
      'SELECT id, title, content FROM trip_documents WHERE trip_id = ? ORDER BY created_at ASC',
      [tripId]
    );

    res.json({
      trip: {
        ...updatedTrips[0],
        id: updatedTrips[0].id.toString(),
        activities: updatedActivities.map(a => ({ ...a, id: a.id.toString() })),
        expenses: updatedExpenses.map(e => ({ ...e, id: e.id.toString(), amount: parseFloat(e.amount) })),
        packingList: updatedPacking.map(p => ({ id: p.id.toString(), text: p.text, checked: !!p.checked })),
        documents: updatedDocs.map(d => ({ id: d.id.toString(), title: d.title, content: d.content })),
      }
    });
  } catch (err) {
    await connection.rollback();
    console.error('Update trip error:', err);
    res.status(500).json({ error: 'Chyba při aktualizaci výletu.' });
  } finally {
    connection.release();
  }
});

// ── DELETE /api/trips/:id ───────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const tripId = parseInt(req.params.id);

    const [result] = await pool.query(
      'DELETE FROM trips WHERE id = ? AND user_id = ?',
      [tripId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Výlet nenalezen.' });
    }

    res.json({ message: 'Výlet byl smazán.' });
  } catch (err) {
    console.error('Delete trip error:', err);
    res.status(500).json({ error: 'Chyba při mazání výletu.' });
  }
});

export default router;
