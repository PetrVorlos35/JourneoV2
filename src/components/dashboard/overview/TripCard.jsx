import { format } from 'date-fns';
import { cs, enUS } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Trash2, ArrowRight, ChevronRight, Users, Heart } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, useReducedMotion } from 'framer-motion';
import { getTripColor } from '../../../utils/tripColor';
import { categorizeTrip, currentTripDay, tripDayCount } from '../../../utils/trip';

/**
 * A single trip in the overview list. Extracted from the old inline markup so
 * the overview page stays readable; the delete button still just calls
 * `onDeleteTrip`, which keeps DashboardHome's optimistic-undo flow intact.
 */
const TripCard = ({ trip, onDeleteTrip }) => {
  const { t, i18n } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const dateLocale = i18n.language?.startsWith('en') ? enUS : cs;

  const color = getTripColor(trip.title);
  const isOngoing = categorizeTrip(trip) === 'ongoing';

  const tripHref = `/dashboard/trip/${trip.id}?from=dashboard`;
  const dateRange = `${format(new Date(trip.startDate), 'd. M.', { locale: dateLocale })} – ${format(new Date(trip.endDate), 'd. M. yyyy', { locale: dateLocale })}`;

  const handleDelete = (e) => {
    e.preventDefault();
    onDeleteTrip(trip.id);
  };

  return (
    <motion.div
      variants={shouldReduceMotion ? {} : {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className="glass-card md:hover:-translate-y-2 md:hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:md:hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] transition-all duration-300 relative md:p-8 md:flex md:flex-col md:min-h-[220px] group"
    >
      {/* Mobil: řádek seznamu — celý je odkaz, žádné mazání na dosah palce
          (výlet jde smazat v Moje výlety nebo v detailu). */}
      <Link
        to={tripHref}
        className="md:hidden flex items-center gap-3 p-3.5 pr-3 rounded-[inherit] active:bg-gray-50 dark:active:bg-white/[0.03] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
      >
        <span className={`w-11 h-11 rounded-[0.9rem] flex items-center justify-center shrink-0 ${color.bg} ${color.icon}`}>
          <MapPin size={20} strokeWidth={2} aria-hidden="true" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-1.5 min-w-0">
            <span className="text-[15px] font-bold text-primary tracking-tight truncate">{trip.title}</span>
            {(trip.role === 'editor' || trip.role === 'viewer') && (
              <Users size={14} strokeWidth={2} className="shrink-0 text-gray-400 dark:text-white/40" aria-label={t('tripCard.sharedTrip')} />
            )}
          </span>
          <span className="flex items-center gap-2 mt-0.5 text-[12px] font-medium text-muted">
            {isOngoing ? (
              <span className="inline-flex items-center gap-1.5 min-w-0 font-semibold text-success">
                <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                <span className="truncate">
                  {t('tripsOverview.hero.inProgress')} · {t('tripsOverview.hero.dayOf', { day: currentTripDay(trip), total: tripDayCount(trip) })}
                </span>
              </span>
            ) : (
              <span className="truncate tabular-nums">{dateRange}</span>
            )}
          </span>
        </span>
        <ChevronRight size={18} strokeWidth={2.25} className="shrink-0 text-gray-300 dark:text-white/25" aria-hidden="true" />
      </Link>

      <div className="hidden md:flex md:flex-col md:flex-1">
      <div className="flex justify-between items-start mb-5">
        <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center ${color.bg} ${color.icon}`}>
          <MapPin size={24} strokeWidth={2} aria-hidden="true" />
        </div>
        <div className="flex items-center gap-2">
          {isOngoing && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-wash px-2.5 py-1 text-[11px] font-bold text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              {t('tripsOverview.hero.inProgress')}
            </span>
          )}
          {(trip.role === 'editor' || trip.role === 'viewer') && (
            <span title={t('tripCard.sharedTrip')} className="flex items-center text-gray-400 dark:text-white/40">
              <Users size={16} strokeWidth={2} />
            </span>
          )}
          <button
            onClick={handleDelete}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-danger-wash text-red-500 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-500/20 cursor-pointer"
            aria-label={`${t('tripsOverview.delete.title')}: ${trip.title}`}
            title={t('tripsOverview.delete.title')}
          >
            <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>

      <h3 className="text-2xl font-bold mb-2 text-primary tracking-tight truncate min-w-0">
        {trip.title}
      </h3>

      <div className="flex items-center text-[13px] font-bold text-gray-500 gap-2 mb-6">
        <Calendar size={16} strokeWidth={2} aria-hidden="true" />
        <span>
          {format(new Date(trip.startDate), 'd. M.', { locale: dateLocale })} — {format(new Date(trip.endDate), 'd. M. yyyy', { locale: dateLocale })}
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between pt-5 border-t border-subtle">
        <div className="flex items-center gap-3 text-gray-400 text-[12px] font-medium">
          <span>{t('tripsOverview.activities')} {trip.activities?.length || 0}</span>
          {trip.role === 'owner' && (
            <span className="flex items-center gap-1">
              <Heart size={12} strokeWidth={2} aria-hidden="true" />
              {trip.likes || 0}
            </span>
          )}
        </div>
        <Link
          to={`/dashboard/trip/${trip.id}?from=dashboard`}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:text-blue-500 transition-colors min-h-[44px]"
        >
          {t('tripsOverview.open')}
          <ArrowRight size={14} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
      </div>
    </motion.div>
  );
};

export default TripCard;
