import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { cs } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { MapPin, Calendar, Trash2, Clock, Plane, Plus, TrendingUp, ArrowRight, Wallet, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useDialog } from '../ui/DialogModal';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const TripsOverview = ({ trips, onDeleteTrip, onOpenCreateModal }) => {
  const { confirmDialog, ModalPortal } = useDialog();
  const { t, i18n } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('ongoing');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const dateLocale = i18n.language?.startsWith('en') ? enUS : cs;

  const categorizeTrips = (trip) => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const now = new Date();
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
    if (end < now) return 'past';
    if (start <= now && end >= now) return 'ongoing';
    return 'upcoming';
  };

  const filterTrips = (tripList) => {
    return tripList.filter(trip => {
      if (searchQuery && !trip.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (dateFilter) {
        const tripStartStr = format(new Date(trip.startDate), 'yyyy-MM-dd');
        if (tripStartStr !== dateFilter) return false;
      }
      return true;
    });
  };

  const tripsByCategory = {
    ongoing: filterTrips(trips.filter(trip => categorizeTrips(trip) === 'ongoing')),
    upcoming: filterTrips(trips.filter(trip => categorizeTrips(trip) === 'upcoming')),
    past: filterTrips(trips.filter(trip => categorizeTrips(trip) === 'past')),
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    const ok = await confirmDialog({
      title: t('tripsOverview.delete.title'),
      message: t('tripsOverview.delete.message'),
      variant: 'danger',
      confirmLabel: t('tripsOverview.delete.confirm')
    });
    if (ok) {
      onDeleteTrip(id);
      toast.success(t('tripsOverview.delete.success'));
    }
  };

  const allUpcoming = trips.filter(trip => categorizeTrips(trip) === 'upcoming').sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  const nextTrip = allUpcoming[0];
  const daysUntilNextTrip = nextTrip ? Math.ceil(differenceInDays(new Date(nextTrip.startDate), new Date())) : null;

  const totalVisitedPlaces = trips.reduce((acc, t) => acc + (t.activities?.filter(a => a.location)?.length || 0), 0);

  return (
    <div className="space-y-6 sm:space-y-10 w-full pb-10">
      {ModalPortal}
      <div className="flex justify-between items-end">
        <div className="space-y-1 sm:space-y-2">
          <p className="text-[11px] sm:text-[12px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">{t('tripsOverview.subtitle')}</p>
          <h1 className="text-3xl sm:text-4xl text-gray-900 dark:text-white tracking-tight font-bold">{t('tripsOverview.title')}</h1>
        </div>
      </div>

      {/* Smart Dashboard Widgets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, staggerChildren: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-12 gap-6"
      >
        {/* Next Trip Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-6 lg:col-span-5 glass-card p-6 sm:p-8 rounded-[2rem] flex flex-col justify-between min-h-[160px] sm:min-h-[220px] relative overflow-hidden group"
        >
          {nextTrip ? (
            <div className="flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-4 sm:gap-0 h-full">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-[10px] sm:text-[12px] font-bold uppercase tracking-widest mb-2 sm:mb-4 bg-blue-50 dark:bg-blue-500/10 self-start px-3 py-1.5 rounded-full">
                  <Clock size={14} strokeWidth={2.5} className="sm:w-4 sm:h-4" /> {t('tripsOverview.countdown.label')}
                </div>
                <div className="flex items-baseline gap-2 sm:gap-3">
                  <span className="text-5xl sm:text-7xl font-bold tracking-tighter text-gray-900 dark:text-white leading-none">{daysUntilNextTrip > 0 ? daysUntilNextTrip : t('tripsOverview.countdown.today')}</span>
                  {daysUntilNextTrip > 0 && <span className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-widest">{t('tripsOverview.countdown.days')}</span>}
                </div>
              </div>
              <div className="text-right sm:text-left pt-2 sm:pt-4 sm:mt-auto">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1 truncate tracking-tight max-w-[140px] sm:max-w-none">{nextTrip.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-[12px] sm:text-[13px] font-medium">{format(new Date(nextTrip.startDate), 'd. M. yyyy', { locale: dateLocale })}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full space-y-4 py-4 sm:py-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-gray-400">
                <Plane size={24} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">{t('tripsOverview.noTrip.title')}</h3>
                <p className="text-[13px] sm:text-[14px] font-medium text-gray-500">{t('tripsOverview.noTrip.subtitle')}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-6 lg:col-span-4 glass-card rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between group"
        >
          <div>
            <h3 className="text-gray-500 dark:text-gray-400 text-[11px] sm:text-[12px] flex items-center gap-2 mb-4 sm:mb-6 uppercase tracking-widest font-bold">
              <TrendingUp size={16} strokeWidth={2.5} /> {t('tripsOverview.stats.label')}
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:gap-8">
              <div className="space-y-1">
                <span className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-none tracking-tighter">{trips.length}</span>
                <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-widest">{t('tripsOverview.stats.trips')}</p>
              </div>
              <div className="space-y-1">
                <span className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-none tracking-tighter">{totalVisitedPlaces}</span>
                <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-widest">{t('tripsOverview.stats.places')}</p>
              </div>
            </div>
          </div>
          <Link to="/dashboard/statistics" className="text-[12px] sm:text-[13px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors duration-300 flex items-center gap-1.5 mt-6 sm:mt-8 pt-4">
            {t('tripsOverview.stats.link')} <ArrowRight size={16} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-12 lg:col-span-3 flex flex-row lg:flex-col gap-4"
        >
          <button
            onClick={onOpenCreateModal}
            className="hidden sm:flex flex-1 lg:flex-none items-center justify-center gap-2 sm:gap-3 py-5 sm:py-6 lg:py-8 px-4 bg-blue-600 text-white rounded-[2rem] hover:bg-blue-500 transition-all duration-300 shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
          >
            <Plus size={22} strokeWidth={2.5} className="sm:w-6 sm:h-6" />
            <span className="font-bold text-[14px] sm:text-[15px]">{t('tripsOverview.actions.newTrip')}</span>
          </button>
          <Link
            to="/dashboard/budget"
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 sm:gap-3 py-5 sm:py-6 lg:py-8 px-4 glass-card hover:bg-white/80 dark:hover:bg-white/5 transition-all duration-300 active:scale-95"
          >
            <Wallet size={22} strokeWidth={2} className="sm:w-6 sm:h-6" />
            <span className="font-bold text-[14px] sm:text-[15px]">{t('tripsOverview.actions.budget')}</span>
          </Link>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row gap-4 mt-8">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t('tripsOverview.search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-[14px]"
          />
        </div>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-[14px] cursor-pointer"
          />
          {(searchQuery || dateFilter) && (
            <button
              onClick={() => { setSearchQuery(''); setDateFilter(''); }}
              className="flex items-center justify-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl px-4 py-2 transition-all w-full sm:w-auto shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <X size={16} strokeWidth={2.5} /> {t('tripsOverview.filter.reset')}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex w-full justify-between sm:justify-start sm:gap-8 border-b border-gray-200 dark:border-white/10">
        {[
          { id: 'ongoing', label: t('tripsOverview.tabs.ongoing') },
          { id: 'upcoming', label: t('tripsOverview.tabs.upcoming') },
          { id: 'past', label: t('tripsOverview.tabs.past') }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`pb-4 px-1 sm:px-2 text-[13px] sm:text-[15px] font-bold transition-all duration-300 border-b-[3px] relative top-[2px] ${
              activeCategory === cat.id
                ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 border-transparent hover:text-gray-900 dark:hover:text-white'
            } cursor-pointer disabled:cursor-not-allowed`}
          >
            {cat.label} <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400">{tripsByCategory[cat.id].length}</span>
          </button>
        ))}
      </div>

      {/* Trip List */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
        className="flex md:grid overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none no-scrollbar pb-6 md:pb-0 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 -mx-4 px-4 md:mx-0 md:px-0"
      >
        {tripsByCategory[activeCategory].length > 0 ? (
          tripsByCategory[activeCategory].map(trip => (
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              key={trip.id}
              className="min-w-[85vw] sm:min-w-[320px] md:min-w-0 snap-center glass-card hover:-translate-y-2 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] transition-all duration-300 p-6 sm:p-8 relative flex flex-col min-h-[200px] sm:min-h-[220px] group shrink-0"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-[1rem] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <MapPin size={24} strokeWidth={2} />
                </div>
                <button
                  onClick={(e) => handleDelete(trip.id, e)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-500/20 cursor-pointer disabled:cursor-not-allowed"
                  title={t('tripsOverview.delete.title')}
                >
                  <Trash2 size={18} strokeWidth={2} />
                </button>
              </div>

              <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white tracking-tight">{trip.title}</h3>

              <div className="flex items-center text-[13px] font-bold text-gray-500 gap-2 mb-8">
                <Calendar size={16} strokeWidth={2} />
                <span>{format(new Date(trip.startDate), 'd. M.')} — {format(new Date(trip.endDate), 'd. M. yyyy')}</span>
              </div>

              <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-2 text-gray-400 text-[11px] uppercase tracking-widest font-bold">
                  <span>{t('tripsOverview.activities')} {trip.activities?.length || 0}</span>
                </div>
                <Link
                  to={`/dashboard/trip/${trip.id}?from=dashboard`}
                  className="inline-flex items-center gap-1.5 text-[12px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors uppercase tracking-widest"
                >
                  {t('tripsOverview.open')} <ArrowRight size={16} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-10 sm:py-20 text-center glass-card rounded-[2rem] flex flex-col items-center justify-center space-y-4 shadow-none min-h-[50vh] md:min-h-0">
            <p className="text-xl sm:text-2xl text-gray-900 dark:text-white font-bold tracking-tight">{t('tripsOverview.empty.title')}</p>
            <p className="text-[14px] sm:text-[15px] text-gray-500 font-medium max-w-md px-4">{t('tripsOverview.empty.description')}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TripsOverview;
