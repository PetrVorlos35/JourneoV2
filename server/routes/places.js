import { Router } from 'express';
import pool from '../config/db.js';
import { getTripRole } from '../lib/tripAccess.js';
import { geocodeOne } from '../lib/geocode.js';

const router = Router();

const CATEGORIES = ['sight', 'food', 'stay', 'nature', 'activity', 'transport', 'other'];
const STATUSES = ['wishlist', 'visited'];
const SOURCES = ['manual', 'search', 'gps', 'itinerary'];

// Kolik nových míst zvládne jeden import z itineráře. Nominatim smí
// dostat 1 dotaz/s, takže bez stropu by dlouhý výlet request natáhl
// na minuty. Zbytek si klient doimportuje dalším voláním.
const IMPORT_BATCH_LIMIT = 30;

const shapePlace = (row) => ({
  id: row.id.toString(),
  tripId: row.trip_id != null ? row.trip_id.toString() : null,
  tripTitle: row.tripTitle ?? null,
  dayIndex: row.day_index != null ? row.day_index : null,
  name: row.name,
  address: row.address,
  lat: parseFloat(row.lat),
  lng: parseFloat(row.lng),
  category: row.category,
  status: row.status,
  note: row.note,
  countryCode: row.country_code,
  city: row.city,
  source: row.source,
  createdAt: row.created_at,
});

// Ověří vstup pro zápis místa. Vrací { error } nebo normalizovaná data.
const validatePlaceInput = (body, { partial = false } = {}) => {
  const out = {};

  if (body.name !== undefined || !partial) {
    const name = String(body.name ?? '').trim();
    if (!name) return { error: 'Název místa je povinný.' };
    if (name.length > 255) return { error: 'Název místa je příliš dlouhý.' };
    out.name = name;
  }

  if (body.lat !== undefined || !partial) {
    const lat = Number(body.lat);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) return { error: 'Neplatná zeměpisná šířka.' };
    out.lat = lat;
  }

  if (body.lng !== undefined || !partial) {
    const lng = Number(body.lng);
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) return { error: 'Neplatná zeměpisná délka.' };
    out.lng = lng;
  }

  if (body.category !== undefined) {
    if (!CATEGORIES.includes(body.category)) return { error: 'Neplatná kategorie.' };
    out.category = body.category;
  }

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return { error: 'Neplatný stav místa.' };
    out.status = body.status;
  }

  if (body.source !== undefined) {
    if (!SOURCES.includes(body.source)) return { error: 'Neplatný zdroj místa.' };
    out.source = body.source;
  }

  if (body.address !== undefined) {
    out.address = body.address ? String(body.address).slice(0, 500) : null;
  }
  if (body.note !== undefined) {
    out.note = body.note ? String(body.note).slice(0, 2000) : null;
  }
  if (body.countryCode !== undefined) {
    out.countryCode = body.countryCode ? String(body.countryCode).toUpperCase().slice(0, 2) : null;
  }
  if (body.city !== undefined) {
    out.city = body.city ? String(body.city).slice(0, 120) : null;
  }
  if (body.dayIndex !== undefined) {
    if (body.dayIndex === null || body.dayIndex === '') {
      out.dayIndex = null;
    } else {
      const dayIndex = parseInt(body.dayIndex);
      if (!Number.isInteger(dayIndex) || dayIndex < 0) return { error: 'Neplatný den výletu.' };
      out.dayIndex = dayIndex;
    }
  }

  return { data: out };
};

// Smí uživatel do daného výletu zapisovat? Vrací null při OK,
// jinak { status, error } připravené k odeslání.
const assertTripWritable = async (tripId, userId) => {
  const role = await getTripRole(tripId, userId);
  if (!role) return { status: 404, error: 'Výlet nenalezen.' };
  if (role === 'viewer') return { status: 403, error: 'Nemáte oprávnění upravovat tento výlet.' };
  return null;
};

