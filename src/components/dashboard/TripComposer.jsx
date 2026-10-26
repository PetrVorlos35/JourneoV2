import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { cs, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Building2, Mountain, Waves, Car, Check, Loader2, CalendarRange, MapPin, PackageOpen, NotebookText, PenLine } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import LocationAutocomplete from '../ui/LocationAutocomplete';
import { TRIP_TYPES, QUICK_DATES, quickDateRange, buildStarterDays, buildStarterPacking } from '../../utils/onboarding';

const EASE = [0.22, 1, 0.36, 1];
const TYPE_ICONS = { city: Building2, mountains: Mountain, sea: Waves, roadtrip: Car };
const MAX_DAYS = 100;
const PREVIEW_DAYS = 5;
const PREVIEW_PACKING = 6;

const chipClass = (active) =>
  `inline-flex items-center gap-2 rounded-2xl px-4 min-h-[44px] text-[14px] font-semibold border transition-all active:scale-[0.97] cursor-pointer ${
    active
      ? 'bg-active text-active border-blue-200 dark:border-blue-400/30'
      : 'bg-page border-gray-200/80 dark:border-white/10 text-soft hover:bg-field hover:text-primary'
  }`;

const fieldClass =
  'w-full h-12 px-4 rounded-2xl bg-field border border-default text-primary text-[16px] sm:text-[15px] font-medium focus:outline-none focus:bg-page focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20 transition-colors';

/**
 * The trip as it will be created, assembled live from the answers on the
 * left: title, day chips, packing list and the map pin. Empty slots stay as
 * quiet placeholders, so the page is never blank and every answer visibly
 * "fills in" the notebook.
 */
