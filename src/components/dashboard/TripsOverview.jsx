import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { cs } from 'date-fns/locale';
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
    <div className="space-y-6 md:space-y-8">
      {ModalPortal}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">Chytrá nástěnka</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">Přehled vašich cest a rychlé akce.</p>
        </div>
      </div>

      {/* Smart Dashboard Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Next Trip Countdown */}
        {nextTrip ? (
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 md:p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 text-white/10 rotate-12">
              <Plane size={140} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-blue-100/80 mb-2 text-[10px] font-bold uppercase tracking-widest">
                <Clock size={14} /> Další cesta za
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-black">{daysUntilNextTrip > 0 ? daysUntilNextTrip : 'Dnes'}</span>
                {daysUntilNextTrip > 0 && <span className="text-lg font-medium text-blue-100/80 uppercase">dní</span>}
              </div>
            </div>
            <div className="relative z-10 mt-4">
              <h3 className="font-bold text-lg md:text-xl truncate drop-shadow-sm">{nextTrip.title}</h3>
              <p className="text-blue-100/70 text-xs font-medium">{format(new Date(nextTrip.startDate), 'd. MMMM yyyy', { locale: cs })}</p>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-500/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
              <Plane size={24} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Žádný plán</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Kam vyrazíte příště?</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2 mb-4 uppercase tracking-wider">
              <TrendingUp size={16} className="text-purple-500" /> Rychlá data
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Výlety</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{trips.length}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Místa</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{totalVisitedPlaces}</p>
              </div>
            </div>
          </div>
          <Link to="/dashboard/statistics" className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline mt-4 flex items-center gap-1">
            Všechny statistiky <TrendingUp size={12} />
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-row md:flex-col gap-3">
          <Link
            to="/dashboard/create"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25 active:scale-95"
          >
            <Plus size={20} /> <span className="hidden sm:inline">Nový výlet</span><span className="sm:hidden">Nový</span>
          </Link>
          <Link
            to="/dashboard/budget"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 py-4 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-white/10 rounded-2xl font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-all active:scale-95"
          >
            <TrendingUp size={18} /> <span className="hidden sm:inline">Výdaje</span><span className="sm:hidden">Výdaje</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="pt-2 flex gap-1 bg-gray-100/50 dark:bg-white/5 p-1 rounded-2xl w-fit">
        {[
          { id: 'ongoing', label: 'Probíhající' },
          { id: 'upcoming', label: 'Plánované' },
          { id: 'past', label: 'Minulé' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeCategory === cat.id
                ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {cat.label} <span className="ml-1 opacity-50">{tripsByCategory[cat.id].length}</span>
          </button>
        ))}
      </div>

      {/* Trip List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {tripsByCategory[activeCategory].length > 0 ? (
          tripsByCategory[activeCategory].map(trip => (
            <div
              key={trip.id}
              className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-5 md:p-6 hover:shadow-xl hover:shadow-blue-500/5 transition-all group relative flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
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
              <h3 className="text-xl font-black mb-1 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">{trip.title}</h3>
              <div className="flex items-center text-xs font-medium text-gray-400 dark:text-gray-500 gap-1.5 mb-6">
                <Calendar size={14} />
                <span>{format(new Date(trip.startDate), 'd. M.')} — {format(new Date(trip.endDate), 'd. M. yyyy')}</span>
              </div>
              
              <div className="mt-auto flex items-center justify-between gap-4 pt-4 border-t border-gray-50 dark:border-white/5">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                       <div className="w-full h-full rounded-full bg-blue-500/10" />
                    </div>
                  ))}
                  <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 bg-gray-50 dark:bg-white/5 flex items-center justify-center text-[8px] font-black text-gray-400">
                    +{trip.activities?.length || 0}
                  </div>
                </div>
                <Link
                  to={`/dashboard/trip/${trip.id}`}
                  className="px-4 py-2 bg-gray-50 dark:bg-white/5 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 transition-all active:scale-95"
                >
                  Otevřít
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
