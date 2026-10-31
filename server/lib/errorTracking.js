import crypto from 'node:crypto';
import { waitUntil } from '@vercel/functions';
import pool from '../config/db.js';
import { ANALYTICS_ENV, isBot } from './analytics.js';
import { currentRequest } from './requestContext.js';

// ── Hlídání chyb ────────────────────────────────────────────
// Chyby z prohlížeče i ze serveru končí v app_errors, seskupené podle otisku:
// stejná chyba = jeden řádek s počítadlem, posledním výskytem a stackem.
// Admin je vidí v záložce Chyby. Viz migrace 012.

// Čísla, id a hashe ve zprávě by z jedné chyby udělaly stovky skupin.
const normalize = (message) =>
  String(message)
    .replace(/\b[0-9a-f]{8,}\b/gi, '<id>')
    .replace(/\d+/g, 'N')
    .replace(/(["'`]).*?\1/g, '<str>')
    .slice(0, 300);

// První rámec stacku bez čísel řádků/sloupců (ty se mění s každým buildem).
const topFrame = (stack) => {
  const line = String(stack || '').split('\n').find((l) => /^\s+at\s|@/.test(l));
  return line ? line.trim().replace(/:\d+(:\d+)?\)?$/, '').replace(/\?[^\s)]*/, '') : '';
};

const fingerprintOf = ({ source, message, stack, path }) =>
  crypto
    .createHash('sha1')
    .update(`${ANALYTICS_ENV}|${source}|${normalize(message)}|${topFrame(stack)}|${stack ? '' : path || ''}`)
    .digest('hex');

// Bouře stejných chyb nemá zahltit DB: jeden zápis za otisk a 2 s na instanci.
const recent = new Map();
const THROTTLE_MS = 2000;

export const reportError = async ({ source, message, stack, path, method, userId, userAgent }) => {
  if (!message) return;
  if (userAgent && isBot(userAgent)) return;
  const fingerprint = fingerprintOf({ source, message, stack, path });
  const now = Date.now();
  if (now - (recent.get(fingerprint) || 0) < THROTTLE_MS) return;
  recent.set(fingerprint, now);
  if (recent.size > 500) recent.clear();

  await pool.query(
    `INSERT INTO app_errors
       (fingerprint, env, source, message, stack, path, method, users_affected, last_user_id, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       count = count + 1,
       users_affected = users_affected + IF(VALUES(last_user_id) IS NOT NULL AND NOT (last_user_id <=> VALUES(last_user_id)), 1, 0),
       last_user_id = COALESCE(VALUES(last_user_id), last_user_id),
       message = VALUES(message),
       stack = COALESCE(VALUES(stack), stack),
       path = VALUES(path),
       method = VALUES(method),
       user_agent = COALESCE(VALUES(user_agent), user_agent),
       last_seen = CURRENT_TIMESTAMP,
       resolved_at = NULL`,
    [
      fingerprint,
      ANALYTICS_ENV,
      source,
      String(message).slice(0, 500),
      stack ? String(stack).slice(0, 8000) : null,
      path ? String(path).slice(0, 255) : null,
      method ? String(method).slice(0, 8) : null,
      userId ? 1 : 0,
      userId || null,
      userAgent ? String(userAgent).slice(0, 255) : null,
    ]
  );
};

// Routy chyby logují přes console.error('X error:', err) a vrací 500. Místo
// úprav desítek catch bloků console.error obalíme: zaloguje jako dřív a navíc
// chybu uloží i s routou a uživatelem z kontextu requestu.
let installed = false;
let reporting = false;

export const installServerErrorTracking = () => {
  if (installed) return;
  installed = true;
  const original = console.error.bind(console);

  console.error = (...args) => {
    original(...args);
    if (reporting) return;
    const err = args.find((a) => a instanceof Error);
    const label = args.filter((a) => typeof a === 'string').join(' ').trim();
    const message = err ? `${label ? `${label} ` : ''}${err.message}`.trim() : label;
    // Varování Node.js (deprecation, experimental…) jdou taky přes console.error.
    if (!message || /^\(node:\d+\)/.test(message)) return;

    const req = currentRequest();
    reporting = true;
    try {
      const task = reportError({
        source: 'server',
        message,
        stack: err?.stack,
        path: req ? (req.baseUrl || '') + (req.route?.path || req.path || '') : null,
        method: req?.method,
        userId: req?.userId,
        userAgent: req?.headers?.['user-agent'],
      }).catch((e) => console.warn('Error tracking failed:', e.message));
      waitUntil(task);
    } finally {
      reporting = false;
    }
  };

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason instanceof Error ? reason : new Error(String(reason)));
  });
};
