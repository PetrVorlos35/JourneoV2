import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, MapPin, Calendar, Pencil, Check } from 'lucide-react';
import { format, eachDayOfInterval } from 'date-fns';
import { cs } from 'date-fns/locale';
import toast from 'react-hot-toast';

const TripDetail = ({ trips, onUpdateTrip }) => {
  const { id } = useParams();
  const trip = trips.find(t => t.id === id);

  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [dailyPlans, setDailyPlans] = useState([]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [tripTitle, setTripTitle] = useState(trip?.title || '');
  const titleInputRef = useRef(null);

  useEffect(() => {
    if (trip) setTripTitle(trip.title);
  }, [trip?.id]);

  useEffect(() => {
    if (trip) {
      const days = eachDayOfInterval({
        start: new Date(trip.startDate),
        end: new Date(trip.endDate)
      });
      const existingActivities = trip.activities || [];
      const initialPlans = days.map((date, index) => {
        const existing = existingActivities[index];
        return {
          date,
          title: existing?.title || `Den ${index + 1}`,
          plan: existing?.plan || '',
          location: existing?.location || ''
        };
      });
      setDailyPlans(initialPlans);
    }
  }, [trip]);

  if (!trip) {
    return (
      <div className="text-center py-20 text-gray-500 dark:text-gray-400">
        Výlet nebyl nalezen.
        <br />
        <Link to="/dashboard" className="text-blue-600 dark:text-blue-500 hover:underline mt-4 inline-block">Zpět na přehled</Link>
      </div>
    );
  }

  const handlePlanChange = (value) => {
    const updated = [...dailyPlans];
    updated[activeDayIndex].plan = value;
    setDailyPlans(updated);
  };

  const handleLocationChange = (value) => {
    const updated = [...dailyPlans];
    updated[activeDayIndex].location = value;
    setDailyPlans(updated);
  };

  const handleSave = () => {
    onUpdateTrip({ ...trip, title: tripTitle, activities: dailyPlans });
    toast.success('Itinerář byl úspěšně uložen!');
  };

  const currentDay = dailyPlans[activeDayIndex];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Link to="/dashboard" className="inline-flex items-center text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 mb-4 font-medium transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Zpět na přehled
          </Link>

          <div className="flex items-center gap-3 mb-2">
            {editingTitle ? (
              <>
                <input
                  ref={titleInputRef}
                  value={tripTitle}
                  onChange={e => setTripTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') setEditingTitle(false); }}
                  className="text-3xl md:text-4xl font-bold bg-transparent border-b-2 border-blue-500 text-gray-900 dark:text-white focus:outline-none w-full"
                  autoFocus
                />
                <button onClick={() => setEditingTitle(false)} className="text-green-600 dark:text-green-400 hover:text-green-700 mt-1">
                  <Check size={22} />
                </button>
              </>
            ) : (
              <>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{tripTitle}</h1>
                <button onClick={() => setEditingTitle(true)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mt-1" title="Přejmenovat">
                  <Pencil size={18} />
                </button>
              </>
            )}
          </div>

          <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <Calendar size={16} />
            {format(new Date(trip.startDate), 'dd.MM.yyyy')} - {format(new Date(trip.endDate), 'dd.MM.yyyy')}
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors w-fit"
        >
          <Save size={18} /> Uložit plán
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Days sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-sm mb-4 px-2">Itinerář</h3>
          {dailyPlans.map((day, index) => (
            <button
              key={index}
              onClick={() => setActiveDayIndex(index)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                activeDayIndex === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              <div className="font-bold">{day.title}</div>
              <div className="text-xs opacity-70 mt-1 capitalize">
                {format(new Date(day.date), 'EEEE, dd.MM.yyyy', { locale: cs })}
              </div>
            </button>
          ))}
        </div>

        {/* Day editor */}
        <div className="lg:col-span-3">
          {currentDay && (
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 md:p-8 rounded-2xl">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-white/10 pb-4 flex items-baseline gap-3">
                <span>Plán pro {currentDay.title}</span>
                <span className="text-sm font-normal text-gray-400 dark:text-gray-500 capitalize">
                  ({format(new Date(currentDay.date), 'EEEE', { locale: cs })})
                </span>
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin size={16} /> Lokace (Město, Místo)
                  </label>
                  <input
                    type="text"
                    value={currentDay.location}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    placeholder="Např. Eiffelova věž, Paříž"
                    className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Co máte v plánu?
                  </label>
                  <textarea
                    value={currentDay.plan}
                    onChange={(e) => handlePlanChange(e.target.value)}
                    placeholder="Napište si poznámky, aktivity, časy rezervací..."
                    rows={8}
                    className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-y"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripDetail;
