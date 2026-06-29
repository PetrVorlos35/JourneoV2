import { Router } from 'express';
import { randomBytes } from 'crypto';
import { waitUntil } from '@vercel/functions';
import pool from '../config/db.js';
import { calculateBalances } from '../lib/balances.js';
import { sendSettlementEmail } from '../lib/mailer.js';

const router = Router();

const CURRENCY_SYMBOLS = { CZK: 'Kč', EUR: '€', USD: '$', GBP: '£' };
const formatAmountLabel = (amount, currency = 'CZK', locale = 'cs') => {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${Number(amount).toLocaleString(locale)} ${symbol}`;
};

// Loads a trip's expenses together with their splits, shaped for the API.
// `db` may be the pool or an active transaction connection.
const fetchExpensesWithSplits = async (tripId, db = pool) => {
  const [expenses] = await db.query(
    "SELECT id, description, amount, category, DATE_FORMAT(date, '%Y-%m-%d') AS date, paid_by AS paidBy FROM trip_expenses WHERE trip_id = ? ORDER BY created_at DESC",
    [tripId]
  );

  const [splits] = await db.query(
    `SELECT es.expense_id AS expenseId, es.user_id AS userId, es.amount
     FROM expense_splits es
     JOIN trip_expenses te ON te.id = es.expense_id
     WHERE te.trip_id = ?`,
    [tripId]
  );

  const splitsByExpense = new Map();
  for (const s of splits) {
    if (!splitsByExpense.has(s.expenseId)) splitsByExpense.set(s.expenseId, []);
    splitsByExpense.get(s.expenseId).push({ userId: s.userId, amount: parseFloat(s.amount) });
  }

  return expenses.map((e) => ({
    id: e.id.toString(),
    description: e.description,
    amount: parseFloat(e.amount),
    category: e.category,
    date: e.date,
    paidBy: e.paidBy != null ? e.paidBy : null,
    splits: splitsByExpense.get(e.id) || [],
  }));
};

// Loads recorded settle-up payments for a trip (compensating transactions).
const fetchSettlements = async (tripId, db = pool) => {
  const [rows] = await db.query(
    'SELECT from_user_id AS fromUserId, to_user_id AS toUserId, amount FROM trip_settlements WHERE trip_id = ?',
    [tripId]
  );
  return rows.map((r) => ({
    fromUserId: r.fromUserId,
    toUserId: r.toUserId,
    amount: parseFloat(r.amount),
  }));
};

const formatDateForDb = (date) => {
  if (!date) return null;
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  if (typeof date === 'string') return date.split('T')[0].split(' ')[0];
  if (date instanceof Date) return date.toISOString().split('T')[0];
  return date;
};

const MIN_TRIP_DATE = new Date('2024-01-01');
const MAX_TRIP_DAYS = 100;

const validateTripDates = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { status: 400, error: 'Neplatné datum.' };
  }
  if (start < MIN_TRIP_DATE) {
    return { status: 400, error: 'Datum začátku musí být nejdříve 1. 1. 2024.' };
  }
  const diffDays = (end - start) / (1000 * 60 * 60 * 24);
  if (diffDays > MAX_TRIP_DAYS) {
    return { status: 400, error: 'Výlet nemůže být delší než 100 dní.' };
  }
  return null;
};

// Returns 'owner' | 'editor' | 'viewer' | null (no access)
const getTripRole = async (tripId, userId) => {
  const [[owned]] = await pool.query(
    'SELECT id FROM trips WHERE id = ? AND user_id = ?',
    [tripId, userId]
  );
  if (owned) return 'owner';

  const [[collab]] = await pool.query(
    'SELECT role FROM trip_collaborators WHERE trip_id = ? AND user_id = ?',
    [tripId, userId]
  );
  return collab ? collab.role : null;
};

// ── GET /api/trips ──────────────────────────────────────────
// Returns owned trips + trips shared with the user, each with their role
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;

    const [trips] = await pool.query(
      `SELECT t.id, t.title,
         DATE_FORMAT(t.start_date, '%Y-%m-%d') AS startDate,
         DATE_FORMAT(t.end_date, '%Y-%m-%d') AS endDate,
         t.created_at AS createdAt,
         'owner' AS role,
         (SELECT COUNT(*) FROM votes v WHERE v.trip_id = t.id AND v.value = 1) AS likes,
         t.share_token AS shareToken,
         t.budget_target AS budgetTarget
       FROM trips t
       WHERE t.user_id = ?
       UNION
       SELECT t.id, t.title,
         DATE_FORMAT(t.start_date, '%Y-%m-%d') AS startDate,
         DATE_FORMAT(t.end_date, '%Y-%m-%d') AS endDate,
         t.created_at AS createdAt,
         tc.role,
         NULL AS likes,
         NULL AS shareToken,
         t.budget_target AS budgetTarget
       FROM trips t
       JOIN trip_collaborators tc ON tc.trip_id = t.id AND tc.user_id = ?
       WHERE t.user_id != ?
       ORDER BY startDate DESC`,
      [userId, userId, userId]
    );

    const fullTrips = await Promise.all(trips.map(async (trip) => {
      const [activities] = await pool.query(
        "SELECT id, day_index AS dayIndex, DATE_FORMAT(date, '%Y-%m-%d') AS date, title, plan, location FROM trip_activities WHERE trip_id = ? ORDER BY day_index ASC",
        [trip.id]
      );

      const expenses = await fetchExpensesWithSplits(trip.id);

      const [packingItems] = await pool.query(
        'SELECT id, text, checked FROM trip_packing_items WHERE trip_id = ? ORDER BY created_at ASC',
        [trip.id]
      );

      const [documents] = await pool.query(
        'SELECT id, title, content FROM trip_documents WHERE trip_id = ? ORDER BY created_at ASC',
        [trip.id]
      );

      const [voteScore] = await pool.query(
        'SELECT COUNT(*) AS likes FROM votes WHERE trip_id = ? AND value = 1',
        [trip.id]
      );

      const [userVote] = await pool.query(
        'SELECT value FROM votes WHERE user_id = ? AND trip_id = ?',
        [userId, trip.id]
      );

      return {
        ...trip,
        id: trip.id.toString(),
        budgetTarget: trip.budgetTarget != null ? parseFloat(trip.budgetTarget) : null,
        activities: activities.map(a => ({ ...a, id: a.id.toString() })),
        expenses,
        packingList: packingItems.map(p => ({ id: p.id.toString(), text: p.text, checked: !!p.checked })),
        documents: documents.map(d => ({ id: d.id.toString(), title: d.title, content: d.content })),
        likes: parseInt(voteScore[0].likes),
        isLiked: userVote.length > 0 && userVote[0].value === 1,
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

    const dateValidationError = validateTripDates(startDate, endDate);
    if (dateValidationError) {
      return res.status(dateValidationError.status).json({ error: dateValidationError.error });
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
        role: 'owner',
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
// Owners and editors can update; viewers are blocked with 403
router.put('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.userId;
    const tripId = parseInt(req.params.id);
    const { title, startDate, endDate, activities, expenses, packingList, documents, budgetTarget } = req.body;

    const role = await getTripRole(tripId, userId);
    if (!role) {
      await connection.rollback();
      return res.status(404).json({ error: 'Výlet nenalezen.' });
    }
    if (role === 'viewer') {
      await connection.rollback();
      return res.status(403).json({ error: 'Nemáte oprávnění upravovat tento výlet.' });
    }

    if (startDate || endDate) {
      const effectiveStart = startDate || (await connection.query("SELECT DATE_FORMAT(start_date, '%Y-%m-%d') AS d FROM trips WHERE id = ?", [tripId]))[0][0]?.d;
      const effectiveEnd = endDate || (await connection.query("SELECT DATE_FORMAT(end_date, '%Y-%m-%d') AS d FROM trips WHERE id = ?", [tripId]))[0][0]?.d;
      const dateValidationError = validateTripDates(effectiveStart, effectiveEnd);
      if (dateValidationError) {
        await connection.rollback();
        return res.status(dateValidationError.status).json({ error: dateValidationError.error });
      }
    }

    if (title || startDate || endDate || budgetTarget !== undefined) {
      const budgetClause = budgetTarget !== undefined ? ', budget_target = ?' : '';
      const budgetParams = budgetTarget !== undefined ? [budgetTarget] : [];
      await connection.query(
        `UPDATE trips SET title = COALESCE(?, title), start_date = COALESCE(?, start_date), end_date = COALESCE(?, end_date)${budgetClause} WHERE id = ?`,
        [title, formatDateForDb(startDate), formatDateForDb(endDate), ...budgetParams, tripId]
      );
    }

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

    if (expenses !== undefined) {
      // Splits cascade-delete with their expense, so removing the expenses
      // here also clears the old expense_splits rows.
      await connection.query('DELETE FROM trip_expenses WHERE trip_id = ?', [tripId]);
      for (const e of expenses) {
        const paidBy = e.paidBy != null && e.paidBy !== '' ? parseInt(e.paidBy) : null;
        const [insertResult] = await connection.query(
          'INSERT INTO trip_expenses (trip_id, description, amount, category, date, paid_by) VALUES (?, ?, ?, ?, ?, ?)',
          [tripId, e.description, e.amount, e.category || 'other', formatDateForDb(e.date), paidBy]
        );

        const expenseId = insertResult.insertId;
        const splits = Array.isArray(e.splits) ? e.splits : [];
        for (const s of splits) {
          if (s == null || s.userId == null || s.userId === '') continue;
          const splitAmount = Number(s.amount);
          if (!Number.isFinite(splitAmount) || splitAmount <= 0) continue;
          await connection.query(
            `INSERT INTO expense_splits (expense_id, user_id, amount) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
            [expenseId, parseInt(s.userId), splitAmount]
          );
        }
      }
    }

    if (packingList !== undefined) {
      await connection.query('DELETE FROM trip_packing_items WHERE trip_id = ?', [tripId]);
      for (const p of packingList) {
        await connection.query(
          'INSERT INTO trip_packing_items (trip_id, text, checked) VALUES (?, ?, ?)',
          [tripId, p.text, p.checked ? 1 : 0]
        );
      }
    }

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

    const [updatedTrips] = await pool.query(
      "SELECT id, title, DATE_FORMAT(start_date, '%Y-%m-%d') AS startDate, DATE_FORMAT(end_date, '%Y-%m-%d') AS endDate, budget_target AS budgetTarget FROM trips WHERE id = ?",
      [tripId]
    );
    const [updatedActivities] = await pool.query(
      "SELECT id, day_index AS dayIndex, DATE_FORMAT(date, '%Y-%m-%d') AS date, title, plan, location FROM trip_activities WHERE trip_id = ? ORDER BY day_index ASC",
      [tripId]
    );
    const updatedExpenses = await fetchExpensesWithSplits(tripId);
    const [updatedPacking] = await pool.query(
      'SELECT id, text, checked FROM trip_packing_items WHERE trip_id = ? ORDER BY created_at ASC',
      [tripId]
    );
    const [updatedDocs] = await pool.query(
      'SELECT id, title, content FROM trip_documents WHERE trip_id = ? ORDER BY created_at ASC',
      [tripId]
    );
    const [voteScore] = await pool.query(
      'SELECT COUNT(*) AS likes FROM votes WHERE trip_id = ? AND value = 1',
      [tripId]
    );
    const [userVote] = await pool.query(
      'SELECT value FROM votes WHERE user_id = ? AND trip_id = ?',
      [userId, tripId]
    );

    res.json({
      trip: {
        ...updatedTrips[0],
        id: updatedTrips[0].id.toString(),
        budgetTarget: updatedTrips[0].budgetTarget != null ? parseFloat(updatedTrips[0].budgetTarget) : null,
        role,
        activities: updatedActivities.map(a => ({ ...a, id: a.id.toString() })),
        expenses: updatedExpenses,
        packingList: updatedPacking.map(p => ({ id: p.id.toString(), text: p.text, checked: !!p.checked })),
        documents: updatedDocs.map(d => ({ id: d.id.toString(), title: d.title, content: d.content })),
        likes: parseInt(voteScore[0].likes),
        isLiked: userVote.length > 0 && userVote[0].value === 1,
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
// Only the owner can delete a trip
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const tripId = parseInt(req.params.id);

    const [result] = await pool.query(
      'DELETE FROM trips WHERE id = ? AND user_id = ?',
      [tripId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Výlet nenalezen nebo nemáte oprávnění jej smazat.' });
    }

    res.json({ message: 'Výlet byl smazán.' });
  } catch (err) {
    console.error('Delete trip error:', err);
    res.status(500).json({ error: 'Chyba při mazání výletu.' });
  }
});

// ── GET /api/trips/:id/collaborators ────────────────────────
router.get('/:id/collaborators', async (req, res) => {
  try {
    const userId = req.userId;
    const tripId = parseInt(req.params.id);

    const role = await getTripRole(tripId, userId);
    if (!role) return res.status(404).json({ error: 'Výlet nenalezen.' });

    const [rows] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.avatar_url, tc.role
       FROM trip_collaborators tc
       JOIN users u ON u.id = tc.user_id
       WHERE tc.trip_id = ?
       ORDER BY tc.created_at ASC`,
      [tripId]
    );

    res.json({ collaborators: rows });
  } catch (err) {
    console.error('Get collaborators error:', err);
    res.status(500).json({ error: 'Chyba při načítání spolupracovníků.' });
  }
});

// ── GET /api/trips/:id/balances ─────────────────────────────
// Computes the simplified "who owes whom" ledger for a trip from its
// expenses + splits. Returns trip members, each member's net balance,
// and the minimal set of settlement transactions.
router.get('/:id/balances', async (req, res) => {
  try {
    const userId = req.userId;
    const tripId = parseInt(req.params.id);

    const role = await getTripRole(tripId, userId);
    if (!role) return res.status(404).json({ error: 'Výlet nenalezen.' });

    // Trip members = owner + collaborators. bankAccount is included so the
    // Settle Up modal can show where to send money.
    const [members] = await pool.query(
      `SELECT u.id, u.first_name AS firstName, u.last_name AS lastName,
              u.email, u.avatar_url AS avatarUrl, u.bank_account AS bankAccount, 'owner' AS role
       FROM trips t JOIN users u ON u.id = t.user_id
       WHERE t.id = ?
       UNION
       SELECT u.id, u.first_name AS firstName, u.last_name AS lastName,
              u.email, u.avatar_url AS avatarUrl, u.bank_account AS bankAccount, tc.role
       FROM trip_collaborators tc JOIN users u ON u.id = tc.user_id
       WHERE tc.trip_id = ?`,
      [tripId, tripId]
    );

    const expenses = await fetchExpensesWithSplits(tripId);
    const recordedSettlements = await fetchSettlements(tripId);
    const { balances, settlements } = calculateBalances(expenses, recordedSettlements);

    // Index net balances by user for a stable, member-ordered response.
    const netByUser = new Map(balances.map((b) => [Number(b.userId), b.net]));

    res.json({
      members,
      balances: members.map((m) => ({ userId: m.id, net: netByUser.get(Number(m.id)) || 0 })),
      settlements,
    });
  } catch (err) {
    console.error('Get balances error:', err);
    res.status(500).json({ error: 'Chyba při výpočtu zůstatků.' });
  }
});

// ── POST /api/trips/:id/settle ──────────────────────────────
// Records a compensating payment from the caller (debtor) to `toUserId`
// (creditor), zeroing out that debt. Returns the receiver's bank account.
router.post('/:id/settle', async (req, res) => {
  try {
    const userId = req.userId;
    const tripId = parseInt(req.params.id);
    const { toUserId, amount, currency, locale } = req.body;

    const role = await getTripRole(tripId, userId);
    if (!role) return res.status(404).json({ error: 'Výlet nenalezen.' });

    const toId = parseInt(toUserId);
    const amt = Number(amount);
    if (!toId || !Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: 'Neplatný příjemce nebo částka.' });
    }
    if (toId === userId) {
      return res.status(400).json({ error: 'Nemůžete vyrovnat dluh sám se sebou.' });
    }

    // The receiver must also be a member of this trip.
    const receiverRole = await getTripRole(tripId, toId);
    if (!receiverRole) {
      return res.status(400).json({ error: 'Příjemce není účastníkem výletu.' });
    }

    // Record the compensating payment: caller (payer) → receiver.
    await pool.query(
      'INSERT INTO trip_settlements (trip_id, from_user_id, to_user_id, amount) VALUES (?, ?, ?, ?)',
      [tripId, userId, toId, amt]
    );

    // Fetch the receiver's contact + bank account, the payer's name, and the
    // trip name — for the response and the notification email.
    const [[receiver]] = await pool.query(
      'SELECT email, first_name AS firstName, last_name AS lastName, bank_account AS bankAccount FROM users WHERE id = ?',
      [toId]
    );
    const [[payer]] = await pool.query(
      'SELECT first_name AS firstName, last_name AS lastName FROM users WHERE id = ?',
      [userId]
    );
    const [[trip]] = await pool.query('SELECT title FROM trips WHERE id = ?', [tripId]);

    // Notify the person who was owed money (non-blocking, fire-and-forget).
    if (receiver?.email) {
      const payerName = [payer?.firstName, payer?.lastName].filter(Boolean).join(' ').trim() || 'Někdo';
      waitUntil(
        sendSettlementEmail(receiver.email, {
          payerName,
          amountLabel: formatAmountLabel(amt, currency, locale),
          tripName: trip?.title || '',
          locale,
        }).catch((err) => console.error('Settlement email error:', err))
      );
    }

    res.json({
      success: true,
      receiverBankAccount: receiver?.bankAccount || null,
    });
  } catch (err) {
    console.error('Settle error:', err);
    res.status(500).json({ error: 'Chyba při vyrovnání dluhu.' });
  }
});

// ── POST /api/trips/:id/share ───────────────────────────────
// Owner adds a friend as editor or viewer
router.post('/:id/share', async (req, res) => {
  try {
    const userId = req.userId;
    const tripId = parseInt(req.params.id);
    const { userId: targetUserId, role } = req.body;

    if (!targetUserId || !role) {
      return res.status(400).json({ error: 'userId a role jsou povinné.' });
    }
    if (!['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Role musí být editor nebo viewer.' });
    }
    if (parseInt(targetUserId) === userId) {
      return res.status(400).json({ error: 'Nemůžete sdílet výlet sami se sebou.' });
    }

    const callerRole = await getTripRole(tripId, userId);
    if (!callerRole) return res.status(404).json({ error: 'Výlet nenalezen.' });
    if (callerRole !== 'owner') return res.status(403).json({ error: 'Pouze vlastník může sdílet výlet.' });

    const [[friendship]] = await pool.query(
      `SELECT id FROM friendships
       WHERE status = 'ACCEPTED'
         AND ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?))`,
      [userId, targetUserId, targetUserId, userId]
    );
    if (!friendship) {
      return res.status(400).json({ error: 'Výlet lze sdílet pouze s přáteli.' });
    }

    await pool.query(
      `INSERT INTO trip_collaborators (trip_id, user_id, role) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE role = VALUES(role), updated_at = CURRENT_TIMESTAMP`,
      [tripId, targetUserId, role]
    );

    res.status(201).json({ message: 'Výlet byl sdílen.' });
  } catch (err) {
    console.error('Share trip error:', err);
    res.status(500).json({ error: 'Chyba při sdílení výletu.' });
  }
});

// ── PUT /api/trips/:id/share/:targetUserId ──────────────────
// Owner updates a collaborator's role
router.put('/:id/share/:targetUserId', async (req, res) => {
  try {
    const userId = req.userId;
    const tripId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.targetUserId);
    const { role } = req.body;

    if (!role || !['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Role musí být editor nebo viewer.' });
    }

    const callerRole = await getTripRole(tripId, userId);
    if (!callerRole) return res.status(404).json({ error: 'Výlet nenalezen.' });
    if (callerRole !== 'owner') return res.status(403).json({ error: 'Pouze vlastník může měnit oprávnění.' });

    const [result] = await pool.query(
      'UPDATE trip_collaborators SET role = ? WHERE trip_id = ? AND user_id = ?',
      [role, tripId, targetUserId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Spolupracovník nenalezen.' });
    }

    res.json({ message: 'Oprávnění bylo aktualizováno.' });
  } catch (err) {
    console.error('Update share error:', err);
    res.status(500).json({ error: 'Chyba při aktualizaci oprávnění.' });
  }
});

// ── DELETE /api/trips/:id/share/:targetUserId ───────────────
// Owner removes a collaborator's access
router.delete('/:id/share/:targetUserId', async (req, res) => {
  try {
    const userId = req.userId;
    const tripId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.targetUserId);

    const callerRole = await getTripRole(tripId, userId);
    if (!callerRole) return res.status(404).json({ error: 'Výlet nenalezen.' });
    if (callerRole !== 'owner') return res.status(403).json({ error: 'Pouze vlastník může odebírat přístup.' });

    const [result] = await pool.query(
      'DELETE FROM trip_collaborators WHERE trip_id = ? AND user_id = ?',
      [tripId, targetUserId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Spolupracovník nenalezen.' });
    }

    res.json({ message: 'Přístup byl odebrán.' });
  } catch (err) {
    console.error('Remove share error:', err);
    res.status(500).json({ error: 'Chyba při odebírání přístupu.' });
  }
});

// ── POST /api/trips/:id/share-link ─────────────────────────
// Owner generates a public share token
router.post('/:id/share-link', async (req, res) => {
  try {
    const userId = req.userId;
    const tripId = parseInt(req.params.id);
    const role = await getTripRole(tripId, userId);
    if (!role) return res.status(404).json({ error: 'Výlet nenalezen.' });
    if (role !== 'owner') return res.status(403).json({ error: 'Pouze vlastník může generovat odkaz.' });

    const token = randomBytes(32).toString('hex');
    await pool.query('UPDATE trips SET share_token = ? WHERE id = ?', [token, tripId]);
    res.json({ token });
  } catch (err) {
    console.error('Generate share link error:', err);
    res.status(500).json({ error: 'Chyba při generování odkazu.' });
  }
});

// ── DELETE /api/trips/:id/share-link ───────────────────────
// Owner revokes the public share token
router.delete('/:id/share-link', async (req, res) => {
  try {
    const userId = req.userId;
    const tripId = parseInt(req.params.id);
    const role = await getTripRole(tripId, userId);
    if (!role) return res.status(404).json({ error: 'Výlet nenalezen.' });
    if (role !== 'owner') return res.status(403).json({ error: 'Pouze vlastník může zrušit odkaz.' });

    await pool.query('UPDATE trips SET share_token = NULL WHERE id = ?', [tripId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Revoke share link error:', err);
    res.status(500).json({ error: 'Chyba při rušení odkazu.' });
  }
});

export default router;
