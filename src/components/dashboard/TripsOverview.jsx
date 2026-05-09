import { useState } from 'react';
import { format } from 'date-fns';
import { MapPin, Calendar, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const TripsOverview = ({ trips, onDeleteTrip }) => {
  const [activeCategory, setActiveCategory] = useState('ongoing');

  const categorizeTrips = (trip) => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const now = new Date();
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
    if (end < now) return 'past';
    if (start <= now && end >= now) return 'ongoing';
    return 'upcoming';
  };

  const tripsByCategory = {
    ongoing: trips.filter(trip => categorizeTrips(trip) === 'ongoing'),
    upcoming: trips.filter(trip => categorizeTrips(trip) === 'upcoming'),
    past: trips.filter(trip => categorizeTrips(trip) === 'past'),
  };

  const handleDelete = (id, e) => {
    e.preventDefault();
    if (window.confirm('Opravdu chcete tento výlet trvale smazat?')) {
      onDeleteTrip(id);
      toast.success('Výlet byl úspěšně smazán');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Moje Výlety</h1>
        <p className="text-gray-500 dark:text-gray-400">Přehled všech vašich naplánovaných i proběhlých cest.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-white/10 pb-4">
        {[
          { id: 'ongoing', label: 'Probíhající' },
          { id: 'upcoming', label: 'Nadcházející' },
          { id: 'past', label: 'Minulé' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-5 py-2 rounded-lg font-medium transition-colors ${
              activeCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            {cat.label} ({tripsByCategory[cat.id].length})
          </button>
        ))}
      </div>

      {/* Trip List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tripsByCategory[activeCategory].length > 0 ? (
          tripsByCategory[activeCategory].map(trip => (
            <div
              key={trip.id}
              className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group relative flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
                  <MapPin size={24} />
                </div>
                <button
                  onClick={(e) => handleDelete(trip.id, e)}
                  className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Smazat výlet"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{trip.title}</h3>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-2 mb-auto pb-4">
                <Calendar size={16} />
                <span>{format(new Date(trip.startDate), 'dd.MM.yyyy')} - {format(new Date(trip.endDate), 'dd.MM.yyyy')}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 flex justify-between items-center">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Aktivit: {trip.activities?.filter(a => a.plan || a.location).length || 0}
                </span>
                <Link
                  to={`/dashboard/trip/${trip.id}`}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Detail výletu
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
            <p className="text-gray-500 dark:text-gray-400 mb-2">V této kategorii nemáte zatím žádné výlety.</p>
            {activeCategory !== 'past' && (
              <p className="text-sm text-gray-400 dark:text-gray-500">Zkuste nějaký přidat v sekci "Vytvořit výlet".</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TripsOverview;
