import { Router } from 'express';
import pool from '../config/db.js';

// Admin: vlastní analytika (analytics_events) a hlídání chyb (app_errors).
// Montuje se pod /api/admin, takže adminAuth už proběhl.
const router = Router();

// Admini do statistik nepatří — jinak by Petrovo klikání přebilo uživatele.
const NOT_ADMIN = `(e.user_id IS NULL OR e.user_id NOT IN (SELECT id FROM users WHERE role = 'admin'))`;
const ENVS = ['production', 'preview', 'development'];

const parseRange = (req) => {
  const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
  const env = ENVS.includes(req.query.env) ? req.query.env : 'production';
  return { days, env };
};

const num = (v) => Number(v) || 0;

// Souvislá řada dní (i prázdné dny = 0). „Dnes“ bere z DB (CURDATE), aby
// hranice dní seděly s DATE(created_at) v časové zóně databáze.
const dayKeys = (today, days, offset = 0) => {
  const [y, m, d] = today.split('-').map(Number);
  const out = [];
  for (let i = days - 1 + offset; i >= offset; i--) {
    out.push(new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10));
  }
  return out;
};

// ── GET /api/admin/analytics?days=30&env=production ─────────
router.get('/analytics', async (req, res) => {
  const { days, env } = parseRange(req);
  const range = `e.env = ? AND e.created_at >= CURDATE() - INTERVAL ? DAY`;
  const args = [env, days - 1];

  try {
    const [
      [dailyRows],
      [activeRows],
      [pageRows],
      [referrerRows],
      [utmRows],
      [deviceRows],
      [countryRows],
      [eventRows],
      [funnelVisitRows],
      [cohortRows],
      [[{ today }]],
    ] = await Promise.all([
      // Denní řada pro aktuální i předchozí období (kvůli srovnání).
      pool.query(
        `SELECT DATE_FORMAT(e.created_at, '%Y-%m-%d') AS day,
                COUNT(DISTINCT CASE WHEN e.name = 'pageview' THEN e.visitor_id END) AS visitors,
                SUM(e.name = 'pageview') AS pageviews,
                COUNT(DISTINCT e.user_id) AS activeUsers,
                SUM(e.name = 'signup') AS signups,
                SUM(e.name = 'trip_created') AS trips
         FROM analytics_events e
         WHERE e.env = ? AND e.created_at >= CURDATE() - INTERVAL ? DAY AND ${NOT_ADMIN}
         GROUP BY day`,
        [env, days * 2 - 1]
      ),
      // Unikátní aktivní uživatelé za celé období a za předchozí.
      pool.query(
        `SELECT
           COUNT(DISTINCT CASE WHEN e.created_at >= CURDATE() - INTERVAL ? DAY THEN e.user_id END) AS current,
           COUNT(DISTINCT CASE WHEN e.created_at < CURDATE() - INTERVAL ? DAY THEN e.user_id END) AS previous
         FROM analytics_events e
         WHERE e.env = ? AND e.created_at >= CURDATE() - INTERVAL ? DAY AND e.user_id IS NOT NULL AND ${NOT_ADMIN}`,
        [days - 1, days - 1, env, days * 2 - 1]
      ),
      pool.query(
        `SELECT e.path, COUNT(*) AS views, COUNT(DISTINCT e.visitor_id) AS visitors
         FROM analytics_events e
         WHERE ${range} AND e.name = 'pageview' AND e.path IS NOT NULL AND ${NOT_ADMIN}
         GROUP BY e.path ORDER BY visitors DESC, views DESC LIMIT 12`,
        args
      ),
      pool.query(
        `SELECT e.referrer_host AS label, COUNT(DISTINCT e.visitor_id) AS visitors
         FROM analytics_events e
         WHERE ${range} AND e.name = 'pageview' AND e.referrer_host IS NOT NULL AND ${NOT_ADMIN}
         GROUP BY label ORDER BY visitors DESC LIMIT 8`,
        args
      ),
      pool.query(
        `SELECT CONCAT_WS(' / ', e.utm_source, e.utm_medium, e.utm_campaign) AS label, COUNT(DISTINCT e.visitor_id) AS visitors
         FROM analytics_events e
         WHERE ${range} AND e.name = 'pageview' AND e.utm_source IS NOT NULL AND ${NOT_ADMIN}
         GROUP BY label ORDER BY visitors DESC LIMIT 8`,
        args
      ),
      pool.query(
        `SELECT CONCAT(e.device, IF(e.standalone, ' · PWA', '')) AS label, COUNT(DISTINCT e.visitor_id) AS visitors
         FROM analytics_events e
         WHERE ${range} AND e.name = 'pageview' AND e.device IS NOT NULL AND ${NOT_ADMIN}
         GROUP BY label ORDER BY visitors DESC`,
        args
      ),
      pool.query(
        `SELECT e.country AS label, COUNT(DISTINCT e.visitor_id) AS visitors
         FROM analytics_events e
         WHERE ${range} AND e.name = 'pageview' AND e.country IS NOT NULL AND ${NOT_ADMIN}
         GROUP BY label ORDER BY visitors DESC LIMIT 8`,
        args
      ),
      // Používání funkcí: každá akce kromě zobrazení stránky.
      pool.query(
        `SELECT e.name, COUNT(*) AS count, COUNT(DISTINCT e.user_id) AS users
         FROM analytics_events e
         WHERE ${range} AND e.name <> 'pageview' AND ${NOT_ADMIN}
         GROUP BY e.name ORDER BY count DESC`,
        args
      ),
      // Funnel návštěvník → přihlášení (návštěvník = hash za den).
      pool.query(
        `SELECT
           COUNT(DISTINCT CONCAT(DATE(e.created_at), e.visitor_id)) AS visited,
           COUNT(DISTINCT CASE WHEN e.path = '/' THEN CONCAT(DATE(e.created_at), e.visitor_id) END) AS landing,
           COUNT(DISTINCT CASE WHEN e.path = '/auth' THEN CONCAT(DATE(e.created_at), e.visitor_id) END) AS auth
         FROM analytics_events e
         WHERE ${range} AND e.name = 'pageview' AND ${NOT_ADMIN}`,
        args
      ),
      // Noví uživatelé v období a co s aplikací udělali (z dat aplikace,
      // takže to platí i pro účty starší než sběr událostí).
      pool.query(
        `SELECT
           COUNT(*) AS signedUp,
           SUM(EXISTS (SELECT 1 FROM trips t WHERE t.user_id = u.id)
               OR EXISTS (SELECT 1 FROM trip_collaborators c WHERE c.user_id = u.id)) AS hasTrip,
           SUM(EXISTS (
             SELECT 1 FROM trips t
             WHERE t.user_id = u.id AND (
               EXISTS (SELECT 1 FROM trip_activities a WHERE a.trip_id = t.id)
               OR EXISTS (SELECT 1 FROM trip_places p WHERE p.trip_id = t.id)
               OR EXISTS (SELECT 1 FROM trip_expenses x WHERE x.trip_id = t.id)
             )
           )) AS hasContent,
           SUM(EXISTS (
             SELECT 1 FROM trips t JOIN trip_collaborators c ON c.trip_id = t.id WHERE t.user_id = u.id
           )) AS invited,
           SUM(EXISTS (
             SELECT 1 FROM analytics_events e
             WHERE e.user_id = u.id AND DATE(e.created_at) > DATE(u.created_at)
           )) AS returned
         FROM users u
         WHERE u.role <> 'admin' AND u.is_verified = 1 AND u.created_at >= CURDATE() - INTERVAL ? DAY`,
        [days - 1]
      ),
      pool.query(`SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today`),
    ]);

    const byDay = new Map(dailyRows.map((r) => [r.day, r]));
    const series = (keys) =>
      keys.map((day) => {
        const r = byDay.get(day) || {};
        return {
          day,
          visitors: num(r.visitors),
          pageviews: num(r.pageviews),
          activeUsers: num(r.activeUsers),
          signups: num(r.signups),
          trips: num(r.trips),
        };
      });
    const current = series(dayKeys(today, days));
    const previous = series(dayKeys(today, days, days));
    const sum = (rows, key) => rows.reduce((acc, r) => acc + r[key], 0);
    const total = (key) => ({ current: sum(current, key), previous: sum(previous, key) });

    const visit = funnelVisitRows[0] || {};
    const cohort = cohortRows[0] || {};

    res.json({
      analytics: {
        days,
        env,
        summary: {
          visitors: total('visitors'),
          pageviews: total('pageviews'),
          activeUsers: { current: num(activeRows[0]?.current), previous: num(activeRows[0]?.previous) },
          signups: total('signups'),
          trips: total('trips'),
        },
        daily: current,
        funnel: {
          visitors: [
            { key: 'visited', value: num(visit.visited) },
            { key: 'landing', value: num(visit.landing) },
            { key: 'auth', value: num(visit.auth) },
            { key: 'signup', value: sum(current, 'signups') },
          ],
          newUsers: [
            { key: 'signedUp', value: num(cohort.signedUp) },
            { key: 'hasTrip', value: num(cohort.hasTrip) },
            { key: 'hasContent', value: num(cohort.hasContent) },
            { key: 'invited', value: num(cohort.invited) },
            { key: 'returned', value: num(cohort.returned) },
          ],
        },
        pages: pageRows.map((r) => ({ label: r.path, value: num(r.visitors), views: num(r.views) })),
        referrers: referrerRows.map((r) => ({ label: r.label, value: num(r.visitors) })),
        utm: utmRows.map((r) => ({ label: r.label, value: num(r.visitors) })),
        devices: deviceRows.map((r) => ({ label: r.label, value: num(r.visitors) })),
        countries: countryRows.map((r) => ({ label: r.label, value: num(r.visitors) })),
        events: eventRows.map((r) => ({ name: r.name, count: num(r.count), users: num(r.users) })),
      },
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    res.status(500).json({ error: 'Chyba při načítání analytiky.' });
  }
});

const shapeEvent = (r) => ({
  id: String(r.id),
  createdAt: r.created_at,
  name: r.name,
  path: r.path,
  device: r.device,
  standalone: !!r.standalone,
  country: r.country,
  referrer: r.referrer_host,
  props: typeof r.props === 'string' ? JSON.parse(r.props) : r.props,
  user: r.user_id
    ? { id: r.user_id, email: r.email, firstName: r.first_name, lastName: r.last_name, avatarUrl: r.avatar_url }
    : null,
});

// ── GET /api/admin/analytics/live?env=production ────────────
// Posledních 50 událostí, nejnovější nahoře.
router.get('/analytics/live', async (req, res) => {
  const { env } = parseRange(req);
  try {
    const [rows] = await pool.query(
      `SELECT e.*, u.email, u.first_name, u.last_name, u.avatar_url
       FROM analytics_events e
       LEFT JOIN users u ON u.id = e.user_id
       WHERE e.env = ? AND ${NOT_ADMIN}
       ORDER BY e.created_at DESC, e.id DESC LIMIT 50`,
      [env]
    );
    res.json({ events: rows.map(shapeEvent) });
  } catch (err) {
    console.error('Admin analytics live error:', err);
    res.status(500).json({ error: 'Chyba při načítání událostí.' });
  }
});

// ── GET /api/admin/users/:id/activity ───────────────────────
// Časová osa jednoho uživatele (všechna prostředí, ať je vidět i test).
router.get('/users/:id/activity', async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    const [[rows], [[stats]]] = await Promise.all([
      pool.query(
        `SELECT e.*, NULL AS email, NULL AS first_name, NULL AS last_name, NULL AS avatar_url
         FROM analytics_events e WHERE e.user_id = ? ORDER BY e.created_at DESC, e.id DESC LIMIT 60`,
        [userId]
      ),
      pool.query(
        `SELECT MAX(created_at) AS lastSeen,
                COUNT(DISTINCT DATE(created_at)) AS activeDays,
                SUM(name = 'pageview') AS pageviews
         FROM analytics_events WHERE user_id = ?`,
        [userId]
      ),
    ]);
    res.json({
      activity: {
        lastSeen: stats?.lastSeen || null,
        activeDays: num(stats?.activeDays),
        pageviews: num(stats?.pageviews),
        events: rows.map(shapeEvent),
      },
    });
  } catch (err) {
    console.error('Admin user activity error:', err);
    res.status(500).json({ error: 'Chyba při načítání aktivity.' });
  }
});

