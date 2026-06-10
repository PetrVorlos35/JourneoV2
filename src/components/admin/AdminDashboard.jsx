import { useState, useEffect } from 'react';
import { Users, Map, DollarSign, Heart, TrendingUp, UserPlus, Calendar } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import api from '../../services/api';
import UserAvatar from '../ui/UserAvatar';

const StatCard = ({ icon: Icon, label, value, subtitle, gradient, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6 group hover:border-white/[0.1] transition-all duration-300"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity ${gradient}`} />
    <div className="relative z-10">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg`}>
        <Icon size={20} className="text-white" strokeWidth={2} />
      </div>
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black tracking-tight">{value}</p>
      {subtitle && <p className="text-[13px] text-gray-400 mt-1 font-medium">{subtitle}</p>}
    </div>
  </motion.div>
);

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await api.admin.dashboard();
        setData(result.dashboard);
      } catch (err) {
        console.error('Failed to fetch admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-gray-400">
        Nepodařilo se načíst data.
      </div>
    );
  }

  const monthNames = {
    '01': 'Led', '02': 'Úno', '03': 'Bře', '04': 'Dub',
    '05': 'Kvě', '06': 'Čvn', '07': 'Čvc', '08': 'Srp',
    '09': 'Zář', '10': 'Říj', '11': 'Lis', '12': 'Pro',
  };

  const maxTripsInMonth = Math.max(...(data.tripsPerMonth?.map(m => m.count) || [1]), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
          Admin <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">Přehled</span>
        </h1>
        <p className="text-gray-400 mt-2 font-medium">Statistiky a přehledy celé platformy Journeo</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Uživatelé" value={data.totalUsers} subtitle={`+${data.newUsersWeek} tento týden`} gradient="from-blue-500 to-cyan-500" delay={0.05} />
        <StatCard icon={Map} label="Výlety" value={data.totalTrips} gradient="from-purple-500 to-pink-500" delay={0.1} />
        <StatCard icon={DollarSign} label="Celkové výdaje" value={`${data.totalExpenseAmount.toLocaleString('cs-CZ')} Kč`} subtitle={`${data.totalExpenses} položek`} gradient="from-emerald-500 to-teal-500" delay={0.15} />
        <StatCard icon={Heart} label="Přátelství" value={data.totalFriendships} subtitle={`+${data.newUsersMonth} uživatelů za měsíc`} gradient="from-orange-500 to-red-500" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trips per month chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <TrendingUp size={18} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Výlety za měsíc</h3>
              <p className="text-[11px] text-gray-500 font-medium">Posledních 6 měsíců</p>
            </div>
          </div>
          
          {data.tripsPerMonth && data.tripsPerMonth.length > 0 ? (
            <div className="flex items-end gap-3 h-40">
              {data.tripsPerMonth.map((m, i) => {
                const monthKey = m.month.split('-')[1];
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[11px] font-bold text-gray-400">{m.count}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(m.count / maxTripsInMonth) * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                      className="w-full min-h-[8px] rounded-xl bg-gradient-to-t from-purple-600 to-pink-500 shadow-lg shadow-purple-500/20"
                    />
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{monthNames[monthKey] || monthKey}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-500 text-sm">Žádná data</div>
          )}
        </motion.div>

        {/* Top users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
              <Users size={18} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Top uživatelé</h3>
              <p className="text-[11px] text-gray-500 font-medium">Podle počtu výletů</p>
            </div>
          </div>

          <div className="space-y-3">
            {data.topUsers.map((u, i) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                <span className="text-[13px] font-black text-gray-500 w-6 text-center">{i + 1}.</span>
                <UserAvatar user={{ first_name: u.firstName, last_name: u.lastName, avatar_url: u.avatarUrl }} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold truncate">
                    {u.firstName ? `${u.firstName} ${u.lastName || ''}` : u.email}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">{u.email}</p>
                </div>
                <span className="text-[13px] font-bold text-orange-400">{u.tripCount} výletů</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Users */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <UserPlus size={18} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Poslední registrace</h3>
            <p className="text-[11px] text-gray-500 font-medium">10 nejnovějších uživatelů</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/[0.06]">
                <th className="pb-3 pr-4">Uživatel</th>
                <th className="pb-3 pr-4 hidden sm:table-cell">E-mail</th>
                <th className="pb-3 pr-4 hidden md:table-cell">Role</th>
                <th className="pb-3 pr-4">Výlety</th>
                <th className="pb-3">Registrace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {data.recentUsers.map(u => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={{ first_name: u.firstName, last_name: u.lastName, avatar_url: u.avatarUrl }} size="sm" />
                      <span className="text-[13px] font-bold truncate max-w-[120px]">
                        {u.firstName ? `${u.firstName} ${u.lastName || ''}` : u.email.split('@')[0]}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 hidden sm:table-cell">
                    <span className="text-[13px] text-gray-400 truncate">{u.email}</span>
                  </td>
                  <td className="py-3 pr-4 hidden md:table-cell">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                      u.role === 'admin' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/[0.06] text-gray-400'
                    }`}>
                      {u.role || 'user'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-[13px] font-bold">{u.tripCount}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-[12px] text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString('cs-CZ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
