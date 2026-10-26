import { addDays, differenceInCalendarDays, format, isSaturday, isSunday, nextSaturday, parseISO, startOfDay } from 'date-fns';

// ── Typy výletu a balení ────────────────────────────────────────────────
// Typ jen předvyplní seznam na balení; texty jsou v i18n pod
// onboarding.packing.<typ>, společný základ pod onboarding.packing.base.
export const TRIP_TYPES = ['city', 'mountains', 'sea', 'roadtrip'];

export const buildStarterPacking = (t, type) => {
  const base = t('onboarding.packing.base', { returnObjects: true });
  const extra = TRIP_TYPES.includes(type) ? t(`onboarding.packing.${type}`, { returnObjects: true }) : [];
  const texts = [...(Array.isArray(extra) ? extra : []), ...(Array.isArray(base) ? base : [])];
  return texts.map((text, i) => ({ id: `starter-${i}`, text, checked: false }));
};

// Stránky programu: první den nese destinaci (z ní je i místo na mapě),
// poslední den je cesta domů. Ostatní dny zůstávají s výchozím názvem.
export const buildStarterDays = (t, startDate, endDate, destination) => {
  const start = parseISO(startDate);
  const count = differenceInCalendarDays(parseISO(endDate), start) + 1;
  return Array.from({ length: count }, (_, i) => ({
    date: format(addDays(start, i), 'yyyy-MM-dd'),
    title: i === 0
      ? t('onboarding.days.arrival')
      : i === count - 1
        ? t('onboarding.days.departure')
        : t('onboarding.days.day', { n: i + 1 }),
    plan: '',
    location: i === 0 ? destination : '',
  }));
};

// ── Rychlé termíny ──────────────────────────────────────────────────────
export const QUICK_DATES = ['thisWeekend', 'nextWeekend', 'inMonth'];

export const quickDateRange = (key, today = new Date()) => {
  const day = startOfDay(today);
  const saturday = isSaturday(day) ? day : isSunday(day) ? addDays(day, -1) : nextSaturday(day);
  let start;
  let end;
  if (key === 'thisWeekend') {
    start = isSunday(day) ? day : saturday;
    end = addDays(saturday, 1);
  } else if (key === 'nextWeekend') {
    start = addDays(saturday, 7);
    end = addDays(saturday, 8);
  } else {
    start = addDays(day, 30);
    end = addDays(start, 6);
  }
  return { startDate: format(start, 'yyyy-MM-dd'), endDate: format(end, 'yyyy-MM-dd') };
};

// ── Uvítací checklist ───────────────────────────────────────────────────
// Pamatuje si, pro který výlet se má ukázat a jestli ho uživatel zavřel.
// Jen pohodlí v prohlížeči: když localStorage nejde, checklist se prostě
// neukáže a nic se nerozbije.
const WELCOME_KEY = 'journeo_welcome';

const readWelcome = () => {
  try {
    return JSON.parse(localStorage.getItem(WELCOME_KEY)) || null;
  } catch {
    return null;
  }
};

const writeWelcome = (value) => {
  try {
    localStorage.setItem(WELCOME_KEY, JSON.stringify(value));
  } catch { /* soukromé okno apod. */ }
};

export const startWelcome = (tripId, source = 'starter') =>
  writeWelcome({ tripId: String(tripId), source, invited: false, dismissed: false });

export const getWelcome = (tripId) => {
  const w = readWelcome();
  return w && w.tripId === String(tripId) && !w.dismissed ? w : null;
};

export const updateWelcome = (tripId, patch) => {
  const w = readWelcome();
  if (w && w.tripId === String(tripId)) writeWelcome({ ...w, ...patch });
};
