import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, PlusSquare, Settings, LogOut, BarChart2, Menu, X, Wallet } from 'lucide-react';
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

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex">
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
          <Menu size={20} />
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
      <main className="flex-1 overflow-y-auto min-w-0 pb-20 md:pb-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-lg sticky top-0 z-30">
          <Link to="/" className="flex items-center gap-2">
            <img src={JourneoLogo} alt="Journeo" className="w-6 h-6 object-contain" />
            <span className="font-bold text-gray-900 dark:text-white tracking-tight">Journeo</span>
          </Link>
          <div className="flex items-center gap-4">
             {/* Small status indicator or user icon could go here */}
             <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold uppercase">
               JD
             </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
