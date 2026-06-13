import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, Trash2, ChevronLeft, ChevronRight, Calendar, DollarSign, Heart, MapPin, Eye, X, Package, FileText, CheckSquare, Square, Clock } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import UserAvatar from '../ui/UserAvatar';
import { useDialog } from '../ui/DialogModal';

const CATEGORY_EMOJIS = {
  transport: '🚗',
  accommodation: '🏨',
  food: '🍽️',
  activities: '🎯',
  other: '📦',
};

const AdminTrips = () => {
  const { t, i18n } = useTranslation();
  const [trips, setTrips] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const { confirmDialog, ModalPortal } = useDialog();

  const fetchTrips = useCallback(async (page = 1, searchQuery = search) => {
    setLoading(true);
    try {
      const result = await api.admin.getTrips({ page, limit: 20, search: searchQuery });
      setTrips(result.trips);
      setPagination(result.pagination);
    } catch (err) {
      console.error('Failed to fetch trips:', err);
      toast.error(t('admin.trips.toast.loadError'));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTrips(1, '');
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTrips(1, search);
  };

  const handleDeleteTrip = async (tripId, title) => {
    const ok = await confirmDialog({
      title: t('admin.trips.dialog.deleteTitle'),
      message: t('admin.trips.dialog.deleteMessage', { title }),
      confirmLabel: t('admin.trips.dialog.deleteConfirm'),
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await api.admin.deleteTrip(tripId);
      setTrips(prev => prev.filter(t => t.id !== tripId));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      toast.success(t('admin.trips.toast.deleted'));
      if (selectedTrip?.id === tripId) setSelectedTrip(null);
    } catch (err) {
      toast.error(err.message || t('admin.trips.toast.deleteError'));
    }
  };

  const handleViewTrip = async (tripId) => {
    setDetailLoading(true);
    setSelectedTrip({ loading: true });
    try {
      const result = await api.admin.getTrip(tripId);
      setSelectedTrip(result.trip);
    } catch (err) {
      toast.error(t('admin.trips.toast.detailError'));
      setSelectedTrip(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalTripExpenses = (trip) => trip.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

  return (
    <div className="space-y-6">
      {ModalPortal}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">{t('admin.trips.title')}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">{t('admin.trips.total', { count: pagination.total })}</p>
        </div>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.trips.searchPlaceholder')}
              className="pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] text-sm font-medium focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all w-64 placeholder:text-gray-600"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-gray-900 dark:text-white text-sm font-bold hover:shadow-lg hover:shadow-orange-500/20 transition-all active:scale-95 cursor-pointer"
          >
            {t('admin.trips.searchButton')}
          </button>
        </form>
      </motion.div>

      {/* Trips Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none backdrop-blur-xl overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : trips.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            {t('admin.trips.notFound')}
          </div>
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="md:hidden divide-y divide-white/[0.04]">
              {trips.map((trip, i) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => handleViewTrip(trip.id)}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors active:bg-gray-200 dark:active:bg-white/[0.04] cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold truncate">{trip.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <UserAvatar user={{ first_name: trip.user.firstName, last_name: trip.user.lastName, avatar_url: trip.user.avatarUrl }} size="xs" />
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{trip.user.firstName ? `${trip.user.firstName} ${trip.user.lastName || ''}` : trip.user.email}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {trip.durationDays}d</span>
                        <span className="flex items-center gap-1"><DollarSign size={12} /> {trip.totalExpenses.toLocaleString(i18n.language)} Kč</span>
                        <span className="flex items-center gap-1"><Heart size={12} /> {trip.likes}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleViewTrip(trip.id); }}
                        className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center cursor-pointer"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTrip(trip.id, trip.title); }}
                        className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200 dark:border-white/[0.06]">
                    <th className="px-6 py-4">{t('admin.trips.table.trip')}</th>
                    <th className="px-4 py-4">{t('admin.trips.table.user')}</th>
                    <th className="px-4 py-4">{t('admin.trips.table.period')}</th>
                    <th className="px-4 py-4">{t('admin.trips.table.days')}</th>
                    <th className="px-4 py-4 hidden lg:table-cell">{t('admin.trips.table.activities')}</th>
                    <th className="px-4 py-4">{t('admin.trips.table.expenses')}</th>
                    <th className="px-4 py-4 hidden lg:table-cell">{t('admin.trips.table.likes')}</th>
                    <th className="px-4 py-4 text-right">{t('admin.trips.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {trips.map((trip, i) => (
                    <motion.tr
                      key={trip.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => handleViewTrip(trip.id)}
                    >
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-bold">{trip.title}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <UserAvatar user={{ first_name: trip.user.firstName, last_name: trip.user.lastName, avatar_url: trip.user.avatarUrl }} size="xs" />
                          <div>
                            <p className="text-[12px] font-bold truncate max-w-[120px]">
                              {trip.user.firstName ? `${trip.user.firstName} ${trip.user.lastName || ''}` : trip.user.email.split('@')[0]}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate max-w-[120px]">{trip.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[12px] text-gray-500 dark:text-gray-400">{trip.startDate} → {trip.endDate}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[13px] font-bold">{trip.durationDays}</span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-[13px] font-bold">{trip.activityCount}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[13px] font-bold text-orange-400">{trip.totalExpenses.toLocaleString(i18n.language)} Kč</span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-[13px] font-bold flex items-center gap-1"><Heart size={12} className="text-red-400" /> {trip.likes}</span>
                      </td>
                      <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleViewTrip(trip.id)}
                            className="p-2 rounded-lg hover:bg-blue-500/10 text-gray-500 dark:text-gray-400 hover:text-blue-400 transition-colors cursor-pointer"
                            title={t('admin.trips.tooltips.viewTrip')}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTrip(trip.id, trip.title)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                            title={t('admin.trips.tooltips.deleteTrip')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-white/[0.06]">
            <p className="text-[12px] text-gray-500 font-medium">
              {t('admin.trips.pageMeta', { page: pagination.page, pages: pagination.totalPages, count: pagination.total })}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => fetchTrips(pagination.page - 1, search)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 rounded-lg text-[12px] font-bold hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {t('admin.trips.prevPage')}
              </button>
              <button
                onClick={() => fetchTrips(pagination.page + 1, search)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-lg text-[12px] font-bold hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {t('admin.trips.nextPage')}
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Trip Detail Slide-over */}
      {createPortal(
        <AnimatePresence>
          {selectedTrip && (
            <div className="fixed inset-0 z-[100] flex justify-end">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-md"
                onClick={() => setSelectedTrip(null)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                className="relative w-full max-w-xl bg-white dark:bg-[#111113] border-l border-gray-200 dark:border-white/[0.08] h-full overflow-y-auto z-10 custom-scrollbar shadow-2xl shadow-black/50"
              >
                {detailLoading || selectedTrip?.loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="p-8 space-y-6">
                    {/* Close button */}
                    <button
                      onClick={() => setSelectedTrip(null)}
                      className="absolute top-6 right-6 p-2.5 rounded-full bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:bg-white/[0.12] transition-colors cursor-pointer group"
                    >
                      <X size={16} className="text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:text-white transition-colors" />
                    </button>

                    {/* Trip Header */}
                    <div className="pt-2">
                      <h2 className="text-2xl font-black tracking-tight pr-12">{selectedTrip.title}</h2>
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <span className="text-[12px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 bg-gray-100 dark:bg-white/[0.04] px-3 py-1.5 rounded-lg">
                          <Calendar size={13} /> {selectedTrip.startDate} → {selectedTrip.endDate}
                        </span>
                        <span className="text-[12px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 bg-gray-100 dark:bg-white/[0.04] px-3 py-1.5 rounded-lg">
                          <Clock size={13} /> {selectedTrip.durationDays} {t('admin.trips.detail.daysLabel')}
                        </span>
                        <span className="text-[12px] text-red-400 flex items-center gap-1.5 bg-red-500/10 px-3 py-1.5 rounded-lg font-bold">
                          <Heart size={13} /> {selectedTrip.likes}
                        </span>
                      </div>
                      {/* Owner */}
                      <div className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none border border-gray-200 dark:border-white/[0.06]">
                        <UserAvatar user={{ first_name: selectedTrip.user?.firstName, last_name: selectedTrip.user?.lastName, avatar_url: selectedTrip.user?.avatarUrl }} size="sm" />
                        <div>
                          <p className="text-[12px] font-bold">
                            {selectedTrip.user?.firstName ? `${selectedTrip.user.firstName} ${selectedTrip.user.lastName || ''}` : selectedTrip.user?.email}
                          </p>
                          <p className="text-[11px] text-gray-500">{selectedTrip.user?.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center p-3 rounded-xl bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none border border-gray-200 dark:border-white/[0.06]">
                        <p className="text-lg font-black">{selectedTrip.activities?.length || 0}</p>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{t('admin.trips.detail.daysLabel')}</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none border border-gray-200 dark:border-white/[0.06]">
                        <p className="text-lg font-black text-orange-400">{totalTripExpenses(selectedTrip).toLocaleString(i18n.language)}</p>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Kč</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none border border-gray-200 dark:border-white/[0.06]">
                        <p className="text-lg font-black">{selectedTrip.packingList?.length || 0}</p>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{t('admin.trips.detail.packingLabel')}</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none border border-gray-200 dark:border-white/[0.06]">
                        <p className="text-lg font-black">{selectedTrip.documents?.length || 0}</p>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{t('admin.trips.detail.notesLabel')}</p>
                      </div>
                    </div>

                    {/* Itinerary / Activities */}
                    {selectedTrip.activities?.length > 0 && (
                      <div>
                        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <MapPin size={13} /> {t('tripDetail.tabs.itinerary')} ({selectedTrip.activities.length} {t('admin.trips.detail.daysLabel')})
                        </h3>
                        <div className="space-y-2">
                          {selectedTrip.activities.map((a, i) => (
                            <div key={a.id} className="p-4 rounded-xl bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none border border-gray-200 dark:border-white/[0.06]">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                  <span className="text-[11px] font-black text-blue-400">{i + 1}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-[13px] font-bold truncate">{a.title || `Den ${i + 1}`}</p>
                                    <span className="text-[10px] text-gray-500 shrink-0">{a.date}</span>
                                  </div>
                                  {a.location && (
                                    <p className="text-[11px] text-orange-400 mt-0.5 flex items-center gap-1">
                                      <MapPin size={10} /> {a.location}
                                    </p>
                                  )}
                                  {a.plan && (
                                    <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed whitespace-pre-wrap">{a.plan}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expenses */}
                    {selectedTrip.expenses?.length > 0 && (
                      <div>
                        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <DollarSign size={13} /> {t('budget.title')} ({selectedTrip.expenses.length} {t('budget.items')} · {totalTripExpenses(selectedTrip).toLocaleString(i18n.language)} Kč)
                        </h3>
                        <div className="space-y-1.5">
                          {selectedTrip.expenses.map(e => {
                            const catEmoji = CATEGORY_EMOJIS[e.category] || CATEGORY_EMOJIS.other;
                            const catLabel = t(`budget.categories.${e.category}`) || t('budget.categories.other');
                            return (
                              <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none border border-gray-200 dark:border-white/[0.06]">
                                <span className="text-lg">{catEmoji}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-bold truncate">{e.description}</p>
                                  <p className="text-[10px] text-gray-500">{catLabel}{e.date ? ` · ${e.date}` : ''}</p>
                                </div>
                                <span className="text-[13px] font-bold text-orange-400 shrink-0">{e.amount.toLocaleString(i18n.language)} Kč</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Packing List */}
                    {selectedTrip.packingList?.length > 0 && (
                      <div>
                        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Package size={13} /> {t('admin.trips.detail.packingLabel')} ({selectedTrip.packingList.filter(p => p.checked).length}/{selectedTrip.packingList.length})
                        </h3>
                        <div className="grid grid-cols-2 gap-1.5">
                          {selectedTrip.packingList.map(p => (
                            <div key={p.id} className={`flex items-center gap-2 p-2.5 rounded-lg text-[12px] ${
                              p.checked ? 'text-gray-500 line-through bg-gray-50 dark:bg-white/[0.02]' : 'text-gray-600 dark:text-gray-300 bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none'
                            }`}>
                              {p.checked ? <CheckSquare size={14} className="text-green-500 shrink-0" /> : <Square size={14} className="text-gray-600 shrink-0" />}
                              <span className="truncate">{p.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents */}
                    {selectedTrip.documents?.length > 0 && (
                      <div>
                        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <FileText size={13} /> {t('admin.trips.detail.notesLabel')} ({selectedTrip.documents.length})
                        </h3>
                        <div className="space-y-2">
                          {selectedTrip.documents.map(d => (
                            <div key={d.id} className="p-4 rounded-xl bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none border border-gray-200 dark:border-white/[0.06]">
                              <p className="text-[13px] font-bold mb-2">{d.title}</p>
                              <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{d.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty state if nothing */}
                    {!selectedTrip.activities?.length && !selectedTrip.expenses?.length && !selectedTrip.packingList?.length && !selectedTrip.documents?.length && (
                      <div className="text-center py-12 text-gray-600">
                        <MapPin size={32} className="mx-auto mb-3 opacity-50" />
                        <p className="text-[13px]">{t('admin.trips.detail.empty')}</p>
                      </div>
                    )}

                    {/* Delete button at bottom */}
                    <div className="pt-4 border-t border-gray-200 dark:border-white/[0.06]">
                      <button
                        onClick={() => handleDeleteTrip(selectedTrip.id, selectedTrip.title)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors font-bold text-[13px] cursor-pointer"
                      >
                        <Trash2 size={16} />
                        {t('admin.trips.detail.deleteButton')}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default AdminTrips;
