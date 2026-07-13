import { useState, useEffect } from 'react';
import { Users, Map, DollarSign, Heart, TrendingUp, UserPlus } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import UserAvatar from '../ui/UserAvatar';
import { AdminDashboardSkeleton } from '../ui/Skeletons';

// eslint-disable-next-line no-unused-vars
const SectionHead = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
      <Icon size={17} className="text-blue-600 dark:text-blue-400" strokeWidth={2.25} />
    </div>
    <div>
      <h3 className="font-bold text-[15px] tracking-tight">{title}</h3>
      <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">{subtitle}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
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

  const reveal = (delay = 0) =>
    shouldReduceMotion
      ? {}
      : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25, delay, ease: 'easeOut' } };

  if (loading) {
    return <AdminDashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-gray-500 dark:text-gray-400">
        {t('admin.dashboard.loadError')}
      </div>
    );
  }

  const getMonthLabel = (monthKey) => {
    try {
      return new Date(2024, parseInt(monthKey) - 1, 1).toLocaleString(i18n.language, { month: 'short' });
    } catch {
      return monthKey;
    }
  };

  const maxTripsInMonth = Math.max(...(data.tripsPerMonth?.map(m => m.count) || [1]), 1);

  const kpis = [
    {
      icon: Users,
      label: t('admin.dashboard.stats.users'),
      value: data.totalUsers.toLocaleString(i18n.language),
      delta: t('admin.dashboard.stats.newThisWeek', { count: data.newUsersWeek }),
      primary: true,
    },
    {
      icon: Map,
      label: t('admin.dashboard.stats.trips'),
      value: data.totalTrips.toLocaleString(i18n.language),
    },
    {
      icon: DollarSign,
      label: t('admin.dashboard.stats.expenses'),
      value: `${data.totalExpenseAmount.toLocaleString(i18n.language)} Kč`,
      delta: t('admin.dashboard.stats.expenseItems', { count: data.totalExpenses }),
    },
    {
      icon: Heart,
      label: t('admin.dashboard.stats.friendships'),
      value: data.totalFriendships.toLocaleString(i18n.language),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div {...reveal()}>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">
          {t('admin.dashboard.overview')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm font-medium">{t('admin.dashboard.subtitle')}</p>
      </motion.div>

      {/* KPI strip — one panel, hairline-separated segments, primary metric accented */}
      <motion.div
        {...reveal(0.05)}
        className="rounded-2xl overflow-hidden border border-gray-200 dark:border-white/[0.06] bg-gray-200 dark:bg-white/[0.06] grid grid-cols-2 lg:grid-cols-4 gap-px"
      >
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-white dark:bg-[#0e0e10] p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <Icon
                  size={15}
                  strokeWidth={2.5}
                  className={k.primary ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}
                />
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {k.label}
                </span>
              </div>
              <p
                className={`text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${
                  k.primary ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                }`}
              >
                {k.value}
              </p>
              {k.delta && <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1 font-medium">{k.delta}</p>}
            </div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trips per month chart */}
        <motion.div
          {...reveal(0.1)}
          className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.03] p-6"
        >
          <SectionHead
            icon={TrendingUp}
            title={t('admin.dashboard.tripsChart.title')}
            subtitle={t('admin.dashboard.tripsChart.subtitle')}
          />

          {data.tripsPerMonth && data.tripsPerMonth.length > 0 ? (
            <div className="flex items-end gap-3 h-40">
              {data.tripsPerMonth.map((m, i) => {
                const monthKey = m.month.split('-')[1];
                const pct = `${(m.count / maxTripsInMonth) * 100}%`;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 tabular-nums">{m.count}</span>
                    <motion.div
                      initial={shouldReduceMotion ? false : { height: 0 }}
                      animate={{ height: pct }}
                      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.45, delay: 0.15 + i * 0.05, ease: 'easeOut' }}
                      className="w-full min-h-[8px] rounded-lg bg-blue-600 dark:bg-blue-500"
                    />
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">{getMonthLabel(monthKey)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">{t('admin.dashboard.tripsChart.noData')}</div>
          )}
        </motion.div>

        {/* Top users */}
        <motion.div
          {...reveal(0.15)}
          className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.03] p-6"
        >
          <SectionHead
            icon={Users}
            title={t('admin.dashboard.topUsers.title')}
            subtitle={t('admin.dashboard.topUsers.subtitle')}
          />

          <div className="space-y-1">
            {data.topUsers.map((u, i) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                <span className="text-[13px] font-semibold text-gray-400 dark:text-gray-500 w-6 text-center tabular-nums">{i + 1}</span>
                <UserAvatar user={{ first_name: u.firstName, last_name: u.lastName, avatar_url: u.avatarUrl }} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate">
                    {u.firstName ? `${u.firstName} ${u.lastName || ''}` : u.email}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                </div>
                <span className="text-[13px] font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                  {u.tripCount} {t('admin.dashboard.stats.tripCount')}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Users */}
      <motion.div
        {...reveal(0.2)}
        className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.03] p-6"
      >
        <SectionHead
          icon={UserPlus}
          title={t('admin.dashboard.recentUsers.title')}
          subtitle={t('admin.dashboard.recentUsers.subtitle')}
        />

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-white/[0.06]">
                <th scope="col" className="pb-3 pr-4">{t('admin.dashboard.recentUsers.cols.user')}</th>
                <th scope="col" className="pb-3 pr-4 hidden sm:table-cell">{t('admin.dashboard.recentUsers.cols.email')}</th>
                <th scope="col" className="pb-3 pr-4 hidden md:table-cell">{t('admin.dashboard.recentUsers.cols.role')}</th>
                <th scope="col" className="pb-3 pr-4">{t('admin.dashboard.recentUsers.cols.trips')}</th>
                <th scope="col" className="pb-3">{t('admin.dashboard.recentUsers.cols.registration')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
              {data.recentUsers.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={{ first_name: u.firstName, last_name: u.lastName, avatar_url: u.avatarUrl }} size="sm" />
                      <span className="text-[13px] font-semibold truncate max-w-[120px]">
                        {u.firstName ? `${u.firstName} ${u.lastName || ''}` : u.email.split('@')[0]}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 hidden sm:table-cell">
                    <span className="text-[13px] text-gray-500 dark:text-gray-400 truncate">{u.email}</span>
                  </td>
                  <td className="py-3 pr-4 hidden md:table-cell">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                      u.role === 'admin' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400'
                    }`}>
                      {u.role || 'user'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-[13px] font-semibold tabular-nums">{u.tripCount}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-[12px] text-gray-500 dark:text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString(i18n.language)}
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
