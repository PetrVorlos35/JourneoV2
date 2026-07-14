import { useState, useEffect, useCallback } from 'react';
import { Search, UserPlus, UserCheck, UserX, Users, X, ArrowRight, Clock, Link as LinkIcon, Copy, Check, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useDialog } from '../ui/DialogModal';
import UserAvatar from '../ui/UserAvatar';
import { FriendsSkeleton } from '../ui/Skeletons';

const FRIEND_COLORS = [
  { ring: 'ring-blue-300 dark:ring-blue-500/40'    },
  { ring: 'ring-violet-300 dark:ring-violet-500/40' },
  { ring: 'ring-emerald-300 dark:ring-emerald-500/40' },
  { ring: 'ring-amber-300 dark:ring-amber-500/40'  },
  { ring: 'ring-rose-300 dark:ring-rose-500/40'    },
  { ring: 'ring-cyan-300 dark:ring-cyan-500/40'    },
  { ring: 'ring-orange-300 dark:ring-orange-500/40' },
  { ring: 'ring-indigo-300 dark:ring-indigo-500/40' },
];

const getFriendColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return FRIEND_COLORS[Math.abs(hash) % FRIEND_COLORS.length];
};

const Friends = () => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingActions, setPendingActions] = useState(new Set());
  const [inviteToken, setInviteToken] = useState(null);
  const [isRegeneratingLink, setIsRegeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const { confirmDialog, ModalPortal } = useDialog();

  const setPending = (id, on) => setPendingActions(prev => {
    const next = new Set(prev);
    on ? next.add(id) : next.delete(id);
    return next;
  });

  const fetchData = useCallback(async () => {
    try {
      const [friendsData, requestsData] = await Promise.all([
        api.friends.getAll(),
        api.friends.getRequests(),
      ]);
      setFriends(friendsData.friends);
      setRequests(requestsData.requests);
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    api.friends.getInviteLink()
      .then(data => setInviteToken(data.token))
      .catch(err => console.error('Failed to load invite link:', err));
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await api.friends.search(searchQuery);
        setSearchResults(data.users);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleSendRequest = async (userId) => {
    try {
      await api.friends.sendRequest(userId);
      toast.success(t('friends.toasts.requestSent'));
      setSearchResults(prev => prev.map(u => u.id === userId ? { ...u, friendshipStatus: 'PENDING_SENT' } : u));
    } catch (err) {
      toast.error(err.message || t('friends.toasts.requestError'));
    }
  };

  const handleAccept = async (friendshipId) => {
    setPending(friendshipId, true);
    try {
      await api.friends.accept(friendshipId);
      toast.success(t('friends.toasts.accepted'));
      fetchData();
    } catch (err) {
      toast.error(err.message || t('friends.toasts.acceptError'));
    } finally {
      setPending(friendshipId, false);
    }
  };

  const handleDecline = async (friendshipId) => {
    setPending(friendshipId, true);
    try {
      await api.friends.decline(friendshipId);
      setRequests(prev => prev.filter(r => r.friendshipId !== friendshipId));
    } catch (err) {
      toast.error(err.message || t('friends.toasts.declineError'));
    } finally {
      setPending(friendshipId, false);
    }
  };

  const handleRemoveFriend = async (friendId, name) => {
    const ok = await confirmDialog({
      title: t('friends.remove.title'),
      message: t('friends.remove.message', { name }),
      confirmLabel: t('friends.remove.confirm'),
      variant: 'danger',
    });
    if (!ok) return;

    setPending(friendId, true);
    try {
      const statusData = await api.friends.getStatus(friendId);
      if (statusData.friendshipId) {
        await api.friends.remove(statusData.friendshipId);
        setFriends(prev => prev.filter(f => f.id !== friendId));
        toast.success(t('friends.toasts.removed'));
      }
    } catch (err) {
      toast.error(err.message || t('friends.toasts.removeError'));
    } finally {
      setPending(friendId, false);
    }
  };

  const inviteUrl = inviteToken ? `${window.location.origin}/dashboard/add-friend/${inviteToken}` : null;
  const inviteUrlDisplay = inviteUrl ? inviteUrl.replace(/^https?:\/\//, '') : null;

  const handleRegenerateInvite = async () => {
    const ok = await confirmDialog({
      title: t('friends.invite.regenerateTitle'),
      message: t('friends.invite.regenerateMessage'),
      confirmLabel: t('friends.invite.regenerateConfirm'),
      variant: 'danger',
    });
    if (!ok) return;

    setIsRegeneratingLink(true);
    try {
      const { token } = await api.friends.regenerateInviteLink();
      setInviteToken(token);
      toast.success(t('friends.invite.regenerateSuccess'));
    } catch (err) {
      toast.error(err.message || t('friends.invite.regenerateError'));
    } finally {
      setIsRegeneratingLink(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setLinkCopied(true);
      toast.success(t('friends.invite.linkCopied'));
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error(t('friends.invite.copyError'));
    }
  };

  if (loading) {
    return <FriendsSkeleton />;
  }

  const tabs = [
    { id: 'friends', label: t('friends.tabs.friends'), count: friends.length },
    { id: 'requests', label: t('friends.tabs.requests'), count: requests.length },
  ];

  return (
    <div className="space-y-10 w-full pb-10">
      {ModalPortal}

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('friends.subtitle')}</p>
        <h1 className="text-3xl sm:text-4xl text-gray-900 dark:text-white tracking-tight font-bold">{t('friends.title')}</h1>
      </div>

      {/* Invite link — compact */}
      <div className="rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.03] p-3 sm:p-3.5">
        <div className="flex items-center gap-2 mb-2.5">
          <LinkIcon size={13} className="shrink-0 text-gray-400 dark:text-white/40" strokeWidth={2.5} />
          <span className="text-[12px] font-semibold text-gray-600 dark:text-white/60">
            {t('friends.invite.title')}
          </span>
          <span className="text-[12px] text-gray-400 dark:text-white/35 truncate hidden sm:inline">
            · {t('friends.invite.hint')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/10 rounded-xl px-3 h-11 min-w-0">
            <span className="flex-1 text-[13px] text-gray-600 dark:text-white/60 truncate select-all">
              {inviteUrlDisplay || '…'}
            </span>
          </div>
          <button
            onClick={handleCopyInvite}
            disabled={!inviteUrl}
            aria-label={t('friends.invite.copy')}
            className="shrink-0 flex items-center gap-1.5 h-11 px-3.5 rounded-xl text-[13px] font-semibold bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-700 dark:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {linkCopied
              ? <><Check size={14} strokeWidth={2.5} className="text-green-500 dark:text-green-400" /><span className="text-green-500 dark:text-green-400 hidden sm:inline">{t('friends.invite.copied')}</span></>
              : <><Copy size={14} strokeWidth={2} /><span className="hidden sm:inline">{t('friends.invite.copyShort')}</span></>}
          </button>
          <button
            onClick={handleRegenerateInvite}
            disabled={isRegeneratingLink || !inviteUrl}
            title={t('friends.invite.regenerate')}
            aria-label={t('friends.invite.regenerate')}
            className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={15} strokeWidth={2.5} className={isRegeneratingLink ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card p-6 rounded-[2rem] space-y-4">
        <div className="relative group/search">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search size={20} className="text-gray-400 group-focus-within/search:text-blue-500 transition-colors duration-300" strokeWidth={2.5} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('friends.search.placeholder')}
            className="glass-input !pl-14 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults([]); }}
              aria-label={t('friends.search.clear')}
              className="absolute inset-y-0 right-2 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {(searchResults.length > 0 || isSearching) && (
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={shouldReduceMotion ? {} : { opacity: 0, height: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              {isSearching ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-5 h-5 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  {searchResults.map(user => (
                    <div key={user.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                      <UserAvatar user={user} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[15px] text-gray-900 dark:text-white truncate">
                          {user.first_name || user.last_name
                            ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                            : user.email}
                        </p>
                        <p className="text-[12px] text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                      </div>
                      {user.friendshipStatus === 'ACCEPTED' ? (
                        <button disabled className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-[12px] font-bold rounded-xl shrink-0 opacity-70 cursor-not-allowed">
                          <UserCheck size={16} strokeWidth={2.5} /> {t('friends.status.alreadyFriends')}
                        </button>
                      ) : user.friendshipStatus === 'PENDING_SENT' ? (
                        <button disabled className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-[12px] font-bold rounded-xl shrink-0 opacity-70 cursor-not-allowed">
                          <Clock size={16} strokeWidth={2.5} /> {t('friends.status.requestSent')}
                        </button>
                      ) : user.friendshipStatus === 'PENDING_RECEIVED' ? (
                        <button disabled className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-[12px] font-bold rounded-xl shrink-0 opacity-70 cursor-not-allowed">
                          <Clock size={16} strokeWidth={2.5} /> {t('friends.status.pendingReceived')}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(user.id)}
                          className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white text-[12px] font-bold rounded-xl hover:bg-blue-500 transition-colors shrink-0 cursor-pointer"
                        >
                          <UserPlus size={16} strokeWidth={2.5} /> {t('friends.status.addButton')}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-white/10 gap-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 px-2 text-[15px] font-bold transition-all duration-300 relative cursor-pointer ${
              activeTab === tab.id
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-[11px] font-bold text-gray-500 dark:text-gray-400">
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <motion.div
                layoutId="friends-tab-indicator"
                className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-blue-600 dark:bg-blue-400 rounded-t-full"
                transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Friends List */}
      {activeTab === 'friends' && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: shouldReduceMotion ? 0 : 0.05 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {friends.length > 0 ? (
            friends.map(friend => {
              const color = getFriendColor(friend.first_name || friend.email || '');
              const displayName = friend.first_name || friend.last_name
                ? `${friend.first_name || ''} ${friend.last_name || ''}`.trim()
                : friend.email;
              return (
                <motion.div
                  key={friend.id}
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                  className="glass-card p-6 sm:p-8 flex flex-col hover:-translate-y-2 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] transition-all duration-300 group"
                >
                  <div className="flex items-start gap-4 mb-5">
                    <div className={`rounded-full ring-2 ${color.ring} shrink-0`}>
                      <UserAvatar user={friend} size="md" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate tracking-tight">
                        {displayName}
                      </h3>
                      <p className="text-[13px] text-gray-500 dark:text-gray-400 truncate font-medium">
                        {friend.bio || friend.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[12px] font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2.5 py-1 rounded-full w-fit mb-5">
                    <UserCheck size={13} strokeWidth={2.5} aria-hidden="true" /> {t('friends.status.friends')}
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10">
                    <button
                      onClick={() => handleRemoveFriend(friend.id, friend.first_name || t('friends.defaultName'))}
                      disabled={pendingActions.has(friend.id)}
                      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-400 hover:text-red-500 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed py-2.5 -my-2.5 pr-2 -mr-2"
                    >
                      {pendingActions.has(friend.id) ? (
                        <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                      ) : null}
                      {t('friends.status.remove')}
                    </button>
                    <Link
                      to={`/dashboard/profile/${friend.id}`}
                      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors py-2.5 -my-2.5 pl-2 -ml-2"
                    >
                      {t('friends.status.profile')} <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
                    </Link>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center glass-card rounded-[2rem] flex flex-col items-center justify-center space-y-4 shadow-none">
              <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 mb-2">
                <Users size={28} strokeWidth={2} />
              </div>
              <p className="text-2xl text-gray-900 dark:text-white font-bold tracking-tight">{t('friends.empty.friends.title')}</p>
              <p className="text-[15px] text-gray-500 font-medium max-w-md">{t('friends.empty.friends.description')}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Requests List */}
      {activeTab === 'requests' && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: shouldReduceMotion ? 0 : 0.05 } } }}
          className="space-y-4"
        >
          {requests.length > 0 ? (
            requests.map(req => (
              <motion.div
                key={req.friendshipId}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -50 }}
                className="glass-card p-6 flex flex-col sm:flex-row sm:items-center gap-4 hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`rounded-full ring-2 ${getFriendColor(req.first_name || req.email || '').ring} shrink-0`}>
                    <UserAvatar user={req} size="md" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[15px] text-gray-900 dark:text-white truncate">
                      {req.first_name || req.last_name
                        ? `${req.first_name || ''} ${req.last_name || ''}`.trim()
                        : req.email}
                    </h3>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium mt-0.5">
                      <Clock size={12} aria-hidden="true" /> {t('friends.status.waitingConfirm')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <button
                    onClick={() => handleAccept(req.friendshipId)}
                    disabled={pendingActions.has(req.friendshipId)}
                    className="flex-1 sm:flex-none flex items-center gap-2 px-4 py-3 sm:py-2.5 bg-blue-600 text-white text-[12px] font-bold rounded-xl hover:bg-blue-500 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed sm:min-w-[100px] justify-center"
                  >
                    {pendingActions.has(req.friendshipId) ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><UserCheck size={16} strokeWidth={2.5} /> {t('friends.status.accept')}</>
                    )}
                  </button>
                  <button
                    onClick={() => handleDecline(req.friendshipId)}
                    disabled={pendingActions.has(req.friendshipId)}
                    className="flex-1 sm:flex-none flex items-center gap-2 px-4 py-3 sm:py-2.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 text-[12px] font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-white/15 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed sm:min-w-[100px] justify-center"
                  >
                    {pendingActions.has(req.friendshipId) ? (
                      <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 dark:border-white/30 dark:border-t-white rounded-full animate-spin" />
                    ) : (
                      <><UserX size={16} strokeWidth={2.5} /> {t('friends.status.decline')}</>
                    )}
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center glass-card rounded-[2rem] flex flex-col items-center justify-center space-y-4 shadow-none">
              <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 mb-2">
                <UserPlus size={28} strokeWidth={2} />
              </div>
              <p className="text-2xl text-gray-900 dark:text-white font-bold tracking-tight">{t('friends.empty.requests.title')}</p>
              <p className="text-[15px] text-gray-500 font-medium max-w-md">{t('friends.empty.requests.description')}</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Friends;
