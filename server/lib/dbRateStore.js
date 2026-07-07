import pool from '../config/db.js';

// ============================================================
// DB-backed store pro express-rate-limit.
//
// In-memory počítadla nejsou na Vercelu sdílená mezi warm
// lambdami — limit se tak násobí počtem instancí. Tenhle store
// počítá zásahy v tabulce `rate_limits` (viz migrace 003),
// takže limit platí globálně, stejně jako DB cooldown na OTP.
//
// Při výpadku DB propouštíme (fail open) — rate limiting nesmí
// položit celé API, a auth endpointy bez DB stejně nefungují.
// ============================================================

export default class DbRateStore {
  // Klíče jsou sdílené napříč instancemi (express-rate-limit podle
  // toho vynechává per-instance optimalizace).
  localKeys = false;

  constructor(prefix) {
    this.prefix = prefix;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  key(ip) {
    return `${this.prefix}:${ip}`;
  }

  async increment(ip) {
    const windowSeconds = Math.ceil(this.windowMs / 1000);
    const rlKey = this.key(ip);
    try {
      // Atomický upsert: po vypršení okna začíná nové počítadlo od 1,
      // jinak se přičte zásah a reset_at zůstává.
      await pool.query(
        `INSERT INTO rate_limits (rl_key, hits, reset_at)
         VALUES (?, 1, DATE_ADD(NOW(), INTERVAL ? SECOND))
         ON DUPLICATE KEY UPDATE
           hits = IF(reset_at <= NOW(), 1, hits + 1),
           reset_at = IF(reset_at <= NOW(), DATE_ADD(NOW(), INTERVAL ? SECOND), reset_at)`,
        [rlKey, windowSeconds, windowSeconds]
      );
      const [rows] = await pool.query(
        'SELECT hits, reset_at FROM rate_limits WHERE rl_key = ?',
        [rlKey]
      );

      // Občasný úklid dávno vypršelých oken, ať tabulka neroste donekonečna.
      if (Math.random() < 0.01) {
        pool.query('DELETE FROM rate_limits WHERE reset_at < NOW() - INTERVAL 1 DAY').catch(() => {});
      }

      return {
        totalHits: rows[0]?.hits ?? 1,
        resetTime: rows[0] ? new Date(rows[0].reset_at) : new Date(Date.now() + this.windowMs),
      };
    } catch (err) {
      console.error('DbRateStore increment failed (failing open):', err.message);
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
    }
  }

  async decrement(ip) {
    try {
      await pool.query(
        'UPDATE rate_limits SET hits = GREATEST(hits, 1) - 1 WHERE rl_key = ?',
        [this.key(ip)]
      );
    } catch (err) {
      console.error('DbRateStore decrement failed:', err.message);
    }
  }

  async resetKey(ip) {
    try {
      await pool.query('DELETE FROM rate_limits WHERE rl_key = ?', [this.key(ip)]);
    } catch (err) {
      console.error('DbRateStore resetKey failed:', err.message);
    }
  }
}
