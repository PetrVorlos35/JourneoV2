import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Trash2, Loader2, ChevronDown, Link as LinkIcon, Copy, Check, RefreshCw, UserPlus, Share2, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../ui/UserAvatar';
import { track } from '../../utils/analytics';
import Skeleton from '../ui/Skeleton';

const ROLES = ['editor', 'viewer'];

const RoleSelect = ({ value, onChange, disabled, t, label }) => (
  <div className="relative shrink-0">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-label={label}
      className="appearance-none h-10 bg-subtle border border-default text-secondary font-semibold rounded-xl pl-3 pr-8 text-[16px] sm:text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-gray-200 dark:hover:bg-white/15"
    >
      {ROLES.map((r) => (
        <option key={r} value={r} className="bg-white text-primary dark:bg-gray-900">
          {t(`shareModal.roles.${r}`)}
        </option>
      ))}
    </select>
    <ChevronDown size={14} strokeWidth={2.5} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
  </div>
);

/** Odkaz v poli s tlačítkem Kopírovat; plné tlačítko jen u hlavní akce. */
const LinkField = ({ url, copied, onCopy, t, primary = false }) => (
  <div className="flex items-center gap-2 min-w-0 bg-field border border-default rounded-2xl pl-4 pr-1.5 py-1.5">
    <span className="flex-1 min-w-0 text-[13px] text-secondary font-mono truncate select-all">
      {url.replace(/^https?:\/\//, '')}
    </span>
    <button
      onClick={onCopy}
      className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] font-semibold transition-all active:scale-95 cursor-pointer ${
        primary
          ? 'bg-accent text-white hover:bg-accent-hover shadow-[0_6px_16px_-8px_rgba(37,99,235,0.7)]'
          : 'bg-page border border-default text-primary hover:bg-subtle'
      }`}
    >
      {copied ? <Check size={14} strokeWidth={2.75} /> : <Copy size={14} strokeWidth={2.25} />}
      {copied ? t('shareModal.copied') : t('shareModal.copy')}
    </button>
  </div>
);

const ShareTripModal = ({ isOpen, onClose, trip, onInvited }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('viewer');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [shareToken, setShareToken] = useState(trip?.shareToken || null);
  const [isTogglingLink, setIsTogglingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [inviteToken, setInviteToken] = useState(null);
  const [inviteState, setInviteState] = useState('idle'); // idle | loading | error
  const [inviteCopied, setInviteCopied] = useState(false);

  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  const loadData = useCallback(async () => {
    if (!trip?.id) return;
    setIsLoadingData(true);
    try {
      const [{ friends: f }, { collaborators: c }] = await Promise.all([
        api.friends.getAll(),
        api.trips.getCollaborators(trip.id),
      ]);
      setFriends(f);
      setCollaborators(c);
    } catch {
      // silently fail — toast on specific operations
    } finally {
      setIsLoadingData(false);
    }
  }, [trip?.id]);

  // Zvací odkaz se načte (případně založí) hned při otevření: pozvat partu
  // je hlavní důvod, proč sem lidi chodí, tak ať je odkaz rovnou po ruce.
  const loadInvite = useCallback(async () => {
    if (!trip?.id) return;
    setInviteState('loading');
    try {
      const { token } = await api.trips.getInviteLink(trip.id);
      setInviteToken(token);
      setInviteState('idle');
    } catch {
      setInviteState('error');
    }
  }, [trip?.id]);

  useEffect(() => {
    if (isOpen) {
      loadInvite();
      loadData();
      setInviteCopied(false);
      setLinkCopied(false);
      setSearchQuery('');
      setSelectedRole('viewer');
      setShowDropdown(false);
    }
  }, [isOpen, loadInvite, loadData]);

  // Veřejný odkaz se mění jen tady v modalu; seznam výletů v rodiči o změně
  // neví, proto se z trip.shareToken převezme jen při přechodu na jiný výlet.
  useEffect(() => {
    setShareToken(trip?.shareToken || null);
  }, [trip?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKey);
      document.addEventListener('mousedown', handleClick);
    }
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen, onClose]);

  const collabIds = new Set(collaborators.map((c) => String(c.id)));

  const filteredFriends = searchQuery.trim()
    ? friends.filter((f) => {
        const name = `${f.first_name ?? ''} ${f.last_name ?? ''}`.toLowerCase();
        const email = (f.email ?? '').toLowerCase();
        const q = searchQuery.toLowerCase();
        return (name.includes(q) || email.includes(q)) && !collabIds.has(String(f.id));
      })
    : [];

  const handleAdd = async (friend) => {
    setAddingId(friend.id);
    try {
      await api.trips.share(trip.id, friend.id, selectedRole);
      const { collaborators: updated } = await api.trips.getCollaborators(trip.id);
      setCollaborators(updated);
      setSearchQuery('');
      setShowDropdown(false);
      onInvited?.();
      toast.success(t('shareModal.addedSuccess', { name: `${friend.first_name} ${friend.last_name}` }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAddingId(null);
    }
  };

  const handleRoleChange = async (collab, newRole) => {
    setUpdatingId(collab.id);
    try {
      await api.trips.updateShare(trip.id, collab.id, newRole);
      setCollaborators((prev) => prev.map((c) => (c.id === collab.id ? { ...c, role: newRole } : c)));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (collab) => {
    setRemovingId(collab.id);
    try {
      await api.trips.removeShare(trip.id, collab.id);
      setCollaborators((prev) => prev.filter((c) => c.id !== collab.id));
      toast.success(t('shareModal.removedSuccess'));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRemovingId(null);
    }
  };

  // ── Zvací odkaz ─────────────────────────────────────────────
  const inviteUrl = inviteToken ? `${window.location.origin}/join/${inviteToken}` : null;
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      toast.error(t('shareModal.invite.copyError'));
      return false;
    }
  };

  const handleCopyInvite = async () => {
    if (!inviteUrl || !(await copyText(inviteUrl))) return;
    setInviteCopied(true);
    track('invite_link_shared', { via: 'copy' });
    onInvited?.();
    toast.success(t('shareModal.linkCopied'));
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.share({
        title: trip?.title,
        text: t('shareModal.invite.shareText', { trip: trip?.title }),
        url: inviteUrl,
      });
      track('invite_link_shared', { via: 'native' });
      onInvited?.();
    } catch {
      // Zavřený systémový dialog není chyba.
    }
  };

  const handleRevokeInvite = async () => {
    setInviteState('loading');
    try {
      await api.trips.revokeInviteLink(trip.id);
      setInviteToken(null);
      setInviteState('idle');
      toast.success(t('shareModal.invite.revoked'));
    } catch (err) {
      setInviteState('idle');
      toast.error(err.message);
    }
  };

  // ── Veřejný odkaz jen pro čtení ─────────────────────────────
  const shareUrl = shareToken ? `${window.location.origin}/share/${shareToken}` : null;

  const handleTogglePublic = async () => {
    setIsTogglingLink(true);
    try {
      if (shareToken) {
        await api.trips.revokeShareLink(trip.id);
        setShareToken(null);
      } else {
        const { token } = await api.trips.generateShareLink(trip.id);
        setShareToken(token);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsTogglingLink(false);
    }
  };

  const handleCopyPublic = async () => {
    if (!shareUrl || !(await copyText(shareUrl))) return;
    track('share_link_copied');
    setLinkCopied(true);
    toast.success(t('shareModal.linkCopied'));
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const sectionTitle = 'text-[15px] font-bold tracking-tight text-primary';
  const sectionHint = 'text-[13px] font-medium text-muted mt-0.5';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/20 dark:bg-black/70 backdrop-blur-md dark:backdrop-blur-sm cursor-pointer"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="relative w-full max-w-[880px] z-10 flex flex-col bg-page border border-subtle rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl shadow-black/10 dark:shadow-black/60 overflow-hidden max-h-[90dvh]"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-6 sm:pt-7 pb-5 border-b border-subtle shrink-0">
              <div className="min-w-0">
                <h2 id="share-modal-title" className="text-primary font-bold text-[22px] leading-tight tracking-tight">
                  {t('shareModal.title')}
                </h2>
                <p className="text-muted text-[14px] font-medium mt-1 truncate">{trip?.title}</p>
              </div>
              <button
                onClick={onClose}
                aria-label={t('common.close')}
                className="w-11 h-11 -mr-2 -mt-1 shrink-0 flex items-center justify-center rounded-2xl text-muted hover:text-primary hover:bg-field transition-colors cursor-pointer"
              >
                <X size={20} strokeWidth={2.25} />
              </button>
            </div>

            {/* Body: vlevo kdo jede, vpravo odkazy */}
            <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 md:divide-x divide-gray-100 dark:divide-white/5">

              {/* ── Kdo jede ── */}
              <section className="px-6 sm:px-8 py-6 order-2 md:order-1 border-t md:border-t-0 border-subtle">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className={sectionTitle}>{t('shareModal.people.title')}</h3>
                  <span className="text-[13px] font-semibold text-muted tabular-nums">{collaborators.length + 1}</span>
                </div>

                <ul className="mt-3 space-y-1">
                  <li className="flex items-center gap-3 py-2">
                    <UserAvatar user={user} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-primary truncate">
                        {user?.first_name} {user?.last_name} <span className="font-medium text-muted">· {t('shareModal.people.you')}</span>
                      </p>
                      <p className="text-[12px] font-medium text-muted truncate">{user?.email}</p>
                    </div>
                    <span className="shrink-0 text-[13px] font-semibold text-muted px-3">{t('shareModal.roles.owner')}</span>
                  </li>

                  {isLoadingData && collaborators.length === 0 ? (
                    <li aria-hidden="true" className="flex items-center gap-3 py-2.5">
                      <Skeleton className="w-9 h-9 shrink-0" rounded="rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-8 w-20" rounded="rounded-xl" />
                    </li>
                  ) : (
                    <AnimatePresence initial={false}>
                      {collaborators.map((collab) => {
                        const isUpdating = updatingId === collab.id;
                        const isRemoving = removingId === collab.id;
                        return (
                          <motion.li
                            key={collab.id}
                            layout
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: isRemoving ? 0.5 : 1, y: 0 }}
                            exit={{ opacity: 0, x: -16 }}
                            className="group flex items-center gap-3 py-2"
                          >
                            <UserAvatar user={collab} size="md" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-semibold text-primary truncate">
                                {collab.first_name} {collab.last_name}
                              </p>
                              <p className="text-[12px] font-medium text-muted truncate">{collab.email}</p>
                            </div>
                            {isUpdating ? (
                              <Loader2 size={15} className="text-muted animate-spin mx-3" />
                            ) : (
                              <RoleSelect
                                value={collab.role}
                                onChange={(newRole) => handleRoleChange(collab, newRole)}
                                disabled={isRemoving}
                                t={t}
                                label={t('shareModal.people.roleFor', { name: collab.first_name })}
                              />
                            )}
                            <button
                              onClick={() => handleRemove(collab)}
                              disabled={isRemoving || !!updatingId}
                              aria-label={t('shareModal.people.remove', { name: collab.first_name })}
                              className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl text-muted hover:text-danger hover:bg-danger-wash md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-all cursor-pointer disabled:pointer-events-none"
                            >
                              {isRemoving ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} strokeWidth={2} />}
                            </button>
                          </motion.li>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </ul>

                {!isLoadingData && collaborators.length === 0 && (
                  <p className="mt-1 text-[13px] font-medium text-muted">{t('shareModal.people.empty')}</p>
                )}

                {/* Přidat z přátel */}
                <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/5">
                  <p className="text-[13px] font-semibold text-muted mb-2.5">{t('shareModal.addSection')}</p>
                  <div className="flex gap-2">
                    <div className="flex-1 min-w-0 relative">
                      <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                        {addingId
                          ? <Loader2 size={15} className="text-muted animate-spin" />
                          : <Search size={15} className="text-muted" strokeWidth={2.5} />}
                      </div>
                      <input
                        ref={searchRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        placeholder={t('shareModal.searchPlaceholder')}
                        className="w-full h-10 bg-field border border-default text-primary placeholder:text-placeholder text-base sm:text-[14px] font-medium rounded-xl pl-9 pr-3 focus:outline-none focus:bg-page focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                      />

                      <AnimatePresence>
                        {showDropdown && searchQuery.trim() && (
                          <motion.div
                            ref={dropdownRef}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-page border border-default rounded-2xl overflow-hidden z-20 shadow-[0_12px_32px_-12px_rgba(17,24,39,0.25)]"
                          >
                            {filteredFriends.length > 0 ? filteredFriends.map((friend) => (
                              <button
                                key={friend.id}
                                onClick={() => handleAdd(friend)}
                                disabled={!!addingId}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-field transition-colors text-left disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                              >
                                <UserAvatar user={friend} size="sm" />
                                <div className="min-w-0">
                                  <p className="text-primary text-[13px] font-semibold truncate">
                                    {friend.first_name} {friend.last_name}
                                  </p>
                                  <p className="text-muted text-[12px] truncate">{friend.email}</p>
                                </div>
                              </button>
                            )) : !isLoadingData && (
                              <p className="px-4 py-3 text-muted text-[13px] font-medium text-center">
                                {t('shareModal.noFriendsFound')}
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <RoleSelect value={selectedRole} onChange={setSelectedRole} disabled={!!addingId} t={t} label={t('shareModal.people.newRole')} />
                  </div>
                  <p className="text-[12px] text-muted mt-2 font-medium">{t('shareModal.onlyFriendsHint')}</p>
                </div>
              </section>

              {/* ── Odkazy ── */}
              <section className="px-6 sm:px-8 py-6 order-1 md:order-2">
                {/* Pozvánka — hlavní akce */}
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-xl bg-active text-accent flex items-center justify-center shrink-0">
                    <UserPlus size={18} strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0">
                    <h3 className={sectionTitle}>{t('shareModal.invite.section')}</h3>
                    <p className={sectionHint}>{t('shareModal.invite.hint')}</p>
                  </div>
                </div>

                <div className="mt-4">
                  {inviteState === 'loading' ? (
                    <div role="status" aria-label={t('shareModal.invite.loading')}>
                      <Skeleton className="h-[52px] w-full" rounded="rounded-2xl" />
                    </div>
                  ) : inviteUrl ? (
                    <>
                      <LinkField url={inviteUrl} copied={inviteCopied} onCopy={handleCopyInvite} t={t} primary />
                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                        {canNativeShare ? (
                          <button
                            onClick={handleNativeShare}
                            className="inline-flex items-center gap-2 h-10 px-3 -ml-3 rounded-xl text-[13px] font-semibold text-secondary hover:text-primary hover:bg-field transition-colors cursor-pointer"
                          >
                            <Share2 size={15} strokeWidth={2.25} />
                            {t('shareModal.invite.share')}
                          </button>
                        ) : <span />}
                        <button
                          onClick={handleRevokeInvite}
                          className="inline-flex items-center h-10 px-3 -mr-3 rounded-xl text-[13px] font-semibold text-muted hover:text-danger hover:bg-danger-wash transition-colors cursor-pointer"
                        >
                          {t('shareModal.invite.revoke')}
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={loadInvite}
                      className="inline-flex items-center gap-2 h-11 px-4 rounded-2xl bg-accent text-white text-[14px] font-semibold hover:bg-accent-hover transition-colors cursor-pointer"
                    >
                      {inviteState === 'error' ? <RefreshCw size={15} strokeWidth={2.25} /> : <UserPlus size={15} strokeWidth={2.25} />}
                      {inviteState === 'error' ? t('shareModal.invite.retry') : t('shareModal.invite.create')}
                    </button>
                  )}
                </div>

                {/* Veřejný odkaz jen pro čtení — přepínač */}
                <div className="mt-7 pt-6 border-t border-gray-100 dark:border-white/5">
                  <div className="flex items-start gap-3">
                    <span className="w-10 h-10 rounded-xl bg-subtle text-secondary flex items-center justify-center shrink-0">
                      <Eye size={18} strokeWidth={2.25} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className={sectionTitle}>{t('shareModal.linkSection')}</h3>
                      <p className={sectionHint}>{t('shareModal.linkHint')}</p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={!!shareToken}
                      aria-label={t('shareModal.linkSection')}
                      onClick={handleTogglePublic}
                      disabled={isTogglingLink}
                      className={`relative shrink-0 mt-1 w-11 h-6 rounded-full transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait ${shareToken ? 'bg-accent' : 'bg-gray-300 dark:bg-white/20'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${shareToken ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {shareUrl && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4">
                          <LinkField url={shareUrl} copied={linkCopied} onCopy={handleCopyPublic} t={t} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="px-6 sm:px-8 pt-3.5 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4 border-t border-subtle shrink-0 flex items-center gap-2 text-muted">
              <LinkIcon size={13} strokeWidth={2.25} className="shrink-0" />
              <p className="text-[12px] font-medium">{t('shareModal.footer')}</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ShareTripModal;
