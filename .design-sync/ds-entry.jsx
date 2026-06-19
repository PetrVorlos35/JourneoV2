// Design-sync barrel entry for JourneoV2.
//
// Why this file exists: every component in this app is a `default` export, and
// the converter's synth-entry fallback uses `export * from`, which does NOT
// forward default exports. So we re-export each component here as a *named*
// export, and point cfg.entry / --entry at this barrel. cfg.componentSrcMap
// enumerates the same set for discovery + src enrichment.
//
// It also exports DSProvider — the preview wrapper (cfg.provider) — which gives
// previews a router (react-router) and an initialized i18n instance loaded with
// the real English locale, so cards render real labels instead of raw keys.
//
// Scope note: only api-free reusable components are re-exported here. Components
// that import ../src/services/api read import.meta.env.VITE_API_URL at module
// load, which is undefined in the IIFE and would crash window.Journeo.

import React, { useEffect } from 'react';
import { MemoryRouter } from 'react-router-dom';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import enTranslation from '../src/locales/en/translation.json';

// One shared, already-initialized i18n instance for all preview cards.
const i18n = i18next.createInstance();
i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: enTranslation } },
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

/**
 * Preview wrapper: supplies the router + i18n context the components read.
 * Referenced by cfg.provider.component = "DSProvider".
 */
export function DSProvider({ children }) {
  // JourneoV2 is dark-first: ThemeContext defaults to 'dark' and the app adds a
  // `.dark` class to <html>. The compiled Tailwind uses
  // `@custom-variant dark (&:where(.dark, .dark *))`, so previews need a `.dark`
  // ancestor. Add it to <html> (not just a wrapper div) so components that
  // createPortal to document.body (e.g. DialogModal) also render dark — exactly
  // what the app's ThemeContext does.
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);
  return (
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </MemoryRouter>
  );
}

// ── Reusable component surface (api-free) ─────────────────────────────────
export { default as AuroraBackground } from '../src/components/ui/AuroraBackground.jsx';
export { default as CharCount } from '../src/components/ui/CharCount.jsx';
export { default as DialogModal } from '../src/components/ui/DialogModal.jsx';
export { default as HorizontalScrollCarousel } from '../src/components/ui/HorizontalScrollCarousel.jsx';
export { default as LocationAutocomplete } from '../src/components/ui/LocationAutocomplete.jsx';
export { default as ScrollTextReveal } from '../src/components/ui/ScrollTextReveal.jsx';
export { default as SpotlightCard } from '../src/components/ui/SpotlightCard.jsx';
export { default as UserAvatar } from '../src/components/ui/UserAvatar.jsx';
export { default as LoadingScreen } from '../src/components/LoadingScreen.jsx';
export { default as NotFound } from '../src/components/NotFound.jsx';
export { default as Navbar } from '../src/components/Navbar.jsx';
export { default as LandingLanguageSwitcher } from '../src/components/LandingLanguageSwitcher.jsx';
