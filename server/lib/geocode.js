import { createHash } from 'crypto';
import pool from '../config/db.js';

// ============================================================
// Geokódování přes Nominatim (OpenStreetMap).
//
// Proč přes server a ne přímo z prohlížeče:
//  1. Nominatim usage policy vyžaduje identifikující User-Agent —
//     ten prohlížeč nastavit neumí (hlavička se zahodí).
//  2. Max 1 request/s. Import míst z itineráře je dávkový, takže
//     requesty tady serializujeme přes frontu.
//  3. Odpovědi cachujeme v DB (`geocode_cache`), takže opakované
//     dotazy Nominatim vůbec nezatíží a import je po prvním běhu
//     prakticky okamžitý.
//
// Cache i síť selhávají "měkce": při chybě vrátíme prázdný výsledek
// a volající to promítne do UI, nikdy to neshodí celý request.
// ============================================================

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const CONTACT = process.env.NOMINATIM_CONTACT || 'https://journeo.vorlos.eu';
const USER_AGENT = `JourneoApp/1.2 (${CONTACT})`;
const CACHE_TTL_DAYS = 30;
const MIN_INTERVAL_MS = 1100;
const FETCH_TIMEOUT_MS = 8000;

// Fronta držící odstup mezi voláními Nominatimu (≤ 1 req/s).
let queue = Promise.resolve();
let lastCallAt = 0;

const schedule = (fn) => {
  const run = queue.then(async () => {
    const wait = lastCallAt + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastCallAt = Date.now();
    return fn();
  });
  // Řetěz nesmí zůstat v rejected stavu, jinak by spadly i další položky.
  queue = run.then(
    () => {},
    () => {}
  );
  return run;
};

const hashKey = (prefix, value) =>
  `${prefix}:${createHash('sha1').update(value).digest('hex')}`;

const cacheGet = async (key) => {
  try {
    const [[row]] = await pool.query(
      'SELECT response FROM geocode_cache WHERE cache_key = ? AND created_at > NOW() - INTERVAL ? DAY',
      [key, CACHE_TTL_DAYS]
    );
    if (!row) return null;
    return typeof row.response === 'string' ? JSON.parse(row.response) : row.response;
  } catch (err) {
    console.error('Geocode cache read failed:', err.message);
    return null;
  }
};

const cacheSet = async (key, value) => {
  try {
    await pool.query(
      `INSERT INTO geocode_cache (cache_key, response) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE response = VALUES(response), created_at = CURRENT_TIMESTAMP`,
      [key, JSON.stringify(value)]
    );
  } catch (err) {
    console.error('Geocode cache write failed:', err.message);
  }
};

// Nominatim vrací hromadu polí; ven pouští jen to, co mapa potřebuje.
const normalize = (item) => {
  if (!item || item.lat == null || item.lon == null) return null;
  const address = item.address || {};
  const city =
    address.city || address.town || address.village || address.municipality || null;
  const name =
    item.name?.trim() || city || String(item.display_name || '').split(',')[0].trim();

  if (!name) return null;

  return {
    name: name.slice(0, 255),
    address: item.display_name ? String(item.display_name).slice(0, 500) : null,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    countryCode: address.country_code ? address.country_code.toUpperCase().slice(0, 2) : null,
    city: city ? String(city).slice(0, 120) : null,
  };
};

const callNominatim = async (path, params) => {
  const url = `${NOMINATIM_BASE}${path}?${new URLSearchParams(params)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Referer: CONTACT, Accept: 'application/json' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Nominatim responded ${res.status}`);
  return res.json();
};

// ── Fulltextové hledání ─────────────────────────────────────
// Vrací pole normalizovaných míst (může být prázdné).
export const searchPlaces = async (query, lang = 'cs', limit = 5) => {
  const q = String(query || '').trim();
  if (q.length < 3) return [];

  const key = hashKey('search', `${q.toLowerCase()}|${lang}|${limit}`);
  const cached = await cacheGet(key);
  if (cached) return cached;

  try {
    const data = await schedule(() =>
      callNominatim('/search', {
        q,
        format: 'jsonv2',
        addressdetails: '1',
        limit: String(limit),
        'accept-language': lang,
      })
    );

    const results = (Array.isArray(data) ? data : [])
      .map(normalize)
      .filter(Boolean)
      // Nominatim občas vrátí stejné místo víckrát.
      .filter((v, i, arr) => arr.findIndex((o) => o.address === v.address) === i);

    await cacheSet(key, results);
    return results;
  } catch (err) {
    console.error('Nominatim search failed:', err.message);
    return [];
  }
};

// ── Reverzní geokódování ────────────────────────────────────
// Vrací jedno normalizované místo, nebo null.
export const reverseGeocode = async (lat, lng, lang = 'cs') => {
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;

  // Zaokrouhlení na ~11 m dělá z cache užitečný zásah i pro sousední kliky.
  const roundedLat = latNum.toFixed(4);
  const roundedLng = lngNum.toFixed(4);
  const key = `rev:${roundedLat},${roundedLng}|${lang}`;
  const cached = await cacheGet(key);
  if (cached) return cached;

  try {
    const data = await schedule(() =>
      callNominatim('/reverse', {
        lat: roundedLat,
        lon: roundedLng,
        format: 'jsonv2',
        addressdetails: '1',
        zoom: '16',
        'accept-language': lang,
      })
    );

    const result = normalize(data);
    if (result) {
      // Souřadnice necháváme ty klikané — Nominatim vrací střed nalezeného objektu.
      result.lat = latNum;
      result.lng = lngNum;
      await cacheSet(key, result);
    }
    return result;
  } catch (err) {
    console.error('Nominatim reverse failed:', err.message);
    return null;
  }
};

// Nejlepší shoda pro textovou lokaci (import z itineráře).
export const geocodeOne = async (query, lang = 'cs') => {
  const [first] = await searchPlaces(query, lang, 1);
  return first || null;
};