// Načte místo a ověří, že s ním volající smí pracovat.
// Místo bez výletu patří výhradně svému autorovi; místo ve výletu
// řídí role ve výletu (viewer smí jen číst).
const loadWritablePlace = async (placeId, userId) => {
  const [[place]] = await pool.query('SELECT * FROM trip_places WHERE id = ?', [placeId]);
  if (!place) return { error: { status: 404, error: 'Místo nenalezeno.' } };

  if (place.trip_id == null) {
    if (place.user_id !== userId) return { error: { status: 404, error: 'Místo nenalezeno.' } };
    return { place };
  }

  const denied = await assertTripWritable(place.trip_id, userId);
  if (denied) return { error: denied };
  return { place };
};

// ── GET /api/places ─────────────────────────────────────────
// Všechna místa, na která má uživatel nárok: vlastní místa mimo výlety
// + místa výletů, kde je vlastníkem nebo spolupracovníkem. Výlety v koši
// (deleted_at) se nezobrazují — obnovením se místa zase vrátí.
// Filtry: ?tripId= &status= &category=
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const params = [userId, userId, userId];
    let where = `(
      (p.trip_id IS NULL AND p.user_id = ?)
      OR (p.trip_id IS NOT NULL AND t.deleted_at IS NULL AND (
        t.user_id = ?
        OR EXISTS (SELECT 1 FROM trip_collaborators tc WHERE tc.trip_id = t.id AND tc.user_id = ?)
      ))
    )`;

    if (req.query.tripId) {
      where += ' AND p.trip_id = ?';
      params.push(parseInt(req.query.tripId));
    }
    if (req.query.status && STATUSES.includes(req.query.status)) {
      where += ' AND p.status = ?';
      params.push(req.query.status);
    }
    if (req.query.category && CATEGORIES.includes(req.query.category)) {
      where += ' AND p.category = ?';
      params.push(req.query.category);
    }

    const [rows] = await pool.query(
      `SELECT p.*, t.title AS tripTitle
       FROM trip_places p
       LEFT JOIN trips t ON t.id = p.trip_id
       WHERE ${where}
       ORDER BY p.trip_id IS NULL, p.trip_id, p.day_index IS NULL, p.day_index, p.sort_order, p.created_at`,
      params
    );

    res.json({ places: rows.map(shapePlace) });
  } catch (err) {
    console.error('Get places error:', err);
    res.status(500).json({ error: 'Chyba při načítání míst.' });
  }
});

