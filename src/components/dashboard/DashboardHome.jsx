import React, { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import DashboardSplash from './DashboardSplash';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Lazy load dashboard sub-components
const TripsOverview = lazy(() => import('./TripsOverview'));
const CreateTrip = lazy(() => import('./CreateTrip'));
const TripDetail = lazy(() => import('./TripDetail'));
const Statistics = lazy(() => import('./Statistics'));
const Settings = lazy(() => import('./Settings'));
const Budget = lazy(() => import('./Budget'));

const EXCHANGE_RATES = {
  CZK: { CZK: 1, EUR: 0.04, USD: 0.043, GBP: 0.034 },
  EUR: { CZK: 25, EUR: 1, USD: 1.08, GBP: 0.85 },
  USD: { CZK: 23, EUR: 0.93, USD: 1, GBP: 0.79 },
  GBP: { CZK: 29, EUR: 1.18, USD: 1.27, GBP: 1 }
};

const DashboardLoading = () => (
  <div className="w-full h-[60vh] flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
  </div>
);

const DashboardHome = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load trips from API on mount
  const fetchTrips = useCallback(async () => {
    try {
      const data = await api.trips.getAll();
      setTrips(data.trips);
    } catch (err) {
      console.error('Failed to fetch trips:', err);
      toast.error('Nepodařilo se načíst výlety.');
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
      setTrips(prev => [...prev, data.trip]);
      return data.trip;
    } catch (err) {
      toast.error(err.message || 'Nepodařilo se vytvořit výlet.');
      throw err;
    }
  };

  const handleDeleteTrip = async (id) => {
    try {
      await api.trips.delete(id);
      setTrips(prev => prev.filter(trip => trip.id !== id));
    } catch (err) {
      toast.error(err.message || 'Nepodařilo se smazat výlet.');
    }
  };

  const handleUpdateTrip = async (updatedTrip) => {
    try {
      const data = await api.trips.update(updatedTrip.id, updatedTrip);
      setTrips(prev => prev.map(trip => trip.id === data.trip.id ? data.trip : trip));
      return data.trip;
    } catch (err) {
      toast.error(err.message || 'Nepodařilo se aktualizovat výlet.');
      throw err;
    }
  };

  const handleClearData = async () => {
    try {
      // Delete all trips one by one
      await Promise.all(trips.map(trip => api.trips.delete(trip.id)));
      setTrips([]);
    } catch (err) {
      toast.error('Nepodařilo se smazat data.');
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
          amount: parseFloat((exp.amount * rate).toFixed(2))
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
      toast.error('Chyba při přepočtu měny.');
    }
  };

  if (loading) {
    return (
      <DashboardSplash>
        <DashboardLayout>
          <DashboardLoading />
        </DashboardLayout>
      </DashboardSplash>
    );
  }

  return (
    <DashboardSplash>
      <DashboardLayout>
        <Suspense fallback={<DashboardLoading />}>
          <Routes>
            <Route 
              path="/" 
              element={<TripsOverview trips={trips} onDeleteTrip={handleDeleteTrip} />} 
            />
            <Route 
              path="/create" 
              element={<CreateTrip onAddTrip={handleAddTrip} />} 
            />
            <Route 
              path="/trip/:id" 
              element={<TripDetail trips={trips} onUpdateTrip={handleUpdateTrip} />} 
            />
            <Route 
              path="/statistics" 
              element={<Statistics trips={trips} />} 
            />
            <Route 
              path="/settings" 
              element={<Settings onClearData={handleClearData} onConvertCurrency={handleConvertCurrency} />} 
            />
            <Route 
              path="/budget" 
              element={<Budget trips={trips} onUpdateTrip={handleUpdateTrip} />} 
            />
          </Routes>
        </Suspense>
      </DashboardLayout>
    </DashboardSplash>
  );
};

export default DashboardHome;
