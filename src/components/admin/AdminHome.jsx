import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { Toaster } from 'react-hot-toast';
import { AdminDashboardSkeleton, AdminTableSkeleton } from '../ui/Skeletons';

const AdminDashboard = lazy(() => import('./AdminDashboard'));
const AdminUsers = lazy(() => import('./AdminUsers'));
const AdminTrips = lazy(() => import('./AdminTrips'));

// Per-route Suspense so the matching skeleton appears instantly on navigation
// instead of freezing on the previous page while the lazy chunk downloads.
const withSuspense = (element, fallback) => (
  <Suspense fallback={fallback}>{element}</Suspense>
);

const AdminTableLoading = () => (
  <div className="space-y-8">
    <div className="h-9 w-48 skeleton rounded-xl" aria-hidden="true" />
    <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] p-4">
      <AdminTableSkeleton rows={8} />
    </div>
  </div>
);

const AdminHome = () => {
  return (
    <AdminLayout>
      <Toaster
        position="top-right"
        containerStyle={{ zIndex: 99999 }}
        toastOptions={{
          style: {
            background: '#1C1C1E',
            color: '#f5f5f7',
            borderRadius: '1rem',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />
      <Routes>
        <Route path="/" element={withSuspense(<AdminDashboard />, <AdminDashboardSkeleton />)} />
        <Route path="/users" element={withSuspense(<AdminUsers />, <AdminTableLoading />)} />
        <Route path="/trips" element={withSuspense(<AdminTrips />, <AdminTableLoading />)} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminHome;
