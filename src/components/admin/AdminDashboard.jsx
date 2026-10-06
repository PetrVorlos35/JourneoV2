import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import api from '../../services/api';
import UserAvatar from '../ui/UserAvatar';
import { AdminDashboardSkeleton } from '../ui/Skeletons';
import { avatarUser, displayName, formatDate } from './adminUi';

// Barvy grafu ověřené validátorem palety (CVD i kontrast) pro světlý
// i tmavý povrch: modrá = registrace, jantarová = výlety.
const SERIES = [
  { key: 'signups', bar: 'bg-blue-600 dark:bg-blue-500', dot: 'bg-blue-600 dark:bg-blue-500' },
  { key: 'trips', bar: 'bg-amber-600', dot: 'bg-amber-600' },
];

const WeeklyChart = ({ weeks, t, locale }) => {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...weeks.flatMap((w) => [w.signups, w.trips]));
  const label = (iso) => new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'numeric' });

  return (
    <div>
      <div className="flex items-center gap-5 text-[13px] font-medium text-gray-600 dark:text-gray-300">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-sm ${s.dot}`} aria-hidden="true" />
            {t(`admin.v2.${s.key}`)}
          </span>
        ))}
      </div>

      <div className="relative mt-5" aria-hidden="true">
        {/* jemná mřížka: jen polovina a vršek */}
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-gray-200 dark:border-white/10" />
        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-gray-100 dark:border-white/[0.06]" />
        <span className="absolute -top-2.5 right-0 bg-white dark:bg-[#1C1C1E] pl-1.5 text-[11px] font-medium tabular-nums text-gray-500">{max}</span>

        <div className="relative h-44 flex items-end gap-1 sm:gap-2 border-b border-gray-200 dark:border-white/10">
          {weeks.map((w, i) => (
            <div
              key={w.week}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className={`relative flex-1 h-full flex items-end justify-center gap-[2px] rounded-t-md transition-colors ${hover === i ? 'bg-gray-50 dark:bg-white/[0.04]' : ''}`}
            >
              {SERIES.map((s) => (
                <span
                  key={s.key}
                  className={`w-full max-w-[14px] rounded-t-[4px] ${s.bar}`}
                  style={{ height: `${(w[s.key] / max) * 100}%`, minHeight: w[s.key] > 0 ? 3 : 0 }}
                />
              ))}
              {hover === i && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 w-max px-3 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[12px] shadow-lg pointer-events-none">
                  <p className="font-semibold">{t('admin.v2.weekOf', { date: label(w.week) })}</p>
                  {SERIES.map((s) => (
                    <p key={s.key} className="flex items-center gap-2 mt-0.5 tabular-nums">
                      <span className={`w-2 h-2 rounded-sm ${s.dot}`} />
                      {t(`admin.v2.${s.key}`)}: <span className="font-semibold">{w[s.key]}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-1 sm:gap-2 mt-2">
          {weeks.map((w, i) => (
            <span key={w.week} className="flex-1 text-center text-[11px] font-medium tabular-nums text-gray-500 dark:text-gray-400">
              {i % 2 === 0 ? label(w.week) : ''}
            </span>
          ))}
        </div>
      </div>

      {/* Hodnoty i pro čtečky a bez barev */}
      <table className="sr-only">
        <caption>{t('admin.v2.chartTable')}</caption>
        <thead><tr><th>{t('admin.v2.weekOf', { date: '' })}</th><th>{t('admin.v2.signups')}</th><th>{t('admin.v2.trips')}</th></tr></thead>
        <tbody>{weeks.map((w) => <tr key={w.week}><td>{label(w.week)}</td><td>{w.signups}</td><td>{w.trips}</td></tr>)}</tbody>
      </table>
    </div>
  );
};

const PersonRow = ({ u, meta, t }) => (
  <li>
    <Link
      to={`/dashboard/admin/users?user=${u.id}`}
      className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
    >
      <UserAvatar user={avatarUser(u)} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-gray-900 dark:text-white truncate">{displayName(u, t('admin.users.detail.noName'))}</span>
        <span className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 truncate">{u.email}</span>
      </span>
      <span className="shrink-0 text-[13px] font-medium tabular-nums text-gray-600 dark:text-gray-300">{meta}</span>
    </Link>
  </li>
);

const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.dashboard()
      .then((r) => setData(r.dashboard))
      .catch((err) => console.error('Failed to fetch admin dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminDashboardSkeleton />;
  if (!data) {
    return <p className="py-20 text-center text-gray-500 dark:text-gray-400">{t('admin.dashboard.loadError')}</p>;
  }

  const n = (v) => (v ?? 0).toLocaleString(i18n.language);
  const pageCard = 'bg-white dark:bg-[#1C1C1E] border border-gray-200/80 dark:border-white/10 rounded-[1.75rem] p-5 sm:p-8';

  const facts = [
    { label: t('admin.v2.totalUsers'), value: n(data.totalUsers), note: `+${n(data.newUsersWeek)} · 7 d` },
    { label: t('admin.v2.active30'), value: n(data.activeUsers30), note: t('admin.v2.active30Hint') },
    { label: t('admin.v2.totalTrips'), value: n(data.totalTrips), note: `+${n(data.newTripsWeek)} · 7 d` },
    { label: t('admin.v2.friendships'), value: n(data.totalFriendships) },
    { label: t('admin.v2.unverified'), value: n(data.unverifiedUsers) },
  ];

  return (
    <div className="space-y-5">
      <section className={pageCard}>
        <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-5">
          {facts.map((f) => (
            <div key={f.label} className="min-w-0 flex flex-col">
              <dt className="order-last mt-1 text-[13px] font-medium text-gray-600 dark:text-gray-300">{f.label}</dt>
              <dd className="text-[26px] font-bold leading-none tracking-tight tabular-nums text-gray-900 dark:text-white">
                {f.value}
                {f.note && <span className="ml-2 text-[12px] font-semibold tracking-normal text-gray-500 dark:text-gray-400">{f.note}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={pageCard}>
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
          <h2 className="text-[18px] font-bold tracking-tight text-gray-900 dark:text-white">{t('admin.v2.chartTitle')}</h2>
          <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">{t('admin.v2.chartRange')}</p>
        </div>
        {data.weekly?.length ? <WeeklyChart weeks={data.weekly} t={t} locale={i18n.language} /> : <p className="text-gray-500">{t('admin.dashboard.tripsChart.noData')}</p>}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className={pageCard}>
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <h2 className="text-[18px] font-bold tracking-tight text-gray-900 dark:text-white">{t('admin.v2.newest')}</h2>
            <Link to="/dashboard/admin/users" className="inline-flex items-center gap-1 text-[13px] font-semibold text-blue-700 dark:text-blue-400 hover:underline underline-offset-2">
              {t('admin.v2.allUsers')} <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>
          <ul>
            {(data.recentUsers || []).slice(0, 6).map((u) => (
              <PersonRow key={u.id} u={u} t={t} meta={formatDate(u.createdAt, i18n.language)} />
            ))}
          </ul>
        </section>
        <section className={pageCard}>
          <h2 className="text-[18px] font-bold tracking-tight text-gray-900 dark:text-white mb-2">{t('admin.v2.mostActive')}</h2>
          <ul>
            {(data.topUsers || []).map((u) => (
              <PersonRow key={u.id} u={u} t={t} meta={`${n(u.tripCount)} ${t('admin.dashboard.stats.tripCount')}`} />
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
