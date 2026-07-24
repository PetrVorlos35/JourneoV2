import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

// ── GET /api/cron/purge-trash ───────────────────────────────
// Hard-deletes every trip that has been sitting in the trash for more
// than 30 days (child rows cascade via foreign keys). Invoked daily by
// a Vercel Cron Job (see vercel.json), which authenticates with
// `Authorization: Bearer ${CRON_SECRET}`. Fails closed: without a
// configured CRON_SECRET the endpoint refuses to run.
router.get('/purge-trash', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const [result] = await pool.query(
      'DELETE FROM trips WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL 30 DAY'
    );

    // Při té příležitosti vyhodíme i prošlé odpovědi Nominatimu
    // (TTL 30 dní, viz lib/geocode.js) — jinak by tabulka jen rostla.
    const [geocache] = await pool.query(
      'DELETE FROM geocode_cache WHERE created_at < NOW() - INTERVAL 30 DAY'
    );

    res.json({ purged: result.affectedRows, geocachePurged: geocache.affectedRows });
  } catch (err) {
    console.error('Purge trash error:', err);
    res.status(500).json({ error: 'Purge failed' });
  }
});

export default router;
