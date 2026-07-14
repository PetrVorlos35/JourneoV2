import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Search, Trash2, Shield, Eye, Loader2, ChevronDown, Link as LinkIcon, Copy, Check, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import UserAvatar from '../ui/UserAvatar';

const ROLES = ['editor', 'viewer'];

const RoleBadge = ({ role, t }) => {
  if (role === 'owner') {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-blue-500/20 text-blue-300">
        <Shield size={11} strokeWidth={3} /> {t('shareModal.roles.owner')}
      </span>
    );
  }
  if (role === 'editor') {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-violet-500/20 text-violet-300">
        {t('shareModal.roles.editor')}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-white/10 text-white/60">
      <Eye size={11} strokeWidth={2.5} /> {t('shareModal.roles.viewer')}
    </span>
  );
};

const RoleSelect = ({ value, onChange, disabled, t, fullWidthMobile = false }) => (
  <div className={`relative ${fullWidthMobile ? 'w-full sm:w-auto' : ''}`}>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`appearance-none bg-white/10 border border-white/10 text-white font-bold uppercase tracking-widest rounded-xl pl-3 pr-7 py-2.5 sm:py-1.5 focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-white/15 ${fullWidthMobile ? 'w-full sm:w-auto text-[16px] sm:text-[12px]' : 'text-[12px]'}`}
    >
      {ROLES.map((r) => (
        <option key={r} value={r} className="bg-gray-900 text-white normal-case tracking-normal">
          {t(`shareModal.roles.${r}`)}
        </option>
      ))}
    </select>
    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
  </div>
);

