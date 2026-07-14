import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Trash2, Calendar, ArrowLeft, RotateCcw, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useDialog } from '../ui/DialogModal';
import api from '../../services/api';
import { ContentSkeleton } from '../ui/Skeletons';

const RETENTION_DAYS = 30;

const daysLeft = (deletedAt) => {
  const purgeAt = new Date(deletedAt).getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return Math.max(Math.ceil((purgeAt - Date.now()) / (24 * 60 * 60 * 1000)), 0);
};

// Trash view: trips soft-deleted within the last 30 days. Restore brings a
// trip back fully intact; "Delete forever" / "Empty trash" purge immediately.
const Trash = ({ onTripsChanged }) => {
  const { confirmDialog, ModalPortal } = useDialog();
  const { t } = useTranslation();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const fetchTrash = useCallback(async () => {
    try {
      const data = await api.trips.getTrash();
      setTrips(data.trips);
    } catch (err) {
      toast.error(err.message || t('trash.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const handleRestore = async (trip) => {
    setBusyId(trip.id);
    try {
      await api.trips.restore(trip.id);
      setTrips(prev => prev.filter(tr => tr.id !== trip.id));
      onTripsChanged?.();
      toast.success(t('trash.restored'));
    } catch (err) {
      toast.error(err.message || t('trash.error'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteForever = async (trip) => {
    const ok = await confirmDialog({
      title: t('trash.confirmForever.title'),
      message: t('trash.confirmForever.message', { title: trip.title }),
      variant: 'danger',
      confirmLabel: t('trash.confirmForever.confirm'),
    });
    if (!ok) return;

    setBusyId(trip.id);
    try {
      await api.trips.deleteForever(trip.id);
      setTrips(prev => prev.filter(tr => tr.id !== trip.id));
      toast.success(t('trash.deletedForever'));
    } catch (err) {
      toast.error(err.message || t('trash.error'));
    } finally {
      setBusyId(null);
    }
  };

  const handleEmptyTrash = async () => {
    const ok = await confirmDialog({
      title: t('trash.confirmEmpty.title'),
      message: t('trash.confirmEmpty.message'),
      variant: 'danger',
      confirmLabel: t('trash.confirmEmpty.confirm'),
    });
    if (!ok) return;

    try {
      await api.trips.emptyTrash();
      setTrips([]);
      toast.success(t('trash.emptied'));
    } catch (err) {
      toast.error(err.message || t('trash.error'));
    }
  };

  if (loading) return <ContentSkeleton />;

  return (
    <div className="space-y-8 w-full pb-10">
      {ModalPortal}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-1 sm:space-y-2">
          <Link
            to="/dashboard/all-trips"
            className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={2.5} aria-hidden="true" /> {t('trash.backToTrips')}
          </Link>
          <h1 className="text-3xl sm:text-4xl text-gray-900 dark:text-white tracking-tight font-bold">{t('trash.title')}</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">{t('trash.subtitle')}</p>
        </div>

        {trips.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 font-semibold text-[14px] hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors shrink-0 cursor-pointer min-h-[44px]"
          >
            <Trash2 size={16} strokeWidth={2.5} aria-hidden="true" />
            {t('trash.emptyTrash')}
          </button>
        )}
      </div>

      {trips.length === 0 ? (
        <div className="py-14 sm:py-20 text-center glass-card rounded-[2rem] flex flex-col items-center justify-center space-y-4 shadow-none px-4">
          <div className="w-14 h-14 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-gray-400">
            <Trash2 size={26} strokeWidth={2} aria-hidden="true" />
          </div>
          <p className="text-2xl text-gray-900 dark:text-white font-bold tracking-tight">{t('trash.empty.title')}</p>
          <p className="text-[15px] text-gray-500 dark:text-gray-400 font-medium max-w-md">{t('trash.empty.description')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map(trip => {
            const remaining = daysLeft(trip.deletedAt);
            const busy = busyId === trip.id;

            return (
              <div key={trip.id} className="glass-card p-6 sm:p-8 flex flex-col min-h-[200px]">
                <div className="flex justify-between items-start mb-5">
                  <div className="w-12 h-12 rounded-[1rem] bg-gray-100 dark:bg-white/5 text-gray-400 flex items-center justify-center shrink-0">
                    <Trash2 size={22} strokeWidth={2} aria-hidden="true" />
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Clock size={11} strokeWidth={2.5} aria-hidden="true" />
                    {t('trash.daysLeft', { count: remaining })}
                  </span>
                </div>

                <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white tracking-tight truncate min-w-0">{trip.title}</h2>

                <div className="flex items-center text-[13px] font-medium text-gray-500 dark:text-gray-400 gap-2">
                  <Calendar size={15} strokeWidth={2} aria-hidden="true" />
                  <span>{format(new Date(trip.startDate), 'd. M.')} — {format(new Date(trip.endDate), 'd. M. yyyy')}</span>
                </div>
                <p className="text-[12px] font-medium text-gray-400 dark:text-gray-500 mt-1">
                  {t('trash.deletedOn', { date: format(new Date(trip.deletedAt), 'd. M. yyyy') })}
                </p>

                <div className="mt-auto flex items-center gap-3 pt-6 border-t border-gray-100 dark:border-white/10">
                  <button
                    onClick={() => handleRestore(trip)}
                    disabled={busy}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    <RotateCcw size={14} strokeWidth={2.5} aria-hidden="true" />
                    {t('trash.restore')}
                  </button>
                  <button
                    onClick={() => handleDeleteForever(trip)}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 text-[13px] font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    {t('trash.deleteForever')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Trash;
