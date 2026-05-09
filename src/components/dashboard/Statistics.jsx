import { Plane, CalendarDays, Map, CheckCircle } from 'lucide-react';
import { eachDayOfInterval } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, colorClass, lightColorClass }) => (
  <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex items-center gap-6">
    <div className={`p-4 rounded-xl ${lightColorClass} dark:${colorClass}`}>
      <Icon size={32} />
    </div>
    <div>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
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
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Statistiky cestování</h1>
        <p className="text-gray-500 dark:text-gray-400">Přehled vašich cestovatelských úspěchů a dat.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          icon={Plane}
          label="Celkem výletů"
          value={totalTrips}
          colorClass="bg-blue-500/20 text-blue-400"
          lightColorClass="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={CalendarDays}
          label="Celkem dní na cestách"
          value={totalDays}
          colorClass="bg-purple-500/20 text-purple-400"
          lightColorClass="bg-purple-100 text-purple-600"
        />
        <StatCard
          icon={CheckCircle}
          label="Dokončených výletů"
          value={pastTripsCount}
          colorClass="bg-green-500/20 text-green-400"
          lightColorClass="bg-green-100 text-green-600"
        />
        <StatCard
          icon={Map}
          label="Naplánovaných aktivit"
          value={totalActivities}
          colorClass="bg-orange-500/20 text-orange-400"
          lightColorClass="bg-orange-100 text-orange-600"
        />
      </div>

      {totalTrips === 0 && (
        <div className="mt-8 text-center p-8 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
          <p className="text-gray-500 dark:text-gray-400">Zatím nemáte žádné výlety. Zkuste si nějaký vytvořit!</p>
        </div>
      )}
    </div>
  );
};

export default Statistics;
