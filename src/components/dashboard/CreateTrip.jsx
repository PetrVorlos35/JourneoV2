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
    <div className="w-full space-y-12 pb-10">
      <div className="space-y-2">
        <p className="text-[12px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">Plánování</p>
        <h1 className="text-4xl text-gray-900 dark:text-white tracking-tight font-bold">Vytvořit nový výlet</h1>
      </div>

      {/* Progress Bar */}
      <div className="max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[12px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Krok {step} z {totalSteps}</span>
          <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{Math.round((step / totalSteps) * 100)}% hotovo</span>
        </div>
        <div className="h-[4px] w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            className="h-full bg-blue-600 dark:bg-blue-500 rounded-full"
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </div>

      <div className="min-h-[400px] max-w-3xl flex flex-col">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-12"
            >
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Kam se chystáte?</h2>
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Pojmenujte svůj výlet nebo zadejte cílovou destinaci.</p>
              </div>

              <div className="relative group max-w-2xl">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <MapPin size={24} strokeWidth={2} />
                </div>
                <input
                  type="text"
                  autoFocus
                  placeholder="např. Snová dovolená v Římě"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                  className="glass-input !pl-14 text-2xl py-6"
                />
              </div>
              
              <div className="pt-8">
                <button
                  onClick={nextStep}
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-colors duration-300 shadow-md shadow-blue-500/20 active:scale-95"
                >
                  Pokračovat
                  <ArrowRight size={18} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
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
              className="space-y-12"
            >
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Kdy vyrážíte?</h2>
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Vyberte termín vaší cesty.</p>
              </div>

              <div className="space-y-8">
                <div className="inline-block glass-card p-6 rounded-[2rem]">
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
                  <div className="flex items-center gap-6 p-6 border-l-4 border-blue-500 glass-card max-w-fit rounded-r-[1rem] rounded-l-none">
                    <div className="flex flex-col">
                      <span className="text-[11px] uppercase text-gray-500 dark:text-gray-400 tracking-widest font-bold mb-1">Odjezd</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{format(range.from, 'd. MMMM yyyy', { locale: cs })}</span>
                    </div>
                    <ArrowRight size={20} strokeWidth={2} className="text-gray-400 mx-2" />
                    <div className="flex flex-col">
                      <span className="text-[11px] uppercase text-gray-500 dark:text-gray-400 tracking-widest font-bold mb-1">Návrat</span>
                      <span className={`text-lg font-bold ${range.to ? 'text-gray-900 dark:text-white' : 'text-gray-400 italic'}`}>
                        {range.to ? format(range.to, 'd. MMMM yyyy', { locale: cs }) : 'Vyberte datum'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center gap-6">
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-4 text-[13px] text-gray-500 hover:text-gray-900 dark:hover:text-white uppercase tracking-widest font-bold transition-colors"
                >
                  <ArrowLeft size={16} strokeWidth={2.5} />
                  Zpět
                </button>
                <button
                  onClick={nextStep}
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-colors duration-300 shadow-md shadow-blue-500/20 active:scale-95"
                >
                  Další krok
                  <ArrowRight size={18} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
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
              className="space-y-12"
            >
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Vše připraveno?</h2>
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Zkontrolujte si údaje a můžete vyrazit.</p>
              </div>

              <div className="glass-card rounded-[2rem] p-10 space-y-8 max-w-2xl">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                    <MapPin size={24} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-2">Destinace</p>
                    <p className="font-bold text-3xl tracking-tight text-gray-900 dark:text-white leading-tight">{formData.title}</p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                    <Calendar size={24} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-2">Termín</p>
                    <p className="font-bold text-2xl tracking-tight text-gray-900 dark:text-white leading-tight">
                      {formData.startDate && new Date(formData.startDate).toLocaleDateString('cs-CZ')} — {formData.endDate && new Date(formData.endDate).toLocaleDateString('cs-CZ')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-6">
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-4 text-[13px] text-gray-500 hover:text-gray-900 dark:hover:text-white uppercase tracking-widest font-bold transition-colors"
                >
                  <ArrowLeft size={16} strokeWidth={2.5} />
                  Upravit
                </button>
                <button
                  onClick={handleSubmit}
                  className="group inline-flex items-center gap-3 px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-colors duration-300 shadow-md shadow-blue-500/20 active:scale-95"
                >
                  <Rocket size={18} strokeWidth={2.5} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
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
