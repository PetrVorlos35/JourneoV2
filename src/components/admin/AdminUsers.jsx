import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, Trash2, Shield, ChevronLeft, ChevronRight, Eye, X, MapPin, Calendar, Users, Heart } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import UserAvatar from '../ui/UserAvatar';
import { useDialog } from '../ui/DialogModal';
import { useAuth } from '../../contexts/AuthContext';
import Skeleton, { AdminTableSkeleton } from '../ui/Skeletons';
import useSlideOverA11y from '../../hooks/useSlideOverA11y';

const RoleChip = ({ role }) => (
  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
    role === 'admin' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400'
  }`}>
    {role}
  </span>
);

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const { confirmDialog, ModalPortal } = useDialog();
  const detailPanelRef = useSlideOverA11y(!!selectedUser, () => setSelectedUser(null));

  const fetchUsers = useCallback(async (page = 1, searchQuery = search) => {
    setLoading(true);
    try {
      const result = await api.admin.getUsers({ page, limit: 20, search: searchQuery });
      setUsers(result.users);
      setPagination(result.pagination);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error(t('admin.users.toast.loadError'));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchUsers(1, '');
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1, search);
  };

  const handleChangeRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const ok = await confirmDialog({
      title: newRole === 'admin' ? t('admin.users.dialog.grantTitle') : t('admin.users.dialog.revokeTitle'),
      message: newRole === 'admin'
        ? t('admin.users.dialog.grantMessage')
        : t('admin.users.dialog.revokeMessage'),
      confirmLabel: newRole === 'admin' ? t('admin.users.dialog.grantConfirm') : t('admin.users.dialog.revokeConfirm'),
      variant: newRole === 'admin' ? 'info' : 'danger',
    });
    if (!ok) return;

    try {
      await api.admin.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(newRole === 'admin' ? t('admin.users.toast.granted') : t('admin.users.toast.revoked'));
    } catch (err) {
      toast.error(err.message || t('admin.users.toast.roleError'));
    }
  };

  const handleDeleteUser = async (userId, email) => {
    const ok = await confirmDialog({
      title: t('admin.users.dialog.deleteTitle'),
      message: t('admin.users.dialog.deleteMessage', { email }),
      confirmLabel: t('admin.users.dialog.deleteConfirm'),
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await api.admin.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      toast.success(t('admin.users.toast.deleted'));
      if (selectedUser?.id === userId) setSelectedUser(null);
    } catch (err) {
      toast.error(err.message || t('admin.users.toast.deleteError'));
    }
  };

  const handleViewUser = async (userId) => {
    setDetailLoading(true);
    setSelectedUser({ loading: true });
    try {
      const result = await api.admin.getUser(userId);
      setSelectedUser(result.user);
    } catch (err) {
      toast.error(t('admin.users.toast.detailError'));
      setSelectedUser(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const isSelf = (userId) => currentUser?.id === userId;

  return (
    <div className="space-y-6">
      {ModalPortal}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('admin.users.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm font-medium">{t('admin.users.total', { count: pagination.total })}</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.users.searchPlaceholder')}
              aria-label={t('admin.users.searchPlaceholder')}
              className="pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] text-sm font-medium focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all w-full sm:w-64 placeholder:text-gray-500 dark:placeholder:text-gray-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
          >
            {t('admin.users.searchButton')}
          </button>
        </form>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05, ease: 'easeOut' }}
        className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none overflow-hidden"
      >
        {loading ? (
          <div className="p-4">
            <AdminTableSkeleton rows={8} />
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400 text-sm">
            {t('admin.users.notFound')}
          </div>
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-white/[0.04]">
              {users.map((u) => (
                <div
                  key={u.id}
                  onClick={() => handleViewUser(u.id)}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors active:bg-gray-100 dark:active:bg-white/[0.04] cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={{ first_name: u.firstName, last_name: u.lastName, avatar_url: u.avatarUrl }} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-semibold truncate">
                            {u.firstName ? `${u.firstName} ${u.lastName || ''}` : u.email.split('@')[0]}
                          </p>
                          {u.role === 'admin' && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-full">admin</span>
                          )}
                          {isSelf(u.id) && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-full">{t('admin.users.you')}</span>
                          )}
                        </div>
                        <p className="text-[12px] text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                          <span>{u.tripCount} {t('admin.users.table.trips')}</span>
                          <span>{u.friendCount} {t('admin.users.table.friends')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons on mobile (tapping the card opens detail) */}
                    {!isSelf(u.id) && (
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleChangeRole(u.id, u.role); }}
                          aria-label={u.role === 'admin' ? t('admin.users.tooltips.revokeAdmin') : t('admin.users.tooltips.grantAdmin')}
                          className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
                            u.role === 'admin' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          <Shield size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id, u.email); }}
                          aria-label={t('admin.users.tooltips.deleteUser')}
                          className="w-11 h-11 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-white/[0.06]">
                    <th scope="col" className="px-6 py-4">{t('admin.users.table.user')}</th>
                    <th scope="col" className="px-4 py-4">{t('admin.users.table.email')}</th>
                    <th scope="col" className="px-4 py-4">{t('admin.users.table.role')}</th>
                    <th scope="col" className="px-4 py-4">{t('admin.users.table.trips')}</th>
                    <th scope="col" className="px-4 py-4 hidden lg:table-cell">{t('admin.users.table.friends')}</th>
                    <th scope="col" className="px-4 py-4 hidden xl:table-cell">{t('admin.users.table.registration')}</th>
                    <th scope="col" className="px-4 py-4 text-right">{t('admin.users.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => handleViewUser(u.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={{ first_name: u.firstName, last_name: u.lastName, avatar_url: u.avatarUrl }} size="sm" />
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold truncate max-w-[140px]">
                              {u.firstName ? `${u.firstName} ${u.lastName || ''}` : u.email.split('@')[0]}
                            </span>
                            {isSelf(u.id) && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-full shrink-0">{t('admin.users.you')}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[13px] text-gray-500 dark:text-gray-400">{u.email}</span>
                      </td>
                      <td className="px-4 py-4">
                        <RoleChip role={u.role} />
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[13px] font-semibold tabular-nums">{u.tripCount}</span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-[13px] font-semibold tabular-nums">{u.friendCount}</span>
                      </td>
                      <td className="px-4 py-4 hidden xl:table-cell">
                        <span className="text-[12px] text-gray-500 dark:text-gray-400">{new Date(u.createdAt).toLocaleDateString(i18n.language)}</span>
                      </td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleViewUser(u.id)}
                            className="p-2 rounded-lg hover:bg-blue-500/10 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                            title={t('admin.users.tooltips.viewUser')}
                            aria-label={t('admin.users.tooltips.viewUser')}
                          >
                            <Eye size={16} />
                          </button>
                          {/* Only show role toggle for other users - never for yourself */}
                          {!isSelf(u.id) && (
                            <button
                              onClick={() => handleChangeRole(u.id, u.role)}
                              className={`p-2 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
                                u.role === 'admin'
                                  ? 'hover:bg-red-500/10 text-gray-500 dark:text-gray-400 hover:text-red-500'
                                  : 'hover:bg-amber-500/10 text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400'
                              }`}
                              title={u.role === 'admin' ? t('admin.users.tooltips.revokeAdmin') : t('admin.users.tooltips.grantAdmin')}
                              aria-label={u.role === 'admin' ? t('admin.users.tooltips.revokeAdmin') : t('admin.users.tooltips.grantAdmin')}
                            >
                              <Shield size={16} />
                            </button>
                          )}
                          {!isSelf(u.id) && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
                              title={t('admin.users.tooltips.deleteUser')}
                              aria-label={t('admin.users.tooltips.deleteUser')}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-white/[0.06]">
            <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">
              {t('admin.users.pageMeta', { page: pagination.page, pages: pagination.totalPages, count: pagination.total })}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => fetchUsers(pagination.page - 1, search)}
                disabled={pagination.page <= 1}
                aria-label={t('admin.users.prevPage')}
                className="inline-flex items-center gap-1 min-h-[44px] px-4 rounded-xl text-[12px] font-semibold hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
              >
                <ChevronLeft size={15} /> {t('admin.users.prevPage').replace('← ', '')}
              </button>
              <button
                onClick={() => fetchUsers(pagination.page + 1, search)}
                disabled={pagination.page >= pagination.totalPages}
                aria-label={t('admin.users.nextPage')}
                className="inline-flex items-center gap-1 min-h-[44px] px-4 rounded-xl text-[12px] font-semibold hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
              >
                {t('admin.users.nextPage').replace(' →', '')} <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* User Detail Slide-over */}
      {createPortal(
        <AnimatePresence>
          {selectedUser && (
            <div className="fixed inset-0 z-[100] flex justify-end">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-md"
                onClick={() => setSelectedUser(null)}
              />
              <motion.div
                ref={detailPanelRef}
                role="dialog"
                aria-modal="true"
                aria-label={t('admin.users.detail.dialogLabel')}
                tabIndex={-1}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#111113] border-l border-gray-200 dark:border-white/[0.08] h-full overflow-y-auto z-10 custom-scrollbar shadow-2xl shadow-black/50 focus:outline-none"
              >
                {detailLoading || selectedUser?.loading ? (
                  <div className="p-8 space-y-8">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-16 h-16" rounded="rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-3.5 w-52" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-20 rounded-2xl" />
                      <Skeleton className="h-20 rounded-2xl" />
                    </div>
                    <div className="space-y-3">
                      <Skeleton className="h-16 rounded-2xl" />
                      <Skeleton className="h-16 rounded-2xl" />
                      <Skeleton className="h-16 rounded-2xl" />
                    </div>
                  </div>
                ) : (
                  <div className="p-8 space-y-8">
                    {/* Close button */}
                    <button
                      onClick={() => setSelectedUser(null)}
                      aria-label={t('admin.close')}
                      className="absolute top-6 right-6 p-2.5 rounded-full bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.12] transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                    >
                      <X size={16} className="text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                    </button>

                    {/* User Profile Header */}
                    <div className="flex items-start gap-4 pt-2">
                      <div className="relative">
                        <UserAvatar user={{ first_name: selectedUser.firstName, last_name: selectedUser.lastName, avatar_url: selectedUser.avatarUrl }} size="lg" />
                        {selectedUser.role === 'admin' && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center border-2 border-white dark:border-[#111113]">
                            <Shield size={10} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold tracking-tight truncate">
                          {selectedUser.firstName ? `${selectedUser.firstName} ${selectedUser.lastName || ''}` : t('admin.users.detail.noName')}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{selectedUser.email}</p>
                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                          <RoleChip role={selectedUser.role} />
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(selectedUser.createdAt).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedUser.bio && (
                      <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-white/[0.02] p-4 rounded-xl border border-gray-100 dark:border-white/[0.04] italic">
                        "{selectedUser.bio}"
                      </p>
                    )}

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 rounded-xl bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none border border-gray-200 dark:border-white/[0.06]">
                        <p className="text-xl font-bold tabular-nums">{selectedUser.trips?.length || 0}</p>
                        <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">{t('admin.users.detail.trips')}</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none border border-gray-200 dark:border-white/[0.06]">
                        <p className="text-xl font-bold tabular-nums">{selectedUser.friends?.length || 0}</p>
                        <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">{t('admin.users.detail.friends')}</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none border border-gray-200 dark:border-white/[0.06]">
                        <p className="text-xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
                          {selectedUser.trips?.reduce((sum, trip) => sum + trip.totalExpenses, 0).toLocaleString(i18n.language) || 0}
                        </p>
                        <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">{t('admin.users.detail.totalCzk')}</p>
                      </div>
                    </div>

                    {/* User's Trips */}
                    <div>
                      <h3 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <MapPin size={13} /> {t('admin.users.detail.trips')} ({selectedUser.trips?.length || 0})
                      </h3>
                      <div className="space-y-2">
                        {selectedUser.trips?.length > 0 ? selectedUser.trips.map(trip => (
                          <div key={trip.id} className="p-4 rounded-xl bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none border border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/[0.12] transition-colors duration-200">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-semibold truncate">{trip.title}</p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{trip.startDate} → {trip.endDate}</p>
                              </div>
                              <div className="text-right shrink-0 ml-3">
                                <p className="text-[13px] font-semibold tabular-nums">{trip.totalExpenses.toLocaleString(i18n.language)} Kč</p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-end gap-1"><Heart size={10} /> {trip.likes}</p>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-[13px]">
                            {t('admin.users.detail.noTrips')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* User's Friends */}
                    <div>
                      <h3 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Users size={13} /> {t('admin.users.detail.friends')} ({selectedUser.friends?.length || 0})
                      </h3>
                      <div className="space-y-1.5">
                        {selectedUser.friends?.length > 0 ? selectedUser.friends.map(f => (
                          <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.03] transition-colors">
                            <UserAvatar user={{ first_name: f.firstName, last_name: f.lastName, avatar_url: f.avatarUrl }} size="sm" />
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold truncate">{f.firstName ? `${f.firstName} ${f.lastName || ''}` : f.email}</p>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{f.email}</p>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-[13px]">
                            {t('admin.users.detail.noFriends')}
                          </div>
                        )}
                      </div>
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

export default AdminUsers;
