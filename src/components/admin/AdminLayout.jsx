import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Map, LogOut, ArrowLeft, Shield } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../ui/UserAvatar';

// eslint-disable-next-line no-unused-vars
const AdminTab = ({ icon: Icon, label, path, active, layoutId, reduceMotion }) => (
  <Link
    to={path}
    aria-current={active ? 'page' : undefined}
    className={`relative flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 h-11 md:h-9 rounded-[10px] text-[13px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
      active
        ? 'text-gray-900 dark:text-white'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
    }`}
  >
    {active && (
      <motion.span
        layoutId={reduceMotion ? undefined : layoutId}
        className="absolute inset-0 rounded-[10px] bg-white dark:bg-[#2c2c2e] shadow-sm border border-black/[0.04] dark:border-white/[0.06]"
        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 32 }}
      />
    )}
    <span className="relative z-10 flex items-center gap-2">
      <Icon size={15} strokeWidth={active ? 2.4 : 2} />
      {label}
    </span>
  </Link>
);

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const adminTabs = [
    { icon: LayoutDashboard, label: t('admin.nav.overview'), path: '/admin' },
    { icon: Users, label: t('admin.nav.users'), path: '/admin/users' },
    { icon: Map, label: t('admin.nav.trips'), path: '/admin/trips' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-[100dvh] bg-[#fbfbfd] dark:bg-black text-gray-900 dark:text-[#f5f5f7] font-sans">
      {/* Static ambient glow — same family as the dashboard, no decorative motion */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 -translate-x-1/2 -top-64 w-[900px] h-[560px] rounded-full bg-blue-500/[0.05] dark:bg-blue-500/[0.07] blur-[140px]" />
      </div>

      {/* ── Console header ── */}
      <header className="sticky top-0 z-40 glass-nav border-x-0 border-t-0 pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-3">
            {/* Identity — amber shield marks admin mode */}
            <Link
              to="/admin"
              className="flex items-center gap-2.5 min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <Shield size={17} className="text-amber-600 dark:text-amber-400" strokeWidth={2.25} />
              </div>
              <div className="leading-tight min-w-0">
                <p className="font-bold text-[15px] tracking-tight truncate">Journeo</p>
                <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 truncate">
                  {t('admin.administrator')}
                </p>
              </div>
            </Link>

            {/* Desktop tab nav */}
            <nav
              aria-label={t('admin.dashboard.title')}
              className="hidden md:flex items-center gap-0.5 p-1 rounded-[14px] bg-gray-100/70 dark:bg-white/[0.06] border border-black/5 dark:border-white/[0.06]"
            >
              {adminTabs.map((tab) => (
                <AdminTab
                  key={tab.path}
                  {...tab}
                  active={location.pathname === tab.path}
                  layoutId="admin-tab-desktop"
                  reduceMotion={shouldReduceMotion}
                />
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-1">
              <Link
                to="/dashboard"
                className="hidden sm:flex items-center gap-2 h-10 px-3.5 rounded-xl text-[13px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
              >
                <ArrowLeft size={16} strokeWidth={2.25} />
                <span>{t('admin.backToDashboard')}</span>
              </Link>
              <Link
                to="/dashboard"
                aria-label={t('admin.backToDashboard')}
                className="sm:hidden w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
              >
                <ArrowLeft size={19} strokeWidth={2.25} />
              </Link>
              <button
                onClick={handleLogout}
                aria-label={t('admin.logout')}
                title={t('admin.logout')}
                className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
              >
                <LogOut size={17} strokeWidth={2.25} />
              </button>
              <div className="hidden sm:block pl-1.5" title={user?.email}>
                <UserAvatar user={user} size="sm" />
              </div>
            </div>
          </div>

          {/* Mobile tab nav */}
          <nav
            aria-label={t('admin.dashboard.title')}
            className="md:hidden flex items-center gap-0.5 p-1 mb-3 rounded-[14px] bg-gray-100/70 dark:bg-white/[0.06] border border-black/5 dark:border-white/[0.06]"
          >
            {adminTabs.map((tab) => (
              <AdminTab
                key={tab.path}
                {...tab}
                active={location.pathname === tab.path}
                layoutId="admin-tab-mobile"
                reduceMotion={shouldReduceMotion}
              />
            ))}
          </nav>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-[max(4rem,calc(env(safe-area-inset-bottom)+3rem))]">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
