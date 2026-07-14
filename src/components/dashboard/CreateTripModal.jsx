import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight, ArrowLeft, Rocket, Check, Loader2, X, AlertCircle } from 'lucide-react';
import CharCount from '../ui/CharCount';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { DayPicker } from 'react-day-picker';
import { cs } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { format } from 'date-fns';
import 'react-day-picker/dist/style.css';

const CreateTripModal = ({ isOpen, onClose, onAddTrip }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ title: '', startDate: '', endDate: '' });
  const [range, setRange] = useState({ from: undefined, to: undefined });
  const [isLoading, setIsLoading] = useState(false);
  const [dateError, setDateError] = useState(false);
  const [durationError, setDurationError] = useState(false);
  const [nameError, setNameError] = useState(false);

  const MIN_DATE = new Date('2024-01-01');
  const MAX_DATE = new Date('2030-12-31');

  const dateLocale = i18n.language?.startsWith('en') ? enUS : cs;

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setFormData({ title: '', startDate: '', endDate: '' });
      setRange({ from: undefined, to: undefined });
      setIsLoading(false);
      setDateError(false);
      setDurationError(false);
      setNameError(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!formData.startDate && !formData.endDate) return;
    let valid = true;
    const newFrom = formData.startDate ? new Date(formData.startDate) : undefined;
    const newTo = formData.endDate ? new Date(formData.endDate) : undefined;
    if (formData.startDate && (!newFrom || isNaN(newFrom.getTime()))) valid = false;
    if (formData.endDate && (!newTo || isNaN(newTo.getTime()))) valid = false;
    if (newFrom && newTo && newTo < newFrom) valid = false;
    setDateError(!valid);
    if (valid) {
      setRange({ from: newFrom, to: newTo });
    }
  }, [formData.startDate, formData.endDate]);

  const totalSteps = 3;

  const nextStep = () => {
    if (step === 1 && !formData.title.trim()) {
      setNameError(true);
      return;
    }
    if (step === 2) {
      if (!formData.startDate || !formData.endDate) {
        setDateError(true);
        return;
      }
      const diffDays = (new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24);
      if (diffDays > 100) {
        setDurationError(true);
        return;
      }
    }
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const createdTrip = await onAddTrip({
        title: formData.title,
        startDate: formData.startDate,
        endDate: formData.endDate,
      });
      onClose();
      navigate(`/dashboard/trip/${createdTrip.id}`);
    } catch (err) {
      // Error toast is handled in DashboardHome
    } finally {
      setIsLoading(false);
    }
  };

  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  const steps = [
    { id: 1, label: t('createTripModal.steps.destination') },
    { id: 2, label: t('createTripModal.steps.dates') },
    { id: 3, label: t('createTripModal.steps.details') },
  ];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
          />
          <motion.div
            layout
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{
              y: { type: "spring", damping: 25, stiffness: 200 },
              layout: { type: "spring", damping: 25, stiffness: 200 }
            }}
            className="relative w-full max-w-2xl bg-[#fbfbfd] dark:bg-[#1C1C1E] rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl flex flex-col h-auto max-h-[85dvh] sm:max-h-[90dvh] overflow-hidden z-10"
          >
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
              <button onClick={onClose} aria-label={t('common.close')} className="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer disabled:cursor-not-allowed">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="w-full flex justify-center sm:hidden pt-4 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-white/20 rounded-full" />
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-5 sm:p-8 pt-2 sm:pt-4 flex flex-col">
              <div className="w-full flex flex-col flex-1 space-y-4 sm:space-y-5">
                <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-0 pr-12 sm:pr-0">
                  <p className="text-[10px] sm:text-[12px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">{t('createTripModal.planning')}</p>
                  <h1 className="text-2xl sm:text-3xl text-gray-900 dark:text-white tracking-tight font-bold">{t('createTripModal.title')}</h1>
                </div>

                {/* Animated Stepper */}
                <div className="w-full flex items-center justify-between mb-6 sm:mb-10 pt-1 pb-1 sm:pb-2">
                  {steps.map((s, i) => {
                    const isCompleted = step > s.id;
                    const isActive = step === s.id;

                    return (
                      <div key={s.id} className="flex items-center flex-1 last:flex-none">
                        <div className="relative flex flex-col items-center">
                          <motion.div
                            initial={false}
                            animate={{ borderColor: isActive ? 'rgba(37, 99, 235, 0.3)' : 'transparent' }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 border-4 transition-colors duration-300 ${
                              isCompleted || isActive
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600'
                            }`}
                          >
                            <AnimatePresence mode="wait">
                              {isCompleted ? (
                                <motion.div key="check" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                                  <Check size={18} strokeWidth={3} />
                                </motion.div>
                              ) : (
                                <motion.span key="number" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                  {s.id}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </motion.div>
                          <div className="absolute top-12 w-max text-center">
                            <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                              isActive ? 'text-blue-600 dark:text-blue-400' : isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'
                            }`}>
                              {s.label}
                            </span>
                          </div>
                        </div>
                        {i < steps.length - 1 && (
                          <div className="flex-1 h-[2px] mx-2 sm:mx-4 bg-gray-200 dark:bg-white/10 relative overflow-hidden rounded-full mt-[-20px] sm:mt-0">
                            <motion.div className="absolute top-0 left-0 h-full bg-blue-600 dark:bg-blue-500 rounded-full" initial={{ width: "0%" }} animate={{ width: isCompleted ? "100%" : "0%" }} transition={{ duration: 0.5, ease: "easeInOut" }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <motion.div layout className="w-full grid mb-2 sm:mb-4 relative items-start">
                  <AnimatePresence initial={false}>
                    {step === 1 && (
                      <motion.div key="step1" variants={variants} initial="initial" animate="animate" exit="exit" className="space-y-6 w-full" style={{ gridArea: '1 / 1 / 2 / 2' }}>
                        <div className="space-y-2 sm:space-y-3">
                          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{t('createTripModal.step1.title')}</h2>
                          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">{t('createTripModal.step1.subtitle')}</p>
                        </div>
                        <div className="relative group w-full">
                          <div className={`absolute inset-y-0 left-4 sm:left-5 flex items-center pointer-events-none transition-colors ${nameError ? 'text-red-500' : 'text-gray-400 group-focus-within:text-blue-500'}`}>
                            <MapPin strokeWidth={2} className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <input
                            type="text"
                            autoFocus
                            maxLength={255}
                            aria-label={t('createTripModal.step3.destinationLabel')}
                            placeholder={t('createTripModal.step1.placeholder')}
                            value={formData.title}
                            onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setNameError(false); }}
                            onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                            className={`glass-input !pl-12 sm:!pl-14 text-lg sm:text-2xl py-4 sm:py-6 transition-colors ${nameError ? '!ring-2 !ring-red-500/60 !border-red-500/40' : ''}`}
                          />
                        </div>
                        <div className="flex justify-end pr-1 -mt-1">
                          <CharCount value={formData.title} max={255} />
                        </div>
                        {nameError ? (
                          <p className="flex items-center gap-1.5 text-red-500 text-[12px] font-semibold mt-2">
                            <AlertCircle size={13} strokeWidth={2.5} />
                            {t('createTripModal.errors.nameRequired')}
                          </p>
                        ) : (
                          <p className="text-gray-400 dark:text-gray-500 text-[12px] font-medium mt-2">
                            {t('createTripModal.step1.hint')}
                          </p>
                        )}
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div key="step2" variants={variants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-4 sm:gap-6 w-full" style={{ gridArea: '1 / 1 / 2 / 2' }}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                          <div className="space-y-1 sm:space-y-2">
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{t('createTripModal.step2.title')}</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg font-medium">{t('createTripModal.step2.subtitle')}</p>
                          </div>
                          <div className={`flex flex-row items-center justify-between sm:justify-center gap-4 px-5 py-3 sm:px-6 sm:py-4 bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-2xl w-full sm:w-fit max-w-full shrink-0 border-2 transition-colors ${range?.from ? 'border-blue-500/60 dark:border-blue-500/40' : 'border-white/50 dark:border-white/10'}`}>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] sm:text-[11px] uppercase text-gray-500 dark:text-gray-400 tracking-widest font-bold mb-1">{t('createTripModal.step2.departure')}</span>
                              <span className={`text-base sm:text-lg font-bold truncate ${range?.from ? 'text-gray-900 dark:text-white' : 'text-gray-400 italic'}`}>
                                {range?.from ? format(range.from, 'd. M. yyyy', { locale: dateLocale }) : t('createTripModal.step2.select')}
                              </span>
                            </div>
                            <ArrowRight size={16} strokeWidth={2} className="text-gray-400 shrink-0 mx-1 sm:mx-2" />
                            <div className="flex flex-col min-w-0 text-right sm:text-left">
                              <span className="text-[10px] sm:text-[11px] uppercase text-gray-500 dark:text-gray-400 tracking-widest font-bold mb-1">{t('createTripModal.step2.return')}</span>
                              <span className={`text-base sm:text-lg font-bold truncate ${range?.to ? 'text-gray-900 dark:text-white' : 'text-gray-400 italic'}`}>
                                {range?.to ? format(range.to, 'd. M. yyyy', { locale: dateLocale }) : t('createTripModal.step2.select')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-center w-full gap-2">
                          <div className="inline-block glass-card p-2 sm:p-4 rounded-2xl sm:rounded-[2rem] w-fit max-w-full flex justify-center overflow-hidden">
                            <DayPicker mode="range" selected={range} onSelect={(newRange) => {
                                setRange(newRange);
                                setDateError(false);
                                setDurationError(false);
                                if (newRange?.from) setFormData(prev => ({ ...prev, startDate: format(newRange.from, 'yyyy-MM-dd') }));
                                if (newRange?.to) setFormData(prev => ({ ...prev, endDate: format(newRange.to, 'yyyy-MM-dd') }));
                              }}
                              fromDate={MIN_DATE} toDate={MAX_DATE}
                              locale={dateLocale} numberOfMonths={1} className="premium-calendar max-sm:[--rdp-day-width:36px]! max-sm:[--rdp-day-height:36px]! max-sm:[--rdp-day\_button-width:36px]! max-sm:[--rdp-day\_button-height:36px]!"
                            />
                          </div>
                          {dateError && (
                            <p className="flex items-center gap-1.5 text-red-500 text-[12px] font-semibold">
                              <AlertCircle size={13} strokeWidth={2.5} />
                              {t('createTripModal.errors.datesRequired')}
                            </p>
                          )}
                          {durationError && (
                            <p className="flex items-center gap-1.5 text-red-500 text-[12px] font-semibold">
                              <AlertCircle size={13} strokeWidth={2.5} />
                              {t('createTripModal.errors.durationExceeded')}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div key="step3" variants={variants} initial="initial" animate="animate" exit="exit" className="space-y-6 w-full" style={{ gridArea: '1 / 1 / 2 / 2' }}>
                        <div className="space-y-2 sm:space-y-3">
                          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{t('createTripModal.step3.title')}</h2>
                          <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg font-medium">{t('createTripModal.step3.subtitle')}</p>
                        </div>
                        <div className="glass-card rounded-[2rem] p-5 sm:p-8 space-y-6 w-full max-w-xl">
                          <div className="flex items-start gap-4 sm:gap-6">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                              <MapPin size={20} strokeWidth={2} className="sm:w-6 sm:h-6" />
                            </div>
                            <div className="w-full">
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-1 ml-2">{t('createTripModal.step3.destinationLabel')}</p>
                              <input type="text" maxLength={255} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="font-bold text-xl sm:text-3xl tracking-tight text-gray-900 dark:text-white leading-tight bg-transparent hover:bg-black/5 dark:hover:bg-white/5 focus:bg-black/5 dark:focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-black/10 dark:focus:ring-white/20 rounded-lg px-2 py-1 w-full transition-all -ml-2" />
                              <div className="flex justify-end mt-1 pr-1">
                                <CharCount value={formData.title} max={255} />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-4 sm:gap-6">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                              <Calendar size={20} strokeWidth={2} className="sm:w-6 sm:h-6" />
                            </div>
                            <div className="w-full">
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-1 ml-2">{t('createTripModal.step3.datesLabel')}</p>
                              <div className={`flex items-center flex-wrap gap-1 sm:gap-2 font-bold text-lg sm:text-2xl tracking-tight leading-tight ${dateError ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                <input type="date" value={formData.startDate} min="2024-01-01" max="2030-12-31" onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className={`bg-transparent hover:bg-black/5 dark:hover:bg-white/5 focus:bg-black/5 dark:focus:bg-white/10 focus:outline-none focus:ring-1 rounded-lg px-2 py-1 transition-all -ml-2 cursor-pointer ${dateError ? 'focus:ring-red-500 ring-1 ring-red-500/50' : 'focus:ring-black/10 dark:focus:ring-white/20'}`} />
                                <span className="text-gray-300 dark:text-white/20">—</span>
                                <input type="date" value={formData.endDate} min="2024-01-01" max="2030-12-31" onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className={`bg-transparent hover:bg-black/5 dark:hover:bg-white/5 focus:bg-black/5 dark:focus:bg-white/10 focus:outline-none focus:ring-1 rounded-lg px-2 py-1 transition-all cursor-pointer ${dateError ? 'focus:ring-red-500 ring-1 ring-red-500/50' : 'focus:ring-black/10 dark:focus:ring-white/20'}`} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>

            <div className="flex justify-between items-center p-6 sm:p-8 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6 border-t border-gray-100 dark:border-white/5 bg-[#fbfbfd] dark:bg-[#1C1C1E] w-full shrink-0 z-10">
              {step > 1 ? (
                <button onClick={prevStep} aria-label={step === 3 ? t('createTripModal.nav.edit') : t('createTripModal.nav.back')} className="flex items-center gap-2 px-4 sm:px-6 py-3.5 sm:py-4 text-[11px] sm:text-[13px] text-gray-500 hover:text-gray-900 dark:hover:text-white uppercase tracking-widest font-bold transition-colors bg-white/40 dark:bg-white/5 rounded-2xl cursor-pointer disabled:cursor-not-allowed">
                  <ArrowLeft size={16} strokeWidth={2.5} />
                  <span className="hidden sm:inline">{step === 3 ? t('createTripModal.nav.edit') : t('createTripModal.nav.back')}</span>
                </button>
              ) : (
                <div />
              )}
              <button onClick={step === 3 ? handleSubmit : nextStep} disabled={isLoading} className="group inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-colors duration-300 shadow-md shadow-blue-500/20 active:scale-95 text-sm sm:text-base disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer">
                {step === 3 ? (
                  isLoading ? <><Loader2 size={18} strokeWidth={2.5} className="animate-spin" />{t('createTripModal.nav.creating')}</> : <><Rocket size={18} strokeWidth={2.5} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />{t('createTripModal.nav.create')}</>
                ) : (
                  <>{step === 1 ? t('createTripModal.nav.continue') : t('createTripModal.nav.nextStep')}<ArrowRight size={18} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </div>
          </motion.div>
      </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default CreateTripModal;
