import { useState } from 'react';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { cs, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Building2, Mountain, Waves, Car, Check, Loader2, CalendarRange } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import LocationAutocomplete from '../../ui/LocationAutocomplete';
import { TRIP_TYPES, QUICK_DATES, quickDateRange } from '../../../utils/onboarding';

const EASE = [0.22, 1, 0.36, 1];
const TYPE_ICONS = { city: Building2, mountains: Mountain, sea: Waves, roadtrip: Car };
const MAX_DAYS = 100;

const chipClass = (active) =>
  `inline-flex items-center gap-2 rounded-2xl px-4 min-h-[44px] text-[14px] font-semibold border transition-all active:scale-[0.97] cursor-pointer ${
    active
      ? 'bg-active text-active border-blue-200 dark:border-blue-400/30'
      : 'bg-page border-gray-200/80 dark:border-white/10 text-soft hover:bg-field hover:text-primary'
  }`;

const fieldClass =
  'w-full h-12 px-4 rounded-2xl bg-field border border-default text-primary text-[16px] sm:text-[15px] font-medium focus:outline-none focus:bg-page focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20 transition-colors';

/**
 * First run: instead of an empty dashboard, one question — where to? — and
 * a ready trip a few taps later. Dates and trip type appear once there's a
 * destination, so the first screen asks for exactly one thing.
 *
 * `onCreate(draft, onStep)` builds the trip and reports each finished step
 * ('trip' | 'days' | 'packing' | 'map'), which the progress list ticks off.
 */