// ── GET /api/admin/errors?status=open|resolved&env=production ──
router.get('/errors', async (req, res) => {
  const { env } = parseRange(req);
  const resolved = req.query.status === 'resolved';
  try {
    const [[rows], [[counts]]] = await Promise.all([
      pool.query(
        `SELECT a.*, u.email, u.first_name, u.last_name
         FROM app_errors a
         LEFT JOIN users u ON u.id = a.last_user_id
         WHERE a.env = ? AND a.resolved_at IS ${resolved ? 'NOT NULL' : 'NULL'}
         ORDER BY a.last_seen DESC LIMIT 100`,
        [env]
      ),
      pool.query(
        `SELECT SUM(resolved_at IS NULL) AS open,
                SUM(resolved_at IS NULL AND last_seen >= NOW() - INTERVAL 1 DAY) AS last24h
         FROM app_errors WHERE env = ?`,
        [env]
      ),
    ]);
    res.json({
      open: num(counts?.open),
      last24h: num(counts?.last24h),
      errors: rows.map((r) => ({
        id: r.id,
        source: r.source,
        message: r.message,
        stack: r.stack,
        path: r.path,
        method: r.method,
        count: r.count,
        usersAffected: r.users_affected,
        userAgent: r.user_agent,
        firstSeen: r.first_seen,
        lastSeen: r.last_seen,
        resolvedAt: r.resolved_at,
        lastUser: r.last_user_id
          ? { id: r.last_user_id, email: r.email, firstName: r.first_name, lastName: r.last_name }
          : null,
      })),
    });
  } catch (err) {
    console.error('Admin errors list error:', err);
    res.status(500).json({ error: 'Chyba při načítání chyb.' });
  }
});

// ── PUT /api/admin/errors/:id  { resolved: true|false } ─────
// Vyřešená chyba se sama znovu otevře, jakmile se objeví znovu.
router.put('/errors/:id', async (req, res) => {
  const resolved = req.body?.resolved !== false;
  try {
    await pool.query(
      `UPDATE app_errors SET resolved_at = ${resolved ? 'CURRENT_TIMESTAMP' : 'NULL'} WHERE id = ?`,
      [parseInt(req.params.id)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin error resolve error:', err);
    res.status(500).json({ error: 'Chybu se nepodařilo upravit.' });
  }
});

export default router;
