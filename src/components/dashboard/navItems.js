import { Home, Map, MapPinned, BarChart2, Users, Wallet } from 'lucide-react';

// Single source of truth for the dashboard's main destinations, so the
// desktop sidebar, the mobile bottom nav, and the floating nav rendered on
// top of the fullscreen mobile map all stay pixel-for-pixel identical
// instead of drifting apart like the old duplicated FAB positions did.
export const getDashboardNavItems = (t) => [
  { icon: Home,     label: t('dashboardLayout.nav.overview'),   path: '/dashboard',            shortcut: 'H' },
  { icon: Map,      label: t('dashboardLayout.nav.myTrips'),    path: '/dashboard/all-trips',  shortcut: 'T' },
  { icon: MapPinned,label: t('dashboardLayout.nav.map'),        path: '/dashboard/map',        shortcut: 'M' },
  { icon: BarChart2,label: t('dashboardLayout.nav.statistics'), path: '/dashboard/statistics', shortcut: 'S' },
  { icon: Users,    label: t('dashboardLayout.nav.friends'),    path: '/dashboard/friends',    shortcut: 'F' },
  { icon: Wallet,   label: t('dashboardLayout.nav.budget'),     path: '/dashboard/budget',     shortcut: 'B' },
];

// The four everyday destinations shown in the mobile bottom nav (and mirrored
// above the fullscreen mobile map); the rest live in the hamburger menu.
export const MOBILE_PRIMARY_PATHS = ['/dashboard', '/dashboard/all-trips', '/dashboard/map', '/dashboard/budget'];
