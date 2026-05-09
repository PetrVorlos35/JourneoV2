import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Calendar, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateTrip = ({ onAddTrip }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', startDate: '', endDate: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.startDate || !formData.endDate) return;

    const newTrip = {
      id: Date.now().toString(),
      title: formData.title,
      startDate: formData.startDate,
      endDate: formData.endDate,
      activities: []
    };

    onAddTrip(newTrip);
    toast.success('Výlet byl úspěšně vytvořen!');
    navigate(`/dashboard/trip/${newTrip.id}`);
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Založit nový výlet</h1>
        <p className="text-gray-500 dark:text-gray-400">Vyplňte základní informace o vaší nadcházející cestě.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-8 rounded-2xl space-y-6">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <MapPin size={16} /> Název výletu
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="např. Víkend v Paříži"
            className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar size={16} /> Datum od
            </label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar size={16} /> Datum do
            </label>
            <input
              type="date"
              required
              min={formData.startDate}
              value={formData.endDate}
              onChange={e => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end gap-4 border-t border-gray-200 dark:border-white/10">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 rounded-xl font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Zrušit
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors"
          >
            <Plane size={18} />
            Vytvořit výlet
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTrip;
