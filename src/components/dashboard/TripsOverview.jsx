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
    <div className="space-y-12">
      {ModalPortal}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <p className="text-[11px] text-journeo-text-subtle uppercase tracking-widest font-medium">Přehled vašich cest</p>
          <h1 className="font-serif text-4xl text-journeo-text tracking-tight">Chytrá nástěnka</h1>
        </div>
      </div>

      {/* Smart Dashboard Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Next Trip Countdown */}
        <div className="md:col-span-6 lg:col-span-5 bg-journeo-surface border border-journeo-border p-8 rounded-sm flex flex-col justify-between min-h-[200px]">
          {nextTrip ? (
            <>
              <div className="flex items-center gap-2 text-journeo-accent text-[11px] font-medium uppercase tracking-widest mb-4">
                <Clock size={14} /> Další cesta za
              </div>
              <div className="flex items-baseline gap-3 mb-6">
                <span className="font-serif text-6xl text-journeo-text leading-none">{daysUntilNextTrip > 0 ? daysUntilNextTrip : 'Dnes'}</span>
                {daysUntilNextTrip > 0 && <span className="text-sm font-medium text-journeo-text-subtle uppercase tracking-widest">dní</span>}
              </div>
              <div className="border-t border-journeo-border-strong pt-4 mt-auto">
                <h3 className="font-serif text-xl text-journeo-text mb-1 truncate">{nextTrip.title}</h3>
                <p className="text-journeo-text-muted text-[13px] font-medium">{format(new Date(nextTrip.startDate), 'd. MMMM yyyy', { locale: cs })}</p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full space-y-4">
              <div className="w-12 h-12 border border-journeo-border-strong rounded-full flex items-center justify-center text-journeo-text-subtle">
                <Plane size={20} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-serif text-xl text-journeo-text mb-1">Žádný plán</h3>
                <p className="text-[13px] text-journeo-text-subtle">Kam vyrazíte příště?</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="md:col-span-6 lg:col-span-4 bg-journeo-surface border border-journeo-border rounded-sm p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-journeo-text-subtle text-[11px] flex items-center gap-2 mb-6 uppercase tracking-widest font-medium">
              <TrendingUp size={14} /> Rychlá data
            </h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <span className="font-serif text-4xl text-journeo-text leading-none">{trips.length}</span>
                <p className="text-[10px] font-medium text-journeo-text-subtle uppercase tracking-widest">Výletů</p>
              </div>
              <div className="space-y-1">
                <span className="font-serif text-4xl text-journeo-text leading-none">{totalVisitedPlaces}</span>
                <p className="text-[10px] font-medium text-journeo-text-subtle uppercase tracking-widest">Míst</p>
              </div>
            </div>
          </div>
          <Link to="/dashboard/statistics" className="text-[12px] font-medium text-journeo-accent hover:text-journeo-accent-hover transition-colors duration-300 flex items-center gap-1.5 mt-8 border-t border-journeo-border-strong pt-4">
            Všechny statistiky <ArrowRight size={14} />
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="md:col-span-12 lg:col-span-3 flex flex-row lg:flex-col gap-4">
          <Link
            to="/dashboard/create"
            className="flex-1 lg:flex-none flex items-center justify-center gap-3 py-6 lg:py-8 px-4 bg-journeo-accent text-journeo-dark rounded-sm hover:bg-journeo-accent-hover transition-colors duration-300"
          >
            <Plus size={20} strokeWidth={1.5} /> 
            <span className="font-medium text-[14px]">Nový výlet</span>
          </Link>
          <Link
            to="/dashboard/budget"
            className="flex-1 lg:flex-none flex items-center justify-center gap-3 py-6 lg:py-8 px-4 bg-transparent border border-journeo-border text-journeo-text hover:bg-journeo-surface-hover transition-colors duration-300 rounded-sm"
          >
            <Wallet size={20} strokeWidth={1.5} /> 
            <span className="font-medium text-[14px]">Výdaje</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-journeo-border">
        {[
          { id: 'ongoing', label: 'Probíhající' },
          { id: 'upcoming', label: 'Plánované' },
          { id: 'past', label: 'Minulé' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`pb-4 px-2 mr-8 text-[13px] sm:text-[14px] font-medium transition-colors duration-300 border-b-2 relative top-[1px] ${
              activeCategory === cat.id
                ? 'text-journeo-text border-journeo-accent'
                : 'text-journeo-text-subtle border-transparent hover:text-journeo-text-muted'
            }`}
          >
            {cat.label} <span className="ml-1.5 opacity-50 text-[11px]">{tripsByCategory[cat.id].length}</span>
          </button>
        ))}
      </div>

      {/* Trip List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tripsByCategory[activeCategory].length > 0 ? (
          tripsByCategory[activeCategory].map(trip => (
            <div
              key={trip.id}
              className="bg-journeo-surface border border-journeo-border hover:border-journeo-border-strong rounded-sm p-6 sm:p-8 transition-colors duration-300 group relative flex flex-col min-h-[220px]"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="text-journeo-accent opacity-80 group-hover:opacity-100 transition-opacity">
                  <MapPin size={24} strokeWidth={1.2} />
                </div>
                <button
                  onClick={(e) => handleDelete(trip.id, e)}
                  className="text-journeo-text-subtle hover:text-red-400 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                  title="Smazat výlet"
                >
                  <Trash2 size={18} strokeWidth={1.5} />
                </button>
              </div>
              
              <h3 className="font-serif text-2xl mb-2 text-journeo-text leading-tight group-hover:text-journeo-accent transition-colors duration-300">{trip.title}</h3>
              
              <div className="flex items-center text-[12px] font-medium text-journeo-text-muted gap-2 mb-8">
                <Calendar size={14} strokeWidth={1.5} />
                <span>{format(new Date(trip.startDate), 'd. M.')} — {format(new Date(trip.endDate), 'd. M. yyyy')}</span>
              </div>
              
              <div className="mt-auto flex items-center justify-between gap-4 pt-6 border-t border-journeo-border-strong">
                <div className="flex items-center gap-2 text-journeo-text-subtle text-[11px] uppercase tracking-widest font-medium">
                  <span>Aktivit: {trip.activities?.length || 0}</span>
                </div>
                <Link
                  to={`/dashboard/trip/${trip.id}`}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-journeo-text hover:text-journeo-accent transition-colors duration-300 uppercase tracking-widest"
                >
                  Otevřít <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center border border-journeo-border rounded-sm bg-journeo-surface flex flex-col items-center justify-center space-y-4">
            <p className="font-serif text-2xl text-journeo-text">Zatím prázdno</p>
            <p className="text-[14px] text-journeo-text-muted max-w-md">V této kategorii nemáte zatím žádné výlety. Zkuste si nějaký naplánovat.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripsOverview;
