import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ChevronRight } from 'lucide-react';
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

  const pending = items.filter((item) => !item.done);
  const doneCount = items.length - pending.length;

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay: 0.08, ease: EASE }}
      className="md:h-full"
    >
      {/* Mobil: jen to, co ještě chybí. Čtyři řádky s fajfkami by zabraly
          půl obrazovky, přitom akci vyžaduje obvykle jedna věc. */}
      <div className="md:hidden glass-card rounded-[1.75rem] p-4">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 shrink-0">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90" aria-hidden="true">
              <circle cx="40" cy="40" r={RADIUS} fill="none" strokeWidth="9" className="stroke-gray-200/70 dark:stroke-white/[0.08]" />
              <circle
                cx="40" cy="40" r={RADIUS} fill="none" strokeWidth="9" strokeLinecap="round"
                className="stroke-blue-600 dark:stroke-blue-400"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - score / 100)}
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-muted">{t('tripsOverview.readiness.label')}</p>
            <p className="text-[17px] font-bold text-primary tracking-tight tabular-nums leading-tight">
              {score} %
              {doneCount > 0 && pending.length > 0 && (
                <span className="ml-2 text-[12px] font-medium text-muted">{t('tripsOverview.readiness.doneCount', { done: doneCount, total: items.length })}</span>
              )}
            </p>
          </div>
        </div>
        {pending.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {pending.map((item) => (
              <li key={item.key}>
                <Link
                  to={item.view ? `${tripHref}&view=${item.view}` : tripHref}
                  className="inline-flex items-center gap-2 min-h-[40px] pl-3 pr-2.5 rounded-xl bg-field text-[13px] font-semibold text-primary active:scale-[0.97] transition-transform outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                >
                  <span className="w-3.5 h-3.5 shrink-0 rounded-full border-[1.5px] border-check" aria-hidden="true" />
                  {labelFor(item)}
                  <ChevronRight size={14} strokeWidth={2.5} className="text-gray-400" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-success">
            <Check size={14} strokeWidth={3} aria-hidden="true" />
            {t('tripsOverview.readiness.allDone')}
          </p>
        )}
      </div>

      <div className="hidden md:flex glass-card p-8 rounded-[2rem] flex-col items-start min-h-[280px] h-full">
      <div className="shrink-0 mb-6">
        <p className="text-[12px] font-semibold text-gray-500 dark:text-gray-500 mb-4">
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
            <span className="text-xl font-bold tracking-tighter text-primary">
              {score}<span className="text-sm font-semibold text-gray-400 dark:text-gray-500">%</span>
            </span>
          </div>
        </div>
      </div>

      <ul className="flex-1 min-w-0 w-full space-y-1 mt-auto">
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
                    : 'border-[1.5px] border-check'
                }`}
                aria-hidden="true"
              >
                {item.done && <Check size={10} strokeWidth={3.5} />}
              </span>
              <span className={`text-[13px] font-medium truncate ${
                item.done ? 'text-muted' : 'text-primary'
              }`}>
                {labelFor(item)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      </div>
    </motion.div>
  );
};

export default ReadinessCard;
