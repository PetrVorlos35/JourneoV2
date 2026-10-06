import { useState, useRef, useEffect, useMemo, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, Settings, LogOut, X, Sun, Moon, Monitor, Shield, Search, ChevronsUpDown } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useDialog } from '../ui/DialogModal';
import { useUnsavedChanges } from '../../contexts/UnsavedChangesContext';
import { takeUndo } from '../../hooks/undoStack';
import NotificationBell from '../ui/NotificationBell';
import JourneoLogo from '../../assets/Journeo_whitelogo.png';
import JourneoLogoDark from '../../assets/Journeo_blacklogo.png';
import UserAvatar from '../ui/UserAvatar';
import VersionBadge from '../ui/VersionBadge';
import MobileTabBar from './MobileTabBar';
import { getDashboardNavItems, MOBILE_PRIMARY_PATHS } from './navItems';
import { MobileMenuContext } from '../../contexts/MobileMenuContext';
import api from '../../services/api';
import { categorizeTrip, tripDayCount, currentTripDay, daysUntilStart } from '../../utils/trip';
import { countryFlag } from '../../utils/country';

// Paleta se stahuje až při prvním ⌘K — do prvního vykreslení dashboardu
// nepatří nic, co uživatel možná nikdy neotevře.
const Spotlight = lazy(() => import('../spotlight/Spotlight'));

