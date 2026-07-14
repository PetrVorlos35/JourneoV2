import { useState, useEffect, useRef } from 'react';
import { Bell, UserPlus, UserCheck, Heart, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { NotificationListSkeleton } from './Skeletons';

const notifIcons = {
  FRIEND_REQUEST: UserPlus,
  FRIEND_ACCEPTED: UserCheck,
  TRIP_VOTED: Heart,
};

const NotificationBell = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const timeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return t('notifications.timeAgo.justNow');
    if (diffMin < 60) return t('notifications.timeAgo.minutesAgo', { count: diffMin });
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return t('notifications.timeAgo.hoursAgo', { count: diffHr });
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return t('notifications.timeAgo.daysAgo', { count: diffDays });
    return t('notifications.timeAgo.weeksAgo', { count: Math.floor(diffDays / 7) });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await api.notifications.getUnreadCount();
        setUnreadCount(data.count);
      } catch (err) {
        // Silently fail
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.notifications.getAll();
      setNotifications(data.notifications);
    } catch (err) {
      toast.error(t('notifications.toasts.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      toast.error(t('notifications.toasts.markError'));
    }
  };

  const handleAcceptRequest = async (friendshipId, notifId) => {
    try {
      await api.friends.accept(friendshipId);
      await api.notifications.markRead(notifId);
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success(t('notifications.toasts.accepted'));
    } catch (err) {
      toast.error(err.message || t('notifications.toasts.acceptError'));
    }
  };

  const handleDeclineRequest = async (friendshipId, notifId) => {
    try {
      await api.friends.decline(friendshipId);
      await api.notifications.markRead(notifId);
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      toast.error(err.message || t('notifications.toasts.declineError'));
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleToggle}
        aria-label={t('notifications.title')}
        className="relative w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-300 cursor-pointer"
      >
        <Bell size={20} strokeWidth={2} className="text-gray-500 dark:text-gray-400" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full shadow-md shadow-red-500/30"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed md:absolute left-0 right-0 md:left-auto top-[max(4.25rem,calc(env(safe-area-inset-top)+3.75rem))] md:top-14 w-full md:w-96 max-h-[calc(100dvh-max(4.25rem,calc(env(safe-area-inset-top)+3.75rem))-1rem)] md:max-h-[420px] bg-white dark:bg-[#1c1c1e] shadow-2xl rounded-b-[2rem] md:rounded-2xl border-b md:border border-black/5 dark:border-white/10 overflow-hidden z-[100] flex flex-col"
          >
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-[15px] text-gray-900 dark:text-white tracking-tight">{t('notifications.title')}</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="p-2 -m-2 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors uppercase tracking-widest cursor-pointer"
                >
                  {t('notifications.markAllRead')}
                </button>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto md:max-h-[340px] custom-scrollbar">
              {loading ? (
                <NotificationListSkeleton />
              ) : notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-[14px] font-bold">{t('notifications.empty')}</p>
                </div>
              ) : (
                notifications.map(n => {
                  const Icon = notifIcons[n.type] || Bell;
                  const isFriendRequest = n.type === 'FRIEND_REQUEST' && !n.isRead;

                  return (
                    <div
                      key={n.id}
                      className={`flex flex-col gap-1 p-4 border-b border-black/5 dark:border-white/10 last:border-0 transition-colors duration-200 ${
                        !n.isRead ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          n.type === 'FRIEND_REQUEST'
                            ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : n.type === 'FRIEND_ACCEPTED'
                              ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}>
                          <Icon size={16} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <p className={`text-sm leading-tight break-words ${!n.isRead ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-400'}`}>
                            {n.type === 'FRIEND_REQUEST'
                              ? t('notifications.messages.friendRequest', { name: n.actorName || '?' })
                              : n.type === 'FRIEND_ACCEPTED'
                                ? t('notifications.messages.friendAccepted', { name: n.actorName || '?' })
                                : n.actorName || '—'}
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                            {timeAgo(n.createdAt)}
                          </p>

                          {isFriendRequest && n.referenceId && (
                            <div className="flex flex-row gap-2 mt-2">
                              <button
                                onClick={() => handleAcceptRequest(n.referenceId, n.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 md:py-2.5 bg-blue-600 text-white text-[12px] font-bold rounded-xl hover:bg-blue-500 transition-colors cursor-pointer"
                              >
                                <Check size={14} strokeWidth={3} /> {t('notifications.accept')}
                              </button>
                              <button
                                onClick={() => handleDeclineRequest(n.referenceId, n.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 md:py-2.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 text-[12px] font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-white/15 transition-colors cursor-pointer"
                              >
                                <X size={14} strokeWidth={3} /> {t('notifications.decline')}
                              </button>
                            </div>
                          )}
                        </div>
                        {!n.isRead && !isFriendRequest && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
