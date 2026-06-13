import { useState, useEffect } from 'react';
import { Plane, CalendarDays, MapPin, Heart, Wallet, Backpack, Calendar, Crown, TrendingUp, Loader2 } from 'lucide-react';
import { eachDayOfInterval } from 'date-fns';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../contexts/CurrencyContext';
import api from '../../services/api';

const CATEGORY_CONFIG = {
  accommodation: { color: '#818cf8', darkColor: '#6366f1' },
  transport:     { color: '#60a5fa', darkColor: '#3b82f6' },
  food:          { color: '#34d399', darkColor: '#10b981' },
  activities:    { color: '#fbbf24', darkColor: '#f59e0b' },
  other:         { color: '#f87171', darkColor: '#ef4444' },
};

const CURRENCY_SYMBOLS = { CZK: 'Kč', EUR: '€', USD: '$', GBP: '£' };

const AnimatedValue = ({ value, suffix = '', prefix = '', className = '' }) => {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const target = typeof value === 'number' ? value : 0;
    if (target === 0) { setDisplayed(0); return; }

    const duration = 800;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        setDisplayed(target);
        clearInterval(timer);
      } else {
        setDisplayed(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className={className}>
      {prefix}{displayed.toLocaleString('cs-CZ')}{suffix}
    </span>
  );
};

const MetricCard = ({ icon: Icon, label, value, suffix = '', glowColor, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="glass-card p-5 sm:p-6 flex items-center gap-4 sm:gap-5"
  >
    <div
      className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0"
      style={{ backgroundColor: `${glowColor}15`, boxShadow: `0 0 20px ${glowColor}20` }}
    >
      <Icon size={22} strokeWidth={2} style={{ color: glowColor }} />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-0.5">{label}</p>
      <AnimatedValue
        value={value}
        suffix={suffix}
        className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tighter leading-none"
      />
    </div>
  </motion.div>
);

const HighlightCard = ({ icon: Icon, label, mainValue, subValue, glowColor, delay = 0, emptyText = '—' }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="glass-card p-5 sm:p-6 flex flex-col justify-between min-h-[140px]"
  >
    <div className="flex items-center gap-3 mb-4">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${glowColor}15`, boxShadow: `0 0 16px ${glowColor}15` }}
      >
        <Icon size={18} strokeWidth={2} style={{ color: glowColor }} />
      </div>
      <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">{label}</p>
    </div>
    <div>
      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
        {mainValue || emptyText}
      </p>
      {subValue && (
        <p className="text-[12px] sm:text-[13px] text-gray-500 dark:text-gray-400 font-medium mt-1">{subValue}</p>
      )}
    </div>
  </motion.div>
);

const ExpenseBar = ({ breakdown }) => {
  const { t } = useTranslation();

  if (!breakdown || breakdown.length === 0) {
    return <div className="w-full h-3 bg-gray-100 dark:bg-white/5 rounded-full" />;
  }

  return (
    <div className="space-y-4">
      <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-100 dark:bg-white/5">
        {breakdown.map((item, i) => (
          <motion.div
            key={item.category}
            initial={{ width: 0 }}
            animate={{ width: `${item.percentage}%` }}
            transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ backgroundColor: CATEGORY_CONFIG[item.category]?.color || '#6b7280' }}
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
            <span className="text-[11px] sm:text-[12px] font-bold text-gray-500 dark:text-gray-400">
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
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.stats.get();
        setStats(data.stats);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const totalTrips = trips.length;

  const totalDays = trips.reduce((acc, trip) => {
    try {
      return acc + eachDayOfInterval({ start: new Date(trip.startDate), end: new Date(trip.endDate) }).length;
    } catch { return acc; }
  }, 0);

  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

  if (loading) {
    return (
      <div className="w-full space-y-12 pb-10">
        <div className="space-y-2">
          <p className="text-[10px] sm:text-[12px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">{t('statistics.subtitle')}</p>
          <h1 className="text-2xl sm:text-4xl text-gray-900 dark:text-white tracking-tight font-bold">{t('statistics.title')}</h1>
        </div>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={32} strokeWidth={2} className="animate-spin text-blue-500" />
            <p className="text-[13px] text-gray-500 font-medium">{t('statistics.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (totalTrips === 0) {
    return (
      <div className="w-full space-y-12 pb-10">
        <div className="space-y-2">
          <p className="text-[10px] sm:text-[12px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">{t('statistics.subtitle')}</p>
          <h1 className="text-2xl sm:text-4xl text-gray-900 dark:text-white tracking-tight font-bold">{t('statistics.title')}</h1>
        </div>
        <div className="text-center p-16 glass-card">
          <p className="text-gray-500 dark:text-gray-400 font-bold text-xl tracking-tight">{t('statistics.empty')}</p>
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

      <div className="space-y-1 sm:space-y-2">
        <p className="text-[10px] sm:text-[12px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">{t('statistics.subtitle')}</p>
        <h1 className="text-2xl sm:text-4xl text-gray-900 dark:text-white tracking-tight font-bold">{t('statistics.title')}</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard icon={Plane} label={t('statistics.metrics.trips')} value={totalTrips} glowColor="#3b82f6" delay={0} />
        <MetricCard icon={CalendarDays} label={t('statistics.metrics.days')} value={totalDays} glowColor="#8b5cf6" delay={0.05} />
        <MetricCard icon={MapPin} label={t('statistics.metrics.places')} value={stats?.travelHabits?.uniqueLocations ?? 0} glowColor="#10b981" delay={0.1} />
        <MetricCard icon={Heart} label={t('statistics.metrics.likes')} value={stats?.social?.communityScore ?? 0} glowColor="#ef4444" delay={0.15} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card p-6 sm:p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)', boxShadow: '0 0 20px rgba(99, 102, 241, 0.15)' }}
          >
            <Wallet size={18} strokeWidth={2} className="text-indigo-500" />
          </div>
          <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">{t('statistics.financial.label')}</p>
        </div>

        <div className="mb-6 sm:mb-8">
          <div className="flex items-baseline gap-2 sm:gap-3">
            <AnimatedValue
              value={Math.round(stats?.financial?.totalSpent ?? 0)}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white tracking-tighter leading-none"
            />
            <span className="text-lg sm:text-xl font-bold text-gray-400 dark:text-gray-500">{currencySymbol}</span>
          </div>
          {stats?.financial?.mostExpensiveTrip && (
            <p className="text-[12px] sm:text-[13px] text-gray-500 dark:text-gray-400 font-medium mt-2">
              {t('statistics.financial.mostExpensive')} <span className="text-gray-900 dark:text-white font-bold">{stats.financial.mostExpensiveTrip.title}</span>
              {' '}— {stats.financial.mostExpensiveTrip.total.toLocaleString('cs-CZ')} {currencySymbol}
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
