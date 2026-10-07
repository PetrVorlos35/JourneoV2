import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ChevronRight, Loader2, MapPin, Trash2 } from 'lucide-react';
import api from '../../services/api';
import UserAvatar from '../ui/UserAvatar';
import { useDialog } from '../ui/DialogModal';
import { AdminTableSkeleton } from '../ui/Skeletons';
import {
  MasterDetail, ListToolbar, ListRow, LoadMore, BackToList, DetailSection, Badge, EmptyDetail,
  avatarUser, displayName, formatDate,
} from './adminUi';

const TripDossier = ({ tripId, onDeleted, onBack }) => {
  const { t, i18n } = useTranslation();
  const { confirmDialog, ModalPortal } = useDialog();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.admin.getTrip(tripId)
      .then((r) => { if (alive) setTrip(r.trip); })
      .catch(() => { if (alive) { setTrip(null); toast.error(t('admin.trips.toast.detailError')); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tripId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <div className="flex items-center justify-center min-h-[420px]"><Loader2 className="animate-spin text-gray-400" size={22} /></div>;
  }
  if (!trip) return <EmptyDetail text={t('admin.trips.toast.detailError')} />;

  const remove = async () => {
    const ok = await confirmDialog({
      title: t('admin.trips.dialog.deleteTitle'),
      message: t('admin.trips.dialog.deleteMessage', { title: trip.title }),
      confirmLabel: t('admin.trips.dialog.deleteConfirm'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.admin.deleteTrip(trip.id);
      toast.success(t('admin.trips.toast.deleted'));
      onDeleted(trip.id);
    } catch (err) {
      toast.error(err.message || t('admin.trips.toast.deleteError'));
    }
  };

  const packed = trip.packingList.filter((p) => p.checked).length;
  const facts = [
    { label: t('admin.v2.days'), value: trip.activities.length },
    { label: t('admin.v2.expenses'), value: trip.expenses.length },
    { label: t('admin.v2.packing'), value: trip.packingList.length ? `${packed}/${trip.packingList.length}` : 0 },
    { label: t('admin.v2.documents'), value: trip.documents.length },
    { label: t('admin.v2.likes'), value: trip.likes },
  ];

  return (
    <div className="pb-8">
      {ModalPortal}
      <BackToList onClick={onBack} label={t('admin.v2.back')} />

      <header className="px-5 sm:px-8 pt-6 sm:pt-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {trip.inTrash && <Badge tone="red">{t('admin.v2.inTrash')}</Badge>}
        </div>
        <h2 className="text-[24px] sm:text-[28px] font-bold tracking-tight leading-tight text-primary break-words" style={{ textWrap: 'balance' }}>
          {trip.title}
        </h2>
        <p className="mt-1 text-[14px] font-medium text-secondary tabular-nums">
          {formatDate(trip.startDate, i18n.language)} – {formatDate(trip.endDate, i18n.language)}
          <span className="mx-2 text-gray-300 dark:text-gray-600">·</span>
          {t('tripDetail.notebook.days', { count: trip.durationDays + 1 })}
        </p>

        <Link
          to={`/dashboard/admin/users?user=${trip.user.id}`}
          className="group mt-5 flex items-center gap-3 py-2"
        >
          <UserAvatar user={avatarUser(trip.user)} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-medium text-muted">{t('admin.v2.owner')}</span>
            <span className="block text-[14px] font-semibold text-primary truncate group-hover:underline underline-offset-2">
              {displayName(trip.user, trip.user.email)}
            </span>
          </span>
          <ChevronRight size={16} className="text-gray-400" />
        </Link>

        <dl className="mt-5 grid grid-cols-3 sm:grid-cols-5 gap-x-4 gap-y-4 pt-5 border-t border-dashed border-gray-300 dark:border-white/15">
          {facts.map((f) => (
            <div key={f.label} className="flex flex-col min-w-0">
              <dt className="order-last mt-1 text-[12px] font-medium text-muted truncate">{f.label}</dt>
              <dd className="text-[22px] font-bold leading-none tabular-nums text-primary">{f.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <DetailSection title={t('admin.v2.itinerary')} count={trip.activities.length}>
        {trip.activities.length === 0 ? (
          <p className="py-3 text-[14px] text-muted">{t('admin.v2.noItinerary')}</p>
        ) : (
          <ol>
            {trip.activities.map((a, i) => (
              <li key={a.id} className="flex gap-4 py-3 border-b border-gray-100 dark:border-white/[0.06] last:border-b-0">
                <span className="w-12 shrink-0 text-[12px] font-semibold text-muted pt-0.5 tabular-nums">
                  {t('admin.v2.dayN', { n: (a.dayIndex ?? i) + 1 })}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-primary">{a.title || '—'}</span>
                  {a.location && (
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-medium text-muted">
                      <MapPin size={12} strokeWidth={2.25} /> {a.location}
                    </span>
                  )}
                  {a.plan && <span className="mt-1 block text-[13px] text-secondary whitespace-pre-wrap line-clamp-3">{a.plan}</span>}
                </span>
              </li>
            ))}
          </ol>
        )}
      </DetailSection>

      <div className="px-5 sm:px-8 pt-8">
        <button
          type="button"
          onClick={remove}
          className="inline-flex items-center gap-2 h-10 px-3 -ml-3 rounded-xl text-[14px] font-semibold text-danger hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <Trash2 size={16} strokeWidth={2.25} /> {t('admin.v2.deleteTrip')}
        </button>
      </div>
    </div>
  );
};

const AdminTrips = () => {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('trip');
  const [trips, setTrips] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const debounceRef = useRef(null);

  const fetchPage = useCallback(async (nextPage, query, append) => {
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const r = await api.admin.getTrips({ page: nextPage, limit: 30, search: query });
      setTrips((prev) => (append ? [...prev, ...r.trips] : r.trips));
      setPage(r.pagination.page);
      setTotalPages(r.pagination.totalPages);
      setTotal(r.pagination.total);
    } catch {
      toast.error(t('admin.trips.toast.loadError'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [t]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPage(1, search, false), search ? 300 : 0);
    return () => clearTimeout(debounceRef.current);
  }, [search, fetchPage]);

  const select = (id) => setSearchParams(id ? { trip: String(id) } : {});

  useEffect(() => {
    if (!selectedId && trips.length && window.matchMedia('(min-width: 1024px)').matches) {
      setSearchParams({ trip: String(trips[0].id) }, { replace: true });
    }
  }, [selectedId, trips, setSearchParams]);

  const list = (
    <>
      <ListToolbar value={search} onChange={setSearch} placeholder={t('admin.v2.searchTrips')} />
      <p className="px-4 py-2 text-[13px] font-medium text-muted border-b border-subtle tabular-nums">
        {t('admin.trips.total', { count: total })}
      </p>
      {loading ? (
        <div className="p-4"><AdminTableSkeleton rows={8} /></div>
      ) : trips.length === 0 ? (
        <p className="py-12 text-center text-[14px] text-muted">{t('admin.trips.notFound')}</p>
      ) : (
        <ul className="lg:max-h-[calc(100dvh-18rem)] lg:overflow-y-auto custom-scrollbar">
          {trips.map((trip) => (
            <ListRow key={trip.id} selected={String(trip.id) === selectedId} onClick={() => select(trip.id)}>
              <UserAvatar user={avatarUser(trip.user)} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-primary truncate">{trip.title}</span>
                  {trip.inTrash && <Badge tone="red">{t('admin.v2.inTrash')}</Badge>}
                </span>
                <span className="block text-[12px] font-medium text-muted truncate">
                  {displayName(trip.user, trip.user.email)}
                </span>
              </span>
              <span className="shrink-0 text-right text-[12px] font-medium tabular-nums text-secondary">
                {formatDate(trip.startDate, i18n.language)}
              </span>
            </ListRow>
          ))}
        </ul>
      )}
      <LoadMore visible={!loading && page < totalPages} loading={loadingMore} onClick={() => fetchPage(page + 1, search, true)} label={t('admin.v2.loadMore')} />
    </>
  );

  const detail = selectedId ? (
    <TripDossier
      key={selectedId}
      tripId={selectedId}
      onBack={() => select(null)}
      onDeleted={(id) => {
        setTrips((prev) => prev.filter((tr) => tr.id !== id));
        setTotal((n) => n - 1);
        select(null);
      }}
    />
  ) : (
    <EmptyDetail text={t('admin.v2.selectTrip')} />
  );

  return <MasterDetail list={list} detail={detail} hasSelection={!!selectedId} />;
};

export default AdminTrips;
