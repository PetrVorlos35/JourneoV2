import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight, ArrowLeft, Rocket } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import { cs } from 'date-fns/locale';
import { format } from 'date-fns';
import 'react-day-picker/dist/style.css';

const CreateTrip = ({ onAddTrip }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ title: '', startDate: '', endDate: '' });
  const [range, setRange] = useState({ from: undefined, to: undefined });

  const totalSteps = 3;

  const nextStep = () => {
    if (step === 1 && !formData.title) {
      toast.error('Zadejte prosím název nebo cíl cesty.');
      return;
    }
    if (step === 2 && (!formData.startDate || !formData.endDate)) {
      toast.error('Vyberte prosím datum od i do.');
      return;
    }
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      const createdTrip = await onAddTrip({
        title: formData.title,
        startDate: formData.startDate,
        endDate: formData.endDate,
      });
      toast.success('Výlet byl úspěšně vytvořen!');
      setTimeout(() => {
        navigate(`/dashboard/trip/${createdTrip.id}`);
      }, 1500);
    } catch (err) {
      // Error toast is handled in DashboardHome
    }
  };

  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Vytvořit nový výlet</h1>
        <p className="text-gray-500 dark:text-gray-400">Naplánujte si své další dobrodružství krok za krokem.</p>
      </div>

      {/* Progress Bar */}
      <div className="max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Krok {step} z {totalSteps}</span>
          <span className="text-sm font-medium text-gray-500">{Math.round((step / totalSteps) * 100)}% dokončeno</span>
        </div>
        <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </div>

      <div className="min-h-[400px] max-w-4xl flex flex-col">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Kam se chystáte?</h2>
                <p className="text-gray-500 dark:text-gray-400">Pojmenujte svůj výlet nebo zadejte cílovou destinaci.</p>
              </div>

              <div className="relative group max-w-2xl">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <MapPin size={24} />
                </div>
                <input
                  type="text"
                  autoFocus
                  placeholder="např. Snová dovolená v Římě"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                  className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-blue-500/50 dark:focus:border-blue-500/50 rounded-2xl pl-14 pr-6 py-5 text-xl font-medium text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 outline-none transition-all shadow-sm focus:shadow-blue-500/10"
                />
              </div>
              
              <div className="pt-4">
                <button
                  onClick={nextStep}
                  className="group flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 cursor-pointer"
                >
                  Pokračovat
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Kdy vyrážíte?</h2>
                <p className="text-gray-500 dark:text-gray-400">Vyberte termín vaší cesty.</p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col items-center bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 p-4 rounded-3xl shadow-sm w-fit mx-auto md:mx-0">
                  <DayPicker
                    mode="range"
                    selected={range}
                    onSelect={(newRange) => {
                      setRange(newRange);
                      if (newRange?.from) {
                        setFormData(prev => ({ ...prev, startDate: format(newRange.from, 'yyyy-MM-dd') }));
                      }
                      if (newRange?.to) {
                        setFormData(prev => ({ ...prev, endDate: format(newRange.to, 'yyyy-MM-dd') }));
                      }
                    }}
                    locale={cs}
                    numberOfMonths={window.innerWidth > 768 ? 2 : 1}
                    className="premium-calendar"
                  />
                </div>
                
                {range?.from && (
                  <div className="flex items-center gap-4 text-sm font-medium p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl w-fit">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-blue-500/60 tracking-wider">Odjezd</span>
                      <span className="text-gray-900 dark:text-white">{format(range.from, 'd. MMMM yyyy', { locale: cs })}</span>
                    </div>
                    <ArrowRight size={16} className="text-blue-500" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-blue-500/60 tracking-wider">Návrat</span>
                      <span className="text-gray-900 dark:text-white">
                        {range.to ? format(range.to, 'd. MMMM yyyy', { locale: cs }) : 'Vyberte datum...'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-4 text-gray-500 dark:text-gray-400 font-bold hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft size={20} />
                  Zpět
                </button>
                <button
                  onClick={nextStep}
                  className="group flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 cursor-pointer"
                >
                  Další krok
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Vše připraveno?</h2>
                <p className="text-gray-500 dark:text-gray-400">Zkontrolujte si údaje a můžete vyrazit.</p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 rounded-3xl p-8 space-y-6 max-w-2xl">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600/60 dark:text-blue-400/60 uppercase tracking-widest">Destinace</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formData.title}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600/60 dark:text-blue-400/60 uppercase tracking-widest">Termín</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formData.startDate && new Date(formData.startDate).toLocaleDateString('cs-CZ')} — {formData.endDate && new Date(formData.endDate).toLocaleDateString('cs-CZ')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-4 text-gray-500 dark:text-gray-400 font-bold hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft size={20} />
                  Upravit
                </button>
                <button
                  onClick={handleSubmit}
                  className="group flex items-center gap-3 px-10 py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-green-600/20 active:scale-95 cursor-pointer"
                >
                  <Rocket size={22} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                  Vytvořit výlet
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

};

export default CreateTrip;
