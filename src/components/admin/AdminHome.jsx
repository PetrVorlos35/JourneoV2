import { Suspense, lazy } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminDashboardSkeleton, AdminTableSkeleton } from '../ui/Skeletons';

const AdminDashboard = lazy(() => import('./AdminDashboard'));
const AdminUsers = lazy(() => import('./AdminUsers'));
const AdminTrips = lazy(() => import('./AdminTrips'));
const AdminAnalytics = lazy(() => import('./AdminAnalytics'));
const AdminErrors = lazy(() => import('./AdminErrors'));

const TableLoading = () => (
  <div className="rounded-[1.75rem] border border-gray-200 dark:border-white/[0.08] p-4">
    <AdminTableSkeleton rows={8} />
  </div>
);

// Admin žije uvnitř shellu aplikace (postranní panel, mobilní lišta) —
// vlastní je jen nadpis a přepínač pohledů.
const AdminHome = () => {
  const { t } = useTranslation();
  const tabs = [
    { to: '/dashboard/admin', end: true, label: t('admin.nav.overview') },
    { to: '/dashboard/admin/users', label: t('admin.nav.users') },
    { to: '/dashboard/admin/trips', label: t('admin.nav.trips') },
    { to: '/dashboard/admin/analytics', label: t('admin.nav.analytics') },
    { to: '/dashboard/admin/errors', label: t('admin.nav.errors') },
  ];

  return (
    <div className="w-full pb-32 md:pb-12">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="text-[32px] sm:text-5xl font-bold tracking-tight leading-[1.1] text-primary">{t('admin.v2.title')}</h1>
        <nav aria-label={t('admin.v2.title')} className="flex max-w-full overflow-x-auto p-1 rounded-2xl bg-gray-100 dark:bg-white/[0.06] self-start sm:self-auto [scrollbar-width:none]">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => `shrink-0 whitespace-nowrap px-4 h-10 inline-flex items-center rounded-xl text-[14px] font-semibold transition-colors ${
                isActive
                  ? 'bg-white dark:bg-[#2c2c2e] text-primary shadow-[0_1px_2px_rgba(17,24,39,0.08)]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary'
              }`}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <Routes>
        <Route index element={<Suspense fallback={<AdminDashboardSkeleton />}><AdminDashboard /></Suspense>} />
        <Route path="users" element={<Suspense fallback={<TableLoading />}><AdminUsers /></Suspense>} />
        <Route path="trips" element={<Suspense fallback={<TableLoading />}><AdminTrips /></Suspense>} />
        <Route path="analytics" element={<Suspense fallback={<AdminDashboardSkeleton />}><AdminAnalytics /></Suspense>} />
        <Route path="errors" element={<Suspense fallback={<TableLoading />}><AdminErrors /></Suspense>} />
        <Route path="*" element={<Navigate to="/dashboard/admin" replace />} />
      </Routes>
    </div>
  );
};

export default AdminHome;