const TripPreview = ({ title, days, packing, packingOwn, place, dateLocale }) => {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const fade = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, transition: { duration: 0.3, ease: EASE } };
  const shownDays = days.slice(0, PREVIEW_DAYS);
  const shownPacking = packing.slice(0, PREVIEW_PACKING);

  return (
    <div className="relative" aria-hidden="true">
      {/* Druhý list pod náhledem, ať to působí jako zápisník, ne karta. */}
      <div className="absolute inset-x-6 -bottom-3 top-6 rounded-[1.75rem] bg-page/70 border border-gray-200/70 dark:border-white/5 rotate-[1.5deg]" />
      <div className="relative bg-page border border-gray-200/80 dark:border-white/10 rounded-[1.75rem] shadow-[0_1px_2px_rgba(17,24,39,0.04),0_24px_48px_-24px_rgba(17,24,39,0.18)] p-6 sm:p-8">
        <p className="text-[12px] font-semibold text-muted">{t('onboarding.preview.label')}</p>
        <h2 className={`mt-1 text-[28px] font-bold tracking-tight leading-tight break-words ${title ? 'text-primary' : 'text-placeholder'}`}>
          {title || t('onboarding.preview.untitled')}
        </h2>

        {/* Dny */}
        <div className="mt-6 flex items-center gap-2 text-[13px] font-semibold text-muted">
          <NotebookText size={15} strokeWidth={2.25} /> {t('onboarding.preview.days')}
          {days.length > PREVIEW_DAYS && <span className="font-medium">· {t('onboarding.dayCount', { count: days.length })}</span>}
        </div>
        <div className="mt-2.5 flex gap-2 overflow-hidden">
          {shownDays.length > 0
            ? shownDays.map((day, i) => {
                const date = parseISO(day.date);
                return (
                  <motion.div
                    key={day.date}
                    {...fade}
                    className={`w-[84px] shrink-0 rounded-2xl px-3 pt-2 pb-2.5 border ${
                      i === 0 ? 'bg-accent border-transparent text-white shadow-[0_6px_16px_-8px_rgba(37,99,235,0.7)]' : 'bg-page border-gray-200/80 dark:border-white/10 text-primary'
                    }`}
                  >
                    <p className={`text-[12px] font-medium ${i === 0 ? 'text-white/80' : 'text-muted'}`}>{format(date, 'EEEEEE', { locale: dateLocale })}</p>
                    <p className="text-[26px] font-bold leading-none tabular-nums mt-0.5">{format(date, 'd.')}</p>
                    <p className={`text-[12px] font-medium truncate mt-1 ${i === 0 ? 'text-white/90' : 'text-muted'}`}>{day.location || day.title}</p>
                  </motion.div>
                );
              })
            : Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="w-[84px] h-[78px] shrink-0 rounded-2xl border border-dashed border-default" />
              ))}
        </div>

        {/* Balení */}
        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-muted">
            <PackageOpen size={15} strokeWidth={2.25} /> {t('onboarding.preview.packing')}
            {packing.length > 0 && <span className="font-medium tabular-nums">· {packing.length}</span>}
          </div>
          <ul className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2">
            {shownPacking.length === 0 && !packingOwn && Array.from({ length: 4 }, (_, i) => (
              <li key={`empty-${i}`} className="flex items-center gap-2.5">
                <span className="w-4 h-4 shrink-0 rounded-[5px] border-2 border-dashed border-default" />
                <span className="h-2.5 rounded-full bg-subtle" style={{ width: `${[70, 55, 62, 48][i]}%` }} />
              </li>
            ))}
            <AnimatePresence initial={false} mode="popLayout">
              {shownPacking.map((item) => (
                <motion.li key={item.text} {...fade} className="flex items-center gap-2.5 min-w-0 text-[14px] font-medium text-primary">
                  <span className="w-4 h-4 shrink-0 rounded-[5px] border-2 border-check" />
                  <span className="truncate">{item.text}</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          {packingOwn && (
            <p className="mt-2.5 flex items-center gap-2 text-[14px] font-medium text-muted">
              <PenLine size={15} strokeWidth={2.25} className="shrink-0" /> {t('onboarding.preview.packingOwn')}
            </p>
          )}
          {packing.length > PREVIEW_PACKING && (
            <p className="mt-2 text-[13px] font-medium text-muted tabular-nums">{t('onboarding.preview.more', { count: packing.length - PREVIEW_PACKING })}</p>
          )}
        </div>

        {/* Mapa */}
        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/5 flex items-center gap-3">
          <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${place ? 'bg-active text-accent' : 'bg-subtle text-placeholder'}`}>
            <MapPin size={17} strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <p className={`text-[14px] font-semibold truncate ${place ? 'text-primary' : 'text-placeholder'}`}>
              {place ? place.name : t('onboarding.preview.mapEmpty')}
            </p>
            <p className="text-[12px] font-medium text-muted truncate">
              {place ? (place.address || '').split(', ').slice(1).join(', ') : t('onboarding.preview.mapHint')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * The one way to start a trip: a full-screen question — where to? — beside a
 * live preview of the trip it will create. Dates and trip type appear once
 * there's a destination, so the screen first asks for exactly one thing.
 *
 * variant 'first' greets a new user on the empty dashboard; 'new' is the
 * /dashboard/new page behind "+ Vytvořit výlet" for everyone after that.
 *
 * `onCreate(draft, onStep)` builds the trip and reports each finished step
 * ('trip' | 'days' | 'packing' | 'map'), which the progress list ticks off.
 */
const TripComposer = ({ variant = 'first', firstName, initialDestination = '', onCreate }) => {
  const isFirst = variant === 'first';
  const navigate = useNavigate();
  const location = useLocation();
  const busyRef = useRef(false);
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
  busyRef.current = status === 'creating';

  // Stránka zakládání (/dashboard/new) se zavírá i přes Esc: zpět, odkud
  // uživatel přišel, nebo na přehled, když sem přišel přímým odkazem.
  const leave = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate('/dashboard');
  };
  const leaveRef = useRef(leave);
  leaveRef.current = leave;
  useEffect(() => {
    if (isFirst) return;
    const onKey = (e) => {
      if (e.key !== 'Escape' || busyRef.current || e.defaultPrevented) return;
      leaveRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFirst]);

  const name = destination.trim();
  const hasDestination = name.length >= 2;
  const range = dateKey === 'custom' ? custom : dateKey ? quickDateRange(dateKey) : null;
  const dayCount = range?.startDate && range?.endDate
    ? differenceInCalendarDays(parseISO(range.endDate), parseISO(range.startDate)) + 1
    : 0;
  const rangeValid = dayCount >= 1 && dayCount <= MAX_DAYS;
  const canSubmit = hasDestination && rangeValid && status !== 'creating';

  const previewDays = useMemo(
    () => (rangeValid ? buildStarterDays(t, range.startDate, range.endDate, hasDestination ? name : '') : []),
    [rangeValid, range?.startDate, range?.endDate, name, hasDestination, t],
  );
  // Bez zvoleného typu se balení nepředvyplňuje, seznam si uživatel napíše sám.
  const previewPacking = useMemo(() => (hasDestination && type ? buildStarterPacking(t, type) : []), [hasDestination, type, t]);

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
    { id: 'trip', label: t('onboarding.progress.trip') },
    { id: 'days', label: t('onboarding.progress.days', { count: dayCount }) },
    ...(type ? [{ id: 'packing', label: t('onboarding.progress.packing') }] : []),
    ...(place ? [{ id: 'map', label: t('onboarding.progress.map', { place: name }) }] : []),
  ];

  const progress = (
    <div aria-live="polite">
      <h1 className="text-[32px] sm:text-5xl font-bold tracking-tight text-primary leading-[1.1]" style={{ textWrap: 'balance' }}>
        {t('onboarding.progress.title', { place: name })}
      </h1>
      <ul className="mt-8 space-y-4">
        {steps.map((step, i) => {
          const done = doneSteps.includes(step.id);
          const active = !done && steps.slice(0, i).every((s) => doneSteps.includes(s.id));
          return (
            <li key={step.id} className={`flex items-center gap-3 text-[16px] font-medium transition-colors ${done ? 'text-primary' : active ? 'text-secondary' : 'text-muted'}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${done ? 'bg-success-wash text-success' : 'bg-subtle text-muted'}`}>
                {done
                  ? <Check size={16} strokeWidth={3} aria-hidden="true" />
                  : active
                    ? <Loader2 size={15} strokeWidth={2.5} className="animate-spin" aria-hidden="true" />
                    : <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />}
              </span>
              {step.label}
            </li>
          );
        })}
      </ul>
    </div>
  );

  const form = (
    <div>
      {!isFirst && (
        <button
          type="button"
          onClick={leave}
          className="mb-6 -ml-1 inline-flex items-center gap-2 py-2 pr-2 text-[13px] font-semibold text-muted hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} strokeWidth={2.5} aria-hidden="true" />
          {t('onboarding.back')}
          <kbd className="ml-1 text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-subtle text-secondary">Esc</kbd>
        </button>
      )}
      <p className="text-[14px] font-semibold text-muted mb-3">
        {!isFirst
          ? t('onboarding.newEyebrow')
          : firstName ? t('onboarding.greetingName', { name: firstName }) : t('onboarding.greeting')}
      </p>
      <h1 className="text-[40px] sm:text-6xl font-bold tracking-tight text-primary leading-[1.05]" style={{ textWrap: 'balance' }}>
        {t(isFirst ? 'onboarding.title' : 'onboarding.newTitle')}
      </h1>
      <p className="mt-4 text-[16px] sm:text-[17px] font-medium text-muted max-w-lg leading-relaxed" style={{ textWrap: 'pretty' }}>
        {t('onboarding.subtitle')}
      </p>

      <div className="mt-8 sm:mt-10">
        <LocationAutocomplete
          value={destination}
          onChange={handleDestination}
          placeholder={t('onboarding.destinationPlaceholder')}
          ariaLabel={t('onboarding.destinationLabel')}
          maxLength={255}
          autoFocus={!initialDestination}
          searchOnMount={!!initialDestination}
          className="w-full h-16 px-6 rounded-2xl bg-page border border-default text-primary text-[19px] font-semibold placeholder:text-placeholder placeholder:font-medium shadow-[0_1px_2px_rgba(17,24,39,0.04),0_12px_32px_-16px_rgba(17,24,39,0.12)] focus:outline-none focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/15 transition-colors"
        />
      </div>

      <AnimatePresence initial={false}>
        {hasDestination && (
          <motion.div key="details" {...reveal} className="overflow-hidden">
            <div className="pt-8 space-y-7">
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
                <legend className="text-[13px] font-semibold text-muted mb-3">{t('onboarding.typeLabel')}</legend>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setType(null)} aria-pressed={type === null} className={chipClass(type === null)}>
                    <PenLine size={16} strokeWidth={2.25} aria-hidden="true" />
                    {t('onboarding.types.own')}
                  </button>
                  {TRIP_TYPES.map((key) => {
                    const Icon = TYPE_ICONS[key];
                    return (
                      <button key={key} type="button" onClick={() => setType(key)} aria-pressed={type === key} className={chipClass(type === key)}>
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
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl px-7 min-h-[52px] bg-accent text-white text-[16px] font-semibold hover:bg-accent-hover shadow-[0_6px_16px_-8px_rgba(37,99,235,0.7)] transition-all active:scale-[0.97] cursor-pointer disabled:bg-gray-100 disabled:text-placeholder disabled:shadow-none dark:disabled:bg-white/5 disabled:cursor-not-allowed"
                >
                  {t('onboarding.submit')}
                  <ArrowRight size={18} strokeWidth={2.5} className="transition-transform group-enabled:group-hover:translate-x-0.5" aria-hidden="true" />
                </button>
                <p className="text-[13px] font-medium text-muted">
                  {status === 'error'
                    ? <span className="text-danger">{t('onboarding.error')}</span>
                    : rangeValid ? t('onboarding.changeLater') : t('onboarding.pickDates')}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className={`min-h-[calc(100dvh-8rem)] md:min-h-[calc(100dvh-5rem)] grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] xl:grid-cols-[minmax(0,1fr)_minmax(0,480px)] items-center gap-10 lg:gap-16 xl:gap-24 py-4 lg:py-8`}
    >
      <div className="max-w-xl w-full">{status === 'creating' ? progress : form}</div>
      {/* Na mobilu by náhled odsunul tlačítko pod ohyb, tak se ukáže až na širších displejích. */}
      <div className="hidden lg:block">
        <TripPreview
          title={hasDestination ? name : ''}
          days={previewDays}
          packing={previewPacking}
          packingOwn={hasDestination && !type}
          place={place}
          dateLocale={dateLocale}
        />
      </div>
    </motion.section>
  );
};

export default TripComposer;
