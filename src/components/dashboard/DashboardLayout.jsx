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

      {/* ── Mobile slide-over ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={closeMobile} />
          {/* Drawer */}
          <aside className="relative w-72 bg-gray-950 border-r border-white/10 flex flex-col h-full z-10">
            <div className="p-6 flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3" onClick={closeMobile}>
                <img src={JourneoLogo} alt="Journeo" className="w-8 h-8 object-contain" />
                <span className="text-xl font-bold tracking-wide text-white">Journeo</span>
              </Link>
              <button onClick={closeMobile} className="text-gray-400 hover:text-white">
                <X size={22} />
              </button>
            </div>

            <nav className="flex-1 px-4 py-2 space-y-1">
              {navItems.map(item => (
                <SidebarItem
                  key={item.path}
                  {...item}
                  active={location.pathname === item.path}
                  onClick={closeMobile}
                />
              ))}
            </nav>

            <div className="p-4 border-t border-white/10 space-y-1">
              <SidebarItem
                icon={Settings}
                label="Nastavení"
                path="/dashboard/settings"
                active={location.pathname === '/dashboard/settings'}
                onClick={closeMobile}
              />
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
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-black sticky top-0 z-30">
          <Link to="/" className="flex items-center gap-2">
            <img src={JourneoLogo} alt="Journeo" className="w-6 h-6 object-contain" />
            <span className="font-bold text-gray-900 dark:text-white">Journeo</span>
          </Link>
          <button onClick={() => setMobileOpen(true)} className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">
            <Menu size={24} />
          </button>
        </div>

        <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