// eslint-disable-next-line no-unused-vars
const SidebarItem = ({ icon: Icon, label, path, active, onClick, className, layoutId = "sidebar-active-pill", shortcut }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <Link
      to={path}
      aria-current={active ? 'page' : undefined}
      onClick={(e) => {
        if (onClick) onClick(path, e);
      }}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200 relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
        active
          ? 'text-blue-700 dark:text-blue-300'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06]'
      } ${className || ''}`}
    >
      {active && (
        <motion.div
          layoutId={shouldReduceMotion ? undefined : layoutId}
          className="absolute inset-0 bg-blue-50 dark:bg-blue-500/10 rounded-xl"
          transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <div className="relative z-10 flex items-center gap-3 w-full">
        <Icon size={19} strokeWidth={active ? 2.5 : 2} />
        <span className="text-[14px] font-semibold">{label}</span>
        {shortcut && (
          <kbd className={`ml-auto text-[11px] font-mono px-1.5 py-0.5 rounded transition-opacity ${active ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-white/[0.07] text-gray-500'} opacity-0 group-hover:opacity-100`}>
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
          className={`flex-1 flex items-center justify-center p-2.5 rounded-lg transition-all duration-300 ${
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

// „Pas“ — kdo cestuje a kolik toho má za sebou. Čísla jsou popisky pod
// hodnotou, aby nebylo třeba skloňovat („2 výletů“).
const PassportStats = ({ stats, flags = [], t }) => (
  <>
    <dl className="grid grid-cols-3 gap-2">
      {['countries', 'trips', 'days'].map((key) => (
        <div key={key} className="min-w-0 flex flex-col">
          <dt className="order-last mt-1 text-[12px] font-medium leading-tight text-gray-500 dark:text-gray-400 truncate">{t(`dashboardLayout.passport.${key}`)}</dt>
          <dd className="text-[26px] font-bold leading-none tracking-tight tabular-nums text-gray-900 dark:text-white">{stats[key] ?? '—'}</dd>
        </div>
      ))}
    </dl>
    {/* „Razítka“ — vlajky zemí z uložených míst */}
    {flags.length > 0 && (
      <p className="mt-3 text-[15px] leading-none tracking-[0.15em] truncate" aria-hidden="true">
        {flags.slice(0, 8).map(countryFlag).join('')}
      </p>
    )}
  </>
);

const PassportIdentity = ({ user, t, trailing }) => (
  <div className="flex items-center gap-3">
    <UserAvatar user={user} size="md" />
    <div className="min-w-0 flex-1">
      <p className="text-[14px] font-bold truncate text-gray-900 dark:text-white">
        {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
      </p>
      <p className="text-[12px] font-medium truncate text-gray-500 dark:text-gray-400">{user?.bio || t('dashboardLayout.traveler')}</p>
    </div>
    {trailing}
  </div>
);

const DashboardLayout = ({ children, onOpenCreateModal, trips = [] }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, isAdmin } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { confirmDialog, ModalPortal } = useDialog();
  const { hasUnsavedChanges, setHasUnsavedChanges } = useUnsavedChanges();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  // Počet zemí plyne z uložených míst; když endpoint selže, pas ukáže „—“.
  const [countryCodes, setCountryCodes] = useState(null);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  // Chunk palety se stáhne až po prvním otevření; `mounted` ho pak nechá
  // v paměti, ať je druhé ⌘K okamžité.
  const [spotlightMounted, setSpotlightMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const openSpotlight = () => {
    setSpotlightMounted(true);
    setSpotlightOpen(true);
  };

  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const isTripDetail = location.pathname.includes('/trip/');
  // Globální mapa je immerzivní: vyplní obsahovou plochu edge-to-edge, bez
  // paddingu a scrollu, aby ji plovoucí panel překrýval jako na mobilu.
  const isMapRoute = location.pathname.includes('/dashboard/map');

  const navItems = getDashboardNavItems(t);

  useEffect(() => {
    let alive = true;
    // Jen navštívená místa — vysněná země do pasu nepatří (stejně jako ve Statistikách).
    api.places.getAll({ status: 'visited' })
      .then((d) => { if (alive) setCountryCodes([...new Set((d.places || []).map((p) => p.countryCode).filter(Boolean))]); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const onDown = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setProfileOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [profileOpen]);

  const passportStats = useMemo(() => ({
    countries: countryCodes ? countryCodes.length : null,
    trips: trips.length,
    // Stejný součet jako „Dní na cestách“ ve Statistikách (všechny výlety).
    days: trips.reduce((sum, tr) => sum + tripDayCount(tr), 0),
  }), [trips, countryCodes]);

  // Probíhající výlet má přednost, jinak nejbližší chystaný.
  const nextTrip = useMemo(() => {
    const ongoing = trips.find((tr) => categorizeTrip(tr) === 'ongoing');
    if (ongoing) return ongoing;
    return trips
      .filter((tr) => categorizeTrip(tr) === 'upcoming')
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0] || null;
  }, [trips]);
  // Odpočet je obsah karty: velké číslo + co znamená. Na přehledu se karta
  // neukazuje — hlavní karta tam ukazuje tentýž výlet.
  const nextTripCount = nextTrip && (categorizeTrip(nextTrip) === 'ongoing'
    ? { value: currentTripDay(nextTrip), unit: t('dashboardLayout.passport.dayOf', { total: tripDayCount(nextTrip) }) }
    : { value: Math.max(daysUntilStart(nextTrip), 0), unit: t('dashboardLayout.passport.daysToGo', { count: Math.max(daysUntilStart(nextTrip), 0) }) });
  const showNextTripCard = nextTrip && location.pathname !== '/dashboard';
  const primaryNav = navItems.filter(item => MOBILE_PRIMARY_PATHS.includes(item.path));

  // Mobile bottom nav gets only the four everyday destinations; Statistiky
  // and Přátelé live in the avatar's passport sheet so the bar keeps room
  // for the raised create action.
  const mobileNavItems = navItems.filter(item => MOBILE_PRIMARY_PATHS.includes(item.path));
  const mobileSecondaryItems = navItems.filter(item => !MOBILE_PRIMARY_PATHS.includes(item.path));

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
    onOpenCreateModal?.();
  };

  const handleOpenCreateModalRef = useRef(null);
  handleOpenCreateModalRef.current = handleOpenCreateModal;
  const handleNavigationRef = useRef(null);
  handleNavigationRef.current = (path) => handleNavigation(path);
  const toggleSpotlightRef = useRef(null);
  toggleSpotlightRef.current = () => (spotlightOpen ? setSpotlightOpen(false) : openSpotlight());
  const spotlightOpenRef = useRef(false);
  spotlightOpenRef.current = spotlightOpen;

  useEffect(() => {
    const NAV_SHORTCUTS = {
      h: '/dashboard',
      t: '/dashboard/all-trips',
      m: '/dashboard/map',
      s: '/dashboard/statistics',
      f: '/dashboard/friends',
      b: '/dashboard/budget',
      ...(isAdmin ? { a: '/dashboard/admin' } : {}),
    };
    const onKey = (e) => {
      // Cmd/Ctrl+K řešíme jako první a bez ohledu na fokus — paleta musí jít
      // vyvolat i uprostřed psaní v poli, na to si na ni člověk zvykl jinde.
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleSpotlightRef.current?.();
        return;
      }
      // Nad otevřenou paletou žádné globální zkratky — než stihne naskočit
      // fokus v jejím poli, jinak by první písmeno dotazu odnavigovalo pryč.
      if (spotlightOpenRef.current) return;
      // Inside text fields nothing fires app-side — the browser's native
      // text-undo must keep working for Cmd/Ctrl+Z.
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      // Cmd/Ctrl+Z undoes the most recent undoable action (e.g. trip delete)
      // via the same shared undo stack the delete toast's Undo button uses.
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
        const action = takeUndo();
        if (action) {
          e.preventDefault();
          action.undo();
        }
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      const key = e.key.toLowerCase();
      if (key === 'n') { e.preventDefault(); handleOpenCreateModalRef.current?.(); return; }
      const path = NAV_SHORTCUTS[key];
      if (path) { e.preventDefault(); handleNavigationRef.current?.(path); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isAdmin]);

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#fbfbfd] dark:bg-black text-gray-900 dark:text-[#f5f5f7] flex selection:bg-blue-500/30 font-sans relative transition-colors duration-500">
      {ModalPortal}
      {spotlightMounted && (
        <Suspense fallback={null}>
          <Spotlight
            isOpen={spotlightOpen}
            onClose={() => setSpotlightOpen(false)}
            trips={trips}
            onCreateTrip={handleOpenCreateModal}
            onLogout={handleLogout}
          />
        </Suspense>
      )}
      <Toaster
        position="top-right"
        containerStyle={{ zIndex: 99999, top: 'max(1rem, calc(env(safe-area-inset-top) + 0.5rem))' }}
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
          className="absolute w-[420px] h-[420px] md:w-[800px] md:h-[800px] rounded-[100%] bg-blue-500/10 dark:bg-blue-500/15 blur-[70px] md:blur-[120px]"
        />
        <motion.div
          animate={shouldReduceMotion ? { opacity: 0.2 } : {
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, 50, -50, 0],
            y: [0, -50, 50, 0]
          }}
          transition={shouldReduceMotion ? {} : { duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute w-[320px] h-[320px] md:w-[600px] md:h-[600px] rounded-[100%] bg-purple-500/10 dark:bg-purple-500/15 blur-[60px] md:blur-[100px] right-[-100px] top-[-100px]"
        />
      </div>

      {/* ── Desktop sidebar: „cestovní pas“ ── */}
      {/* Na globální mapě panel plave nad mapou (absolutní), ať se mapa
          protáhne edge-to-edge i pod něj; jinde ukusuje z layoutu jako sloupec. */}
      <div className={`hidden md:flex z-20 shrink-0 w-[264px] ${isMapRoute ? 'absolute inset-y-0 left-0' : ''}`}>
        <aside className="w-full h-full flex flex-col bg-white dark:bg-[#111113] border-r border-gray-200/80 dark:border-white/10">
          <div className="flex items-center gap-2.5 pl-5 pr-3 pt-5 pb-4">
            <img src={isDark ? JourneoLogo : JourneoLogoDark} alt="Journeo Logo" className="h-7 w-auto object-contain" />
            <span className="font-bold text-lg tracking-tight">Journeo</span>
            <VersionBadge className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20 hover:text-gray-900 dark:hover:text-gray-200 transition-colors" />
            <div className="ml-auto"><NotificationBell placement="sidebar" /></div>
          </div>

          {/* Pas: identita + čísla; klik otevře menu účtu */}
          <div className="relative px-3" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              aria-expanded={profileOpen}
              aria-label={t('dashboardLayout.passport.openMenu')}
              className={`w-full text-left p-4 rounded-2xl border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
                profileOpen || location.pathname === '/dashboard/settings'
                  ? 'bg-gray-50 dark:bg-white/[0.06] border-gray-300 dark:border-white/15'
                  : 'bg-gray-50/70 dark:bg-white/[0.03] border-gray-200/80 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/15'
              }`}
            >
              <PassportIdentity user={user} t={t} trailing={<ChevronsUpDown size={16} strokeWidth={2} className="shrink-0 text-gray-400" aria-hidden="true" />} />
              <div className="mt-3.5 pt-3.5 border-t border-dashed border-gray-300 dark:border-white/15">
                <PassportStats stats={passportStats} flags={countryCodes || []} t={t} />
              </div>
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute left-3 right-3 top-full mt-2 z-40 p-2 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200 dark:border-white/10 shadow-[0_12px_32px_-12px_rgba(17,24,39,0.25)]"
                >
                  <div className="px-1 pb-2"><ThemeToggle /></div>
                  <Link
                    to="/dashboard/settings"
                    onClick={(e) => { setProfileOpen(false); handleNavigation('/dashboard/settings', e); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <Settings size={18} strokeWidth={2} /> {t('dashboardLayout.nav.settings')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setProfileOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut size={18} strokeWidth={2} /> {t('dashboardLayout.dialogs.logout.confirm')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="px-3 mt-4 space-y-2">
            <button
              onClick={handleOpenCreateModal}
              className="flex w-full items-center gap-2.5 px-3.5 h-11 rounded-xl bg-blue-600 text-white text-[14px] font-semibold shadow-[0_6px_16px_-8px_rgba(37,99,235,0.7)] hover:bg-blue-500 transition-colors group active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>{t('dashboardLayout.nav.createTrip')}</span>
              <kbd className="ml-auto text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/20 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">N</kbd>
            </button>
            {/* Vstup do Spotlightu — zkratka je vidět rovnou, ať se ⌘K dá
                objevit i bez toho, aby ji člověk musel uhodnout. */}
            <button
              onClick={openSpotlight}
              className="flex w-full items-center gap-2.5 px-3.5 h-10 rounded-xl bg-gray-100/80 dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
            >
              <Search size={16} strokeWidth={2.25} />
              <span className="text-[13px] font-semibold">{t('spotlight.trigger')}</span>
              <kbd className="ml-auto text-[11px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-white/[0.07] border border-gray-200 dark:border-white/10 text-gray-500">⌘K</kbd>
            </button>
          </div>

          <nav aria-label={t('dashboardLayout.navLabel')} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3 mt-4 pb-3">
            <div className="space-y-0.5">
              {primaryNav.map(item => (
                <SidebarItem key={item.path} {...item} active={location.pathname === item.path} onClick={(path, e) => handleNavigation(path, e)} className="cursor-pointer" />
              ))}
            </div>
            <div className="my-3 mx-3 h-px bg-gray-100 dark:bg-white/[0.06]" />
            <div className="space-y-0.5">
              {mobileSecondaryItems.map(item => (
                <SidebarItem key={item.path} {...item} active={location.pathname === item.path} onClick={(path, e) => handleNavigation(path, e)} className="cursor-pointer" />
              ))}
              {isAdmin && (
                <SidebarItem icon={Shield} label={t('dashboardLayout.nav.admin')} path="/dashboard/admin" shortcut="A" active={location.pathname.startsWith('/dashboard/admin')} onClick={(path, e) => handleNavigation(path, e)} className="cursor-pointer" />
              )}
            </div>
          </nav>

          {showNextTripCard && (
            <Link
              to={`/dashboard/trip/${nextTrip.id}`}
              onClick={(e) => handleNavigation(`/dashboard/trip/${nextTrip.id}`, e)}
              className="flex items-center gap-3.5 mx-3 mb-4 p-3.5 rounded-2xl border border-gray-200/80 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/15 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
            >
              <span className="shrink-0 w-16 text-center">
                <span className="block text-[26px] font-bold leading-none tracking-tight tabular-nums text-gray-900 dark:text-white">{nextTripCount.value}</span>
                <span className="block mt-1 text-[11px] font-medium leading-tight text-gray-500 dark:text-gray-400">{nextTripCount.unit}</span>
              </span>
              <span className="min-w-0 text-[14px] font-semibold leading-snug text-gray-900 dark:text-white line-clamp-2">{nextTrip.title}</span>
            </Link>
          )}
        </aside>
      </div>

      {/* ── Mobile bottom navigation ── */}
      {!isTripDetail && (
        <MobileTabBar
          items={mobileNavItems}
          activePath={location.pathname}
          onNavigate={(path, e) => handleNavigation(path, e)}
          onCreate={handleOpenCreateModal}
        />
      )}

      {/* ── Mobilní „pas“ (avatar v horní liště) ── */}
      {/* Portaled to <body>: it must be able to show above the fullscreen
          mobile map, which is itself a <body>-level portal — nested here it
          would be trapped under `<main>`'s own stacking context and could
          never out-rank a sibling portal no matter its z-index. */}
      {createPortal(
        <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[140] flex items-end md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={closeMobile}
            />
            <motion.aside
              initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
              animate={shouldReduceMotion ? { opacity: 1 } : { y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
              transition={shouldReduceMotion ? { duration: 0.15 } : { type: 'spring', bounce: 0, duration: 0.4 }}
              className="relative w-full max-h-[90dvh] bg-white dark:bg-[#1C1C1E] flex flex-col z-10 rounded-t-[1.75rem] shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.35)]"
            >
              <div className="px-4 pt-2.5 pb-1 flex items-center justify-between">
                <span className="mx-auto w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" aria-hidden="true" />
              </div>
              <div className="absolute right-3 top-3">
                <button onClick={closeMobile} aria-label={t('common.close')} className="w-11 h-11 flex items-center justify-center bg-gray-100 dark:bg-white/10 rounded-full text-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pt-11 pb-4">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/[0.08]">
                  <PassportIdentity user={user} t={t} />
                  <div className="mt-3.5 pt-3.5 border-t border-dashed border-gray-300 dark:border-white/15">
                    <PassportStats stats={passportStats} flags={countryCodes || []} t={t} />
                  </div>
                </div>

                {nextTrip && (
                  <Link
                    to={`/dashboard/trip/${nextTrip.id}`}
                    onClick={(e) => handleNavigation(`/dashboard/trip/${nextTrip.id}`, e, closeMobile)}
                    className="flex items-center gap-3.5 mt-3 p-3.5 rounded-2xl border border-gray-200/80 dark:border-white/[0.08] active:bg-gray-50 dark:active:bg-white/[0.04]"
                  >
                    <span className="shrink-0 w-16 text-center">
                      <span className="block text-[26px] font-bold leading-none tracking-tight tabular-nums text-gray-900 dark:text-white">{nextTripCount.value}</span>
                      <span className="block mt-1 text-[11px] font-medium leading-tight text-gray-500 dark:text-gray-400">{nextTripCount.unit}</span>
                    </span>
                    <span className="min-w-0 text-[15px] font-semibold leading-snug text-gray-900 dark:text-white">{nextTrip.title}</span>
                  </Link>
                )}

                <div className="mt-5 space-y-0.5">
                  {mobileSecondaryItems.map(item => (
                    <SidebarItem key={item.path} {...item} shortcut={undefined} active={location.pathname === item.path} onClick={(path, e) => handleNavigation(path, e, closeMobile)} layoutId="mobile-sidebar-active-pill" className="cursor-pointer" />
                  ))}
                  <SidebarItem icon={Settings} label={t('dashboardLayout.nav.settings')} path="/dashboard/settings" active={location.pathname === '/dashboard/settings'} onClick={(path, e) => handleNavigation(path, e, closeMobile)} layoutId="mobile-sidebar-active-pill" className="cursor-pointer" />
                  {isAdmin && (
                    <SidebarItem icon={Shield} label={t('dashboardLayout.nav.admin')} path="/dashboard/admin" active={location.pathname.startsWith('/dashboard/admin')} onClick={(path, e) => handleNavigation(path, e, closeMobile)} layoutId="mobile-sidebar-active-pill" className="cursor-pointer" />
                  )}
                </div>

                <div className="mt-5 px-1">
                  <p className="mb-2 text-[13px] font-semibold text-gray-500 dark:text-gray-400">{t('dashboardLayout.mobile.appearance')}</p>
                  <ThemeToggle />
                </div>
              </div>

              <div className="px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-gray-100 dark:border-white/10">
                <button
                  onClick={() => { closeMobile(); handleLogout(); }}
                  className="w-full flex items-center justify-center gap-2.5 h-12 rounded-2xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-semibold cursor-pointer"
                >
                  <LogOut size={19} strokeWidth={2.25} />
                  <span>{t('dashboardLayout.dialogs.logout.confirm')}</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── Main content ── */}
      <main className={`flex-1 min-w-0 ${isTripDetail ? 'pb-[env(safe-area-inset-bottom)]' : 'pb-[calc(max(1.25rem,env(safe-area-inset-bottom))+5.75rem)]'} md:pb-0 h-full flex flex-col relative z-10`}>
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] glass sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2">
            <img
              src={isDark ? JourneoLogo : JourneoLogoDark}
              alt="Journeo Logo"
              className="h-7 w-auto object-contain"
            />
            <span className="font-bold text-lg tracking-tight mt-0.5">Journeo</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={openSpotlight}
              aria-label={t('spotlight.title')}
              className="w-11 h-11 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-gray-900 dark:text-white cursor-pointer"
            >
              <Search size={20} strokeWidth={2.25} />
            </button>
            <NotificationBell />
            <button
              onClick={() => setMobileOpen(true)}
              aria-label={t('dashboardLayout.passport.openMenu')}
              className="w-11 h-11 flex items-center justify-center rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
            >
              <UserAvatar user={user} size="sm" />
            </button>
          </div>
        </div>

        <div
          className={
            isMapRoute
              ? 'flex-1 min-h-0 relative overflow-hidden w-full'
              : 'flex-1 overflow-y-auto overscroll-contain p-4 sm:p-8 md:p-10 max-w-[1400px] mx-auto w-full flex flex-col min-h-0 custom-scrollbar'
          }
        >
          <MobileMenuContext.Provider value={() => setMobileOpen(true)}>
            {children}
          </MobileMenuContext.Provider>
        </div>

      </main>
    </div>
  );
};

export default DashboardLayout;
