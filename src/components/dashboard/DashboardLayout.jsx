import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, PlusSquare, Settings, LogOut, BarChart2, Wallet, X, Sun, Moon, Monitor, Mountain, Palmtree, Compass, Map, Plane, Camera, Menu } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useDialog } from '../ui/DialogModal';
import { useUnsavedChanges } from '../../contexts/UnsavedChangesContext';
import JourneoLogo from '../../assets/Journeo_whitelogo.png';
import JourneoLogoDark from '../../assets/Journeo_blacklogo.png';

const navItems = [
  { icon: Home, label: 'Přehled', path: '/dashboard' },
  { icon: Map, label: 'Moje výlety', path: '/dashboard/all-trips' },
  { icon: PlusSquare, label: 'Vytvořit výlet', path: '/dashboard/create' },
  { icon: BarChart2, label: 'Statistiky', path: '/dashboard/statistics' },
  { icon: Wallet, label: 'Výdaje', path: '/dashboard/budget' },
];

const SidebarItem = ({ icon: Icon, label, path, active, onClick }) => (
  <a
    href={path}
    onClick={(e) => {
      e.preventDefault();
      if (onClick) onClick(path, e);
    }}
    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
      active
        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10'
    } cursor-pointer disabled:cursor-not-allowed`}
  >
    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    <span className="font-semibold">{label}</span>
  </a>
);

const avatarPresets = {
  mountain: Mountain,
  beach: Palmtree,
  city: Compass,
  forest: Map,
  travel: Plane,
  photography: Camera,
};

const UserAvatar = ({ user, size = "md" }) => {
  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user?.first_name) return user.first_name[0].toUpperCase();
    if (user?.email) return user.email.substring(0, 2).toUpperCase();
    return '??';
  };

  const sizeClasses = {
    sm: "w-8 h-8 text-[11px]",
    md: "w-10 h-10 text-xs",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-xl"
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 24,
    xl: 32
  };

  if (user?.avatar_url && avatarPresets[user.avatar_url]) {
    const Icon = avatarPresets[user.avatar_url];
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-2 border-blue-600/30 flex items-center justify-center shrink-0`}>
        <Icon size={iconSizes[size]} strokeWidth={2.5} />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-2 border-blue-600/30 flex items-center justify-center font-bold shrink-0`}>
      {getInitials()}
    </div>
  );
};

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: 'light', icon: Sun, label: 'Světlý' },
    { value: 'dark', icon: Moon, label: 'Tmavý' },
    { value: 'system', icon: Monitor, label: 'Systém' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/50 dark:border-white/5">
      {options.map(({ value, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`flex-1 flex items-center justify-center p-2 rounded-xl transition-all duration-300 ${
            theme === value
              ? 'bg-white dark:bg-white/15 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          } cursor-pointer disabled:cursor-not-allowed`}
          title={value}
        >
          <Icon size={16} strokeWidth={2} />
        </button>
      ))}
    </div>
  );
};

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { theme } = useTheme();
  const { confirmDialog, ModalPortal } = useDialog();
  const { hasUnsavedChanges, setHasUnsavedChanges } = useUnsavedChanges();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const isTripDetail = location.pathname.startsWith('/dashboard/trip/');

  const handleNavigation = async (path, e, onClickCallback) => {
    if (e) e.preventDefault();
    if (location.pathname === path) {
      if (onClickCallback) onClickCallback();
      return;
    }

    if (hasUnsavedChanges) {
      const ok = await confirmDialog({
        title: 'Máte neuložené změny',
        message: 'Opravdu chcete odejít? Vaše změny nebudou uloženy.',
        confirmLabel: 'Odejít bez uložení',
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
        title: 'Máte neuložené změny',
        message: 'Opravdu chcete odejít? Vaše změny nebudou uloženy.',
        confirmLabel: 'Odejít bez uložení',
        variant: 'danger'
      });
      if (!ok) return;
      setHasUnsavedChanges(false);
    }
    
    const ok = await confirmDialog({
      title: 'Odhlásit se?',
      message: 'Opravdu se chcete odhlásit ze svého účtu?',
      variant: 'danger',
      confirmLabel: 'Odhlásit se'
    });
    if (ok) {
      logout();
      navigate('/');
    }
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#fbfbfd] dark:bg-black text-gray-900 dark:text-[#f5f5f7] flex selection:bg-blue-500/30 font-sans relative transition-colors duration-500">
      {ModalPortal}
      <Toaster
        position="top-right"
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

      {/* Subtle Background Glow */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none flex justify-center items-center">
        <div className="absolute w-[800px] h-[800px] rounded-[100%] bg-blue-500/5 dark:bg-blue-500/10 blur-[120px]" />
      </div>

      {/* ── Desktop Sidebar (Floating Glass Panel) ── */}
      <div className="hidden md:flex flex-col p-6 z-20 shrink-0 w-[280px]">
        <aside className="w-full h-full glass-card flex flex-col overflow-hidden">
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
               className="cursor-pointer disabled:cursor-not-allowed"/>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100 dark:border-white/10 space-y-3">
            {/* Theme Toggle */}
            <div className="px-2 pb-2">
              <ThemeToggle />
            </div>

            <SidebarItem
              icon={Settings}
              label="Nastavení"
              path="/dashboard/settings"
              active={location.pathname === '/dashboard/settings'}
              onClick={(path, e) => handleNavigation(path, e)}
             className="cursor-pointer disabled:cursor-not-allowed"/>
            <a href="/dashboard/settings" onClick={(e) => handleNavigation('/dashboard/settings', e)} className="px-4 py-4 flex items-center gap-3 mt-1 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:cursor-not-allowed">
              <UserAvatar user={user} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold truncate">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5 font-semibold">{user?.bio || 'Cestovatel'}</p>
              </div>
            </a>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-300 font-semibold cursor-pointer disabled:cursor-not-allowed"
            >
              <LogOut size={20} strokeWidth={2} />
              <span>Odhlásit se</span>
            </button>
          </div>
        </aside>
      </div>

      {/* ── Mobile bottom navigation (Floating Pill) ── */}
      {!isTripDetail && (
        <div className="md:hidden fixed bottom-6 left-6 right-6 z-50 flex justify-center pointer-events-none">
          <nav className="glass-panel w-full max-w-sm rounded-[2rem] flex justify-around items-center px-2 py-3 pointer-events-auto">
            {navItems.map(({ icon: Icon, label, path }) => (
              <a
                key={path}
                href={path}
                onClick={(e) => handleNavigation(path, e)}
                className={`flex flex-col items-center gap-1.5 flex-1 transition-all duration-300 ${
                  location.pathname === path ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                } cursor-pointer disabled:cursor-not-allowed`}
              >
                <Icon size={22} strokeWidth={location.pathname === path ? 2.5 : 2} />
                {location.pathname === path && <span className="text-[9px] font-bold uppercase tracking-widest">{label.split(' ')[0]}</span>}
              </a>
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
              initial={{ x: "100%" }} 
              animate={{ x: 0 }} 
              exit={{ x: "100%" }} 
              transition={{ type: "spring", bounce: 0, duration: 0.4 }} 
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
                      {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Můj Profil'}
                    </p>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 truncate tracking-wide font-medium">{user?.bio || user?.email}</p>
                  </div>
                </div>

                {/* Mobile Theme Toggle */}
                <div className="px-4 space-y-3">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Vzhled</p>
                  <ThemeToggle />
                </div>

                <div className="space-y-2">
                  <p className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Možnosti</p>
                  <SidebarItem
                    icon={Settings}
                    label="Nastavení"
                    path="/dashboard/settings"
                    active={location.pathname === '/dashboard/settings'}
                    onClick={(path, e) => handleNavigation(path, e, closeMobile)}
                   className="cursor-pointer disabled:cursor-not-allowed"/>
                </div>
              </div>

              <div className="p-6">
                <button
                  onClick={() => { closeMobile(); handleLogout(); }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors duration-300 font-bold cursor-pointer disabled:cursor-not-allowed"
                >
                  <LogOut size={20} strokeWidth={2.5} />
                  <span>Odhlásit se</span>
                </button>
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
          <button onClick={() => setMobileOpen(true)} className="w-10 h-10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-gray-900 dark:text-white cursor-pointer disabled:cursor-not-allowed">
            <Menu size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-10 max-w-[1400px] mx-auto w-full flex flex-col min-h-0 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
