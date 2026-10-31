import { API_BASE } from '../services/api';

// ── Hlídání chyb v prohlížeči ───────────────────────────────
// Neodchycené chyby, odmítnuté promise a pády Reactu (ErrorBoundary) jdou
// na /api/collect/error; server je seskupí a admin je uvidí v záložce Chyby.

const MAX_PER_PAGE = 10;
const seen = new Set();

// Šum, se kterým nic neuděláme: výpadky sítě, rozšíření prohlížeče, limity
// ResizeObserveru a cross-origin „Script error.“ bez jakékoli informace.
const IGNORED = [
  /ResizeObserver loop/i,
  /^Script error\.?$/i,
  /^(Failed to fetch|Load failed|NetworkError when attempting to fetch resource\.?)$/i,
  /^Session expired$/,
  /AbortError|The user aborted a request/i,
];

export const reportClientError = (error, extra = {}) => {
  const message = (error?.message || String(error || '')).trim();
  if (!message || IGNORED.some((re) => re.test(message))) return;
  const stack = error?.stack || extra.componentStack || '';
  if (/chrome-extension:|moz-extension:|safari-web-extension:/.test(stack)) return;
  const key = `${message}|${stack.split('\n')[1] || ''}`;
  if (seen.has(key) || seen.size >= MAX_PER_PAGE) return;
  seen.add(key);

  let token = null;
  try { token = localStorage.getItem('journeo_token'); } catch { /* ignore */ }
  fetch(`${API_BASE}/collect/error`, {
    method: 'POST',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      message: message.slice(0, 500),
      stack: [stack, extra.componentStack ? `\nComponent stack:${extra.componentStack}` : '']
        .join('')
        .slice(0, 8000),
      path: window.location.pathname.replace(/\/[A-Za-z0-9_-]{16,}/g, '/:token').replace(/\/\d+/g, '/:id'),
    }),
  }).catch(() => {});
};

export const installErrorReporting = () => {
  window.addEventListener('error', (event) => {
    reportClientError(event.error || { message: event.message, stack: `${event.filename}:${event.lineno}:${event.colno}` });
  });
  window.addEventListener('unhandledrejection', (event) => {
    reportClientError(event.reason instanceof Error ? event.reason : { message: String(event.reason) });
  });
};
