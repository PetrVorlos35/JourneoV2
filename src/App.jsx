import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AuthFlow from './components/auth/AuthFlow';
import { useAuth } from './contexts/AuthContext';

// Lazy load the dashboard to speed up initial landing page load
const DashboardHome = lazy(() => import('./components/dashboard/DashboardHome'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-[#020617] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

function App() {
  return (
    <div className="bg-[#020617] min-h-screen">
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
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
