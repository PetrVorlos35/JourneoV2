import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import DashboardSplash from './DashboardSplash';
import TripsOverview from './TripsOverview';
import CreateTrip from './CreateTrip';
import TripDetail from './TripDetail';
import Statistics from './Statistics';
import Settings from './Settings';
import Budget from './Budget';
import useLocalStorage from '../../hooks/useLocalStorage';

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

  return (
    <DashboardSplash>
      <DashboardLayout>
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
            element={<Settings onClearData={handleClearData} />} 
          />
          <Route 
            path="/budget" 
            element={<Budget trips={trips} onUpdateTrip={handleUpdateTrip} />} 
          />
        </Routes>
      </DashboardLayout>
    </DashboardSplash>
  );
};

export default DashboardHome;
