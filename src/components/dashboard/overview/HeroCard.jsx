import { format } from 'date-fns';
import { cs, enUS } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plane, ArrowRight, MapPinned, Wallet, CalendarRange, MapPin, Plus } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, useReducedMotion } from 'framer-motion';
import { tripDayCount, currentTripDay, daysUntilStart } from '../../../utils/trip';

const EASE = [0.22, 1, 0.36, 1];

/** Small pill button used for the secondary actions on a running trip. */
const HeroAction = ({ to, icon: Icon, label, primary = false }) => (
  <Link
    to={to}
    className={`inline-flex items-center gap-2 rounded-2xl px-4 min-h-[44px] text-[14px] font-semibold transition-all active:scale-[0.97] ${
      primary
        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-[0_4px_16px_rgba(37,99,235,0.3)]'
        : 'bg-gray-100 dark:bg-white/[0.08] text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/[0.14]'
    }`}
  >
    <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
    {label}
  </Link>
);

/**
 * The one card that answers "what's next?". It adapts to the user's actual
 * situation rather than always showing a countdown:
 *
 *   ongoing  → today's day of the trip + today's plan + jump-in actions
 *   upcoming → days-until countdown + trip shape
 *   past     → the most recent trip as a memory + a nudge to plan another
 *   empty    → first-run invitation
 */
