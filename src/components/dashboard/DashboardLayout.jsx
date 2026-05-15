import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, PlusSquare, Settings, LogOut, BarChart2, Menu, X, Wallet, Camera, Mountain, Palmtree, Compass, Map, Plane } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import JourneoLogo from '../../assets/Journeo_whitelogo.png';

const navItems = [
  { icon: Home, label: 'Přehled', path: '/dashboard' },
  { icon: PlusSquare, label: 'Vytvořit výlet', path: '/dashboard/create' },
  { icon: BarChart2, label: 'Statistiky', path: '/dashboard/statistics' },
  { icon: Wallet, label: 'Výdaje', path: '/dashboard/budget' },
];

const SidebarItem = ({ icon: Icon, label, path, active, onClick }) => (
  <Link
    to={path}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active
        ? 'bg-blue-600 text-white'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const UserAvatar = ({ user, size = "md" }) => {
  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user?.first_name) return user.first_name[0].toUpperCase();
    if (user?.email) return user.email.substring(0, 2).toUpperCase();
    return '??';
  };

  const avatarPresets = {
    mountain: { Icon: Mountain, color: 'bg-blue-500' },
    beach: { Icon: Palmtree, color: 'bg-orange-400' },
    city: { Icon: Compass, color: 'bg-purple-500' },
    forest: { Icon: Map, color: 'bg-green-500' },
    travel: { Icon: Plane, color: 'bg-indigo-500' },
    photography: { Icon: Camera, color: 'bg-pink-500' },
  };

  const preset = user?.avatar_url ? avatarPresets[user.avatar_url] : null;

  const sizeClasses = {
    sm: "w-8 h-8 text-[10px]",
    md: "w-10 h-10 text-xs",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl"
  };

  if (preset) {
    return (
      <div className={`${sizeClasses[size]} rounded-full ${preset.color} flex items-center justify-center text-white shadow-lg shadow-black/20 shrink-0`}>
        <preset.Icon size={size === 'sm' ? 16 : size === 'xl' ? 32 : 20} />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-blue-600 flex items-center justify-center text-white font-black shrink-0`}>
      {getInitials()}
    </div>
  );
};

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="h-screen overflow-hidden bg-white dark:bg-black text-gray-900 dark:text-white flex">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1f2937', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
        }}
      />

      {/* ── Desktop Sidebar ── */}
      <aside className="w-64 border-r border-gray-200 dark:border-white/10 hidden md:flex flex-col bg-white dark:bg-black shrink-0">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-3">
            <img src={JourneoLogo} alt="Journeo" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold tracking-wide">Journeo</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1">
          {navItems.map(item => (
            <SidebarItem
              key={item.path}
              {...item}
              active={location.pathname === item.path}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-white/10 space-y-1">
          <SidebarItem
            icon={Settings}
            label="Nastavení"
            path="/dashboard/settings"
            active={location.pathname === '/dashboard/settings'}
          />
          <div className="px-4 py-3 flex items-center gap-3 border-t border-gray-100 dark:border-white/5 mt-2">
            <UserAvatar user={user} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
              </p>
              <p className="text-[10px] text-gray-400 truncate">{user?.bio || 'Cestovatel'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Odhlásit se</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom navigation ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-lg border-t border-gray-200 dark:border-white/10 flex justify-around items-center px-2 py-3 z-50">
        {navItems.map(({ icon: Icon, label, path }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
              location.pathname === path ? 'text-blue-600 dark:text-blue-500' : 'text-gray-400'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label.split(' ')[0]}</span>
          </Link>
        ))}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center gap-1 flex-1 text-gray-400"
        >
          <UserAvatar user={user} size="sm" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Více</span>
        </button>
      </nav>

      {/* ── Mobile slide-over (for Settings/Logout) ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={closeMobile} />
          <aside className="relative w-72 bg-gray-950 border-r border-white/10 flex flex-col h-full z-10 animate-in slide-in-from-left duration-300">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={JourneoLogo} alt="Journeo" className="w-8 h-8 object-contain" />
                <span className="text-xl font-bold tracking-wide text-white">Journeo</span>
              </div>
              <button onClick={closeMobile} className="text-gray-400 hover:text-white">
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 px-4 py-2 space-y-6">
              <div className="px-4 py-6 bg-white/5 rounded-2xl mx-2">
                <div className="flex items-center gap-4 mb-4">
                  <UserAvatar user={user} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-black text-white truncate">
                      {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Můj Profil'}
                    </p>
                    <p className="text-sm text-gray-400 truncate">{user?.email}</p>
                  </div>
                </div>
                {user?.bio && (
                  <p className="text-xs text-gray-400 line-clamp-2 px-1">{user.bio}</p>
                )}
              </div>

              <div className="space-y-1">
                <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Možnosti</p>
                <SidebarItem
                  icon={Settings}
                  label="Nastavení"
                  path="/dashboard/settings"
                  active={location.pathname === '/dashboard/settings'}
                  onClick={closeMobile}
                />
              </div>
            </div>

            <div className="p-4 border-t border-white/10 space-y-1">
              <button
                onClick={() => { closeMobile(); handleLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium">Odhlásit se</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0 h-full flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-lg sticky top-0 z-30 shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <img src={JourneoLogo} alt="Journeo" className="w-6 h-6 object-contain" />
            <span className="font-bold text-gray-900 dark:text-white tracking-tight">Journeo</span>
          </Link>
          <div className="flex items-center gap-4">
             <Link to="/dashboard/settings">
               <UserAvatar user={user} size="sm" />
             </Link>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col min-h-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