const FirstTripComposer = ({ firstName, initialDestination = '', onCreate }) => {
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();
  const dateLocale = i18n.language?.startsWith('en') ? enUS : cs;

  const [destination, setDestination] = useState(initialDestination);
  const [place, setPlace] = useState(null);
  const [dateKey, setDateKey] = useState(null);
  const [custom, setCustom] = useState({ startDate: '', endDate: '' });
  const [type, setType] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | creating | error
  const [doneSteps, setDoneSteps] = useState([]);

  const name = destination.trim();
  const hasDestination = name.length >= 2;
  const range = dateKey === 'custom' ? custom : dateKey ? quickDateRange(dateKey) : null;
  const dayCount = range?.startDate && range?.endDate
    ? differenceInCalendarDays(parseISO(range.endDate), parseISO(range.startDate)) + 1
    : 0;
  const rangeValid = dayCount >= 1 && dayCount <= MAX_DAYS;
  const canSubmit = hasDestination && rangeValid && status !== 'creating';

  const handleDestination = (text, selected) => {
    // Z návrhu bereme krátký název („Lisabon“), ne celou adresu.
    setDestination(selected ? selected.name : text);
    setPlace(selected);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setStatus('creating');
    setDoneSteps([]);
    try {
      await onCreate(
        { title: name, startDate: range.startDate, endDate: range.endDate, place, type },
        (step) => setDoneSteps((prev) => [...prev, step]),
      );
    } catch {
      setStatus('error');
    }
  };

  const reveal = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, height: 0 },
        animate: { opacity: 1, height: 'auto', transition: { duration: 0.35, ease: EASE } },
        exit: { opacity: 0, height: 0, transition: { duration: 0.2 } },
      };

  const steps = [
    { id: 'trip', label: t('onboarding.progress.trip', { place: name }) },
    { id: 'days', label: t('onboarding.progress.days', { count: dayCount }) },
    { id: 'packing', label: t('onboarding.progress.packing') },
    ...(place ? [{ id: 'map', label: t('onboarding.progress.map', { place: name }) }] : []),
  ];

  if (status === 'creating') {
    return (
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 sm:p-10 rounded-[2rem] min-h-[320px] flex flex-col justify-center"
        aria-live="polite"
      >
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary mb-6" style={{ textWrap: 'balance' }}>
          {t('onboarding.progress.title', { place: name })}
        </h1>
        <ul className="space-y-3.5">
          {steps.map((step, i) => {
            const done = doneSteps.includes(step.id);
            const active = !done && steps.slice(0, i).every((s) => doneSteps.includes(s.id));
            return (
              <li key={step.id} className={`flex items-center gap-3 text-[15px] font-medium transition-colors ${done ? 'text-primary' : active ? 'text-secondary' : 'text-muted'}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${done ? 'bg-success-wash text-success' : 'bg-subtle text-muted'}`}>
                  {done
                    ? <Check size={15} strokeWidth={3} aria-hidden="true" />
                    : active
                      ? <Loader2 size={14} strokeWidth={2.5} className="animate-spin" aria-hidden="true" />
                      : <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />}
                </span>
                {step.label}
              </li>
            );
          })}
        </ul>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="glass-card p-6 sm:p-10 rounded-[2rem]"
    >
      <p className="text-[13px] font-semibold text-muted mb-2">
        {firstName ? t('onboarding.greetingName', { name: firstName }) : t('onboarding.greeting')}
      </p>
      <h1 className="text-[28px] sm:text-4xl font-bold tracking-tight text-primary leading-tight" style={{ textWrap: 'balance' }}>
        {t('onboarding.title')}
      </h1>
      <p className="mt-2 text-[15px] font-medium text-muted max-w-xl" style={{ textWrap: 'pretty' }}>
        {t('onboarding.subtitle')}
      </p>

      <div className="mt-6 sm:mt-8 max-w-xl">
        <LocationAutocomplete
          value={destination}
          onChange={handleDestination}
          placeholder={t('onboarding.destinationPlaceholder')}
          ariaLabel={t('onboarding.destinationLabel')}
          maxLength={255}
          autoFocus={!initialDestination}
          searchOnMount={!!initialDestination}
          className="w-full h-14 px-5 rounded-2xl bg-field border border-default text-primary text-[18px] font-semibold placeholder:text-placeholder placeholder:font-medium focus:outline-none focus:bg-page focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20 transition-colors"
        />
      </div>

      <AnimatePresence initial={false}>
        {hasDestination && (
          <motion.div key="details" {...reveal} className="overflow-hidden">
            <div className="pt-7 space-y-7">
              <fieldset>
                <legend className="text-[13px] font-semibold text-muted mb-3">{t('onboarding.whenLabel')}</legend>
                <div className="flex flex-wrap gap-2">
                  {QUICK_DATES.map((key) => (
                    <button key={key} type="button" onClick={() => setDateKey(key)} aria-pressed={dateKey === key} className={chipClass(dateKey === key)}>
                      {t(`onboarding.dates.${key}`)}
                    </button>
                  ))}
                  <button type="button" onClick={() => setDateKey('custom')} aria-pressed={dateKey === 'custom'} className={chipClass(dateKey === 'custom')}>
                    <CalendarRange size={16} strokeWidth={2.25} aria-hidden="true" />
                    {t('onboarding.dates.custom')}
                  </button>
                </div>

                {dateKey === 'custom' && (
                  <div className="mt-3 grid grid-cols-2 gap-2 max-w-md">
                    <label className="block">
                      <span className="block text-[12px] font-medium text-muted mb-1 ml-1">{t('onboarding.dates.from')}</span>
                      <input
                        type="date"
                        value={custom.startDate}
                        min="2024-01-01"
                        onChange={(e) => setCustom((c) => ({
                          startDate: e.target.value,
                          endDate: c.endDate && c.endDate >= e.target.value ? c.endDate : e.target.value,
                        }))}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block">
                      <span className="block text-[12px] font-medium text-muted mb-1 ml-1">{t('onboarding.dates.to')}</span>
                      <input
                        type="date"
                        value={custom.endDate}
                        min={custom.startDate || '2024-01-01'}
                        onChange={(e) => setCustom((c) => ({ ...c, endDate: e.target.value }))}
                        className={fieldClass}
                      />
                    </label>
                  </div>
                )}

                {range?.startDate && range?.endDate && (
                  <p className={`mt-3 text-[13px] font-medium tabular-nums ${rangeValid ? 'text-muted' : 'text-danger'}`}>
                    {rangeValid
                      ? `${format(parseISO(range.startDate), 'EEEEEE d. M.', { locale: dateLocale })} – ${format(parseISO(range.endDate), 'EEEEEE d. M. yyyy', { locale: dateLocale })} · ${t('onboarding.dayCount', { count: dayCount })}`
                      : t('onboarding.dates.tooLong', { max: MAX_DAYS })}
                  </p>
                )}
              </fieldset>

              <fieldset>
                <legend className="text-[13px] font-semibold text-muted mb-3">
                  {t('onboarding.typeLabel')} <span className="font-medium">· {t('onboarding.optional')}</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {TRIP_TYPES.map((key) => {
                    const Icon = TYPE_ICONS[key];
                    return (
                      <button key={key} type="button" onClick={() => setType(type === key ? null : key)} aria-pressed={type === key} className={chipClass(type === key)}>
                        <Icon size={16} strokeWidth={2.25} aria-hidden="true" />
                        {t(`onboarding.types.${key}`)}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl px-6 min-h-[48px] bg-accent text-white text-[15px] font-semibold hover:bg-accent-hover shadow-[0_6px_16px_-8px_rgba(37,99,235,0.7)] transition-all active:scale-[0.97] cursor-pointer disabled:bg-gray-100 disabled:text-placeholder disabled:shadow-none dark:disabled:bg-white/5 disabled:cursor-not-allowed"
                >
                  {t('onboarding.submit')}
                  <ArrowRight size={17} strokeWidth={2.5} className="transition-transform group-enabled:group-hover:translate-x-0.5" aria-hidden="true" />
                </button>
                <p className="text-[13px] font-medium text-muted">
                  {status === 'error' ? <span className="text-danger">{t('onboarding.error')}</span> : t('onboarding.changeLater')}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

export default FirstTripComposer;
