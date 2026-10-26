import { useState } from 'react';
import { format, differenceInCalendarDays } from 'date-fns';
import { MapPin, Calendar, Trash2, ArrowRight, Search, Filter, X, Users, Heart, ChevronRight, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTripColor } from '../../utils/tripColor';
import { currentTripDay, tripDayCount } from '../../utils/trip';
import EmptyShowcase, { PreviewPaper, PlanFirstTripButton } from './EmptyShowcase';

// Ukázka seznamu výletů pro prázdný stav.
const SAMPLE_TRIPS = [
  { id: 'upcoming', dot: 'bg-blue-500', chip: 'bg-active text-active' },
  { id: 'ongoing', dot: 'bg-emerald-500', chip: 'bg-success-wash text-success' },
  { id: 'past', dot: 'bg-gray-400', chip: 'bg-subtle text-secondary' },
];

const TripsPreview = ({ t }) => (
  <PreviewPaper>
    <ul className="mt-3 divide-y divide-gray-100 dark:divide-white/5">
      {SAMPLE_TRIPS.map((trip) => (
        <li key={trip.id} className="flex items-center gap-3 py-3">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${trip.dot}`} />
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-semibold text-primary truncate">{t(`allTrips.noTrips.samples.${trip.id}.title`)}</span>
            <span className="block text-[12px] font-medium text-muted truncate">{t(`allTrips.noTrips.samples.${trip.id}.meta`)}</span>
          </span>
          <span className={`shrink-0 text-[12px] font-semibold px-2.5 py-1 rounded-full ${trip.chip}`}>
            {t(`allTrips.noTrips.samples.${trip.id}.status`)}
          </span>
        </li>
      ))}
    </ul>
  </PreviewPaper>
);

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

  const statusCounts = trips.reduce(
    (acc, trip) => ({ ...acc, [categorizeTrip(trip)]: acc[categorizeTrip(trip)] + 1 }),
    { ongoing: 0, upcoming: 0, past: 0 },
  );
  // Prázdné kategorie na mobilu nenabízíme — štítek, který vždy vrátí nic,
  // jen zabírá místo v už tak úzké řadě.
  const statusChips = ['all', 'ongoing', 'upcoming', 'past'].filter((key) => key === 'all' || statusCounts[key] > 0);

  return (
    <div className="space-y-4 md:space-y-8 w-full pb-6 md:pb-10">
      <div className="flex items-center md:items-end justify-between gap-4">
        <div className="space-y-1 sm:space-y-2 min-w-0">
          <p className="hidden sm:block text-[13px] text-muted font-medium">{t('allTrips.subtitle')}</p>
          <h1 className="text-[28px] sm:text-4xl text-primary tracking-tight font-bold truncate">{t('allTrips.title')}</h1>
        </div>
        <Link
          to="/dashboard/trash"
          className="inline-flex items-center gap-1.5 min-h-[44px] text-[13px] font-semibold text-muted hover:text-primary hover:bg-subtle rounded-xl px-3 -mr-3 md:mr-0 transition-all shrink-0"
        >
          <Trash2 size={15} strokeWidth={2.5} aria-hidden="true" /> {t('allTrips.trash')}
        </Link>
      </div>

      {/* Filter Bar — bez výletů nemá co filtrovat */}
      {/* Mobil: hledání, pod ním stavové štítky s počty (jeden tap místo
          rozbalovacího menu) a řazení jako hlavička seznamu. */}
      {trips.length > 0 && (
        <div className="md:hidden space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              placeholder={t('allTrips.search.placeholder')}
              aria-label={t('allTrips.search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-page border border-default rounded-2xl focus:outline-none focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/15 transition-colors font-medium text-base text-primary placeholder:text-placeholder"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4" role="group" aria-label={t('allTrips.filter.all')}>
            {statusChips.map((key) => {
              const active = statusFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  aria-pressed={active}
                  className={`shrink-0 inline-flex items-center min-h-[40px] px-3 rounded-full text-[13px] font-semibold border transition-colors active:scale-[0.97] cursor-pointer ${
                    active
                      ? 'bg-active text-active border-blue-200 dark:border-blue-400/30'
                      : 'bg-page border-gray-200/80 dark:border-white/10 text-soft'
                  }`}
                >
                  {t(`allTrips.filter.${key}`)}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-[13px] font-semibold text-muted">
              {t('allTrips.count', { count: filteredTrips.length })}
            </p>
            <label className="relative inline-flex items-center">
              <span className="sr-only">{t('allTrips.sort.dateDesc')}</span>
              <ArrowUpDown size={14} className="absolute left-0 text-gray-400 pointer-events-none" aria-hidden="true" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-transparent pl-5 pr-5 min-h-[40px] text-[13px] font-semibold text-primary focus:outline-none cursor-pointer"
              >
                <option value="date-desc">{t('allTrips.sort.dateDesc')}</option>
                <option value="date-asc">{t('allTrips.sort.dateAsc')}</option>
                <option value="name-asc">{t('allTrips.sort.nameAz')}</option>
              </select>
              <ChevronRight size={13} strokeWidth={2.5} className="absolute right-0 rotate-90 text-gray-400 pointer-events-none" aria-hidden="true" />
            </label>
          </div>
        </div>
      )}

      {trips.length > 0 && (
      <div className="hidden md:flex glass-card p-4 rounded-2xl flex-row gap-4">
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

        <div className="flex flex-row gap-4 w-auto">
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
              className="flex items-center justify-center gap-1.5 text-sm font-semibold text-muted hover:text-primary hover:bg-subtle rounded-xl px-4 py-2.5 transition-all shrink-0 cursor-pointer"
            >
              <X size={16} strokeWidth={2.5} /> {t('allTrips.filter.reset')}
            </button>
          )}
        </div>
      </div>
      )}

      {/* Grid */}
      {trips.length === 0 ? (
        <EmptyShowcase
          title={t('allTrips.noTrips.title')}
          lead={t('allTrips.noTrips.description')}
          actions={<PlanFirstTripButton />}
          preview={<TripsPreview t={t} />}
        />
      ) : filteredTrips.length === 0 ? (
        <div className="py-14 sm:py-20 text-center glass-card rounded-[2rem] flex flex-col items-center justify-center space-y-4 shadow-none px-4">
          <p className="text-2xl text-primary font-bold tracking-tight">{t('allTrips.empty.title')}</p>
          <p className="text-[15px] text-muted font-medium max-w-md">{t('allTrips.empty.description')}</p>
        </div>
      ) : (
        <>
        {/* Mobil: seznam řádků. Celý řádek otevírá výlet, mazání je tlumené
            tlačítko na konci (s možností vrátit zpět) místo červeného kolečka. */}
        <ul className="md:hidden space-y-2.5">
          {filteredTrips.map((trip) => {
            const status = categorizeTrip(trip);
            const color = getTripColor(trip.title);
            const tripDays = tripDayCount(trip);
            const statusText = status === 'ongoing'
              ? t('allTrips.filter.ongoing')
              : status === 'upcoming'
                ? t('allTrips.startsIn', { count: Math.max(differenceInCalendarDays(new Date(trip.startDate), new Date()), 1) })
                : null;
            const shared = trip.role === 'editor' || trip.role === 'viewer';
            return (
              <li key={trip.id} className="glass-card flex items-center">
                <Link
                  to={`/dashboard/trip/${trip.id}?from=all`}
                  className="flex-1 min-w-0 flex items-center gap-3 p-3.5 pr-1 rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                >
                  <span className={`w-11 h-11 rounded-[0.9rem] ${color.bg} ${color.icon} flex items-center justify-center shrink-0 ${status === 'past' ? 'opacity-60' : ''}`}>
                    <MapPin size={20} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[15px] font-bold text-primary tracking-tight truncate">{trip.title}</span>
                      {shared && <Users size={14} strokeWidth={2} className="shrink-0 text-gray-400 dark:text-white/40" aria-label={t('allTrips.shared')} />}
                    </span>
                    <span className="flex items-center gap-1.5 mt-0.5 text-[12px] font-medium text-muted min-w-0">
                      {statusText && (
                        <span className={`shrink-0 inline-flex items-center gap-1 font-semibold ${status === 'ongoing' ? 'text-success' : 'text-accent'}`}>
                          {status === 'ongoing' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />}
                          {statusText}
                          <span className="text-gray-300 dark:text-white/20 font-normal" aria-hidden="true">·</span>
                        </span>
                      )}
                      <span className="truncate tabular-nums">
                        {status === 'ongoing'
                          ? t('tripsOverview.hero.dayOf', { day: currentTripDay(trip), total: tripDays })
                          : `${format(new Date(trip.startDate), 'd. M.')} – ${format(new Date(trip.endDate), 'd. M. yyyy')} · ${t('allTrips.dayCount', { count: tripDays })}`}
                      </span>
                    </span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => onDeleteTrip(trip.id)}
                  className="w-11 h-11 mr-1.5 shrink-0 flex items-center justify-center rounded-xl text-gray-400 dark:text-gray-500 active:bg-danger-wash active:text-red-500 transition-colors cursor-pointer"
                  aria-label={`${t('allTrips.delete.title')}: ${trip.title}`}
                >
                  <Trash2 size={17} strokeWidth={2} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map(trip => {
            const status = categorizeTrip(trip);
            const color = getTripColor(trip.title);
            const tripDays = tripDayCount(trip);

            const statusColors = {
              ongoing:  'bg-green-500/10 text-green-600 dark:text-green-400',
              upcoming: 'bg-blue-500/10 text-accent',
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
                className="glass-card hover:-translate-y-1 transition-transform duration-300 p-8 relative flex flex-col min-h-[220px] group"
              >
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-[1rem] ${color.bg} ${color.icon} flex items-center justify-center shrink-0`}>
                    <MapPin size={24} strokeWidth={2} />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {(trip.role === 'editor' || trip.role === 'viewer') && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-muted bg-subtle px-2 py-0.5 rounded-full">
                        <Users size={11} strokeWidth={2} aria-hidden="true" />
                        {t('allTrips.shared')}
                      </span>
                    )}
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${statusColors[status]}`}>
                      {statusLabels[status]}
                    </span>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteTrip(trip.id); }}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-danger-wash text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-500/20 cursor-pointer"
                      aria-label={t('allTrips.delete.title')}
                    >
                      <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold mb-2 text-primary tracking-tight truncate min-w-0">{trip.title}</h2>

                <div className="flex items-center text-[13px] font-medium text-muted gap-2 mb-5 sm:mb-8">
                  <Calendar size={15} strokeWidth={2} aria-hidden="true" />
                  <span>{format(new Date(trip.startDate), 'd. M.')} — {format(new Date(trip.endDate), 'd. M. yyyy')}</span>
                </div>

                <div className="mt-auto flex items-center justify-between pt-4 sm:pt-6 border-t border-subtle">
                  <div className="flex items-center gap-3 text-[12px] font-medium text-gray-400 dark:text-gray-500">
                    <span>{tripDays} {t('allTrips.days')}</span>
                    {trip.role === 'owner' && trip.likes > 0 && (
                      <span className="flex items-center gap-1">
                        <Heart size={12} strokeWidth={2} aria-hidden="true" />
                        {trip.likes}
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent group-hover:text-blue-500 transition-colors">
                    {t('allTrips.open')} <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
};

export default AllTrips;
