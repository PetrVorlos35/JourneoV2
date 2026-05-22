import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, PlusSquare, Settings, LogOut, BarChart2, Wallet, X } from 'lucide-react';
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
    className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-300 ${
      active
        ? 'bg-journeo-surface border-l-2 border-journeo-accent text-journeo-accent'
        : 'text-journeo-text-muted hover:text-journeo-text hover:bg-journeo-surface-hover border-l-2 border-transparent'
    }`}
  >
    <Icon size={18} strokeWidth={active ? 2 : 1.5} />
    <span className={`font-medium ${active ? 'tracking-wide' : ''}`}>{label}</span>
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

  const sizeClasses = {
    sm: "w-8 h-8 text-[10px]",
    md: "w-10 h-10 text-xs",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl"
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-journeo-surface border border-journeo-border-strong flex items-center justify-center text-journeo-text font-serif shrink-0`}>
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
    <div className="h-screen overflow-hidden bg-journeo-dark text-journeo-text flex font-sans selection:bg-journeo-accent/30">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#161311', color: '#EBEAE4', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px' },
        }}
      />

      {/* ── Desktop Sidebar ── */}
      <aside className="w-64 border-r border-journeo-border hidden md:flex flex-col bg-journeo-dark shrink-0">
        <div className="px-8 py-8">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={JourneoLogo} alt="Journeo" className="w-6 h-6 object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
            <span className="font-serif text-2xl tracking-tight mt-1">Journeo</span>
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

        <div className="p-4 border-t border-journeo-border space-y-1">
          <SidebarItem
            icon={Settings}
            label="Nastavení"
            path="/dashboard/settings"
            active={location.pathname === '/dashboard/settings'}
          />
          <div className="px-4 py-4 flex items-center gap-4 mt-2">
            <UserAvatar user={user} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-journeo-text truncate">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
              </p>
              <p className="text-[11px] text-journeo-text-subtle truncate uppercase tracking-widest mt-0.5">{user?.bio || 'Cestovatel'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-300"
          >
            <LogOut size={18} strokeWidth={1.5} />
            <span className="font-medium">Odhlásit se</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom navigation ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-journeo-dark/90 backdrop-blur-md border-t border-journeo-border flex justify-around items-center px-2 py-3 z-50">
        {navItems.map(({ icon: Icon, label, path }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center gap-1.5 flex-1 transition-colors duration-300 ${
              location.pathname === path ? 'text-journeo-accent' : 'text-journeo-text-subtle'
            }`}
          >
            <Icon size={20} strokeWidth={location.pathname === path ? 2 : 1.5} />
            <span className="text-[9px] font-medium uppercase tracking-widest">{label.split(' ')[0]}</span>
          </Link>
        ))}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center gap-1.5 flex-1 text-journeo-text-subtle hover:text-journeo-text transition-colors"
        >
          <div className="scale-75 origin-bottom">
             <UserAvatar user={user} size="sm" />
          </div>
          <span className="text-[9px] font-medium uppercase tracking-widest">Více</span>
        </button>
      </nav>

      {/* ── Mobile slide-over (for Settings/Logout) ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] flex md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeMobile} />
          <aside className="relative w-72 bg-journeo-surface border-r border-journeo-border flex flex-col h-full z-10 animate-in slide-in-from-left duration-300">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={JourneoLogo} alt="Journeo" className="w-6 h-6 object-contain" />
                <span className="font-serif text-xl tracking-tight text-journeo-text mt-1">Journeo</span>
              </div>
              <button onClick={closeMobile} className="text-journeo-text-subtle hover:text-journeo-text transition-colors">
                <X size={22} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 px-4 py-4 space-y-8">
              <div className="px-6 py-8 bg-journeo-dark border border-journeo-border-strong rounded-sm mx-2">
                <div className="flex flex-col items-center text-center gap-4 mb-4">
                  <UserAvatar user={user} size="lg" />
                  <div className="min-w-0">
                    <p className="font-serif text-xl text-journeo-text truncate mb-1">
                      {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Můj Profil'}
                    </p>
                    <p className="text-[12px] text-journeo-text-subtle truncate tracking-wide">{user?.email}</p>
                  </div>
                </div>
                {user?.bio && (
                  <p className="text-[11px] text-journeo-text-muted text-center italic mt-4">"{user.bio}"</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="px-4 text-[10px] font-medium text-journeo-text-subtle uppercase tracking-widest mb-4">Možnosti</p>
                <SidebarItem
                  icon={Settings}
                  label="Nastavení"
                  path="/dashboard/settings"
                  active={location.pathname === '/dashboard/settings'}
                  onClick={closeMobile}
                />
              </div>
            </div>

            <div className="p-4 border-t border-journeo-border">
              <button
                onClick={() => { closeMobile(); handleLogout(); }}
                className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-sm border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors duration-300"
              >
                <LogOut size={18} strokeWidth={1.5} />
                <span className="font-medium text-[14px]">Odhlásit se</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0 h-full flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-journeo-border bg-journeo-dark/90 backdrop-blur-md sticky top-0 z-30 shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <img src={JourneoLogo} alt="Journeo" className="w-5 h-5 object-contain" />
            <span className="font-serif text-xl text-journeo-text tracking-tight mt-1">Journeo</span>
          </Link>
          <div className="flex items-center gap-4">
             <Link to="/dashboard/settings">
               <UserAvatar user={user} size="sm" />
             </Link>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 max-w-[1400px] mx-auto w-full flex flex-col min-h-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
