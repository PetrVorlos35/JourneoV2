import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, UserCheck, Clock, Link2Off, ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import UserAvatar from '../ui/UserAvatar';

const AddFriendInvite = () => {
  const { token } = useParams();
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [inviter, setInviter] = useState(null);
  const [status, setStatus] = useState(null); // NONE, PENDING_SENT, PENDING_RECEIVED, ACCEPTED, SELF
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setInvalid(false);
      try {
        const data = await api.friends.getInvitePreview(token);
        setInviter(data.inviter);
        setStatus(data.status);
      } catch {
        setInvalid(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleAdd = async () => {
    setSending(true);
    try {
      await api.friends.acceptInvite(token);
      setStatus('PENDING_SENT');
      toast.success(t('addFriendInvite.toasts.requestSent'));
    } catch (err) {
      toast.error(err.message || t('addFriendInvite.toasts.requestError'));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 w-full pb-10">
      <Link
        to="/dashboard/friends"
        className="inline-flex items-center text-[13px] font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors duration-300"
      >
        <ArrowLeft size={16} className="mr-2" strokeWidth={2.5} /> {t('addFriendInvite.backToFriends')}
      </Link>

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card p-8 sm:p-10 rounded-[2rem] relative overflow-hidden max-w-xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

        {invalid ? (
          <div className="relative text-center py-6">
            <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 mx-auto mb-6">
              <Link2Off size={28} strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
              {t('addFriendInvite.invalid.title')}
            </h1>
            <p className="text-[15px] text-gray-500 dark:text-gray-400 font-medium max-w-sm mx-auto">
              {t('addFriendInvite.invalid.description')}
            </p>
          </div>
        ) : status === 'SELF' ? (
          <div className="relative text-center py-6">
            <div className="flex justify-center mb-6">
              <UserAvatar user={inviter} size="xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
              {t('addFriendInvite.self.title')}
            </h1>
            <p className="text-[15px] text-gray-500 dark:text-gray-400 font-medium max-w-sm mx-auto mb-6">
              {t('addFriendInvite.self.description')}
            </p>
            <Link
              to="/dashboard/friends"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors"
            >
              {t('addFriendInvite.goToFriends')} <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
          </div>
        ) : (
          <div className="relative flex flex-col items-center text-center gap-5">
            <UserAvatar user={inviter} size="xl" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-1" style={{ textWrap: 'balance' }}>
                {`${inviter?.first_name || ''} ${inviter?.last_name || ''}`.trim() || t('friends.defaultName')}
              </h1>
              <p className="text-[13px] font-semibold text-gray-400 uppercase tracking-widest">
                {t('addFriendInvite.subtitle')}
              </p>
              {inviter?.bio && (
                <p className="text-[15px] text-gray-500 dark:text-gray-400 font-medium mt-3 max-w-md">{inviter.bio}</p>
              )}
            </div>

            <div className="pt-2">
              {status === 'ACCEPTED' ? (
                <div className="flex flex-col items-center gap-3">
                  <span className="flex items-center gap-2 px-6 py-3 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 font-bold rounded-2xl text-[13px]">
                    <UserCheck size={16} strokeWidth={2.5} /> {t('addFriendInvite.alreadyFriends')}
                  </span>
                  <Link
                    to={`/dashboard/profile/${inviter.id}`}
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors"
                  >
                    {t('addFriendInvite.viewProfile')} <ArrowRight size={16} strokeWidth={2.5} />
                  </Link>
                </div>
              ) : status === 'PENDING_SENT' ? (
                <span className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-bold rounded-2xl text-[13px]">
                  <Clock size={16} strokeWidth={2.5} /> {t('addFriendInvite.requestSent')}
                </span>
              ) : status === 'PENDING_RECEIVED' ? (
                <div className="flex flex-col items-center gap-3">
                  <span className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-bold rounded-2xl text-[13px]">
                    <Clock size={16} strokeWidth={2.5} /> {t('addFriendInvite.pendingReceived')}
                  </span>
                  <Link
                    to="/dashboard/friends"
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors"
                  >
                    {t('addFriendInvite.pendingReceivedAction')} <ArrowRight size={16} strokeWidth={2.5} />
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleAdd}
                  disabled={sending}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-all duration-300 shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {sending
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <UserPlus size={18} strokeWidth={2.5} />}
                  {t('addFriendInvite.addButton')}
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AddFriendInvite;
