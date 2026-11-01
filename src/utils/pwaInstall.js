import { track } from './analytics';

// ── Instalace aplikace na plochu (PWA) ──────────────────────
// Chrome / Edge / Android pošlou `beforeinstallprompt` a systémový dialog jde
// vyvolat tlačítkem. Safari na iPhonu žádné API nemá, tam ukazujeme návod;
// vestavěné prohlížeče (Instagram, Facebook…) neumí instalovat vůbec, tam
// radíme otevřít stránku v Safari / Chrome.

export const OPEN_INSTALL_EVENT = 'journeo:open-install';
const DISMISS_KEY = 'journeo_install_dismissed';
const VISITS_KEY = 'journeo_visits';
const DISMISS_DAYS = 14;

let deferredPrompt = null;
let installedNow = false;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

const safeGet = (storage, key) => { try { return storage.getItem(key); } catch { return null; } };
const safeSet = (storage, key, value) => { try { storage.setItem(key, value); } catch { /* private mode */ } };

if (typeof window !== 'undefined') {
  // Musí se zachytit hned po startu, událost přijde jen jednou.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installedNow = true;
    track('pwa_installed', { via: 'appinstalled' });
    notify();
  });

  // Počet návštěv (jedna za relaci) — kartu nabízíme až vracejícím se lidem.
  if (!safeGet(sessionStorage, VISITS_KEY)) {
    safeSet(sessionStorage, VISITS_KEY, '1');
    safeSet(localStorage, VISITS_KEY, String((Number(safeGet(localStorage, VISITS_KEY)) || 0) + 1));
  }
}

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const ua = () => (typeof navigator === 'undefined' ? '' : navigator.userAgent);

export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);

export const isIOS = () =>
  /iPad|iPhone|iPod/.test(ua()) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const isAndroid = () => /Android/i.test(ua());

// Vestavěné prohlížeče sociálních sítí a messengerů.
export const inAppBrowser = () => {
  const s = ua();
  if (/Instagram/i.test(s)) return 'Instagram';
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(s)) return 'Facebook';
  if (/Messenger/i.test(s)) return 'Messenger';
  if (/musical_ly|TikTok|BytedanceWebview/i.test(s)) return 'TikTok';
  if (/LinkedInApp/i.test(s)) return 'LinkedIn';
  if (/Snapchat/i.test(s)) return 'Snapchat';
  return null;
};

/**
 * 'installed' — už běží z plochy (nebo se právě nainstalovala)
 * 'prompt'    — prohlížeč umí systémový dialog (Chrome, Edge, Android)
 * 'inapp'     — vestavěný prohlížeč, je potřeba otevřít v Safari / Chrome
 * 'ios'       — Safari / jiný prohlížeč na iPhonu: návod přes Sdílet
 * 'android'   — Android bez dialogu (Firefox, Samsung…): návod přes menu
 * 'unsupported' — počítač bez možnosti instalace
 */
export const getInstallMode = () => {
  if (installedNow || isStandalone()) return 'installed';
  if (inAppBrowser()) return 'inapp';
  if (deferredPrompt) return 'prompt';
  if (isIOS()) return 'ios';
  if (isAndroid()) return 'android';
  return 'unsupported';
};

export const isMobileDevice = () => isIOS() || isAndroid();

// Systémový dialog (jen v režimu 'prompt'). Vrací true, když uživatel potvrdil.
export const promptInstall = async (placement) => {
  if (!deferredPrompt) return false;
  const event = deferredPrompt;
  deferredPrompt = null;
  track('pwa_install_opened', { mode: 'prompt', placement });
  event.prompt();
  const { outcome } = await event.userChoice;
  if (outcome === 'accepted') {
    installedNow = true;
    track('pwa_installed', { via: 'prompt', placement });
  } else {
    track('pwa_prompt_declined', { placement });
  }
  notify();
  return outcome === 'accepted';
};

// Otevře návod (iPhone, vestavěný prohlížeč, Android bez dialogu).
export const openInstallSheet = (placement) => {
  track('pwa_install_opened', { mode: getInstallMode(), placement });
  window.dispatchEvent(new CustomEvent(OPEN_INSTALL_EVENT));
};

// Jedno tlačítko pro všechny: kde to jde, rovnou systémový dialog.
export const startInstall = (placement) =>
  getInstallMode() === 'prompt' ? promptInstall(placement) : openInstallSheet(placement);

export const isCardDismissed = () => {
  const ts = Number(safeGet(localStorage, DISMISS_KEY));
  return Boolean(ts) && Date.now() - ts < DISMISS_DAYS * 86400000;
};

export const dismissCard = () => {
  safeSet(localStorage, DISMISS_KEY, String(Date.now()));
  track('pwa_card_dismissed', { mode: getInstallMode() });
  notify();
};

export const visitCount = () => Number(safeGet(localStorage, VISITS_KEY)) || 0;
