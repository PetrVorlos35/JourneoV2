import { Plane, CalendarDays, Map, CheckCircle } from 'lucide-react';
import { eachDayOfInterval } from 'date-fns';

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="glass-card p-8 flex items-center gap-8">
    <div className={`p-4 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-[1rem]`}>
      <Icon size={32} strokeWidth={2} />
    </div>
    <div>
      <p className="text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-widest font-bold mb-3">{label}</p>
      <p className="text-5xl font-bold text-gray-900 dark:text-white tracking-tighter leading-none">{value}</p>
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
    <div className="w-full space-y-12 pb-10">
      <div className="space-y-2">
        <p className="text-[12px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">Přehled</p>
        <h1 className="text-4xl text-gray-900 dark:text-white tracking-tight font-bold">Statistiky cestování</h1>
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
        <div className="text-center p-16 glass-card">
          <p className="text-gray-500 dark:text-gray-400 font-bold text-xl tracking-tight">Zatím nemáte žádné výlety. Zkuste si nějaký vytvořit!</p>
        </div>
      )}
    </div>
  );
};

export default Statistics;
