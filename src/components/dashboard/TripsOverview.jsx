import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { MapPin, Calendar, Trash2, Clock, Plane, Plus, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useDialog } from '../ui/DialogModal';

const TripsOverview = ({ trips, onDeleteTrip }) => {
  const { confirmDialog, ModalPortal } = useDialog();
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

  const handleDelete = async (id, e) => {
    e.preventDefault();
    const ok = await confirmDialog({
      title: 'Smazat výlet?',
      message: 'Opravdu chcete tento výlet trvale smazat? Tato akce nelze vrátit zpět.',
      variant: 'danger',
      confirmLabel: 'Smazat'
    });
    if (ok) {
      onDeleteTrip(id);
      toast.success('Výlet byl úspěšně smazán');
    }
  };

  const upcomingTrips = [...tripsByCategory.upcoming].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  const nextTrip = upcomingTrips[0];
  const daysUntilNextTrip = nextTrip ? Math.ceil(differenceInDays(new Date(nextTrip.startDate), new Date())) : null;

  const totalVisitedPlaces = trips.reduce((acc, t) => acc + (t.activities?.filter(a => a.location)?.length || 0), 0);

  return (
    <div className="space-y-8">
      {ModalPortal}
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Chytrá nástěnka</h1>
        <p className="text-gray-500 dark:text-gray-400">Přehled vašich cest a rychlé akce.</p>
      </div>

      {/* Smart Dashboard Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Next Trip Countdown */}
        {nextTrip ? (
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 text-white/10">
              <Plane size={120} />
            </div>
            <div className="relative z-10 mb-4">
              <div className="flex items-center gap-2 text-blue-100 mb-1 text-sm font-medium uppercase tracking-wider">
                <Clock size={16} /> Další cesta za
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold">{daysUntilNextTrip > 0 ? daysUntilNextTrip : 'Dnes'}</span>
                {daysUntilNextTrip > 0 && <span className="text-xl font-medium text-blue-100">dní</span>}
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-xl truncate">{nextTrip.title}</h3>
              <p className="text-blue-100 text-sm mt-1">{format(new Date(nextTrip.startDate), 'dd.MM.yyyy')}</p>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
              <Plane size={24} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Žádný naplánovaný výlet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Je čas naplánovat další dobrodružství!</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-purple-500" /> Rychlé statistiky
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Celkem výletů</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{trips.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Navštívených míst</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalVisitedPlaces}</p>
              </div>
            </div>
          </div>
          <Link to="/dashboard/statistics" className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline mt-4 inline-block">
            Detailní statistiky &rarr;
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-center gap-4">
          <Link
            to="/dashboard/create"
            className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-md shadow-blue-500/20"
          >
            <Plus size={20} /> Vytvořit nový výlet
          </Link>
          <Link
            to="/dashboard/budget"
            className="flex items-center justify-center gap-2 w-full py-4 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
          >
            <TrendingUp size={18} /> Přidat výdaj
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="pt-4 flex space-x-2 border-b border-gray-200 dark:border-white/10 pb-4">
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
