import { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { AlertCircle, Globe, CalendarDays, MapPin, Heart, Wallet, Backpack, Calendar, Crown, TrendingUp, MapPinned, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { eachDayOfInterval } from 'date-fns';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../contexts/CurrencyContext';
import api from '../../services/api';
import { StatisticsSkeleton } from '../ui/Skeletons';

const CATEGORY_CONFIG = {
  accommodation: { color: '#818cf8' },
  transport:     { color: '#60a5fa' },
  food:          { color: '#34d399' },
  activities:    { color: '#fbbf24' },
  other:         { color: '#f87171' },
};

const CURRENCY_SYMBOLS = { CZK: 'Kč', EUR: '€', USD: '$', GBP: '£' };

// Náhled mapy se stahuje až s Leafletem — statistiky se otevírají i bez něj.
const MapCanvas = lazy(() => import('../map/MapCanvas'));

// ISO kód země → vlajka (regional indicator symbols).
const countryFlag = (code) =>
  code && code.length === 2
    ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)))
    : '🏳️';

const AnimatedValue = ({ value, suffix = '', prefix = '', className = '' }) => {
  const [displayed, setDisplayed] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const { i18n } = useTranslation();
  const finalValue = typeof value === 'number' ? value : 0;

  useEffect(() => {
    if (finalValue === 0) { setDisplayed(0); return; }

    if (shouldReduceMotion) {
      setDisplayed(finalValue);
      return;
    }

    const duration = 700;
    const startTime = performance.now();
    let rafId;

    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * finalValue));
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [finalValue, shouldReduceMotion]);

  return (
    <>
      <span className={className} aria-hidden="true">
        {prefix}{displayed.toLocaleString(i18n.language)}{suffix}
      </span>
      <span className="sr-only">{prefix}{finalValue.toLocaleString(i18n.language)}{suffix}</span>
    </>
  );
};

const MetricCard = ({ icon: Icon, label, value, suffix = '', glowColor, delay = 0 }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[2rem] border border-gray-200/60 dark:border-white/[0.07] p-5 sm:p-6 flex items-center gap-4 sm:gap-5"
    >
      <div
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${glowColor}15`, boxShadow: `0 0 20px ${glowColor}20` }}
      >
        <Icon size={22} strokeWidth={2} style={{ color: glowColor }} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-0.5">{label}</p>
        <AnimatedValue
          value={value}
          suffix={suffix}
          className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tighter leading-none"
        />
      </div>
    </motion.div>
  );
};

const HighlightCard = ({ icon: Icon, label, mainValue, subValue, glowColor, delay = 0, emptyText = '—' }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card p-5 sm:p-6 flex flex-col justify-between min-h-[140px]"
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${glowColor}15`, boxShadow: `0 0 16px ${glowColor}15` }}
        >
          <Icon size={18} strokeWidth={2} style={{ color: glowColor }} aria-hidden="true" />
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{label}</p>
      </div>
      <div>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight line-clamp-2">
          {mainValue || emptyText}
        </p>
        {subValue && (
          <p className="text-[12px] sm:text-[13px] text-gray-500 dark:text-gray-400 font-medium mt-1">{subValue}</p>
        )}
      </div>
    </motion.div>
  );
};

