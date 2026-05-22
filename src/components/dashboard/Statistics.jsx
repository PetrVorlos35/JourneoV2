import { Plane, CalendarDays, Map, CheckCircle } from 'lucide-react';
import { eachDayOfInterval } from 'date-fns';

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="bg-journeo-surface border border-journeo-border rounded-sm p-8 flex items-center gap-8">
    <div className={`p-4 border border-journeo-border-strong text-journeo-accent rounded-full`}>
      <Icon size={32} strokeWidth={1.5} />
    </div>
    <div>
      <p className="text-journeo-text-subtle text-[11px] uppercase tracking-widest font-medium mb-3">{label}</p>
      <p className="text-5xl font-serif text-journeo-text">{value}</p>
    </div>
  </div>
);

const Statistics = ({ trips }) => {
  const totalTrips = trips.length;

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

  const pastTripsCount = trips.filter(t => categorizeTrips(t) === 'past').length;

  const totalDays = trips.reduce((acc, trip) => {
    try {
      return acc + eachDayOfInterval({ start: new Date(trip.startDate), end: new Date(trip.endDate) }).length;
    } catch { return acc; }
  }, 0);

  const totalActivities = trips.reduce((acc, trip) => {
    if (!trip.activities) return acc;
    return acc + trip.activities.filter(a => a.plan?.trim().length > 0 || a.location?.trim().length > 0).length;
  }, 0);

  return (
    <div className="w-full space-y-12">
      <div className="space-y-2">
        <p className="text-[11px] text-journeo-text-subtle uppercase tracking-widest font-medium">Přehled</p>
        <h1 className="font-serif text-4xl text-journeo-text tracking-tight">Statistiky cestování</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          icon={Plane}
          label="Celkem výletů"
          value={totalTrips}
        />
        <StatCard
          icon={CalendarDays}
          label="Celkem dní na cestách"
          value={totalDays}
        />
        <StatCard
          icon={CheckCircle}
          label="Dokončených výletů"
          value={pastTripsCount}
        />
        <StatCard
          icon={Map}
          label="Naplánovaných aktivit"
          value={totalActivities}
        />
      </div>

      {totalTrips === 0 && (
        <div className="text-center p-16 border border-journeo-border rounded-sm bg-journeo-surface">
          <p className="text-journeo-text-subtle font-serif text-2xl italic">Zatím nemáte žádné výlety. Zkuste si nějaký vytvořit!</p>
        </div>
      )}
    </div>
  );
};

export default Statistics;
