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
    <div className="w-full space-y-12">
      <div className="space-y-2">
        <p className="text-[11px] text-journeo-text-subtle uppercase tracking-widest font-medium">Plánování</p>
        <h1 className="font-serif text-4xl text-journeo-text tracking-tight">Vytvořit nový výlet</h1>
      </div>

      {/* Progress Bar */}
      <div className="max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[11px] font-medium text-journeo-accent uppercase tracking-widest">Krok {step} z {totalSteps}</span>
          <span className="text-[11px] font-medium text-journeo-text-subtle uppercase tracking-widest">{Math.round((step / totalSteps) * 100)}% hotovo</span>
        </div>
        <div className="h-[2px] w-full bg-journeo-border-strong overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            className="h-full bg-journeo-accent"
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
                <h2 className="font-serif text-3xl text-journeo-text">Kam se chystáte?</h2>
                <p className="text-journeo-text-muted text-lg font-light">Pojmenujte svůj výlet nebo zadejte cílovou destinaci.</p>
              </div>

              <div className="relative group max-w-2xl">
                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none text-journeo-text-subtle group-focus-within:text-journeo-accent transition-colors">
                  <MapPin size={24} strokeWidth={1.5} />
                </div>
                <input
                  type="text"
                  autoFocus
                  placeholder="např. Snová dovolená v Římě"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                  className="w-full bg-transparent border-b border-journeo-border-strong focus:border-journeo-accent pl-12 pr-6 py-4 text-2xl font-serif text-journeo-text placeholder-journeo-text-subtle/30 outline-none transition-all duration-300"
                />
              </div>
              
              <div className="pt-8">
                <button
                  onClick={nextStep}
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-journeo-accent hover:bg-journeo-accent-hover text-journeo-dark rounded-sm font-medium transition-colors duration-300"
                >
                  Pokračovat
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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
                <h2 className="font-serif text-3xl text-journeo-text">Kdy vyrážíte?</h2>
                <p className="text-journeo-text-muted text-lg font-light">Vyberte termín vaší cesty.</p>
              </div>

              <div className="space-y-8">
                <div className="inline-block bg-journeo-surface border border-journeo-border p-6 rounded-sm shadow-xl">
                  {/* Custom CSS classes for DayPicker are in index.css */}
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
                  <div className="flex items-center gap-6 p-6 border-l-2 border-journeo-accent bg-journeo-surface max-w-fit">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-journeo-text-subtle tracking-widest font-medium mb-1">Odjezd</span>
                      <span className="text-lg font-serif text-journeo-text">{format(range.from, 'd. MMMM yyyy', { locale: cs })}</span>
                    </div>
                    <ArrowRight size={20} className="text-journeo-text-subtle mx-2" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-journeo-text-subtle tracking-widest font-medium mb-1">Návrat</span>
                      <span className={`text-lg font-serif ${range.to ? 'text-journeo-text' : 'text-journeo-text-muted italic'}`}>
                        {range.to ? format(range.to, 'd. MMMM yyyy', { locale: cs }) : 'Vyberte datum'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center gap-6">
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-4 text-[13px] text-journeo-text-subtle hover:text-journeo-text uppercase tracking-widest font-medium transition-colors"
                >
                  <ArrowLeft size={16} />
                  Zpět
                </button>
                <button
                  onClick={nextStep}
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-journeo-accent hover:bg-journeo-accent-hover text-journeo-dark rounded-sm font-medium transition-colors duration-300"
                >
                  Další krok
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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
                <h2 className="font-serif text-3xl text-journeo-text">Vše připraveno?</h2>
                <p className="text-journeo-text-muted text-lg font-light">Zkontrolujte si údaje a můžete vyrazit.</p>
              </div>

              <div className="border border-journeo-border bg-journeo-surface rounded-sm p-10 space-y-8 max-w-2xl">
                <div className="flex items-start gap-6">
                  <div className="text-journeo-accent mt-1">
                    <MapPin size={28} strokeWidth={1.2} />
                  </div>
                  <div>
                    <p className="text-[11px] text-journeo-text-subtle uppercase tracking-widest font-medium mb-2">Destinace</p>
                    <p className="font-serif text-3xl text-journeo-text leading-tight">{formData.title}</p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="text-journeo-accent mt-1">
                    <Calendar size={28} strokeWidth={1.2} />
                  </div>
                  <div>
                    <p className="text-[11px] text-journeo-text-subtle uppercase tracking-widest font-medium mb-2">Termín</p>
                    <p className="font-serif text-3xl text-journeo-text leading-tight">
                      {formData.startDate && new Date(formData.startDate).toLocaleDateString('cs-CZ')} — {formData.endDate && new Date(formData.endDate).toLocaleDateString('cs-CZ')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-6">
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-4 text-[13px] text-journeo-text-subtle hover:text-journeo-text uppercase tracking-widest font-medium transition-colors"
                >
                  <ArrowLeft size={16} />
                  Upravit
                </button>
                <button
                  onClick={handleSubmit}
                  className="group inline-flex items-center gap-3 px-10 py-4 bg-journeo-accent hover:bg-journeo-accent-hover text-journeo-dark rounded-sm font-medium transition-colors duration-300"
                >
                  <Rocket size={18} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
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
