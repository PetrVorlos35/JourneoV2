import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Sparkles, Lock, FileDown, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GUEST_UPSELL_EVENT } from '../../services/api';
import { track } from '../../utils/analytics';

// ── Zkušební režim (host) ───────────────────────────────────
// Lišta se zbývajícím časem, nabídka registrace (limit, zamčená funkce,
// konec zkoušky) a zamčená stránka. Registrace vede na /auth; výlety
// ze zkoušky převede AuthContext po přihlášení (claimGuestTrips).

const GRACE_MS = 24 * 3600 * 1000;

export const openGuestUpsell = (reason = 'GUEST_LOCKED', feature) =>
  window.dispatchEvent(new CustomEvent(GUEST_UPSELL_EVENT, { detail: { reason, feature } }));

// Zbývající čas se přepočítává každou minutu.
export const useGuestClock = () => {
  const { user } = useAuth();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!user?.is_guest) return undefined;
    const id = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, [user?.is_guest]);
  if (!user?.is_guest) return null;
  const left = (user.guestEndsAt || now) - now;
  return { expired: left <= 0, msLeft: Math.max(0, left), graceMsLeft: Math.max(0, left + GRACE_MS) };
};

// „2 dny“ / „5 h“ / „40 min“
export const formatRemaining = (t, ms) => {
  const hours = ms / 3600000;
  if (hours >= 24) return t('guest.time.days', { count: Math.floor(hours / 24) });
  if (hours >= 1) return t('guest.time.hours', { count: Math.floor(hours) });
  return t('guest.time.minutes', { count: Math.max(1, Math.ceil(ms / 60000)) });
};

// Cesta na registraci; po ní se uživatel vrátí, kde byl.
export const useStartUpgrade = () => {
  const navigate = useNavigate();
  const location = useLocation();
  return (placement) => {
    track('guest_upgrade_clicked', { placement });
    navigate('/auth', { state: { from: location.pathname + location.search, guestUpgrade: true } });
  };
};

// Spustí zkušební režim (landing, přihlášení) a pošle do aplikace;
// přihlášený jde rovnou. Když server hosta nezaloží (limit, výpadek),
// skončí člověk na běžné registraci i s důvodem.
export const useStartTrial = () => {
  const { user, startGuest } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const start = async (placement, plan = '') => {
    const target = plan ? `/dashboard?plan=${encodeURIComponent(plan)}` : '/dashboard';
    if (user) {
      navigate(target);
      return;
    }
    track('guest_trial_clicked', { placement, hasDestination: Boolean(plan) });
    setBusy(true);
    try {
      await startGuest();
      navigate(target);
    } catch (err) {
      navigate('/auth', { state: { from: target, trialError: err.message } });
    } finally {
      setBusy(false);
    }
  };
  return { start, busy };
};

const ctaClass =
  'inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full bg-accent hover:bg-accent-hover text-white text-[13px] font-semibold whitespace-nowrap transition-colors cursor-pointer';