const HeroCard = ({ trip, state, placeCount, onCreate }) => {
  const { t, i18n } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const dateLocale = i18n.language?.startsWith('en') ? enUS : cs;

  const card =
    'glass-card p-6 sm:p-10 rounded-[2rem] relative overflow-hidden flex flex-col min-h-[220px] sm:min-h-[280px]';

  const animation = {
    initial: shouldReduceMotion ? false : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: EASE },
  };

  // ── No trips at all ──────────────────────────────────────
  if (state === 'empty') {
    return (
      <motion.div {...animation} className={`${card} items-center justify-center text-center`}>
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400 flex items-center justify-center mb-5">
          <Plane size={26} strokeWidth={2} aria-hidden="true" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-1.5">
          {t('tripsOverview.noTrip.title')}
        </h2>
        <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
          {t('tripsOverview.noTrip.subtitle')}
        </p>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-2xl px-5 min-h-[44px] bg-blue-600 text-white text-[15px] font-semibold hover:bg-blue-700 transition-all active:scale-[0.97] shadow-[0_4px_16px_rgba(37,99,235,0.3)] cursor-pointer"
        >
          <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
          {t('tripsOverview.actions.newTrip')}
        </button>
      </motion.div>
    );
  }

  const dayCount = tripDayCount(trip);
  const tripHref = `/dashboard/trip/${trip.id}?from=dashboard`;
  const dateRange = `${format(new Date(trip.startDate), 'd. M.', { locale: dateLocale })} – ${format(new Date(trip.endDate), 'd. M. yyyy', { locale: dateLocale })}`;

  const meta = [
    dateRange,
    t('tripsOverview.hero.dayCount', { count: dayCount }),
    typeof placeCount === 'number' && placeCount > 0
      ? t('tripsOverview.hero.placeCount', { count: placeCount })
      : null,
  ].filter(Boolean);

  // ── Trip in progress ─────────────────────────────────────
  if (state === 'ongoing') {
    const dayNumber = currentTripDay(trip);
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayActivity =
      (trip.activities || []).find((a) => a.date === today) ||
      (trip.activities || []).find((a) => a.dayIndex === dayNumber - 1);

    return (
      <motion.div {...animation} className={card}>
        <div className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 mb-5">
          <span className="relative flex w-2 h-2" aria-hidden="true">
            {!shouldReduceMotion && (
              <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-70 animate-ping" />
            )}
            <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[12px] font-bold text-emerald-700 dark:text-emerald-400">
            {t('tripsOverview.hero.inProgress')} · {t('tripsOverview.hero.dayOf', { day: dayNumber, total: dayCount })}
          </span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
          <Link to={tripHref} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 rounded-lg">
            {trip.title}
          </Link>
        </h2>

        {todayActivity?.title || todayActivity?.plan ? (
          <div className="mb-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
              {t('tripsOverview.hero.today')}
            </p>
            {todayActivity.title && (
              <p className="text-[15px] sm:text-base font-semibold text-gray-900 dark:text-white">
                {todayActivity.title}
              </p>
            )}
            {todayActivity.plan && (
              <p className="text-[13px] sm:text-[14px] font-medium text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                {todayActivity.plan}
              </p>
            )}
            {todayActivity.location && (
              <p className="flex items-center gap-1.5 text-[12px] font-medium text-gray-400 dark:text-gray-500 mt-1.5">
                <MapPin size={13} strokeWidth={2} aria-hidden="true" />
                {todayActivity.location}
              </p>
            )}
          </div>
        ) : (
          <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 mb-6">
            {t('tripsOverview.hero.noPlanToday')}
          </p>
        )}

        <div className="mt-auto flex flex-wrap gap-2.5">
          <HeroAction to={tripHref} icon={CalendarRange} label={t('tripsOverview.hero.openItinerary')} primary />
          <HeroAction to={`${tripHref}&view=map`} icon={MapPinned} label={t('tripsOverview.hero.map')} />
          <HeroAction to={`${tripHref}&view=budget`} icon={Wallet} label={t('tripsOverview.hero.expenses')} />
        </div>
      </motion.div>
    );
  }

  // ── Next trip ahead ──────────────────────────────────────
  if (state === 'upcoming') {
    const days = daysUntilStart(trip);

    return (
      <motion.div {...animation} className={`${card} group transition-transform duration-200 hover:-translate-y-1`}>
        <Link
          to={tripHref}
          className="absolute inset-0 z-20 rounded-[2rem] outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-inset"
          aria-label={`${t('tripsOverview.continuePlanning')}: ${trip.title}`}
        />
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
          {t('tripsOverview.countdown.label')}
        </p>
        <div className="flex items-baseline gap-2.5 mb-4 sm:mb-6">
          <span className="text-6xl sm:text-7xl font-bold tracking-tighter text-gray-900 dark:text-white leading-none">
            {days > 0 ? days : t('tripsOverview.countdown.today')}
          </span>
          {days > 0 && (
            <span className="text-base font-medium text-gray-500 dark:text-gray-400">
              {t('tripsOverview.countdown.days')}
            </span>
          )}
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1.5">
          {trip.title}
        </h2>
        <p className="text-[13px] sm:text-[14px] font-medium text-gray-500 dark:text-gray-400">
          {meta.join(' · ')}
        </p>

        <div className="mt-auto pt-6 flex items-center gap-1.5">
          <span className="text-[14px] font-semibold text-blue-600 dark:text-blue-400">
            {t('tripsOverview.continuePlanning')}
          </span>
          <ArrowRight size={15} strokeWidth={2.5} className="text-blue-600 dark:text-blue-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </div>
      </motion.div>
    );
  }

  // ── Only past trips left ─────────────────────────────────
  return (
    <motion.div {...animation} className={card}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
        {t('tripsOverview.hero.lastTrip')}
      </p>
      <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-1.5">
        <Link to={tripHref} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 rounded-lg">
          {trip.title}
        </Link>
      </h2>
      <p className="text-[13px] sm:text-[14px] font-medium text-gray-500 dark:text-gray-400">
        {meta.join(' · ')}
      </p>
      <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 mt-5 max-w-sm">
        {t('tripsOverview.hero.planNextPrompt')}
      </p>
      <div className="mt-auto pt-6">
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-2xl px-5 min-h-[44px] bg-blue-600 text-white text-[15px] font-semibold hover:bg-blue-700 transition-all active:scale-[0.97] shadow-[0_4px_16px_rgba(37,99,235,0.3)] cursor-pointer"
        >
          <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
          {t('tripsOverview.actions.newTrip')}
        </button>
      </div>
    </motion.div>
  );
};

export default HeroCard;
