import { useState } from 'react';
import { format } from 'date-fns';
import { MapPin, Calendar, Trash2, ArrowRight, Search, Filter, X, Users, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useDialog } from '../ui/DialogModal';

const AllTrips = ({ trips, onDeleteTrip }) => {
  const { confirmDialog, ModalPortal } = useDialog();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const categorizeTrip = (trip) => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const now = new Date();
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
    if (end < now) return 'past';
    if (start <= now && end >= now) return 'ongoing';
    return 'upcoming';
  };

  const filteredTrips = trips.filter(trip => {
    if (searchQuery && !trip.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (dateFilter) {
      const tripStartStr = format(new Date(trip.startDate), 'yyyy-MM-dd');
      if (tripStartStr !== dateFilter) return false;
    }
    if (statusFilter !== 'all') {
      if (categorizeTrip(trip) !== statusFilter) return false;
    }
    return true;
  });

  const handleDelete = async (id, e) => {
    e.preventDefault();
    const ok = await confirmDialog({
      title: t('allTrips.delete.title'),
      message: t('allTrips.delete.message'),
      variant: 'danger',
      confirmLabel: t('allTrips.delete.confirm')
    });
    if (ok) {
      onDeleteTrip(id);
      toast.success(t('allTrips.delete.success'));
    }
  };

  return (
    <div className="space-y-8 w-full pb-10">
      {ModalPortal}
      <div className="space-y-2">
        <p className="text-[12px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">{t('allTrips.subtitle')}</p>
        <h1 className="text-4xl text-gray-900 dark:text-white tracking-tight font-bold">{t('allTrips.title')}</h1>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t('allTrips.search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-[15px]"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-[15px] cursor-pointer"
          />
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Filter size={18} className="text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-10 py-2.5 bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-[15px] appearance-none cursor-pointer"
            >
              <option value="all">{t('allTrips.filter.all')}</option>
              <option value="ongoing">{t('allTrips.filter.ongoing')}</option>
              <option value="upcoming">{t('allTrips.filter.upcoming')}</option>
              <option value="past">{t('allTrips.filter.past')}</option>
            </select>
          </div>
          {(searchQuery || dateFilter || statusFilter !== 'all') && (
            <button
              onClick={() => { setSearchQuery(''); setDateFilter(''); setStatusFilter('all'); }}
              className="flex items-center justify-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl px-4 py-2.5 transition-all w-full sm:w-auto shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <X size={16} strokeWidth={2.5} /> {t('allTrips.filter.reset')}
            </button>
          )}
        </div>
      </div>

      {/* Flat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrips.length > 0 ? (
          filteredTrips.map(trip => {
            const status = categorizeTrip(trip);
            const statusColors = {
              ongoing: 'bg-green-500/10 text-green-600 dark:text-green-400',
              upcoming: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
              past: 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
            };
            const statusLabels = {
              ongoing: t('allTrips.filter.ongoing'),
              upcoming: t('allTrips.filter.upcoming'),
              past: t('allTrips.filter.past')
            };

            return (
              <div
                key={trip.id}
                className="glass-card hover:-translate-y-1 transition-transform duration-300 p-6 sm:p-8 relative flex flex-col min-h-[220px] group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-[1rem] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <MapPin size={24} strokeWidth={2} />
                  </div>
                  <div className="flex items-center gap-2">
                    {(trip.role === 'editor' || trip.role === 'viewer') && (
                      <span title={t('tripCard.sharedTrip')} className="flex items-center text-gray-400 dark:text-white/40">
                        <Users size={16} strokeWidth={2} />
                      </span>
                    )}
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${statusColors[status]}`}>
                      {statusLabels[status]}
                    </span>
                    <button
                      onClick={(e) => handleDelete(trip.id, e)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-500/20 cursor-pointer disabled:cursor-not-allowed"
                      title={t('allTrips.delete.title')}
                    >
                      <Trash2 size={14} strokeWidth={2} />
                    </button>
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white tracking-tight">{trip.title}</h3>

                <div className="flex items-center text-[13px] font-bold text-gray-500 gap-2 mb-8">
                  <Calendar size={16} strokeWidth={2} />
                  <span>{format(new Date(trip.startDate), 'd. M.')} — {format(new Date(trip.endDate), 'd. M. yyyy')}</span>
                </div>

                <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-100 dark:border-white/10">
                  <div className="flex items-center gap-3 text-gray-400 text-[11px] uppercase tracking-widest font-bold">
                    <span>{t('allTrips.activities')} {trip.activities?.length || 0}</span>
                    {trip.role === 'owner' && (
                      <span className="flex items-center gap-1 normal-case tracking-normal">
                        <Heart size={12} strokeWidth={2} />
                        {trip.likes || 0}
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/dashboard/trip/${trip.id}?from=all`}
                    className="inline-flex items-center gap-1.5 text-[12px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors uppercase tracking-widest"
                  >
                    {t('allTrips.open')} <ArrowRight size={16} strokeWidth={2.5} />
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center glass-card rounded-[2rem] flex flex-col items-center justify-center space-y-4 shadow-none">
            <p className="text-2xl text-gray-900 dark:text-white font-bold tracking-tight">{t('allTrips.empty.title')}</p>
            <p className="text-[15px] text-gray-500 font-medium max-w-md">{t('allTrips.empty.description')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllTrips;
