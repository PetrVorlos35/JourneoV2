import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Map, LogOut, ArrowLeft, Shield } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../ui/UserAvatar';

// eslint-disable-next-line no-unused-vars
const AdminSidebarItem = ({ icon: Icon, label, path, active, onClick }) => (
  <Link
    to={path}
    aria-current={active ? 'page' : undefined}
    onClick={(e) => {
      if (onClick) onClick(path, e);
    }}
    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative group active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
      active
        ? 'text-white'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10'
    }`}
  >
    {active && (
      <motion.div
        layoutId="admin-sidebar-active-pill"
        className="absolute inset-0 bg-orange-600 rounded-2xl shadow-md shadow-orange-500/20"
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
      />
    )}
    <div className="relative z-10 flex items-center gap-3">
      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
      <span className="font-semibold">{label}</span>
    </div>
  </Link>
);

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const adminNavItems = [
    { icon: LayoutDashboard, label: t('admin.nav.overview'), path: '/admin' },
    { icon: Users, label: t('admin.nav.users'), path: '/admin/users' },
    { icon: Map, label: t('admin.nav.trips'), path: '/admin/trips' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#fbfbfd] dark:bg-[#0a0a0b] text-gray-900 dark:text-[#f5f5f7] flex font-sans relative">
      {/* Subtle Background Glow */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none flex justify-center items-center" aria-hidden="true">
        <motion.div
          animate={shouldReduceMotion ? { opacity: 0.18 } : {
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={shouldReduceMotion ? {} : { duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute w-[800px] h-[800px] rounded-[100%] bg-orange-500/15 blur-[150px]"
        />
        <motion.div
          animate={shouldReduceMotion ? { opacity: 0.12 } : {
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, 50, -50, 0],
          }}
          transition={shouldReduceMotion ? {} : { duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute w-[600px] h-[600px] rounded-[100%] bg-red-500/10 blur-[120px] right-[-100px] top-[-100px]"
        />
      </div>

      {/* ── Desktop Sidebar ── */}
      <div className="hidden md:flex flex-col p-6 z-20 shrink-0 w-[280px]">
        <aside className="w-full h-full flex flex-col overflow-hidden bg-gray-50/60 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.06] rounded-[2rem] backdrop-blur-sm">
          {/* Logo / Brand */}
          <div className="px-8 py-8 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Shield size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">Admin</span>
              <span className="text-[10px] ml-1.5 px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded-full font-bold uppercase tracking-wider">Panel</span>
            </div>
          </div>

          {/* Nav items */}
          <nav className="flex-1 px-4 py-2 space-y-2">
            {adminNavItems.map(item => (
              <AdminSidebarItem
                key={item.path}
                {...item}
                active={location.pathname === item.path}
              />
            ))}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-gray-200 dark:border-white/[0.06] space-y-3">
            {/* Back to Dashboard */}
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-300 active:scale-95 font-semibold"
            >
              <ArrowLeft size={20} strokeWidth={2} />
              <span>{t('admin.backToDashboard')}</span>
            </Link>

            {/* User info */}
            <div className="px-4 py-4 flex items-center gap-3 rounded-2xl bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none">
              <UserAvatar user={user} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold truncate">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
                </p>
                <p className="text-[11px] text-orange-400 truncate mt-0.5 font-semibold">{t('admin.administrator')}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all duration-300 active:scale-95 font-semibold cursor-pointer"
            >
              <LogOut size={20} strokeWidth={2} />
              <span>{t('admin.logout')}</span>
            </button>
          </div>
        </aside>
      </div>

      {/* ── Mobile bottom navigation (Floating Pill) ── */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50 flex justify-center pointer-events-none">
        <nav className="glass-panel w-full max-w-sm rounded-[2rem] flex justify-around items-center px-2 py-3 pointer-events-auto">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 flex-1 transition-all duration-300 py-1 ${
                  isActive ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
                <span className={`text-[9px] font-semibold transition-colors ${isActive ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 pb-28 md:pb-0 h-full flex flex-col relative z-10">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between p-4 glass sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
              <Shield size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg tracking-tight">Admin</span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              to="/dashboard"
              aria-label={t('admin.backToDashboard')}
              className="w-10 h-10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </Link>
            <button
              onClick={handleLogout}
              aria-label={t('admin.logout')}
              className="w-10 h-10 flex items-center justify-center hover:bg-red-500/10 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-red-500 cursor-pointer"
            >
              <LogOut size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-10 max-w-[1400px] mx-auto w-full flex flex-col min-h-0 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
