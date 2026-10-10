import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronRight, Heart, Loader2, Shield, Trash2 } from 'lucide-react';
import api from '../../services/api';
import UserAvatar from '../ui/UserAvatar';
import { useDialog } from '../ui/DialogModal';
import { useAuth } from '../../contexts/AuthContext';
import { AdminTableSkeleton } from '../ui/Skeletons';
import {
  MasterDetail, ListToolbar, ListRow, LoadMore, BackToList, DetailSection, Badge, EmptyDetail,
  avatarUser, displayName, formatDate,
} from './adminUi';

const SORTS = {
  newest: { sort: 'created_at', order: 'desc' },
  name: { sort: 'first_name', order: 'asc' },
  email: { sort: 'email', order: 'asc' },
};

const UserDossier = ({ userId, onSelectUser, onChanged, onDeleted, onBack }) => {
  const { t, i18n } = useTranslation();
  const { user: me } = useAuth();
  const { confirmDialog, ModalPortal } = useDialog();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.admin.getUser(userId)
      .then((r) => { if (alive) setUser(r.user); })
      .catch(() => { if (alive) { setUser(null); toast.error(t('admin.users.toast.detailError')); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <div className="flex items-center justify-center min-h-[420px]"><Loader2 className="animate-spin text-gray-400" size={22} /></div>;
  }
  if (!user) return <EmptyDetail text={t('admin.users.toast.detailError')} />;

  const isSelf = Number(me?.id) === Number(user.id);
  const isAdmin = user.role === 'admin';

  const toggleRole = async () => {
    const newRole = isAdmin ? 'user' : 'admin';
    const ok = await confirmDialog({
      title: newRole === 'admin' ? t('admin.users.dialog.grantTitle') : t('admin.users.dialog.revokeTitle'),
      message: newRole === 'admin' ? t('admin.users.dialog.grantMessage') : t('admin.users.dialog.revokeMessage'),
      confirmLabel: newRole === 'admin' ? t('admin.users.dialog.grantConfirm') : t('admin.users.dialog.revokeConfirm'),
      variant: newRole === 'admin' ? 'info' : 'danger',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api.admin.updateUserRole(user.id, newRole);
      setUser((u) => ({ ...u, role: newRole }));
      onChanged({ id: user.id, role: newRole });
      toast.success(newRole === 'admin' ? t('admin.users.toast.granted') : t('admin.users.toast.revoked'));
    } catch (err) {
      toast.error(err.message || t('admin.users.toast.roleError'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const ok = await confirmDialog({
      title: t('admin.users.dialog.deleteTitle'),
      message: t('admin.users.dialog.deleteMessage', { email: user.email }),
      confirmLabel: t('admin.users.dialog.deleteConfirm'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.admin.deleteUser(user.id);
      toast.success(t('admin.users.toast.deleted'));
      onDeleted(user.id);
    } catch (err) {
      toast.error(err.message || t('admin.users.toast.deleteError'));
    }
  };

  return (
    <div className="pb-8">
      {ModalPortal}
      <BackToList onClick={onBack} label={t('admin.v2.back')} />

      <header className="px-5 sm:px-8 pt-6 sm:pt-8">
        <div className="flex items-center gap-4">
          <UserAvatar user={avatarUser(user)} size="lg" />
          <div className="min-w-0">
            <h2 className="text-[24px] sm:text-[28px] font-bold tracking-tight leading-tight text-primary break-words">
              {displayName(user, t('admin.users.detail.noName'))}
            </h2>
            <p className="text-[14px] font-medium text-secondary break-all">{user.email}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {isAdmin && <Badge tone="amber">Admin</Badge>}
          <Badge tone={user.isVerified ? 'green' : 'amber'}>{user.isVerified ? t('admin.v2.verified') : t('admin.v2.unverifiedEmail')}</Badge>
          <span className="text-[13px] font-medium text-muted">{t('admin.v2.registered', { date: formatDate(user.createdAt, i18n.language) })}</span>
        </div>
        {user.bio && <p className="mt-3 text-[14px] text-secondary">{user.bio}</p>}

        {isSelf ? (
          <p className="mt-5 text-[13px] font-medium text-muted">{t('admin.v2.self')}</p>
        ) : (
          <button
            type="button"
            onClick={toggleRole}
            disabled={busy}
            className="mt-5 inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-default text-[14px] font-semibold text-plan hover:bg-field disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Shield size={16} strokeWidth={2.25} className="text-amber-600 dark:text-amber-400" />
            {isAdmin ? t('admin.v2.removeAdmin') : t('admin.v2.makeAdmin')}
          </button>
        )}
      </header>

      <DetailSection title={t('admin.v2.tripCount')} count={user.trips.length}>
        {user.trips.length === 0 ? (
          <p className="py-3 text-[14px] text-muted">{t('admin.users.detail.noTrips')}</p>
        ) : (
          <ul>
            {user.trips.map((trip) => (
              <li key={trip.id}>
                <Link
                  to={`/dashboard/admin/trips?trip=${trip.id}`}
                  className="group flex items-center gap-3 py-3 border-b border-gray-100 dark:border-white/[0.06] last:border-b-0"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-primary truncate group-hover:underline underline-offset-2">{trip.title}</span>
                      {trip.inTrash && <Badge tone="red">{t('admin.v2.inTrash')}</Badge>}
                    </span>
                    <span className="block text-[12px] font-medium text-muted tabular-nums">
                      {formatDate(trip.startDate, i18n.language)} – {formatDate(trip.endDate, i18n.language)}
                    </span>
                  </span>
                  {trip.likes > 0 && (
                    <span className="inline-flex items-center gap-1 text-[13px] font-medium tabular-nums text-secondary">
                      <Heart size={13} strokeWidth={2.25} /> {trip.likes}
                    </span>
                  )}
                  <ChevronRight size={16} className="text-gray-400 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title={t('admin.v2.friendCount')} count={user.friends.length}>
        {user.friends.length === 0 ? (
          <p className="py-3 text-[14px] text-muted">{t('admin.users.detail.noFriends')}</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            {user.friends.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => onSelectUser(f.id)}
                  className="w-full flex items-center gap-3 py-2.5 text-left border-b border-gray-100 dark:border-white/[0.06] cursor-pointer group"
                >
                  <UserAvatar user={avatarUser(f)} size="sm" />
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-primary truncate group-hover:underline underline-offset-2">{displayName(f, t('admin.users.detail.noName'))}</span>
                    <span className="block text-[12px] font-medium text-muted truncate">{f.email}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      {!isSelf && (
        <div className="px-5 sm:px-8 pt-8">
          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center gap-2 h-10 px-3 -ml-3 rounded-xl text-[14px] font-semibold text-danger hover:bg-danger-wash transition-colors cursor-pointer"
          >
            <Trash2 size={16} strokeWidth={2.25} /> {t('admin.v2.deleteAccount')}
          </button>
        </div>
      )}
    </div>
  );
};

const AdminUsers = () => {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('user');
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const debounceRef = useRef(null);

  const fetchPage = useCallback(async (nextPage, query, sort, append) => {
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const r = await api.admin.getUsers({ page: nextPage, limit: 30, search: query, ...SORTS[sort] });
      setUsers((prev) => (append ? [...prev, ...r.users] : r.users));
      setPage(r.pagination.page);
      setTotalPages(r.pagination.totalPages);
      setTotal(r.pagination.total);
    } catch {
      toast.error(t('admin.users.toast.loadError'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [t]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPage(1, search, sortKey, false), search ? 300 : 0);
    return () => clearTimeout(debounceRef.current);
  }, [search, sortKey, fetchPage]);

  const select = (id) => setSearchParams(id ? { user: String(id) } : {});

  // Na desktopu je karta vždy otevřená — bez výběru vezme prvního v seznamu.
  useEffect(() => {
    if (!selectedId && users.length && window.matchMedia('(min-width: 1024px)').matches) {
      setSearchParams({ user: String(users[0].id) }, { replace: true });
    }
  }, [selectedId, users, setSearchParams]);

  const list = (
    <>
      <ListToolbar value={search} onChange={setSearch} placeholder={t('admin.v2.searchUsers')}>
        <div className="relative shrink-0">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            aria-label={t('admin.v2.sortLabel')}
            className="h-10 pl-3 pr-8 rounded-xl appearance-none bg-field border border-default text-base sm:text-[14px] font-semibold text-plan cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-[#1C1C1E]"
          >
            <option value="newest">{t('admin.v2.sortNewest')}</option>
            <option value="name">{t('admin.v2.sortName')}</option>
            <option value="email">{t('admin.v2.sortEmail')}</option>
          </select>
          <ChevronDown size={14} strokeWidth={2.5} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </ListToolbar>
      <p className="px-4 py-2 text-[13px] font-medium text-muted border-b border-subtle tabular-nums">
        {t('admin.users.total', { count: total })}
      </p>
      {loading ? (
        <div className="p-4"><AdminTableSkeleton rows={8} /></div>
      ) : users.length === 0 ? (
        <p className="py-12 text-center text-[14px] text-muted">{t('admin.users.notFound')}</p>
      ) : (
        <ul className="lg:max-h-[calc(100dvh-18rem)] lg:overflow-y-auto custom-scrollbar">
          {users.map((u) => (
            <ListRow key={u.id} selected={String(u.id) === selectedId} onClick={() => select(u.id)}>
              <UserAvatar user={avatarUser(u)} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-primary truncate">{displayName(u, t('admin.users.detail.noName'))}</span>
                  {u.role === 'admin' && <Badge tone="amber">Admin</Badge>}
                </span>
                <span className="block text-[12px] font-medium text-muted truncate">{u.email}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-[13px] font-semibold tabular-nums text-plan">{u.tripCount}</span>
                <span className="block text-[11px] font-medium text-muted tabular-nums">
                  {u.isVerified === false ? t('admin.v2.unverifiedShort') : formatDate(u.createdAt, i18n.language)}
                </span>
              </span>
            </ListRow>
          ))}
        </ul>
      )}
      <LoadMore visible={!loading && page < totalPages} loading={loadingMore} onClick={() => fetchPage(page + 1, search, sortKey, true)} label={t('admin.v2.loadMore')} />
    </>
  );

  const detail = selectedId ? (
    <UserDossier
      key={selectedId}
      userId={selectedId}
      onBack={() => select(null)}
      onSelectUser={select}
      onChanged={(patch) => setUsers((prev) => prev.map((u) => (u.id === patch.id ? { ...u, ...patch } : u)))}
      onDeleted={(id) => {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setTotal((n) => n - 1);
        select(null);
      }}
    />
  ) : (
    <EmptyDetail text={t('admin.v2.selectUser')} />
  );

  return <MasterDetail list={list} detail={detail} hasSelection={!!selectedId} />;
};

export default AdminUsers;
