import { API_BASE } from '../services/api';

// ── Vlastní analytika ───────────────────────────────────────
// Zobrazení stránek a akce v UI jdou na /api/collect/events. Bez cookies
// a bez ukládání čehokoli do prohlížeče (kromě opt-outu níž); anonymního
// návštěvníka server pozná jen v rámci dne. Viz server/lib/analytics.js.

const OPT_OUT_KEY = 'journeo_no_track';
const FLUSH_DELAY = 1500;

let queue = [];
let timer = null;
// Odkud a s jakou kampaní člověk přišel, posíláme jen s první stránkou.
let firstPageview = true;

const optedOut = () => {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === '1' || navigator.webdriver;
  } catch {
    return false;
  }
};

// Zařízení admina se do statistik nepočítá ani nepřihlášené (landing).
export const optOutThisDevice = () => {
  try { localStorage.setItem(OPT_OUT_KEY, '1'); } catch { /* private mode */ }
};

// Přepínač „Měření používání“ v nastavení cookies (námitka proti
// oprávněnému zájmu). Stejný klíč jako opt-out admina.
export const isTrackingEnabled = () => {
  try { return localStorage.getItem(OPT_OUT_KEY) !== '1'; } catch { return true; }
};

export const setTrackingEnabled = (enabled) => {
  try {
    if (enabled) localStorage.removeItem(OPT_OUT_KEY);
    else localStorage.setItem(OPT_OUT_KEY, '1');
  } catch { /* private mode */ }
  if (!enabled) queue = [];
};

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

// Id a tokeny v cestě nepatří do statistik: /dashboard/trip/123 → /dashboard/trip/:id.
export const normalizePath = (pathname) =>
  pathname
    .split('/')
    .map((seg) => (/^\d+$/.test(seg) ? ':id' : /^[A-Za-z0-9_-]{16,}$/.test(seg) ? ':token' : seg))
    .join('/')
    .replace(/\/+$/, '') || '/';

const flush = () => {
  clearTimeout(timer);
  timer = null;
  if (!queue.length) return;
  // Admin se mohl přihlásit až po zařazení prvních stránek do fronty.
  if (optedOut()) { queue = []; return; }
  const events = queue.splice(0, 20);
  let token = null;
  try { token = localStorage.getItem('journeo_token'); } catch { /* ignore */ }
  fetch(`${API_BASE}/collect/events`, {
    method: 'POST',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ events }),
  }).catch(() => {});
  if (queue.length) flush();
};

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}

export const track = (name, props) => {
  if (optedOut()) return;
  queue.push({
    name,
    path: normalizePath(window.location.pathname),
    standalone: isStandalone(),
    props,
  });
  if (!timer) timer = setTimeout(flush, FLUSH_DELAY);
};

export const trackPageview = (pathname) => {
  if (optedOut()) return;
  const event = { name: 'pageview', path: normalizePath(pathname), standalone: isStandalone() };
  if (firstPageview) {
    firstPageview = false;
    const params = new URLSearchParams(window.location.search);
    event.referrer = document.referrer || undefined;
    if (params.get('utm_source')) {
      event.utm = {
        source: params.get('utm_source'),
        medium: params.get('utm_medium') || undefined,
        campaign: params.get('utm_campaign') || undefined,
      };
    }
  }
  queue.push(event);
  if (!timer) timer = setTimeout(flush, FLUSH_DELAY);
};
