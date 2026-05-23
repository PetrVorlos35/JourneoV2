import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { cs } from 'date-fns/locale';
import { MapPin, Calendar, Trash2, Clock, Plane, Plus, TrendingUp, ArrowRight, Wallet } from 'lucide-react';
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
    <div className="space-y-10 w-full pb-10">
      {ModalPortal}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <p className="text-[12px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">Přehled vašich cest</p>
          <h1 className="text-4xl text-gray-900 dark:text-white tracking-tight font-bold">Chytrá nástěnka</h1>
        </div>
      </div>

      {/* Smart Dashboard Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Next Trip Countdown */}
        <div className="md:col-span-6 lg:col-span-5 glass-card p-8 rounded-[2rem] flex flex-col justify-between min-h-[220px]">
          {nextTrip ? (
            <>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-[12px] font-bold uppercase tracking-widest mb-4 bg-blue-50 dark:bg-blue-500/10 self-start px-3 py-1.5 rounded-full">
                <Clock size={16} strokeWidth={2.5} /> Další cesta za
              </div>
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-7xl font-bold tracking-tighter text-gray-900 dark:text-white leading-none">{daysUntilNextTrip > 0 ? daysUntilNextTrip : 'Dnes'}</span>
                {daysUntilNextTrip > 0 && <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">dní</span>}
              </div>
              <div className="pt-4 mt-auto">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate tracking-tight">{nextTrip.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-[13px] font-medium">{format(new Date(nextTrip.startDate), 'd. MMMM yyyy', { locale: cs })}</p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full space-y-4">
              <div className="w-14 h-14 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-gray-400">
                <Plane size={24} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">Žádný plán</h3>
                <p className="text-[14px] font-medium text-gray-500">Kam vyrazíte příště?</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="md:col-span-6 lg:col-span-4 glass-card rounded-[2rem] p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-gray-500 dark:text-gray-400 text-[12px] flex items-center gap-2 mb-6 uppercase tracking-widest font-bold">
              <TrendingUp size={16} strokeWidth={2.5} /> Rychlá data
            </h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <span className="text-5xl font-bold text-gray-900 dark:text-white leading-none tracking-tighter">{trips.length}</span>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Výletů</p>
              </div>
              <div className="space-y-1">
                <span className="text-5xl font-bold text-gray-900 dark:text-white leading-none tracking-tighter">{totalVisitedPlaces}</span>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Míst</p>
              </div>
            </div>
          </div>
          <Link to="/dashboard/statistics" className="text-[13px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors duration-300 flex items-center gap-1.5 mt-8 pt-4">
            Všechny statistiky <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="md:col-span-12 lg:col-span-3 flex flex-row lg:flex-col gap-4">
          <Link
            to="/dashboard/create"
            className="flex-1 lg:flex-none flex items-center justify-center gap-3 py-6 lg:py-8 px-4 bg-blue-600 text-white rounded-[2rem] hover:bg-blue-500 transition-all duration-300 shadow-md shadow-blue-500/20 active:scale-95"
          >
            <Plus size={24} strokeWidth={2.5} /> 
            <span className="font-bold text-[15px]">Nový výlet</span>
          </Link>
          <Link
            to="/dashboard/budget"
            className="flex-1 lg:flex-none flex items-center justify-center gap-3 py-6 lg:py-8 px-4 glass-card hover:bg-white/80 dark:hover:bg-white/5 transition-all duration-300 active:scale-95"
          >
            <Wallet size={24} strokeWidth={2} /> 
            <span className="font-bold text-[15px]">Výdaje</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-white/10 gap-8">
        {[
          { id: 'ongoing', label: 'Probíhající' },
          { id: 'upcoming', label: 'Plánované' },
          { id: 'past', label: 'Minulé' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`pb-4 px-2 text-[14px] sm:text-[15px] font-bold transition-all duration-300 border-b-[3px] relative top-[2px] ${
              activeCategory === cat.id
                ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 border-transparent hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {cat.label} <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-[11px] font-bold text-gray-500 dark:text-gray-400">{tripsByCategory[cat.id].length}</span>
          </button>
        ))}
      </div>

      {/* Trip List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tripsByCategory[activeCategory].length > 0 ? (
          tripsByCategory[activeCategory].map(trip => (
            <div
              key={trip.id}
              className="glass-card hover:-translate-y-1 transition-transform duration-300 p-6 sm:p-8 relative flex flex-col min-h-[220px] group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-[1rem] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <MapPin size={24} strokeWidth={2} />
                </div>
                <button
                  onClick={(e) => handleDelete(trip.id, e)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-500/20"
                  title="Smazat výlet"
                >
                  <Trash2 size={18} strokeWidth={2} />
                </button>
              </div>
              
              <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white tracking-tight">{trip.title}</h3>
              
              <div className="flex items-center text-[13px] font-bold text-gray-500 gap-2 mb-8">
                <Calendar size={16} strokeWidth={2} />
                <span>{format(new Date(trip.startDate), 'd. M.')} — {format(new Date(trip.endDate), 'd. M. yyyy')}</span>
              </div>
              
              <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-2 text-gray-400 text-[11px] uppercase tracking-widest font-bold">
                  <span>Aktivit: {trip.activities?.length || 0}</span>
                </div>
                <Link
                  to={`/dashboard/trip/${trip.id}`}
                  className="inline-flex items-center gap-1.5 text-[12px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors uppercase tracking-widest"
                >
                  Otevřít <ArrowRight size={16} strokeWidth={2.5} />
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center glass-card rounded-[2rem] flex flex-col items-center justify-center space-y-4 shadow-none">
            <p className="text-2xl text-gray-900 dark:text-white font-bold tracking-tight">Zatím prázdno</p>
            <p className="text-[15px] text-gray-500 font-medium max-w-md">V této kategorii nemáte zatím žádné výlety. Zkuste si nějaký naplánovat.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripsOverview;
