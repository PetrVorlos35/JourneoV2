import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, PlusSquare, Plus, Settings, LogOut, BarChart2, Wallet, X, Sun, Moon, Monitor, Map, Menu, Users, Shield } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useDialog } from '../ui/DialogModal';
import { useUnsavedChanges } from '../../contexts/UnsavedChangesContext';
import NotificationBell from '../ui/NotificationBell';
import JourneoLogo from '../../assets/Journeo_whitelogo.png';
import JourneoLogoDark from '../../assets/Journeo_blacklogo.png';
import UserAvatar from '../ui/UserAvatar';

// eslint-disable-next-line no-unused-vars
const SidebarItem = ({ icon: Icon, label, path, active, onClick, className, layoutId = "sidebar-active-pill", shortcut }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <Link
      to={path}
      onClick={(e) => {
        if (onClick) onClick(path, e);
      }}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative group active:scale-[0.98] ${
        active
          ? 'text-white'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10'
      } ${className || ''}`}
    >
      {active && (
        <motion.div
          layoutId={shouldReduceMotion ? undefined : layoutId}
          className="absolute inset-0 bg-blue-600 rounded-2xl shadow-md shadow-blue-500/20"
          transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <div className="relative z-10 flex items-center gap-3 w-full">
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        <span className="font-semibold">{label}</span>
        {shortcut && (
          <kbd className={`ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded transition-opacity ${active ? 'bg-white/20 text-white/70' : 'bg-gray-200/60 dark:bg-white/[0.07] text-gray-400 dark:text-gray-500'} opacity-0 group-hover:opacity-100`}>
            {shortcut}
          </kbd>
        )}
      </div>
    </Link>
  );
};

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const options = [
    { value: 'light', icon: Sun, label: t('dashboardLayout.theme.light') },
    { value: 'dark', icon: Moon, label: t('dashboardLayout.theme.dark') },
    { value: 'system', icon: Monitor, label: t('dashboardLayout.theme.system') },
  ];

  return (
    <div className="w-full flex p-1 bg-gray-100/50 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all duration-300 ${
            theme === value
              ? 'bg-white dark:bg-[#2c2c2e] text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          } cursor-pointer disabled:cursor-not-allowed`}
          aria-label={label}
        >
          <Icon size={16} strokeWidth={2} />
        </button>
      ))}
    </div>
  );
};

