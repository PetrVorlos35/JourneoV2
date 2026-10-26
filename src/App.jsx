import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import NotFound from './components/NotFound';
import CookieConsent from './components/CookieConsent';
import { useAuth } from './contexts/AuthContext';
import { Analytics } from '@vercel/analytics/react';

// Lazy load everything except the landing page to speed up initial load
const AuthFlow = lazy(() => import('./components/auth/AuthFlow'));
const DashboardHome = lazy(() => import('./components/dashboard/DashboardHome'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const PublicTripView = lazy(() => import('./components/public/PublicTripView'));
const JoinTripView = lazy(() => import('./components/public/JoinTripView'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

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

function App() {
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