const ExpenseBar = ({ breakdown }) => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  if (!breakdown || breakdown.length === 0) {
    return <div className="w-full h-3 bg-gray-100 dark:bg-white/5 rounded-full" />;
  }

  return (
    <div className="space-y-4">
      <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-100 dark:bg-white/5">
        {breakdown.map((item, i) => (
          <motion.div
            key={item.category}
            initial={shouldReduceMotion ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.65, delay: 0.25 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${item.percentage}%`,
              backgroundColor: CATEGORY_CONFIG[item.category]?.color || '#6b7280',
              transformOrigin: 'left center',
            }}
            title={`${t('budget.categories.' + item.category)}: ${item.percentage}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {breakdown.map((item) => (
          <div key={item.category} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: CATEGORY_CONFIG[item.category]?.color || '#6b7280' }}
            />
            <span className="text-[11px] sm:text-[12px] font-medium text-gray-500 dark:text-gray-400">
              {t('budget.categories.' + item.category)}
            </span>
            <span className="text-[11px] sm:text-[12px] font-bold text-gray-900 dark:text-white">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Statistics = ({ trips }) => {
  const { currency } = useCurrency();
  const { t, i18n } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [stats, setStats] = useState(null);
  const [placeStats, setPlaceStats] = useState(null);
  const [visitedPlaces, setVisitedPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = useCallback(() => setRetryCount(n => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    const fetchStats = async () => {
      try {
        const data = await api.stats.get();
        if (!cancelled) setStats(data.stats);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Mapová sekce je bonus — když selže, zbytek statistik zůstane.
    const fetchPlaces = async () => {
      try {
        const [summary, places] = await Promise.all([
          api.places.stats(),
          api.places.getAll({ status: 'visited' }),
        ]);
        if (cancelled) return;
        setPlaceStats(summary);
        setVisitedPlaces(places.places || []);
      } catch {
        if (!cancelled) setPlaceStats(null);
      }
    };

    fetchPlaces();
    fetchStats();
    return () => { cancelled = true; };
  }, [retryCount]);

  const totalTrips = trips.length;

  const totalDays = useMemo(() => trips.reduce((acc, trip) => {
    try {
      return acc + eachDayOfInterval({ start: new Date(trip.startDate), end: new Date(trip.endDate) }).length;
    } catch { return acc; }
  }, 0), [trips]);

  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

  // Názvy zemí bere prohlížeč z ICU dat — žádné vlastní překladové tabulky.
  const regionName = useMemo(() => {
    try {
      const display = new Intl.DisplayNames([i18n.language], { type: 'region' });
      return (code) => {
        try {
          return display.of(code) || code;
        } catch {
          return code;
        }
      };
    } catch {
      return (code) => code;
    }
  }, [i18n.language]);

  if (loading) {
    return <StatisticsSkeleton />;
  }

  if (error) {
    return (
      <div className="w-full space-y-8 pb-24 sm:pb-10">
        <h1 className="text-2xl sm:text-4xl text-gray-900 dark:text-white tracking-tight font-bold" style={{ textWrap: 'balance' }}>{t('statistics.title')}</h1>
        <div className="glass-card p-12 flex flex-col items-center gap-4 text-center">
          <AlertCircle size={32} strokeWidth={1.5} className="text-red-400" aria-hidden="true" />
          <p className="text-[15px] font-bold text-gray-900 dark:text-white">{t('statistics.error.title')}</p>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">{t('statistics.error.subtitle')}</p>
          <button
            onClick={handleRetry}
            className="mt-2 px-5 py-2.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            {t('statistics.error.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (totalTrips === 0) {
    return (
      <div className="w-full space-y-8 pb-24 sm:pb-10">
        <h1 className="text-2xl sm:text-4xl text-gray-900 dark:text-white tracking-tight font-bold" style={{ textWrap: 'balance' }}>{t('statistics.title')}</h1>
        <div className="text-center p-16 glass-card">
          <p className="text-gray-500 dark:text-gray-400 font-medium text-[15px]">{t('statistics.empty')}</p>
        </div>
      </div>
    );
  }

  const favTripCount = stats?.travelHabits?.favoriteMonth?.tripCount;
  const tripCountLabel = favTripCount
    ? (favTripCount > 1
        ? (favTripCount < 5 ? t('statistics.highlights.tripCountFew') : t('statistics.highlights.tripCountMany'))
        : t('statistics.highlights.tripCount'))
    : null;

  return (
    <div className="w-full space-y-6 sm:space-y-10 pb-24 sm:pb-10">

      <motion.h1
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="text-2xl sm:text-4xl text-gray-900 dark:text-white tracking-tight font-bold"
        style={{ textWrap: 'balance' }}
      >
        {t('statistics.title')}
      </motion.h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard icon={Globe} label={t('statistics.metrics.trips')} value={totalTrips} glowColor="#3b82f6" delay={0} />
        <MetricCard icon={CalendarDays} label={t('statistics.metrics.days')} value={totalDays} glowColor="#8b5cf6" delay={0.05} />
        <MetricCard icon={MapPin} label={t('statistics.metrics.places')} value={stats?.travelHabits?.uniqueLocations ?? 0} glowColor="#10b981" delay={0.1} />
        <MetricCard icon={Heart} label={t('statistics.metrics.likes')} value={stats?.social?.communityScore ?? 0} glowColor="#ef4444" delay={0.15} />
      </div>

      {/* Mapa cest — jen když už si uživatel nějaká místa uložil. */}
      {placeStats?.placeCount > 0 && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.55, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)' }}
            >
              <MapPinned size={18} strokeWidth={2} className="text-emerald-500" aria-hidden="true" />
            </div>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">{t('map.title')}</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            {[
              { label: t('map.stats.countries'), value: placeStats.countryCount },
              { label: t('map.stats.cities'), value: placeStats.cityCount },
              { label: t('map.stats.places'), value: placeStats.visitedCount },
              { label: t('map.stats.wishlist'), value: placeStats.wishlistCount },
            ].map(({ label, value }) => (
              <div key={label}>
                <AnimatedValue
                  value={value}
                  className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tighter leading-none"
                />
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-1">{label}</p>
              </div>
            ))}
          </div>

          {visitedPlaces.length > 0 && (
            <div className="relative h-[220px] sm:h-[280px] rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 mb-5">
              <Suspense fallback={<div className="w-full h-full skeleton" />}>
                <MapCanvas
                  places={visitedPlaces}
                  interactive={false}
                  fitKey="stats"
                  ariaLabel={t('map.title')}
                />
              </Suspense>
              {/* Náhled je záměrně neinteraktivní — kdo si chce mapu projít,
                  potřebuje odsud cestu na plnou verzi. */}
              <Link
                to="/dashboard/map"
                className="absolute top-3 right-3 z-[500] inline-flex items-center gap-1.5 min-h-[36px] px-3.5 rounded-full glass-card border border-gray-200 dark:border-white/10 text-[12px] font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {t('map.stats.open')}
                <ArrowRight size={13} strokeWidth={2.5} aria-hidden="true" />
              </Link>
            </div>
          )}

          {placeStats.countries.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {placeStats.countries.map(({ code, count }) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 text-[12px] font-semibold text-gray-700 dark:text-gray-200"
                >
                  <span aria-hidden="true">{countryFlag(code)}</span>
                  {regionName(code)}
                  <span className="text-gray-400 dark:text-gray-500 tabular-nums">{count}</span>
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.55, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="glass-card p-6 sm:p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)', boxShadow: '0 0 20px rgba(99, 102, 241, 0.15)' }}
          >
            <Wallet size={18} strokeWidth={2} className="text-indigo-500" aria-hidden="true" />
          </div>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">{t('statistics.financial.label')}</p>
        </div>

        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
            <AnimatedValue
              value={Math.round(stats?.financial?.totalSpent ?? 0)}
              className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white tracking-tighter leading-none"
            />
            <span className="text-lg sm:text-xl font-bold text-gray-400 dark:text-gray-500">{currencySymbol}</span>
          </div>
          {stats?.financial?.mostExpensiveTrip && (
            <p className="text-[12px] sm:text-[13px] text-gray-500 dark:text-gray-400 font-medium mt-2">
              {t('statistics.financial.mostExpensive')} <span className="text-gray-900 dark:text-white font-bold">{stats.financial.mostExpensiveTrip.title}</span>
              {' '}— <span className="text-gray-900 dark:text-white font-bold">{stats.financial.mostExpensiveTrip.total.toLocaleString(i18n.language)} {currencySymbol}</span>
            </p>
          )}
        </div>

        <ExpenseBar breakdown={stats?.financial?.expenseBreakdown} />
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <HighlightCard
          icon={TrendingUp}
          label={t('statistics.highlights.longestTrip')}
          mainValue={stats?.travelHabits?.longestTrip ? `${stats.travelHabits.longestTrip.durationDays} ${t('statistics.highlights.longestTripDays')}` : null}
          subValue={stats?.travelHabits?.longestTrip?.title}
          glowColor="#06b6d4"
          delay={0.25}
          emptyText={t('statistics.highlights.empty')}
        />
        <HighlightCard
          icon={Backpack}
          label={t('statistics.highlights.packing')}
          mainValue={stats?.productivity?.packingDiscipline?.totalItems > 0 ? `${stats.productivity.packingDiscipline.percentage}%` : null}
          subValue={
            stats?.productivity?.packingDiscipline?.totalItems > 0
              ? `${stats.productivity.packingDiscipline.checkedItems} ${t('statistics.highlights.packingOf')} ${stats.productivity.packingDiscipline.totalItems} ${t('statistics.highlights.packingItems')}`
              : t('statistics.highlights.packingNoItems')
          }
          glowColor="#8b5cf6"
          delay={0.3}
          emptyText={t('statistics.highlights.empty')}
        />
        <HighlightCard
          icon={Calendar}
          label={t('statistics.highlights.favoriteMonth')}
          mainValue={stats?.travelHabits?.favoriteMonth?.monthName}
          subValue={favTripCount && tripCountLabel ? `${favTripCount} ${tripCountLabel}` : null}
          glowColor="#f59e0b"
          delay={0.35}
          emptyText={t('statistics.highlights.empty')}
        />
        <HighlightCard
          icon={Crown}
          label={t('statistics.highlights.mostPopular')}
          mainValue={stats?.social?.mostPopularTrip?.title}
          subValue={stats?.social?.mostPopularTrip ? `${stats.social.mostPopularTrip.netScore} ${t('statistics.highlights.likes')}` : null}
          glowColor="#ec4899"
          delay={0.4}
          emptyText={t('statistics.highlights.empty')}
        />
      </div>

    </div>
  );
};

export default Statistics;
