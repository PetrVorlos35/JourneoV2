import crypto from 'node:crypto';
import pool from '../config/db.js';

// ── Zkušební režim bez registrace (hosté) ───────────────────
// Host je skutečný účet (users.is_guest = 1), jen bez e-mailu a s časem
// vypršení. Všechno v aplikaci tak funguje stejně a registrace výlety
// jen převede na nový účet (claimGuest). Viz migrace 013.

export const GUEST_TRIAL_DAYS = 3;
// Po konci zkoušky ještě den jen pro čtení (prohlížení, PDF), pak cron maže.
export const GUEST_GRACE_DAYS = 1;
export const GUEST_OWN_TRIP_LIMIT = 1;
// .invalid je rezervovaná doména (RFC 2606), na takovou adresu nic neodejde.
export const GUEST_EMAIL_DOMAIN = 'guest.journeo.invalid';
// Ukázka začne za tři týdny, ať je vidět odpočet do odjezdu.
const SAMPLE_LEAD_DAYS = 21;

export const isGuestEmail = (email) =>
  typeof email === 'string' && email.trim().toLowerCase().endsWith(`@${GUEST_EMAIL_DOMAIN}`);

export const guestEmail = () => `guest_${crypto.randomBytes(12).toString('hex')}@${GUEST_EMAIL_DOMAIN}`;

// Zbývající čas počítá databáze (NOW() i guest_expires_at jsou ve stejné
// časové zóně), klient dostane jen počet sekund.
export const GUEST_COLUMNS = `is_guest, TIMESTAMPDIFF(SECOND, NOW(), guest_expires_at) AS guest_seconds_left`;

export const guestState = (row) => {
  if (!row?.is_guest) return null;
  const secondsLeft = Number(row.guest_seconds_left) || 0;
  return {
    secondsLeft,
    readOnly: secondsLeft <= 0,
    ended: secondsLeft + GUEST_GRACE_DAYS * 86400 <= 0,
  };
};

// Pole pro klienta (GET /auth/me, POST /auth/guest).
export const guestFields = (row) => {
  const state = guestState(row);
  return state ? { is_guest: true, guest_seconds_left: state.secondsLeft } : { is_guest: false };
};

// Funkce, které potřebují identitu (přátelé, sdílení, pozvánky, heslo).
export const blockGuests = (req, res, next) => {
  if (!req.isGuest) return next();
  return res.status(403).json({
    error: 'Tohle odemkneš registrací. Ve zkušebním režimu to nejde.',
    code: 'GUEST_LOCKED',
  });
};

// Host smí mít jeden vlastní výlet (ukázka se nepočítá). Vrací true, když
// by další výlet limit překročil — volá se před založením, kopií i obnovou.
export const guestTripLimitReached = async (req, db = pool) => {
  if (!req.isGuest) return false;
  const [[row]] = await db.query(
    'SELECT COUNT(*) AS count FROM trips WHERE user_id = ? AND is_sample = 0 AND deleted_at IS NULL',
    [req.userId]
  );
  return Number(row.count) >= GUEST_OWN_TRIP_LIMIT;
};

export const guestTripLimitResponse = (res) =>
  res.status(403).json({
    error: 'Ve zkušebním režimu máš jeden vlastní výlet. Další si založíš po registraci.',
    code: 'GUEST_TRIP_LIMIT',
  });

