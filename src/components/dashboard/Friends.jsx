import { useState, useEffect, useCallback } from 'react';
import { Search, UserPlus, UserCheck, UserX, Users, X, ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useDialog } from '../ui/DialogModal';
import UserAvatar from '../ui/UserAvatar';



const Friends = () => {
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const { confirmDialog, ModalPortal } = useDialog();

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

  // Search with debounce
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
      toast.success('Žádost o přátelství odeslána!');
      setSearchResults(prev => prev.map(u => u.id === userId ? { ...u, friendshipStatus: 'PENDING_SENT' } : u));
    } catch (err) {
      toast.error(err.message || 'Chyba při odesílání žádosti.');
    }
  };

  const handleAccept = async (friendshipId) => {
    try {
      await api.friends.accept(friendshipId);
      toast.success('Přátelství přijato!');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Chyba při přijímání žádosti.');
    }
  };

  const handleDecline = async (friendshipId) => {
    try {
      await api.friends.decline(friendshipId);
      setRequests(prev => prev.filter(r => r.friendshipId !== friendshipId));
    } catch (err) {
      toast.error(err.message || 'Chyba při odmítání žádosti.');
    }
  };

  const handleRemoveFriend = async (friendId, name) => {
    const ok = await confirmDialog({
      title: 'Odebrat přítele?',
      message: `Opravdu chcete odebrat ${name} ze seznamu přátel? Ztratíte vzájemný přístup k výletům.`,
      confirmLabel: 'Odebrat',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      // Find the friendship to get its ID
      const statusData = await api.friends.getStatus(friendId);
      if (statusData.friendshipId) {
        await api.friends.remove(statusData.friendshipId);
        setFriends(prev => prev.filter(f => f.id !== friendId));
        toast.success('Přítel odebrán.');
      }
    } catch (err) {
      toast.error(err.message || 'Chyba při odebírání přítele.');
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
      {ModalPortal}

      <div className="space-y-2">
        <p className="text-[12px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">Sociální síť</p>
        <h1 className="text-4xl text-gray-900 dark:text-white tracking-tight font-bold">Přátelé</h1>
      </div>

      {/* Search */}
      <div className="glass-card p-6 rounded-[2rem] space-y-4">
        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Hledat uživatele</h2>
        <div className="relative">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search size={20} className="text-gray-400" strokeWidth={2.5} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Hledat podle jména nebo e-mailu..."
            className="glass-input !pl-14"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults([]); }}
              className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <AnimatePresence>
          {(searchResults.length > 0 || isSearching) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
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
                        <button disabled className="flex items-center gap-2 px-4 py-2.5 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-[12px] font-bold rounded-xl shrink-0 opacity-70 cursor-not-allowed">
                          <UserCheck size={16} strokeWidth={2.5} /> Přátelé
                        </button>
                      ) : user.friendshipStatus === 'PENDING_SENT' ? (
                        <button disabled className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-[12px] font-bold rounded-xl shrink-0 opacity-70 cursor-not-allowed">
                          <Clock size={16} strokeWidth={2.5} /> Žádost odeslána
                        </button>
                      ) : user.friendshipStatus === 'PENDING_RECEIVED' ? (
                        <button disabled className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-[12px] font-bold rounded-xl shrink-0 opacity-70 cursor-not-allowed">
                          <Clock size={16} strokeWidth={2.5} /> Čeká na přijetí
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(user.id)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-[12px] font-bold rounded-xl hover:bg-blue-500 transition-colors shrink-0 cursor-pointer"
                        >
                          <UserPlus size={16} strokeWidth={2.5} /> Přidat
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
        {[
          { id: 'friends', label: 'Přátelé', count: friends.length },
          { id: 'requests', label: 'Žádosti', count: requests.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 px-2 text-[15px] font-bold transition-all duration-300 border-b-[3px] relative top-[2px] cursor-pointer ${
              activeTab === tab.id
                ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 border-transparent hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
            <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-[11px] font-bold text-gray-500 dark:text-gray-400">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Friends List */}
      {activeTab === 'friends' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {friends.length > 0 ? (
            friends.map(friend => (
              <motion.div
                key={friend.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 sm:p-8 flex flex-col hover:-translate-y-1 transition-transform duration-300 group"
              >
                <div className="flex items-start gap-4 mb-6">
                  <UserAvatar user={friend} size="md" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate tracking-tight">
                      {friend.first_name || friend.last_name
                        ? `${friend.first_name || ''} ${friend.last_name || ''}`.trim()
                        : friend.email}
                    </h3>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 truncate font-medium">
                      {friend.bio || friend.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">
                  <UserCheck size={14} strokeWidth={2.5} /> Přátelé
                </div>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10">
                  <button
                    onClick={() => handleRemoveFriend(friend.id, friend.first_name || 'tohoto uživatele')}
                    className="text-[11px] font-bold text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    Odebrat
                  </button>
                  <Link
                    to={`/dashboard/profile/${friend.id}`}
                    className="inline-flex items-center gap-1.5 text-[12px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors uppercase tracking-widest"
                  >
                    Profil <ArrowRight size={16} strokeWidth={2.5} />
                  </Link>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center glass-card rounded-[2rem] flex flex-col items-center justify-center space-y-4 shadow-none">
              <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 mb-2">
                <Users size={28} strokeWidth={2} />
              </div>
              <p className="text-2xl text-gray-900 dark:text-white font-bold tracking-tight">Zatím žádní přátelé</p>
              <p className="text-[15px] text-gray-500 font-medium max-w-md">Vyhledejte uživatele a pošlete jim žádost o přátelství.</p>
            </div>
          )}
        </div>
      )}

      {/* Requests List */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {requests.length > 0 ? (
            requests.map(req => (
              <motion.div
                key={req.friendshipId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="glass-card p-6 flex items-center gap-4"
              >
                <UserAvatar user={req} size="md" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[15px] text-gray-900 dark:text-white truncate">
                    {req.first_name || req.last_name
                      ? `${req.first_name || ''} ${req.last_name || ''}`.trim()
                      : req.email}
                  </h3>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium mt-0.5">
                    <Clock size={12} /> Čeká na potvrzení
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAccept(req.friendshipId)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-[12px] font-bold rounded-xl hover:bg-blue-500 transition-colors cursor-pointer"
                  >
                    <UserCheck size={16} strokeWidth={2.5} /> Přijmout
                  </button>
                  <button
                    onClick={() => handleDecline(req.friendshipId)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 text-[12px] font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-white/15 transition-colors cursor-pointer"
                  >
                    <UserX size={16} strokeWidth={2.5} /> Odmítnout
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center glass-card rounded-[2rem] flex flex-col items-center justify-center space-y-4 shadow-none">
              <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 mb-2">
                <UserPlus size={28} strokeWidth={2} />
              </div>
              <p className="text-2xl text-gray-900 dark:text-white font-bold tracking-tight">Žádné nové žádosti</p>
              <p className="text-[15px] text-gray-500 font-medium max-w-md">Až vám někdo pošle žádost o přátelství, zobrazí se zde.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Friends;
