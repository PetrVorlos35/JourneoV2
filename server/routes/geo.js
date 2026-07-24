import { Router } from 'express';
import { searchPlaces, reverseGeocode } from '../lib/geocode.js';

const router = Router();

const normalizeLang = (lang) => (String(lang || 'cs').startsWith('en') ? 'en' : 'cs');

// ── GET /api/geo/search?q=&lang= ────────────────────────────
// Našeptávač míst. Prázdné pole je validní odpověď (nic nenalezeno
// nebo Nominatim nedostupný) — klient nesmí kvůli tomu spadnout.
router.get('/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 3) return res.json({ results: [] });

    const results = await searchPlaces(q, normalizeLang(req.query.lang), 5);
    res.json({ results });
  } catch (err) {
    console.error('Geo search error:', err);
    res.status(500).json({ error: 'Chyba při vyhledávání místa.' });
  }
});

// ── GET /api/geo/reverse?lat=&lng=&lang= ────────────────────
// Doplní adresu, město a zemi k souřadnicím z kliku do mapy / GPS.
router.get('/reverse', async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Neplatné souřadnice.' });
    }

    const result = await reverseGeocode(lat, lng, normalizeLang(req.query.lang));
    res.json({ result });
  } catch (err) {
    console.error('Geo reverse error:', err);
    res.status(500).json({ error: 'Chyba při určování adresy.' });
  }
});

export default router;
