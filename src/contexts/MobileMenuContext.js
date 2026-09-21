import { createContext, useContext } from 'react';

// Owned locally by DashboardLayout (not a top-level app provider) — it lets a
// page rendered deep inside `children`, namely the fullscreen mobile map
// which portals itself outside DashboardLayout's own DOM flow, open the same
// hamburger slide-over as the top bar's Menu button.
export const MobileMenuContext = createContext(() => {});

export const useOpenMobileMenu = () => useContext(MobileMenuContext);
