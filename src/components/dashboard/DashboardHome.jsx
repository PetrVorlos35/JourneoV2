import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import DashboardSplash from './DashboardSplash';
import useLocalStorage from '../../hooks/useLocalStorage';

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
  const [trips, setTrips] = useLocalStorage('journeo_trips', []);

  const handleAddTrip = (newTrip) => {
    setTrips([...trips, newTrip]);
  };

  const handleDeleteTrip = (id) => {
    setTrips(trips.filter(trip => trip.id !== id));
  };

  const handleUpdateTrip = (updatedTrip) => {
    setTrips(trips.map(trip => trip.id === updatedTrip.id ? updatedTrip : trip));
  };

  const handleClearData = () => {
    setTrips([]);
  };

  const handleConvertCurrency = (oldCurr, newCurr) => {
    const rate = EXCHANGE_RATES[oldCurr]?.[newCurr] || 1;
    const newTrips = trips.map(trip => {
      if (!trip.expenses) return trip;
      return {
        ...trip,
        expenses: trip.expenses.map(exp => ({
          ...exp,
          amount: parseFloat((exp.amount * rate).toFixed(2))
        }))
      };
    });
    setTrips(newTrips);
  };

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