// Lišta nad obsahem aplikace. Během zkoušky nenápadná, po konci výrazná.
export const GuestBanner = ({ trips = [] }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const clock = useGuestClock();
  const startUpgrade = useStartUpgrade();
  if (!clock) return null;

  // PDF z vlastního výletu, jinak z ukázky.
  const pdfTrip = trips.find((trip) => !trip.isSample) || trips[0];

  if (clock.expired) {
    return (
      <div role="status" className="mb-4 md:mb-6 p-4 sm:p-5 rounded-[1.25rem] bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25">
        <p className="text-[15px] font-bold text-amber-900 dark:text-amber-200">{t('guest.banner.expiredTitle')}</p>
        <p className="mt-0.5 text-[13px] font-medium text-amber-800/90 dark:text-amber-200/80">
          {t('guest.banner.expiredText', { time: formatRemaining(t, clock.graceMsLeft) })}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => startUpgrade('banner_expired')} className={ctaClass}>
            {t('guest.banner.keep')}
          </button>
          {pdfTrip && (
            <button
              type="button"
              onClick={() => navigate(`/dashboard/trip/${pdfTrip.id}?export=pdf`)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 text-[13px] font-semibold text-amber-900 dark:text-amber-100 transition-colors cursor-pointer"
            >
              <FileDown size={15} strokeWidth={2.25} aria-hidden="true" /> {t('guest.banner.pdf')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div role="status" className="mb-4 md:mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 rounded-[1.25rem] bg-active border border-blue-200/70 dark:border-blue-500/20">
      <Sparkles size={18} strokeWidth={2.25} className="shrink-0 text-accent" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-[13px] font-medium text-secondary">
        <span className="font-semibold text-primary">{t('guest.banner.title', { time: formatRemaining(t, clock.msLeft) })}</span>
        <span className="hidden sm:inline"> · {t('guest.banner.local')}</span>
      </p>
      <button type="button" onClick={() => startUpgrade('banner')} className={ctaClass}>
        {t('guest.banner.save')}
      </button>
    </div>
  );
};

// Nabídka registrace: limit výletů, zamčená funkce nebo konec zkoušky.
// Poslouchá událost z api.js (403 GUEST_*) i openGuestUpsell().
export const GuestUpsellSheet = () => {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const { isGuest } = useAuth();
  const startUpgrade = useStartUpgrade();
  const [state, setState] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      const reason = e.detail?.reason || 'GUEST_LOCKED';
      const feature = e.detail?.feature || null;
      track('guest_upsell_shown', { reason, ...(feature ? { feature } : {}) });
      setState({ reason, feature });
    };
    window.addEventListener(GUEST_UPSELL_EVENT, handler);
    return () => window.removeEventListener(GUEST_UPSELL_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!state) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setState(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state]);

  const open = Boolean(state) && isGuest;
  const key = state?.reason === 'GUEST_TRIP_LIMIT' ? 'limit'
    : state?.reason === 'GUEST_EXPIRED' ? 'expired'
      : state?.feature === 'friends' ? 'friends'
        : state?.feature === 'share' ? 'share'
          : 'locked';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setState(null)}
            className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-md cursor-pointer"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-upsell-title"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="relative z-10 w-full max-w-md bg-page border border-subtle rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-8 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setState(null)}
              aria-label={t('common.close')}
              className="absolute top-4 right-4 w-10 h-10 bg-subtle rounded-full flex items-center justify-center text-muted hover:text-primary transition-colors cursor-pointer"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
            <span className="w-12 h-12 rounded-2xl bg-active text-accent flex items-center justify-center">
              {key === 'limit' || key === 'expired'
                ? <Sparkles size={22} strokeWidth={2.25} aria-hidden="true" />
                : <Lock size={21} strokeWidth={2.25} aria-hidden="true" />}
            </span>
            <h2 id="guest-upsell-title" className="mt-5 text-[22px] font-bold tracking-tight text-primary pr-10">
              {t(`guest.upsell.${key}.title`)}
            </h2>
            <p className="mt-1.5 text-[15px] font-medium text-secondary">{t(`guest.upsell.${key}.text`)}</p>
            <ul className="mt-5 space-y-2 text-[14px] font-medium text-secondary">
              {['keep', 'trips', 'friends'].map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <span className="mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  {t(`guest.upsell.benefits.${b}`)}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => { setState(null); startUpgrade(`upsell_${key}`); }}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-accent hover:bg-accent-hover text-white font-semibold transition-colors cursor-pointer"
            >
              {t('guest.upsell.cta')} <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setState(null)}
              className="mt-2 w-full h-11 rounded-full text-[14px] font-semibold text-secondary hover:text-primary transition-colors cursor-pointer"
            >
              {t('guest.upsell.later')}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Celá stránka zamčená pro hosta (Přátelé, pozvánka do přátel).
export const GuestLockedPanel = ({ feature }) => {
  const { t } = useTranslation();
  const startUpgrade = useStartUpgrade();
  return (
    <div className="w-full max-w-lg mx-auto py-10 sm:py-16 px-4 text-center">
      <span className="mx-auto w-14 h-14 rounded-2xl bg-active text-accent flex items-center justify-center">
        <Lock size={24} strokeWidth={2.25} aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-[26px] sm:text-[30px] font-bold tracking-tight text-primary">{t(`guest.locked.${feature}.title`)}</h1>
      <p className="mt-2 text-[15px] font-medium text-secondary">{t(`guest.locked.${feature}.text`)}</p>
      <button
        type="button"
        onClick={() => startUpgrade(`locked_${feature}`)}
        className="mt-7 inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-accent hover:bg-accent-hover text-white font-semibold transition-colors cursor-pointer"
      >
        {t('guest.upsell.cta')} <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
      </button>
    </div>
  );
};