const ShareTripModal = ({ isOpen, onClose, trip }) => {
  const { t } = useTranslation();
  const [friends, setFriends] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('viewer');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [shareToken, setShareToken] = useState(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isRevokingLink, setIsRevokingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

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

  useEffect(() => {
    if (isOpen) {
      loadData();
      setSearchQuery('');
      setSelectedRole('viewer');
      setShowDropdown(false);
      setShareToken(trip?.shareToken || null);
      setLinkCopied(false);
    }
  }, [isOpen, loadData, trip?.shareToken]);

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

  const shareUrl = shareToken ? `${window.location.origin}/share/${shareToken}` : null;

  const handleGenerateLink = async () => {
    setIsGeneratingLink(true);
    try {
      const { token } = await api.trips.generateShareLink(trip.id);
      setShareToken(token);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleRevokeLink = async () => {
    setIsRevokingLink(true);
    try {
      await api.trips.revokeShareLink(trip.id);
      setShareToken(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsRevokingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    toast.success(t('shareModal.linkCopied'));
    setTimeout(() => setLinkCopied(false), 2000);
  };

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
            className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="relative w-full max-w-md z-10 flex flex-col bg-white/5 backdrop-blur-2xl border border-white/10 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl shadow-black/60 overflow-hidden max-h-[85dvh] sm:max-h-[90dvh]"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
                  <Users size={18} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-white font-bold text-lg leading-tight tracking-tight">
                    {t('shareModal.title')}
                  </h2>
                  <p className="text-white/40 text-[12px] font-medium mt-0.5 truncate sm:max-w-[220px]">
                    {trip?.title}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label={t('common.close')}
                className="w-10 h-10 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">

              {/* Share via link */}
              <div className="px-6 py-5 border-b border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <LinkIcon size={13} className="text-white/50" strokeWidth={2.5} />
                  <p className="text-white/50 text-[11px] font-bold uppercase tracking-widest">
                    {t('shareModal.linkSection')}
                  </p>
                </div>

                {shareToken ? (
                  <div className="space-y-2">
                    {/* URL display + copy */}
                    <div className="flex items-center gap-2 min-w-0 bg-white/5 border border-white/10 rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2.5">
                      <span className="flex-1 min-w-0 text-[12px] text-white/60 font-mono truncate select-all">
                        {shareUrl}
                      </span>
                      <button
                        onClick={handleCopyLink}
                        className="shrink-0 w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all cursor-pointer"
                        title={t('shareModal.linkCopy')}
                        aria-label={t('shareModal.linkCopy')}
                      >
                        {linkCopied ? <Check size={14} strokeWidth={2.5} className="text-green-400" /> : <Copy size={14} strokeWidth={2} />}
                      </button>
                    </div>
                    {/* Revoke */}
                    <button
                      onClick={handleRevokeLink}
                      disabled={isRevokingLink}
                      className="flex items-center gap-2 min-h-[44px] sm:min-h-0 text-[11px] font-bold text-red-400/70 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRevokingLink ? <Loader2 size={12} className="animate-spin" /> : <X size={12} strokeWidth={2.5} />}
                      {t('shareModal.linkDisable')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-white/30 text-[12px] font-medium">{t('shareModal.linkHint')}</p>
                    <button
                      onClick={handleGenerateLink}
                      disabled={isGeneratingLink}
                      className="flex items-center gap-2 px-4 py-3 sm:py-2.5 min-h-[44px] sm:min-h-0 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl text-[13px] font-bold text-white/80 hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingLink ? <Loader2 size={14} className="animate-spin" /> : <LinkIcon size={14} strokeWidth={2} />}
                      {t('shareModal.linkEnable')}
                    </button>
                  </div>
                )}
              </div>

              {/* Add collaborator */}
              <div className="px-6 py-5 border-b border-white/10">
                <p className="text-white/50 text-[11px] font-bold uppercase tracking-widest mb-3">
                  {t('shareModal.addSection')}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Search input */}
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                      {addingId ? (
                        <Loader2 size={15} className="text-white/40 animate-spin" />
                      ) : (
                        <Search size={15} className="text-white/40" strokeWidth={2.5} />
                      )}
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
                      className="w-full bg-white/5 border border-white/10 text-white text-base sm:text-sm font-medium placeholder:text-white/30 rounded-xl pl-9 pr-4 py-3 sm:py-2.5 focus:outline-none focus:ring-1 focus:ring-white/20 focus:bg-white/8 transition-all"
                    />

                    {/* Search results dropdown */}
                    <AnimatePresence>
                      {showDropdown && filteredFriends.length > 0 && (
                        <motion.div
                          ref={dropdownRef}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-gray-950/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden z-20 shadow-2xl shadow-black/50"
                        >
                          {filteredFriends.map((friend) => (
                            <button
                              key={friend.id}
                              onClick={() => handleAdd(friend)}
                              disabled={!!addingId}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                            >
                              <UserAvatar user={friend} size="sm" />
                              <div className="min-w-0">
                                <p className="text-white text-[13px] font-bold truncate">
                                  {friend.first_name} {friend.last_name}
                                </p>
                                <p className="text-white/40 text-[11px] truncate">{friend.email}</p>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* No results */}
                    <AnimatePresence>
                      {showDropdown && searchQuery.trim() && filteredFriends.length === 0 && !isLoadingData && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-gray-950/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden z-20 shadow-2xl shadow-black/50"
                        >
                          <p className="px-4 py-3 text-white/40 text-[13px] font-medium text-center">
                            {t('shareModal.noFriendsFound')}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Role selector for new invite */}
                  <RoleSelect value={selectedRole} onChange={setSelectedRole} disabled={!!addingId} t={t} fullWidthMobile />
                </div>

                <p className="text-white/30 text-[11px] mt-2.5 font-medium">
                  {t('shareModal.onlyFriendsHint')}
                </p>
              </div>

              {/* Collaborators list */}
              <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-white/50 text-[11px] font-bold uppercase tracking-widest">
                    {t('shareModal.collaboratorsSection')}
                  </p>
                  {collaborators.length > 0 && (
                    <span className="text-white/30 text-[11px] font-bold">
                      {collaborators.length}
                    </span>
                  )}
                </div>

                {isLoadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="text-white/30 animate-spin" />
                  </div>
                ) : collaborators.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                      <Users size={20} className="text-white/20" strokeWidth={2} />
                    </div>
                    <p className="text-white/30 text-[13px] font-medium">{t('shareModal.noCollaborators')}</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {collaborators.map((collab) => {
                      const isUpdating = updatingId === collab.id;
                      const isRemoving = removingId === collab.id;
                      return (
                        <motion.div
                          key={collab.id}
                          layout
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: isRemoving ? 0.5 : 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="flex items-center gap-3 py-2.5 px-3 rounded-2xl hover:bg-white/5 transition-colors group"
                        >
                          <UserAvatar user={collab} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-[13px] font-bold truncate">
                              {collab.first_name} {collab.last_name}
                            </p>
                            <p className="text-white/40 text-[11px] truncate">{collab.email}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isUpdating ? (
                              <Loader2 size={14} className="text-white/40 animate-spin" />
                            ) : (
                              <RoleSelect
                                value={collab.role}
                                onChange={(newRole) => handleRoleChange(collab, newRole)}
                                disabled={isRemoving}
                                t={t}
                              />
                            )}
                            <button
                              onClick={() => handleRemove(collab)}
                              disabled={isRemoving || !!updatingId}
                              aria-label={t('common.delete')}
                              className="w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all disabled:pointer-events-none cursor-pointer disabled:cursor-not-allowed"
                            >
                              {isRemoving ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Trash2 size={13} strokeWidth={2} />
                              )}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-5 border-t border-white/10 shrink-0">
              <p className="text-white/20 text-[11px] font-medium text-center">
                {t('shareModal.footer')}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ShareTripModal;
