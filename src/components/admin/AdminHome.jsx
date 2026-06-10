import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { Toaster } from 'react-hot-toast';

const AdminDashboard = lazy(() => import('./AdminDashboard'));
const AdminUsers = lazy(() => import('./AdminUsers'));
const AdminTrips = lazy(() => import('./AdminTrips'));

const AdminLoading = () => (
  <div className="w-full h-[60vh] flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
  </div>
);

const AdminHome = () => {
  return (
    <AdminLayout>
      <Toaster
        position="top-right"
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
      <Suspense fallback={<AdminLoading />}>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/trips" element={<AdminTrips />} />
        </Routes>
      </Suspense>
    </AdminLayout>
  );
};

export default AdminHome;