// ── GET /api/places/stats ───────────────────────────────────
// Podklad pro stránku Statistiky. Země a města počítáme jen z míst
// označených jako navštívená — wishlist není „byl jsem tam“.
// Musí být nad GET /:id-like routami, ať se 'stats' nebere jako id.
router.get('/stats', async (req, res) => {
  try {
    const userId = req.userId;
    const visibility = `
      FROM trip_places p
      LEFT JOIN trips t ON t.id = p.trip_id
      WHERE (
        (p.trip_id IS NULL AND p.user_id = ?)
        OR (p.trip_id IS NOT NULL AND t.deleted_at IS NULL AND (
          t.user_id = ?
          OR EXISTS (SELECT 1 FROM trip_collaborators tc WHERE tc.trip_id = t.id AND tc.user_id = ?)
        ))
      )`;
    const params = [userId, userId, userId];

    const [[[totals]], [countries]] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*) AS placeCount,
           SUM(p.status = 'visited') AS visitedCount,
           SUM(p.status = 'wishlist') AS wishlistCount,
           COUNT(DISTINCT IF(p.status = 'visited', p.country_code, NULL)) AS countryCount,
           COUNT(DISTINCT IF(p.status = 'visited', p.city, NULL)) AS cityCount
         ${visibility}`,
        params
      ),
      pool.query(
        `SELECT p.country_code AS code, COUNT(*) AS count
         ${visibility} AND p.status = 'visited' AND p.country_code IS NOT NULL
         GROUP BY p.country_code
         ORDER BY count DESC, code ASC`,
        params
      ),
    ]);

    res.json({
      placeCount: Number(totals.placeCount) || 0,
      visitedCount: Number(totals.visitedCount) || 0,
      wishlistCount: Number(totals.wishlistCount) || 0,
      countryCount: Number(totals.countryCount) || 0,
      cityCount: Number(totals.cityCount) || 0,
      countries: countries.map((c) => ({ code: c.code, count: Number(c.count) })),
    });
  } catch (err) {
    console.error('Place stats error:', err);
    res.status(500).json({ error: 'Chyba při načítání statistik míst.' });
  }
});

// ── POST /api/places ────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { error, data } = validatePlaceInput(req.body);
    if (error) return res.status(400).json({ error });

    let tripId = null;
    if (req.body.tripId != null && req.body.tripId !== '') {
      tripId = parseInt(req.body.tripId);
      if (!Number.isInteger(tripId)) return res.status(400).json({ error: 'Neplatný výlet.' });
      const denied = await assertTripWritable(tripId, userId);
      if (denied) return res.status(denied.status).json({ error: denied.error });
    }

    const [result] = await pool.query(
      `INSERT INTO trip_places
        (user_id, trip_id, day_index, name, address, lat, lng, category, status, note, country_code, city, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        tripId,
        data.dayIndex ?? null,
        data.name,
        data.address ?? null,
        data.lat,
        data.lng,
        data.category ?? 'other',
        data.status ?? 'wishlist',
        data.note ?? null,
        data.countryCode ?? null,
        data.city ?? null,
        data.source ?? 'manual',
      ]
    );

    const [[row]] = await pool.query(
      `SELECT p.*, t.title AS tripTitle FROM trip_places p
       LEFT JOIN trips t ON t.id = p.trip_id WHERE p.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ place: shapePlace(row) });
  } catch (err) {
    console.error('Create place error:', err);
    res.status(500).json({ error: 'Chyba při ukládání místa.' });
  }
});

// ── PUT /api/places/:id ─────────────────────────────────────
// Částečná aktualizace — mění se jen pole poslaná v těle.
router.put('/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const placeId = parseInt(req.params.id);
    if (!Number.isInteger(placeId)) return res.status(400).json({ error: 'Neplatné id místa.' });

    const { place, error: accessError } = await loadWritablePlace(placeId, userId);
    if (accessError) return res.status(accessError.status).json({ error: accessError.error });

    const { error, data } = validatePlaceInput(req.body, { partial: true });
    if (error) return res.status(400).json({ error });

    // Přesun místa mezi výlety (nebo mimo výlet) — cíl musí být zapisovatelný.
    let tripClause = '';
    const tripParams = [];
    if (req.body.tripId !== undefined) {
      if (req.body.tripId === null || req.body.tripId === '') {
        // Odpojení od výletu smí jen autor místa, jinak by cizí místo
        // zmizelo majiteli výletu z mapy do soukromé sbírky.
        if (place.user_id !== userId) {
          return res.status(403).json({ error: 'Místo může od výletu odpojit jen jeho autor.' });
        }
        tripClause = ', trip_id = NULL, day_index = NULL';
      } else {
        const targetTripId = parseInt(req.body.tripId);
        if (!Number.isInteger(targetTripId)) return res.status(400).json({ error: 'Neplatný výlet.' });
        const denied = await assertTripWritable(targetTripId, userId);
        if (denied) return res.status(denied.status).json({ error: denied.error });
        tripClause = ', trip_id = ?';
        tripParams.push(targetTripId);
      }
    }

    const columns = {
      name: 'name',
      address: 'address',
      lat: 'lat',
      lng: 'lng',
      category: 'category',
      status: 'status',
      note: 'note',
      countryCode: 'country_code',
      city: 'city',
      dayIndex: 'day_index',
      source: 'source',
    };

    const sets = [];
    const params = [];
    for (const [key, column] of Object.entries(columns)) {
      if (data[key] !== undefined) {
        sets.push(`${column} = ?`);
        params.push(data[key]);
      }
    }

    if (sets.length === 0 && !tripClause) {
      return res.status(400).json({ error: 'Není co upravit.' });
    }

    await pool.query(
      `UPDATE trip_places SET ${sets.join(', ') || 'id = id'}${tripClause} WHERE id = ?`,
      [...params, ...tripParams, placeId]
    );

    const [[row]] = await pool.query(
      `SELECT p.*, t.title AS tripTitle FROM trip_places p
       LEFT JOIN trips t ON t.id = p.trip_id WHERE p.id = ?`,
      [placeId]
    );

    res.json({ place: shapePlace(row) });
  } catch (err) {
    console.error('Update place error:', err);
    res.status(500).json({ error: 'Chyba při úpravě místa.' });
  }
});

// ── DELETE /api/places/:id ──────────────────────────────────
// Tvrdé smazání — místa jsou levná, koš na ně neděláme.
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const placeId = parseInt(req.params.id);
    if (!Number.isInteger(placeId)) return res.status(400).json({ error: 'Neplatné id místa.' });

    const { error: accessError } = await loadWritablePlace(placeId, userId);
    if (accessError) return res.status(accessError.status).json({ error: accessError.error });

    await pool.query('DELETE FROM trip_places WHERE id = ?', [placeId]);
    res.json({ message: 'Místo bylo smazáno.' });
  } catch (err) {
    console.error('Delete place error:', err);
    res.status(500).json({ error: 'Chyba při mazání místa.' });
  }
});

// ── POST /api/places/import-itinerary/:tripId ───────────────
// Geokóduje textové lokace u dnů výletu a založí z nich místa.
// Idempotentní: den, který už má importované místo, přeskočí — takže
// se dá volat opakovaně (a je potřeba, když dojde dávkový limit).
router.post('/import-itinerary/:tripId', async (req, res) => {
  try {
    const userId = req.userId;
    const tripId = parseInt(req.params.tripId);
    if (!Number.isInteger(tripId)) return res.status(400).json({ error: 'Neplatný výlet.' });

    const denied = await assertTripWritable(tripId, userId);
    if (denied) return res.status(denied.status).json({ error: denied.error });

    const lang = String(req.body?.lang || 'cs').startsWith('en') ? 'en' : 'cs';

    const [activities] = await pool.query(
      `SELECT day_index AS dayIndex, location FROM trip_activities
       WHERE trip_id = ? AND location IS NOT NULL AND location != ''
       ORDER BY day_index ASC`,
      [tripId]
    );

    const [existing] = await pool.query(
      `SELECT day_index AS dayIndex FROM trip_places
       WHERE trip_id = ? AND source = 'itinerary' AND day_index IS NOT NULL`,
      [tripId]
    );
    const alreadyImported = new Set(existing.map((r) => r.dayIndex));

    const pending = activities.filter((a) => !alreadyImported.has(a.dayIndex));
    const batch = pending.slice(0, IMPORT_BATCH_LIMIT);

    // Stejná lokace u víc dnů se geokóduje jen jednou.
    const geocoded = new Map();
    let imported = 0;
    let failed = 0;

    for (const activity of batch) {
      const key = activity.location.trim().toLowerCase();
      if (!geocoded.has(key)) {
        geocoded.set(key, await geocodeOne(activity.location.trim(), lang));
      }
      const hit = geocoded.get(key);

      if (!hit) {
        failed += 1;
        continue;
      }

      await pool.query(
        `INSERT INTO trip_places
          (user_id, trip_id, day_index, name, address, lat, lng, category, status, country_code, city, source, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'other', 'visited', ?, ?, 'itinerary', ?)`,
        [
          userId,
          tripId,
          activity.dayIndex,
          hit.name,
          hit.address,
          hit.lat,
          hit.lng,
          hit.countryCode,
          hit.city,
          activity.dayIndex,
        ]
      );
      imported += 1;
    }

    res.json({
      imported,
      failed,
      skipped: activities.length - pending.length,
      remaining: Math.max(0, pending.length - batch.length),
    });
  } catch (err) {
    console.error('Import itinerary places error:', err);
    res.status(500).json({ error: 'Chyba při načítání míst z itineráře.' });
  }
});

export default router;
