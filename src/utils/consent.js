// Souhlas s cookies (GDPR). Nezbytné cookies/úložiště jedou vždy,
// marketingové (Travelpayouts affiliate) až po výslovném souhlasu.
const STORAGE_KEY = 'journeo_cookie_consent';
const CONSENT_VERSION = 1;
export const CONSENT_EVENT = 'journeo:consent';
export const OPEN_SETTINGS_EVENT = 'journeo:open-cookie-settings';

const TRAVELPAYOUTS_SRC = 'https://emrldco.com/NTg0MjM4.js?t=584238';

export function getConsent() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.v === CONSENT_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

export function saveConsent({ marketing }) {
  const consent = { v: CONSENT_VERSION, marketing: !!marketing, ts: new Date().toISOString() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  } catch {
    // Bez localStorage se lišta ukáže znovu při další návštěvě — nevadí.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }));
  return consent;
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}

// Travelpayouts Drive — načte se jen jednou a jen se souhlasem s marketingem.
// Externí <script src>, protože CSP nepovoluje inline skripty.
export function loadMarketingScripts() {
  if (document.querySelector('script[data-tp-drive]')) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = TRAVELPAYOUTS_SRC;
  script.setAttribute('data-cmp-ab', '2');
  script.setAttribute('data-tp-drive', '');
  document.head.appendChild(script);
}
