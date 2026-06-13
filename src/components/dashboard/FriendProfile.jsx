import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Calendar, MapPin, Lock, UserPlus, UserCheck, UserX, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import LikeButton from '../ui/LikeButton';
import UserAvatar from '../ui/UserAvatar';



const FriendProfile = () => {
  const { userId } = useParams();
  const { t } = useTranslation();
  // eslint-disable-next-line no-unused-vars
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [trips, setTrips] = useState([]);
  const [friendshipStatus, setFriendshipStatus] = useState(null); // NONE, PENDING_SENT, PENDING_RECEIVED, ACCEPTED, SELF
  const [friendshipId, setFriendshipId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Always fetch friendship status first
        const statusData = await api.friends.getStatus(userId);
        setFriendshipStatus(statusData.status);
        setFriendshipId(statusData.friendshipId);

        // Only fetch profile if friends (or self)
        if (statusData.status === 'ACCEPTED' || statusData.status === 'SELF') {
          const profileData = await api.profile.get(userId);
          setProfile(profileData.user);
          setTrips(profileData.trips);
        } else {
          // Fetch basic info from search to at least show name
          // We only get the user info we can see publicly
          try {
            // eslint-disable-next-line no-unused-vars
            const searchData = await api.friends.search('');
            // If we can't get info, just set null
            setProfile(null);
          } catch {
            setProfile(null);
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        if (err.message?.includes('403')) {
          setFriendshipStatus('NONE');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [userId]);

  const handleSendRequest = async () => {
    setActionLoading(true);
    try {
      const data = await api.friends.sendRequest(parseInt(userId));
      setFriendshipStatus('PENDING_SENT');
      setFriendshipId(data.friendshipId);
      toast.success(t('friendProfile.toasts.requestSent'));
    } catch (err) {
      toast.error(err.message || t('friends.toasts.requestError'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    setActionLoading(true);
    try {
      await api.friends.accept(friendshipId);
      setFriendshipStatus('ACCEPTED');
      toast.success(t('friendProfile.toasts.accepted'));
      // Reload profile data
      const profileData = await api.profile.get(userId);
      setProfile(profileData.user);
      setTrips(profileData.trips);
    } catch (err) {
      toast.error(err.message || t('friends.toasts.acceptError'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineRequest = async () => {
    setActionLoading(true);
    try {
      await api.friends.decline(friendshipId);
      setFriendshipStatus('DECLINED');
      toast.success(t('friendProfile.toasts.declined'));
    } catch (err) {
      toast.error(err.message || t('friends.toasts.declineError'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const isFriend = friendshipStatus === 'ACCEPTED';
  const isSelf = friendshipStatus === 'SELF';
  const canView = isFriend || isSelf;

  return (
    <div className="space-y-10 w-full pb-10">
      {/* Back */}
      <Link
        to="/dashboard/friends"
        className="inline-flex items-center text-[12px] uppercase tracking-widest font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors duration-300"
      >
        <ArrowLeft size={16} className="mr-2" strokeWidth={2.5} /> {t('friendProfile.backToFriends')}
      </Link>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 sm:p-10 rounded-[2rem] relative overflow-hidden"
      >
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <UserAvatar user={profile} size="xl" />

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">
              {profile
                ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email
                : t('friendProfile.privateProfile.title')}
            </h1>
            {profile?.bio && (
              <p className="text-[15px] text-gray-500 dark:text-gray-400 font-medium mt-1 max-w-lg">{profile.bio}</p>
            )}
            {canView && (
              <div className="flex items-center gap-4 mt-3">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin size={14} strokeWidth={2.5} /> {trips.length} {t('friendProfile.tripsTitle')}
                </span>
                {profile?.created_at && (
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    {t('friendProfile.memberSince')} {format(new Date(profile.created_at), 'MM/yyyy')}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="shrink-0">
            {friendshipStatus === 'NONE' || friendshipStatus === 'DECLINED' ? (
              <button
                onClick={handleSendRequest}
                disabled={actionLoading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-all duration-300 shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                <UserPlus size={18} strokeWidth={2.5} /> {t('friendProfile.addFriend')}
              </button>
            ) : friendshipStatus === 'PENDING_SENT' ? (
              <span className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-bold rounded-2xl text-[13px]">
                <Clock size={16} strokeWidth={2.5} /> {t('friendProfile.waitingConfirm')}
              </span>
            ) : friendshipStatus === 'PENDING_RECEIVED' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAcceptRequest}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  <UserCheck size={16} strokeWidth={2.5} /> {t('friendProfile.acceptRequest')}
                </button>
                <button
                  onClick={handleDeclineRequest}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-3 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-white/15 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  <UserX size={16} strokeWidth={2.5} /> {t('friendProfile.declineRequest')}
                </button>
              </div>
            ) : isFriend ? (
              <span className="flex items-center gap-2 px-6 py-3 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 font-bold rounded-2xl text-[13px]">
                <UserCheck size={16} strokeWidth={2.5} /> {t('friends.status.alreadyFriends')}
              </span>
            ) : null}
          </div>
        </div>
      </motion.div>

      {/* Private Profile Overlay */}
      {!canView && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-12 sm:p-16 rounded-[2rem] text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 backdrop-blur-sm bg-white/30 dark:bg-black/30 pointer-events-none" />
          <div className="relative">
            <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-[2rem] flex items-center justify-center text-gray-400 dark:text-gray-500 mx-auto mb-6">
              <Lock size={32} strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-3">
              {t('friendProfile.privateProfile.title')}
            </h2>
            <p className="text-[15px] text-gray-500 dark:text-gray-400 font-medium max-w-md mx-auto">
              {t('friendProfile.privateProfile.description')}
            </p>
          </div>
        </motion.div>
      )}

      {/* Trips Grid */}
      {canView && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {isSelf ? t('friendProfile.yourTrips') : t('friendProfile.tripsTitle')}
            </h2>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              {t('friendProfile.tripsTotal', { count: trips.length })}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.length > 0 ? (
              trips.map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-6 sm:p-8 hover:-translate-y-1 transition-transform duration-300 flex flex-col min-h-[220px] group relative"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-[1rem] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <MapPin size={24} strokeWidth={2} />
                    </div>
                    {!isSelf && (
                      <div onClick={e => e.preventDefault()} className="absolute top-4 right-4 z-10 scale-90 origin-top-right">
                        <LikeButton 
                          tripId={trip.id} 
                          initialLikes={trip.likes || 0} 
                          initialIsLiked={trip.isLiked || false} 
                          onLikeChange={(likes, isLiked) => {
                            setTrips(prev => prev.map(t => 
                              t.id === trip.id 
                                ? { ...t, likes, isLiked } 
                                : t
                            ));
                          }} 
                        />
                      </div>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white tracking-tight">{trip.title}</h3>

                  <div className="flex items-center text-[13px] font-bold text-gray-500 gap-2 mb-4">
                    <Calendar size={16} strokeWidth={2} />
                    <span>{format(new Date(trip.startDate), 'd. M.')} — {format(new Date(trip.endDate), 'd. M. yyyy')}</span>
                  </div>

                  {trip.locations && trip.locations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {trip.locations.slice(0, 3).map((loc, i) => (
                        <span key={i} className="px-2.5 py-1 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
                          {loc}
                        </span>
                      ))}
                      {trip.locations.length > 3 && (
                        <span className="px-2.5 py-1 bg-gray-100 dark:bg-white/5 text-gray-400 text-[10px] font-bold rounded-full">
                          +{trip.locations.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-100 dark:border-white/10">
                    <div className="flex items-center gap-2 text-gray-400 text-[11px] uppercase tracking-widest font-bold">
                      <span>{t('friendProfile.activities', { count: trip.activityCount || 0 })}</span>
                    </div>
                    <Link
                      to={`/dashboard/profile/${userId}/trip/${trip.id}`}
                      className="inline-flex items-center gap-1.5 text-[12px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors uppercase tracking-widest"
                    >
                      {t('friendProfile.viewTrip')} <ArrowRight size={16} strokeWidth={2.5} />
                    </Link>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center glass-card rounded-[2rem] flex flex-col items-center justify-center space-y-4 shadow-none">
                <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 mb-2">
                  <MapPin size={28} strokeWidth={2} />
                </div>
                <p className="text-2xl text-gray-900 dark:text-white font-bold tracking-tight">{t('friendProfile.noTripsTitle')}</p>
                <p className="text-[15px] text-gray-500 font-medium max-w-md">
                  {isSelf ? t('friendProfile.noTripsSelf') : t('friendProfile.noTripsOther')}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FriendProfile;
