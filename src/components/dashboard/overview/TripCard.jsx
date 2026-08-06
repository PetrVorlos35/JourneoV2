import { format } from 'date-fns';
import { cs, enUS } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Trash2, ArrowRight, Users, Heart } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, useReducedMotion } from 'framer-motion';
import { getTripColor } from '../../../utils/tripColor';
import { categorizeTrip } from '../../../utils/trip';

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
      className="glass-card hover:-translate-y-2 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] transition-all duration-300 p-6 sm:p-8 relative flex flex-col min-h-[200px] sm:min-h-[220px] group"
    >
      <div className="flex justify-between items-start mb-5">
        <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center ${color.bg} ${color.icon}`}>
          <MapPin size={24} strokeWidth={2} aria-hidden="true" />
        </div>
        <div className="flex items-center gap-2">
          {isOngoing && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
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
            className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-500/20 cursor-pointer"
            aria-label={`${t('tripsOverview.delete.title')}: ${trip.title}`}
            title={t('tripsOverview.delete.title')}
          >
            <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>

      <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-white tracking-tight truncate min-w-0">
        {trip.title}
      </h3>

      <div className="flex items-center text-[13px] font-bold text-gray-500 gap-2 mb-6">
        <Calendar size={16} strokeWidth={2} aria-hidden="true" />
        <span>
          {format(new Date(trip.startDate), 'd. M.', { locale: dateLocale })} — {format(new Date(trip.endDate), 'd. M. yyyy', { locale: dateLocale })}
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between pt-5 border-t border-gray-100 dark:border-white/10">
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
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors min-h-[44px]"
        >
          {t('tripsOverview.open')}
          <ArrowRight size={14} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </motion.div>
  );
};

export default TripCard;
