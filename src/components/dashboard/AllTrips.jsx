import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { MapPin, Calendar, Trash2, ArrowRight, Search, Filter, X, Users, Heart, ChevronRight, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CARD_COLORS = [
  { bg: 'bg-blue-50 dark:bg-blue-500/10',     icon: 'text-blue-600 dark:text-blue-400'   },
  { bg: 'bg-violet-50 dark:bg-violet-500/10',  icon: 'text-violet-600 dark:text-violet-400' },
  { bg: 'bg-emerald-50 dark:bg-emerald-500/10',icon: 'text-emerald-600 dark:text-emerald-400' },
  { bg: 'bg-amber-50 dark:bg-amber-500/10',    icon: 'text-amber-600 dark:text-amber-400'  },
  { bg: 'bg-rose-50 dark:bg-rose-500/10',      icon: 'text-rose-600 dark:text-rose-400'   },
  { bg: 'bg-cyan-50 dark:bg-cyan-500/10',      icon: 'text-cyan-600 dark:text-cyan-400'   },
  { bg: 'bg-orange-50 dark:bg-orange-500/10',  icon: 'text-orange-600 dark:text-orange-400' },
  { bg: 'bg-indigo-50 dark:bg-indigo-500/10',  icon: 'text-indigo-600 dark:text-indigo-400' },
];

const getTripColor = (title = '') => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash + title.charCodeAt(i)) | 0;
  }
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
};

const AllTrips = ({ trips, onDeleteTrip }) => {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  const categorizeTrip = (trip) => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const now = new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    if (end < now) return 'past';
    if (start <= now && end >= now) return 'ongoing';
    return 'upcoming';
  };

  const filteredTrips = trips
    .filter(trip => {
      if (searchQuery && !trip.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (statusFilter !== 'all' && categorizeTrip(trip) !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':  return new Date(a.startDate) - new Date(b.startDate);
        case 'name-asc':  return a.title.localeCompare(b.title);
        default:          return new Date(b.startDate) - new Date(a.startDate);
      }
    });

  const hasActiveFilters = searchQuery || statusFilter !== 'all';

  return (
    <div className="space-y-8 w-full pb-10">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1 sm:space-y-2 min-w-0">
          <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">{t('allTrips.subtitle')}</p>
          <h1 className="text-3xl sm:text-4xl text-gray-900 dark:text-white tracking-tight font-bold truncate">{t('allTrips.title')}</h1>
        </div>
        <Link
          to="/dashboard/trash"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl px-3 py-2.5 transition-all shrink-0"
        >
          <Trash2 size={15} strokeWidth={2.5} aria-hidden="true" /> {t('allTrips.trash')}
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t('allTrips.search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-base sm:text-[14px]"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
          {/* Status filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Filter size={16} className="text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-10 py-2.5 bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-base sm:text-[14px] appearance-none cursor-pointer h-full w-full sm:w-auto"
            >
              <option value="all">{t('allTrips.filter.all')}</option>
              <option value="ongoing">{t('allTrips.filter.ongoing')}</option>
              <option value="upcoming">{t('allTrips.filter.upcoming')}</option>
              <option value="past">{t('allTrips.filter.past')}</option>
            </select>
            <ChevronRight size={14} strokeWidth={2.5} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <ArrowUpDown size={16} className="text-gray-400" />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-9 pr-10 py-2.5 bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-base sm:text-[14px] appearance-none cursor-pointer h-full w-full sm:w-auto"
            >
              <option value="date-desc">{t('allTrips.sort.dateDesc')}</option>
              <option value="date-asc">{t('allTrips.sort.dateAsc')}</option>
              <option value="name-asc">{t('allTrips.sort.nameAz')}</option>
            </select>
            <ChevronRight size={14} strokeWidth={2.5} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
              className="flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl px-4 py-2.5 transition-all shrink-0 cursor-pointer"
            >
              <X size={16} strokeWidth={2.5} /> {t('allTrips.filter.reset')}
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {trips.length === 0 ? (
        <div className="py-14 sm:py-20 text-center glass-card rounded-[2rem] flex flex-col items-center justify-center space-y-4 shadow-none px-4">
          <p className="text-2xl text-gray-900 dark:text-white font-bold tracking-tight">{t('allTrips.noTrips.title')}</p>
          <p className="text-[15px] text-gray-500 dark:text-gray-400 font-medium max-w-md">{t('allTrips.noTrips.description')}</p>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="py-14 sm:py-20 text-center glass-card rounded-[2rem] flex flex-col items-center justify-center space-y-4 shadow-none px-4">
          <p className="text-2xl text-gray-900 dark:text-white font-bold tracking-tight">{t('allTrips.empty.title')}</p>
          <p className="text-[15px] text-gray-500 dark:text-gray-400 font-medium max-w-md">{t('allTrips.empty.description')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map(trip => {
            const status = categorizeTrip(trip);
            const color = getTripColor(trip.title);
            const tripDays = Math.max(differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) + 1, 1);

            const statusColors = {
              ongoing:  'bg-green-500/10 text-green-600 dark:text-green-400',
              upcoming: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
              past:     'bg-gray-500/10 text-gray-600 dark:text-gray-400',
            };
            const statusLabels = {
              ongoing:  t('allTrips.filter.ongoing'),
              upcoming: t('allTrips.filter.upcoming'),
              past:     t('allTrips.filter.past'),
            };

            return (
              <Link
                key={trip.id}
                to={`/dashboard/trip/${trip.id}?from=all`}
                className="glass-card hover:-translate-y-1 transition-transform duration-300 p-6 sm:p-8 relative flex flex-col min-h-[220px] group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-12 h-12 rounded-[1rem] ${color.bg} ${color.icon} flex items-center justify-center shrink-0`}>
                    <MapPin size={24} strokeWidth={2} />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {(trip.role === 'editor' || trip.role === 'viewer') && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                        <Users size={11} strokeWidth={2} aria-hidden="true" />
                        {t('allTrips.shared')}
                      </span>
                    )}
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${statusColors[status]}`}>
                      {statusLabels[status]}
                    </span>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteTrip(trip.id); }}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-500/20 cursor-pointer"
                      aria-label={t('allTrips.delete.title')}
                    >
                      <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white tracking-tight truncate min-w-0">{trip.title}</h2>

                <div className="flex items-center text-[13px] font-medium text-gray-500 dark:text-gray-400 gap-2 mb-8">
                  <Calendar size={15} strokeWidth={2} aria-hidden="true" />
                  <span>{format(new Date(trip.startDate), 'd. M.')} — {format(new Date(trip.endDate), 'd. M. yyyy')}</span>
                </div>

                <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-100 dark:border-white/10">
                  <div className="flex items-center gap-3 text-[12px] font-medium text-gray-400 dark:text-gray-500">
                    <span>{tripDays} {t('allTrips.days')}</span>
                    {trip.role === 'owner' && trip.likes > 0 && (
                      <span className="flex items-center gap-1">
                        <Heart size={12} strokeWidth={2} aria-hidden="true" />
                        {trip.likes}
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-500 transition-colors">
                    {t('allTrips.open')} <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AllTrips;
