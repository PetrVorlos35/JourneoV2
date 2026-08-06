import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, useReducedMotion } from 'framer-motion';
import { computeReadiness } from './readiness';

const EASE = [0.22, 1, 0.36, 1];
const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * How ready the hero trip is, as a ring plus the four things the ring is made
 * of. The pillars are listed explicitly and each links to the place that fixes
 * it, so the percentage is never a number the user has to take on faith.
 */
const ReadinessCard = ({ trip, placeCount }) => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  if (!trip) return null;

  const { score, items } = computeReadiness(trip, placeCount);
  const tripHref = `/dashboard/trip/${trip.id}?from=dashboard`;

  const labelFor = (item) => {
    switch (item.key) {
      // `planned`/`packed` rather than `count` on purpose — a `count` option
      // would send i18next looking for plural forms these keys don't have.
      case 'itinerary':
        return t('tripsOverview.readiness.itinerary', { planned: item.count, total: item.total });
      case 'packing':
        return item.total > 0
          ? t('tripsOverview.readiness.packing', { packed: item.count, total: item.total })
          : t('tripsOverview.readiness.packingEmpty');
      case 'places':
        return item.count > 0
          ? t('tripsOverview.readiness.places', { count: item.count })
          : t('tripsOverview.readiness.placesEmpty');
      case 'documents':
        return item.count > 0
          ? t('tripsOverview.readiness.documents', { count: item.count })
          : t('tripsOverview.readiness.documentsEmpty');
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay: 0.08, ease: EASE }}
      className="glass-card p-6 sm:p-8 rounded-[2rem] flex flex-row md:flex-col items-center md:items-start gap-6 md:gap-0 min-h-[220px] sm:min-h-[280px]"
    >
      <div className="shrink-0 md:mb-6">
        <p className="hidden md:block text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
          {t('tripsOverview.readiness.label')}
        </p>
        <div className="relative w-[88px] h-[88px]">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90" aria-hidden="true">
            <circle
              cx="40" cy="40" r={RADIUS} fill="none" strokeWidth="7"
              className="stroke-gray-200/70 dark:stroke-white/[0.08]"
            />
            <motion.circle
              cx="40" cy="40" r={RADIUS} fill="none" strokeWidth="7" strokeLinecap="round"
              className="stroke-blue-600 dark:stroke-blue-400"
              strokeDasharray={CIRCUMFERENCE}
              initial={shouldReduceMotion ? false : { strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - score / 100) }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.9, delay: 0.2, ease: EASE }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold tracking-tighter text-gray-900 dark:text-white">
              {score}<span className="text-sm font-semibold text-gray-400 dark:text-gray-500">%</span>
            </span>
          </div>
        </div>
      </div>

      <ul className="flex-1 min-w-0 w-full space-y-1 md:mt-auto">
        <li className="md:hidden text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
          {t('tripsOverview.readiness.label')}
        </li>
        {items.map((item) => (
          <li key={item.key}>
            <Link
              to={item.view ? `${tripHref}&view=${item.view}` : tripHref}
              className="flex items-center gap-2.5 -mx-2 px-2 py-1.5 rounded-xl hover:bg-gray-100/70 dark:hover:bg-white/5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
            >
              <span
                className={`w-4 h-4 shrink-0 rounded-full flex items-center justify-center ${
                  item.done
                    ? 'bg-emerald-500 text-white'
                    : 'border-[1.5px] border-gray-300 dark:border-white/20'
                }`}
                aria-hidden="true"
              >
                {item.done && <Check size={10} strokeWidth={3.5} />}
              </span>
              <span className={`text-[13px] font-medium truncate ${
                item.done ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
              }`}>
                {labelFor(item)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

export default ReadinessCard;
