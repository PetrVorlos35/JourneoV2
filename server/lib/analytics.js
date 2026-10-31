import crypto from 'node:crypto';
import { waitUntil } from '@vercel/functions';
import pool from '../config/db.js';

// ── Vlastní analytika ───────────────────────────────────────
// Bez cookies a bez ukládání IP: anonymního návštěvníka poznáme jen v rámci
// jednoho dne podle hashe IP + prohlížeče + data + tajného klíče. Přihlášené
// uživatele vedeme podle user_id. Viz migrace 012.

export const ANALYTICS_ENV = process.env.VERCEL_ENV || 'development';

const SALT = `journeo-analytics:${process.env.JWT_SECRET || ''}`;
const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|pingdom|uptime|curl|wget|python-requests|axios|node-fetch/i;

export const isBot = (ua = '') => !ua || BOT_RE.test(ua);

export const deviceFromUa = (ua = '') => {
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return 'tablet';
  if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)) return 'mobile';
  return 'desktop';
};

const clientIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || '';

export const visitorId = (req) => {
  const day = new Date().toISOString().slice(0, 10);
  return crypto
    .createHash('sha256')
    .update(`${SALT}|${day}|${clientIp(req)}|${req.headers['user-agent'] || ''}`)
    .digest('hex')
    .slice(0, 16);
};

export const countryOf = (req) => {
  const c = req.headers['x-vercel-ip-country'];
  return typeof c === 'string' && /^[A-Z]{2}$/.test(c) ? c : null;
};

const clip = (value, max) => (typeof value === 'string' && value ? value.slice(0, max) : null);

const referrerHost = (referrer) => {
  if (typeof referrer !== 'string' || !referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    // Vlastní doména není zdroj návštěvy.
    if (/(^|\.)vorlos\.eu$|^localhost$/.test(host)) return null;
    return host.slice(0, 120);
  } catch {
    return null;
  }
};

// Jen ploché props s krátkými hodnotami — žádné texty od uživatele.
const cleanProps = (props) => {
  if (!props || typeof props !== 'object') return null;
  const out = {};
  for (const [key, value] of Object.entries(props).slice(0, 12)) {
    if (!/^[a-zA-Z0-9_]{1,32}$/.test(key)) continue;
    if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
    else if (typeof value === 'boolean') out[key] = value;
    else if (typeof value === 'string') out[key] = value.slice(0, 64);
  }
  return Object.keys(out).length ? out : null;
};

export const EVENT_NAME_RE = /^[a-z][a-z0-9_]{1,47}$/;

export const insertEvents = async (req, events, userId = null) => {
  const ua = req.headers['user-agent'] || '';
  if (isBot(ua)) return;
  const base = {
    visitor: visitorId(req),
    device: deviceFromUa(ua),
    country: countryOf(req),
  };
  const rows = events
    .filter((e) => e && EVENT_NAME_RE.test(e.name))
    .map((e) => [
      ANALYTICS_ENV,
      e.name,
      userId,
      base.visitor,
      clip(e.path, 255),
      referrerHost(e.referrer),
      clip(e.utm?.source, 80),
      clip(e.utm?.medium, 80),
      clip(e.utm?.campaign, 120),
      base.device,
      e.standalone ? 1 : 0,
      base.country,
      (() => { const p = cleanProps(e.props); return p ? JSON.stringify(p) : null; })(),
    ]);
  if (!rows.length) return;
  await pool.query(
    `INSERT INTO analytics_events
       (env, name, user_id, visitor_id, path, referrer_host, utm_source, utm_medium, utm_campaign, device, standalone, country, props)
     VALUES ?`,
    [rows]
  );
};

// Událost ze serveru (registrace, nový výlet…). Fire-and-forget: analytika
// nikdy nesmí zdržet ani shodit akci, ke které patří.
export const track = (req, name, { userId = req.userId ?? null, props } = {}) => {
  waitUntil(
    insertEvents(req, [{ name, props }], userId).catch((err) =>
      console.warn('Analytics track error:', err.message)
    )
  );
};
