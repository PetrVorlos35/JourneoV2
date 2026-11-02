import pool from '../config/db.js';
import { sendTripReminderEmail } from './mailer.js';

// ── Připomínka 3 dny před odjezdem ──────────────────────────
// Denní cron vybere výlety, které začínají za REMINDER_DAYS dní, a pošle
// vlastníkovi i parťákům, co ještě zbývá (balení, program, dokumenty).
// Hosté, neověřené účty a kdo si připomínky vypnul, nic nedostanou.
// trip_reminders zaručí jednu připomínku na výlet a člověka (viz migrace 014).

export const REMINDER_DAYS = 3;
const KIND = `before_${REMINDER_DAYS}d`;
const SEND_CONCURRENCY = 3;

export const findDueReminders = async (db = pool) => {
  const [rows] = await db.query(
    `SELECT t.id AS tripId, t.title, u.id AS userId, u.email, u.first_name AS firstName,
            COALESCE(us.language, 'cs') AS language,
            DATEDIFF(t.end_date, t.start_date) + 1 AS daysTotal,
            (SELECT COUNT(*) FROM trip_activities a WHERE a.trip_id = t.id AND TRIM(COALESCE(a.plan, '')) <> '') AS daysPlanned,
            (SELECT COUNT(*) FROM trip_packing_items p WHERE p.trip_id = t.id) AS packingTotal,
            (SELECT COUNT(*) FROM trip_packing_items p WHERE p.trip_id = t.id AND p.checked = 0) AS packingLeft,
            (SELECT COUNT(*) FROM trip_documents d WHERE d.trip_id = t.id) AS documents
     FROM trips t
     JOIN (
       SELECT id AS trip_id, user_id FROM trips
       UNION
       SELECT trip_id, user_id FROM trip_collaborators
     ) m ON m.trip_id = t.id
     JOIN users u ON u.id = m.user_id
     LEFT JOIN user_settings us ON us.user_id = u.id
     WHERE t.start_date = CURDATE() + INTERVAL ? DAY
       AND t.deleted_at IS NULL
       AND t.is_sample = 0
       AND u.is_guest = 0
       AND u.is_verified = 1
       AND COALESCE(us.email_trip_reminders, 1) = 1
       AND NOT EXISTS (
         SELECT 1 FROM trip_reminders r WHERE r.trip_id = t.id AND r.user_id = u.id AND r.kind = ?
       )
     ORDER BY t.id, u.id
     LIMIT 500`,
    [REMINDER_DAYS, KIND]
  );
  return rows;
};

// Nejdřív zápis do trip_reminders (INSERT IGNORE), teprve pak e-mail: dva
// souběžné běhy cronu tak stejnou připomínku nepošlou dvakrát. Když e-mail
// selže, záznam smažeme, ať to zkusí další běh téhož dne.
const sendOne = async (row, db) => {
  const [claim] = await db.query(
    'INSERT IGNORE INTO trip_reminders (trip_id, user_id, kind) VALUES (?, ?, ?)',
    [row.tripId, row.userId, KIND]
  );
  if (claim.affectedRows === 0) return 'skipped';
  try {
    await sendTripReminderEmail(row.email, {
      firstName: row.firstName,
      tripName: row.title,
      tripId: row.tripId,
      daysLeft: REMINDER_DAYS,
      locale: row.language,
      readiness: {
        daysTotal: Number(row.daysTotal) || 0,
        daysPlanned: Math.min(Number(row.daysPlanned) || 0, Number(row.daysTotal) || 0),
        packingTotal: Number(row.packingTotal) || 0,
        packingLeft: Number(row.packingLeft) || 0,
        documents: Number(row.documents) || 0,
      },
    });
    return 'sent';
  } catch (err) {
    await db.query('DELETE FROM trip_reminders WHERE trip_id = ? AND user_id = ? AND kind = ?', [row.tripId, row.userId, KIND]);
    console.error('Trip reminder email error:', err);
    return 'failed';
  }
};

export const sendDueReminders = async (db = pool) => {
  const rows = await findDueReminders(db);
  const result = { due: rows.length, sent: 0, failed: 0, skipped: 0 };
  for (let i = 0; i < rows.length; i += SEND_CONCURRENCY) {
    const outcomes = await Promise.all(rows.slice(i, i + SEND_CONCURRENCY).map((row) => sendOne(row, db)));
    for (const o of outcomes) result[o] += 1;
  }
  return result;
};
