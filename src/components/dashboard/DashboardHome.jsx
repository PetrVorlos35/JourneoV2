import React, { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from './DashboardLayout';
import DashboardSplash from './DashboardSplash';
import DashboardNotFound from './DashboardNotFound';
import CreateTripModal from './CreateTripModal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  TripsOverviewSkeleton,
  AllTripsSkeleton,
  TripDetailSkeleton,
  StatisticsSkeleton,
  SettingsSkeleton,
  BudgetSkeleton,
  FriendsSkeleton,
  FriendProfileSkeleton,
  TripViewSkeleton,
  ContentSkeleton,
} from '../ui/Skeletons';

// Lazy load dashboard sub-components
const TripsOverview = lazy(() => import('./TripsOverview'));
const TripDetail = lazy(() => import('./TripDetail'));
const Statistics = lazy(() => import('./Statistics'));
const Settings = lazy(() => import('./Settings'));
const Budget = lazy(() => import('./Budget'));
const AllTrips = lazy(() => import('./AllTrips'));
const Friends = lazy(() => import('./Friends'));
const FriendProfile = lazy(() => import('./FriendProfile'));
const AddFriendInvite = lazy(() => import('./AddFriendInvite'));
const ReadOnlyTripView = lazy(() => import('./ReadOnlyTripView'));

const EXCHANGE_RATES = {
  CZK: { CZK: 1, EUR: 0.04, USD: 0.043, GBP: 0.034 },
  EUR: { CZK: 25, EUR: 1, USD: 1.08, GBP: 0.85 },
  USD: { CZK: 23, EUR: 0.93, USD: 1, GBP: 0.79 },
  GBP: { CZK: 29, EUR: 1.18, USD: 1.27, GBP: 1 }
};

// Wrap a lazy route element in its own Suspense boundary with a matching
// skeleton fallback. Because each matched route mounts a *new* boundary,
// React shows the fallback immediately on navigation (instead of preserving
// the previous page during the transition while the chunk loads).
const withSuspense = (element, fallback) => (
  <Suspense fallback={fallback}>{element}</Suspense>
);

const DashboardHome = () => {
  const { t } = useTranslation();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Load trips from API on mount
  const fetchTrips = useCallback(async () => {
    try {
      const data = await api.trips.getAll();
      setTrips(data.trips);
    } catch (err) {
      console.error('Failed to fetch trips:', err);
      toast.error(t('dashboardHome.loadError'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleAddTrip = async (newTrip) => {
    try {
      const data = await api.trips.create({
        title: newTrip.title,
        startDate: newTrip.startDate,
        endDate: newTrip.endDate,
      });
      
      const createdTrip = data.trip;
      setTrips(prev => [...prev, createdTrip]);
      toast.success(t('dashboardHome.tripReady'));

      return createdTrip;
    } catch (err) {
      toast.error(err.message || t('dashboardHome.createError'));
      throw err;
    }
  };

  const handleDeleteTrip = async (id) => {
    try {
      await api.trips.delete(id);
      setTrips(prev => prev.filter(trip => trip.id !== id));
    } catch (err) {
      toast.error(err.message || t('dashboardHome.deleteError'));
    }
  };

  const handleUpdateTrip = async (updatedTrip) => {
    try {
      const data = await api.trips.update(updatedTrip.id, updatedTrip);
      setTrips(prev => prev.map(trip => trip.id === data.trip.id ? data.trip : trip));
      return data.trip;
    } catch (err) {
      toast.error(err.message || t('dashboardHome.updateError'));
      throw err;
    }
  };

  const handleClearData = async () => {
    try {
      // Delete all trips one by one
      await Promise.all(trips.map(trip => api.trips.delete(trip.id)));
      setTrips([]);
    } catch (err) {
      toast.error(t('dashboardHome.clearError'));
    }
  };

  const handleConvertCurrency = async (oldCurr, newCurr) => {
    const rate = EXCHANGE_RATES[oldCurr]?.[newCurr] || 1;
    const convertedTrips = trips.map(trip => {
      if (!trip.expenses || trip.expenses.length === 0) return trip;
      return {
        ...trip,
        expenses: trip.expenses.map(exp => ({
          ...exp,
          amount: parseFloat((exp.amount * rate).toFixed(2)),
          splits: Array.isArray(exp.splits)
            ? exp.splits.map(s => ({ ...s, amount: parseFloat((s.amount * rate).toFixed(2)) }))
            : exp.splits,
        }))
      };
    });

    // Update each trip with converted expenses on the server
    try {
      await Promise.all(
        convertedTrips
          .filter(trip => trip.expenses && trip.expenses.length > 0)
          .map(trip => api.trips.update(trip.id, trip))
      );
      setTrips(convertedTrips);
    } catch (err) {
      toast.error(t('dashboardHome.currencyError'));
    }
  };

  if (loading) {
    return (
      <DashboardSplash>
        <DashboardLayout>
          <TripsOverviewSkeleton />
        </DashboardLayout>
      </DashboardSplash>
    );
  }

  return (
    <DashboardSplash>
      <DashboardLayout onOpenCreateModal={() => setIsCreateModalOpen(true)}>
        <CreateTripModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          onAddTrip={handleAddTrip} 
        />
        {/* Per-route Suspense boundaries: navigating mounts a fresh boundary,
            so the matching skeleton shows instantly instead of the page freezing
            on the previous view while the lazy chunk downloads. */}
        <Routes>
          <Route
            path="/"
            element={withSuspense(<TripsOverview trips={trips} onDeleteTrip={handleDeleteTrip} onOpenCreateModal={() => setIsCreateModalOpen(true)} />, <TripsOverviewSkeleton />)}
          />
          <Route
            path="/all-trips"
            element={withSuspense(<AllTrips trips={trips} onDeleteTrip={handleDeleteTrip} />, <AllTripsSkeleton />)}
          />
          <Route
            path="/trip/:id"
            element={withSuspense(<TripDetail trips={trips} onUpdateTrip={handleUpdateTrip} />, <TripDetailSkeleton />)}
          />
          <Route
            path="/statistics"
            element={withSuspense(<Statistics trips={trips} />, <StatisticsSkeleton />)}
          />
          <Route
            path="/settings"
            element={withSuspense(<Settings onClearData={handleClearData} onConvertCurrency={handleConvertCurrency} />, <SettingsSkeleton />)}
          />
          <Route
            path="/budget"
            element={withSuspense(<Budget trips={trips} onUpdateTrip={handleUpdateTrip} />, <BudgetSkeleton />)}
          />
          <Route
            path="/friends"
            element={withSuspense(<Friends />, <FriendsSkeleton />)}
          />
          <Route
            path="/add-friend/:token"
            element={withSuspense(<AddFriendInvite />, <ContentSkeleton />)}
          />
          <Route
            path="/profile/:userId"
            element={withSuspense(<FriendProfile />, <FriendProfileSkeleton />)}
          />
          <Route
            path="/profile/:userId/trip/:tripId"
            element={withSuspense(<ReadOnlyTripView />, <TripViewSkeleton />)}
          />
          <Route path="*" element={withSuspense(<DashboardNotFound />, <ContentSkeleton />)} />
        </Routes>
      </DashboardLayout>
    </DashboardSplash>
  );
};

export default DashboardHome;