const DashboardLayout = ({ children, onOpenCreateModal }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, isAdmin } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { confirmDialog, ModalPortal } = useDialog();
  const { hasUnsavedChanges, setHasUnsavedChanges } = useUnsavedChanges();
  const [mobileOpen, setMobileOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const isTripDetail = location.pathname.includes('/trip/');

  const navItems = [
    { icon: Home,     label: t('dashboardLayout.nav.overview'),   path: '/dashboard',            shortcut: 'H' },
    { icon: Map,      label: t('dashboardLayout.nav.myTrips'),    path: '/dashboard/all-trips',  shortcut: 'T' },
    { icon: BarChart2,label: t('dashboardLayout.nav.statistics'), path: '/dashboard/statistics', shortcut: 'S' },
    { icon: Users,    label: t('dashboardLayout.nav.friends'),    path: '/dashboard/friends',    shortcut: 'F' },
    { icon: Wallet,   label: t('dashboardLayout.nav.budget'),     path: '/dashboard/budget',     shortcut: 'B' },
  ];

  const handleNavigation = async (path, e, onClickCallback) => {
    if (e) {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault();
    }
    if (location.pathname === path) {
      if (onClickCallback) onClickCallback();
      return;
    }

    if (hasUnsavedChanges) {
      const ok = await confirmDialog({
        title: t('dashboardLayout.dialogs.unsaved.title'),
        message: t('dashboardLayout.dialogs.unsaved.message'),
        confirmLabel: t('dashboardLayout.dialogs.unsaved.confirm'),
        variant: 'danger'
      });
      if (!ok) return;
      setHasUnsavedChanges(false);
    }

    if (onClickCallback) onClickCallback();
    navigate(path);
  };

  const handleLogout = async () => {
    if (hasUnsavedChanges) {
      const ok = await confirmDialog({
        title: t('dashboardLayout.dialogs.unsaved.title'),
        message: t('dashboardLayout.dialogs.unsaved.message'),
        confirmLabel: t('dashboardLayout.dialogs.unsaved.confirm'),
        variant: 'danger'
      });
      if (!ok) return;
      setHasUnsavedChanges(false);
    }

    const ok = await confirmDialog({
      title: t('dashboardLayout.dialogs.logout.title'),
      message: t('dashboardLayout.dialogs.logout.message'),
      variant: 'danger',
      confirmLabel: t('dashboardLayout.dialogs.logout.confirm')
    });
    if (ok) {
      logout();
      navigate('/');
    }
  };

  const closeMobile = () => setMobileOpen(false);

  const handleOpenCreateModal = async () => {
    if (hasUnsavedChanges) {
      const ok = await confirmDialog({
        title: t('dashboardLayout.dialogs.unsaved.title'),
        message: t('dashboardLayout.dialogs.unsaved.message'),
        confirmLabel: t('dashboardLayout.dialogs.unsaved.confirm'),
        variant: 'danger'
      });
      if (!ok) return;
      setHasUnsavedChanges(false);
    }
    onOpenCreateModal();
  };

  const handleOpenCreateModalRef = useRef(null);
  handleOpenCreateModalRef.current = handleOpenCreateModal;
  const handleNavigationRef = useRef(null);
  handleNavigationRef.current = (path) => handleNavigation(path);

  useEffect(() => {
    const NAV_SHORTCUTS = { h: '/dashboard', t: '/dashboard/all-trips', s: '/dashboard/statistics', f: '/dashboard/friends', b: '/dashboard/budget' };
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      const key = e.key.toLowerCase();
      if (key === 'n') { e.preventDefault(); handleOpenCreateModalRef.current?.(); return; }
      const path = NAV_SHORTCUTS[key];
      if (path) { e.preventDefault(); handleNavigationRef.current?.(path); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#fbfbfd] dark:bg-black text-gray-900 dark:text-[#f5f5f7] flex selection:bg-blue-500/30 font-sans relative transition-colors duration-500">
      {ModalPortal}
      <Toaster
        position="top-right"
        containerStyle={{ zIndex: 99999 }}
        toastOptions={{
          style: {
            background: isDark ? '#1C1C1E' : '#fff',
            color: isDark ? '#f5f5f7' : '#111827',
            borderRadius: '1rem',
            boxShadow: isDark ? '0 10px 15px -3px rgba(0,0,0,0.4)' : '0 10px 15px -3px rgba(0,0,0,0.1)',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
          },
        }}
      />

      {/* Subtle Background Glow with animation */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none flex justify-center items-center" aria-hidden="true">
        <motion.div
          animate={shouldReduceMotion ? { opacity: 0.3 } : {
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 5, -5, 0]
          }}
          transition={shouldReduceMotion ? {} : { duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute w-[800px] h-[800px] rounded-[100%] bg-blue-500/10 dark:bg-blue-500/15 blur-[120px]"
        />
        <motion.div
          animate={shouldReduceMotion ? { opacity: 0.2 } : {
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, 50, -50, 0],
            y: [0, -50, 50, 0]
          }}
          transition={shouldReduceMotion ? {} : { duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute w-[600px] h-[600px] rounded-[100%] bg-purple-500/10 dark:bg-purple-500/15 blur-[100px] right-[-100px] top-[-100px]"
        />
      </div>

      {/* ── Desktop Sidebar (Floating Glass Panel) ── */}
      <div className="hidden md:flex flex-col p-6 z-20 shrink-0 w-[280px]">
        <aside className="w-full h-full flex flex-col overflow-hidden bg-gray-50/60 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/[0.06] rounded-[2rem] backdrop-blur-sm">
          <div className="px-8 py-8 flex items-center gap-3">
            <img
              src={isDark ? JourneoLogo : JourneoLogoDark}
              alt="Journeo Logo"
              className="h-8 w-auto object-contain"
            />
            <span className="font-bold text-xl tracking-tight mt-0.5">Journeo</span>
          </div>

          <nav className="flex-1 px-4 py-2 space-y-2">
            {navItems.map(item => (
              <SidebarItem
                key={item.path}
                {...item}
                active={location.pathname === item.path}
                onClick={(path, e) => handleNavigation(path, e)}
                className="cursor-pointer disabled:cursor-not-allowed"
              />
            ))}
            <div className="pt-2">
              <button
                onClick={handleOpenCreateModal}
                className="flex w-full items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative group active:scale-[0.98] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <div className="relative z-10 flex items-center gap-3 w-full">
                  <PlusSquare size={20} strokeWidth={2} />
                  <span className="font-semibold">{t('dashboardLayout.nav.createTrip')}</span>
                  <kbd className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-200/60 dark:bg-white/[0.07] text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">N</kbd>
                </div>
              </button>
            </div>
          </nav>

          <div className="p-4 border-t border-gray-100 dark:border-white/10 space-y-3">
            <div className="w-full px-2 pb-2">
              <ThemeToggle />
            </div>

            <Link to="/dashboard/settings" onClick={(e) => handleNavigation('/dashboard/settings', e)} className={`px-4 py-4 flex items-center gap-3 rounded-2xl transition-all duration-300 active:scale-95 cursor-pointer disabled:cursor-not-allowed ${location.pathname === '/dashboard/settings' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'hover:bg-gray-100 dark:hover:bg-white/10'}`}>
              <UserAvatar user={user} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold truncate">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
                </p>
                <p className={`text-[11px] truncate mt-0.5 font-semibold ${location.pathname === '/dashboard/settings' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>{user?.bio || t('dashboardLayout.traveler')}</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-300 active:scale-95 font-semibold cursor-pointer disabled:cursor-not-allowed"
            >
              <LogOut size={20} strokeWidth={2} />
              <span>{t('dashboardLayout.dialogs.logout.confirm')}</span>
            </button>

            {isAdmin && (
              <Link
                to="/admin"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 text-orange-500 dark:text-orange-400 hover:from-orange-500/20 hover:to-red-500/20 transition-all duration-300 active:scale-95 font-semibold cursor-pointer"
              >
                <Shield size={20} strokeWidth={2} />
                <span>{t('dashboardLayout.nav.admin')}</span>
              </Link>
            )}
          </div>
        </aside>
      </div>

      {/* ── Mobile bottom navigation (Floating Pill) ── */}
      {!isTripDetail && (
        <div className="md:hidden fixed bottom-6 left-6 right-6 z-50 flex justify-center pointer-events-none">
          <nav className="glass-panel w-full max-w-sm rounded-[2rem] flex justify-around items-center px-2 py-3 pointer-events-auto">
            {navItems.map(({ icon: Icon, label, path }) => (
              <Link
                key={path}
                to={path}
                onClick={(e) => handleNavigation(path, e)}
                className={`flex flex-col items-center gap-1 flex-1 transition-all duration-300 py-1 ${
                  location.pathname === path ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                } cursor-pointer disabled:cursor-not-allowed`}
              >
                <Icon size={20} strokeWidth={location.pathname === path ? 2.5 : 2} aria-hidden="true" />
                <span className={`text-[9px] font-semibold transition-colors ${location.pathname === path ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>{label.split(' ')[0]}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* ── Mobile slide-over (for Settings/Logout) ── */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[60] flex md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
              onClick={closeMobile}
            />
            <motion.aside
              initial={shouldReduceMotion ? { opacity: 0 } : { x: "100%" }}
              animate={shouldReduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { x: "100%" }}
              transition={shouldReduceMotion ? { duration: 0.15 } : { type: "spring", bounce: 0, duration: 0.4 }}
              className="absolute right-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-white dark:bg-[#1C1C1E] flex flex-col h-full z-10 rounded-l-[2rem] shadow-2xl"
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={isDark ? JourneoLogo : JourneoLogoDark}
                    alt="Journeo Logo"
                    className="h-7 w-auto object-contain"
                  />
                  <span className="font-bold text-xl tracking-tight mt-0.5">Journeo</span>
                </div>
                <button onClick={closeMobile} className="p-2 bg-gray-100 dark:bg-white/10 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer disabled:cursor-not-allowed">
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              <div className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
                <div className="p-6 bg-gray-50 dark:bg-black border border-gray-100 dark:border-white/5 rounded-3xl mx-2 text-center">
                  <div className="flex justify-center mb-4">
                    <UserAvatar user={user} size="lg" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xl truncate mb-1">
                      {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : t('dashboardLayout.mobile.myProfile')}
                    </p>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 truncate tracking-wide font-medium">{user?.bio || user?.email}</p>
                  </div>
                </div>

                {/* Mobile Theme Toggle */}
                <div className="px-4 space-y-3">
                  <p className="text-[11px] font-medium text-gray-400">{t('dashboardLayout.mobile.appearance')}</p>
                  <ThemeToggle />
                </div>

                <div className="space-y-2">
                  <p className="px-4 text-[11px] font-medium text-gray-400 mb-3">{t('dashboardLayout.mobile.options')}</p>
                  <button
                    onClick={() => { closeMobile(); handleOpenCreateModal(); }}
                    className="flex w-full items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative group active:scale-[0.98] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 mb-2 cursor-pointer"
                  >
                    <div className="relative z-10 flex items-center gap-3">
                      <PlusSquare size={20} strokeWidth={2} />
                      <span className="font-semibold">{t('dashboardLayout.nav.createTrip')}</span>
                    </div>
                  </button>
                  <SidebarItem
                    icon={BarChart2}
                    label={t('dashboardLayout.nav.statistics')}
                    path="/dashboard/statistics"
                    active={location.pathname === '/dashboard/statistics'}
                    onClick={(path, e) => handleNavigation(path, e, closeMobile)}
                    layoutId="mobile-sidebar-active-pill"
                   className="cursor-pointer disabled:cursor-not-allowed"/>
                  <SidebarItem
                    icon={Settings}
                    label={t('dashboardLayout.nav.settings')}
                    path="/dashboard/settings"
                    active={location.pathname === '/dashboard/settings'}
                    onClick={(path, e) => handleNavigation(path, e, closeMobile)}
                    layoutId="mobile-sidebar-active-pill"
                   className="cursor-pointer disabled:cursor-not-allowed"/>
                </div>
              </div>

              <div className="p-6">
                <button
                  onClick={() => { closeMobile(); handleLogout(); }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors duration-300 font-bold cursor-pointer disabled:cursor-not-allowed"
                >
                  <LogOut size={20} strokeWidth={2.5} />
                  <span>{t('dashboardLayout.dialogs.logout.confirm')}</span>
                </button>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={closeMobile}
                    className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 text-orange-500 hover:from-orange-500/20 hover:to-red-500/20 transition-all font-bold mt-3"
                  >
                    <Shield size={20} strokeWidth={2.5} />
                    <span>{t('dashboardLayout.nav.admin')}</span>
                  </Link>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 pb-28 md:pb-0 h-full flex flex-col relative z-10">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between p-4 glass sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2">
            <img
              src={isDark ? JourneoLogo : JourneoLogoDark}
              alt="Journeo Logo"
              className="h-7 w-auto object-contain"
            />
            <span className="font-bold text-lg tracking-tight mt-0.5">Journeo</span>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button onClick={() => setMobileOpen(true)} className="w-10 h-10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-gray-900 dark:text-white cursor-pointer disabled:cursor-not-allowed">
              <Menu size={24} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ── Desktop Floating Notification Bell ── */}
        <div className="hidden md:block fixed top-6 right-6 z-50">
          <NotificationBell />
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-10 max-w-[1400px] mx-auto w-full flex flex-col min-h-0 custom-scrollbar">
          {children}
        </div>

        {/* ── Global FAB for new trip (Mobile) ── */}
        {!isTripDetail && !location.pathname.includes('/budget') && (
          <button
            onClick={handleOpenCreateModal}
            aria-label={t('dashboardLayout.nav.createTrip')}
            className="md:hidden fixed bottom-24 right-6 z-[100] w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(37,99,235,0.4)] active:scale-90 transition-transform cursor-pointer"
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        )}
      </main>
    </div>
  );
};

export default DashboardLayout;