const shiftIsoDate = (iso, days) => {
  if (!iso) return iso;
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

// Kopie ukázkového výletu (SAMPLE_TRIP_ID) pro hosta, i s výdaji a dokumenty,
// aby bylo vidět, co všechno Journeo umí. Výdaje jsou osobní (bez plátce
// a dělení — host nemá parťáky). Bez SAMPLE_TRIP_ID se ukázka prostě nevytvoří.
export const createSampleTrip = async (connection, userId) => {
  const sourceId = parseInt(process.env.SAMPLE_TRIP_ID, 10);
  if (!sourceId) return null;

  const [[source]] = await connection.query(
    `SELECT id, title, budget_target, currency,
       DATE_FORMAT(start_date, '%Y-%m-%d') AS startDate,
       DATE_FORMAT(end_date, '%Y-%m-%d') AS endDate
     FROM trips WHERE id = ? AND deleted_at IS NULL`,
    [sourceId]
  );
  if (!source) return null;

  const today = new Date().toISOString().slice(0, 10);
  const shift = Math.round(
    (new Date(`${shiftIsoDate(today, SAMPLE_LEAD_DAYS)}T00:00:00Z`) - new Date(`${source.startDate}T00:00:00Z`)) / 86400000
  );

  const [[activities], [packing], [places], [expenses], [documents]] = await Promise.all([
    connection.query(
      "SELECT day_index, DATE_FORMAT(date, '%Y-%m-%d') AS date, title, plan, location FROM trip_activities WHERE trip_id = ? ORDER BY day_index ASC",
      [source.id]
    ),
    connection.query('SELECT text, checked FROM trip_packing_items WHERE trip_id = ? ORDER BY created_at ASC', [source.id]),
    connection.query(
      `SELECT day_index, name, address, lat, lng, category, country_code, city, sort_order
       FROM trip_places WHERE trip_id = ? ORDER BY sort_order ASC, id ASC`,
      [source.id]
    ),
    connection.query(
      `SELECT description, amount, category, DATE_FORMAT(date, '%Y-%m-%d') AS date,
         original_amount, original_currency, exchange_rate, DATE_FORMAT(rate_date, '%Y-%m-%d') AS rate_date, rate_source
       FROM trip_expenses WHERE trip_id = ? ORDER BY id ASC`,
      [source.id]
    ),
    connection.query('SELECT title, content FROM trip_documents WHERE trip_id = ? ORDER BY created_at ASC', [source.id]),
  ]);

  const [result] = await connection.query(
    'INSERT INTO trips (user_id, title, start_date, end_date, currency, budget_target, is_sample) VALUES (?, ?, ?, ?, ?, ?, 1)',
    [userId, source.title, shiftIsoDate(source.startDate, shift), shiftIsoDate(source.endDate, shift), source.currency, source.budget_target]
  );
  const tripId = result.insertId;

  for (const a of activities) {
    await connection.query(
      'INSERT INTO trip_activities (trip_id, day_index, date, title, plan, location) VALUES (?, ?, ?, ?, ?, ?)',
      [tripId, a.day_index, shiftIsoDate(a.date, shift), a.title, a.plan || '', a.location || '']
    );
  }
  for (const p of packing) {
    await connection.query('INSERT INTO trip_packing_items (trip_id, text, checked) VALUES (?, ?, ?)', [tripId, p.text, p.checked ? 1 : 0]);
  }
  for (const p of places) {
    await connection.query(
      `INSERT INTO trip_places
        (user_id, trip_id, day_index, name, address, lat, lng, category, status, country_code, city, source, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'wishlist', ?, ?, 'manual', ?)`,
      [userId, tripId, p.day_index, p.name, p.address, p.lat, p.lng, p.category, p.country_code, p.city, p.sort_order]
    );
  }
  for (const e of expenses) {
    await connection.query(
      `INSERT INTO trip_expenses
        (trip_id, description, amount, category, date, paid_by, original_amount, original_currency, exchange_rate, rate_date, rate_source)
       VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?)`,
      [tripId, e.description, e.amount, e.category, shiftIsoDate(e.date, shift),
        e.original_amount, e.original_currency, e.exchange_rate, e.rate_date, e.rate_source]
    );
  }
  for (const d of documents) {
    await connection.query('INSERT INTO trip_documents (trip_id, title, content) VALUES (?, ?, ?)', [tripId, d.title, d.content]);
  }
  return tripId;
};

// Převede všechno, co host vytvořil, na skutečný účet a hosta smaže.
// Kdo už výlety měl (přihlásil se do existujícího účtu), ukázku nedostane —
// jen by mu zaneřádila seznam. Nový účet si ji nechá, mohl ji upravovat.
export const claimGuest = async (connection, guestId, userId) => {
  const [[{ owned }]] = await connection.query(
    'SELECT COUNT(*) AS owned FROM trips WHERE user_id = ? AND deleted_at IS NULL',
    [userId]
  );
  if (Number(owned) > 0) {
    await connection.query('DELETE FROM trips WHERE user_id = ? AND is_sample = 1', [guestId]);
  }
  const [moved] = await connection.query('UPDATE trips SET user_id = ? WHERE user_id = ?', [userId, guestId]);
  await connection.query('UPDATE trip_places SET user_id = ? WHERE user_id = ?', [userId, guestId]);
  await connection.query('UPDATE trip_expenses SET paid_by = ? WHERE paid_by = ?', [userId, guestId]);
  await connection.query('UPDATE expense_splits SET user_id = ? WHERE user_id = ?', [userId, guestId]);
  await connection.query('UPDATE trip_settlements SET from_user_id = ? WHERE from_user_id = ?', [userId, guestId]);
  await connection.query('UPDATE trip_settlements SET to_user_id = ? WHERE to_user_id = ?', [userId, guestId]);
  // Lajky: unikátní (user, trip) — duplicitní zůstanou u hosta a smažou se s ním.
  await connection.query('UPDATE IGNORE votes SET user_id = ? WHERE user_id = ?', [userId, guestId]);
  // Analytika: časová osa uživatele začne už zkouškou.
  await connection.query('UPDATE analytics_events SET user_id = ? WHERE user_id = ?', [userId, guestId]);
  await connection.query('DELETE FROM users WHERE id = ? AND is_guest = 1', [guestId]);
  return moved.affectedRows;
};
