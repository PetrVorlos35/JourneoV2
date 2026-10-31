import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import NotFound from './components/NotFound';
import CookieConsent from './components/CookieConsent';
import { useAuth } from './contexts/AuthContext';
import { Analytics } from '@vercel/analytics/react';
import { trackPageview, optOutThisDevice } from './utils/analytics';
import { AppShellSkeleton } from './components/ui/Skeletons';

// Lazy load everything except the landing page to speed up initial load
const AuthFlow = lazy(() => import('./components/auth/AuthFlow'));
const DashboardHome = lazy(() => import('./components/dashboard/DashboardHome'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const PublicTripView = lazy(() => import('./components/public/PublicTripView'));
const JoinTripView = lazy(() => import('./components/public/JoinTripView'));

// Aplikace dostane kostru postranního panelu a obsahu; veřejné stránky
// (přihlášení, sdílený výlet…) mají vlastní vzhled, tak jen čisté pozadí.
const LoadingFallback = () => {
  const { pathname } = useLocation();
  return pathname.startsWith('/dashboard')
    ? <AppShellSkeleton />
    : <div className="min-h-screen bg-gray-50 dark:bg-black" aria-hidden="true" />;
};

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname + location.search }} replace />;
  }

  return children;
};

// Admin Protected Route component
const AdminProtectedRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Admin žije uvnitř dashboardu; staré odkazy /admin/... vedou tam.
const AdminRedirect = () => {
  const location = useLocation();
  return <Navigate to={`/dashboard${location.pathname}${location.search}`} replace />;
};

// Zobrazení stránky při každé změně cesty; zařízení admina se nepočítá.
const usePageviews = () => {
  const { pathname } = useLocation();
  const { isAdmin } = useAuth();
  useEffect(() => { if (isAdmin) optOutThisDevice(); }, [isAdmin]);
  useEffect(() => { trackPageview(pathname); }, [pathname]);
};

function App() {
  usePageviews();
  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen text-primary transition-colors duration-500">
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthFlow />} />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <AdminProtectedRoute>
                <AdminRedirect />
              </AdminProtectedRoute>
            }
          />
          <Route path="/share/:token" element={<PublicTripView />} />
          <Route path="/join/:token" element={<JoinTripView />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Analytics />
      <CookieConsent />
    </div>
  );
}

export default App;
