import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';

const MAX_DAYS = 100;
const MIN_DATE = new Date('2024-01-01T00:00:00');

const useWideScreen = () => {
  const query = '(min-width: 768px)';
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setWide(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return wide;
};

/**
 * Změna termínu výletu: kalendář s rozsahem, pod ním shrnutí nového
 * termínu a co se stane s programem (to spočítá rodič přes `describe`).
 */
const TripDatesEditor = ({ startDate, endDate, dateLocale, onSave, onCancel, describe, anchorRef, className = '' }) => {
  const { t } = useTranslation();
  const wide = useWideScreen();
  const [range, setRange] = useState({ from: parseISO(startDate), to: parseISO(endDate) });
  // Klik začne nový termín (první den), další klik ho uzavře (poslední den),
  // takže posunout celý výlet jsou dva kliky místo rozšiřování starého.
  const [pickingEnd, setPickingEnd] = useState(false);
  const pick = (_selected, day) => {
    if (!day) return;
    if (!pickingEnd) {
      setRange({ from: day, to: undefined });
      setPickingEnd(true);
      return;
    }
    setRange(day < range.from ? { from: day, to: range.from } : { from: range.from, to: day });
    setPickingEnd(false);
  };

  // Vrstva přes stránku: Esc a klik mimo ji zavřou (klik na datum v hlavičce
  // řeší samo tlačítko, jinak by se hned znovu otevřela).
  const panelRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      onCancel();
      anchorRef?.current?.focus();
    };
    const onPointerDown = (e) => {
      if (panelRef.current?.contains(e.target) || anchorRef?.current?.contains(e.target)) return;
      onCancel();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [onCancel, anchorRef]);

  const from = range?.from || null;
  const to = range?.to || null;
  const days = from && to ? differenceInCalendarDays(to, from) + 1 : 0;
  const tooLong = days > MAX_DAYS + 1;
  const startIso = from ? format(from, 'yyyy-MM-dd') : null;
  const endIso = to ? format(to, 'yyyy-MM-dd') : null;
  const unchanged = startIso === startDate && endIso === endDate;
  const note = from && to && !unchanged && !tooLong ? describe(startIso, endIso) : null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={t('tripDetail.dates.edit')}
      className={`p-3 sm:p-5 rounded-3xl bg-page border border-default shadow-[0_24px_48px_-16px_rgba(17,24,39,0.28)] max-w-[calc(100vw-2rem)] ${className}`}
    >
      <div className="overflow-x-auto">
        <DayPicker
          mode="range"
          selected={range}
          onSelect={pick}
          defaultMonth={parseISO(startDate)}
          numberOfMonths={wide ? 2 : 1}
          disabled={{ before: MIN_DATE }}
          locale={dateLocale}
          className="premium-calendar"
        />
      </div>

      <div className="mt-3 px-1 sm:px-2 space-y-1">
        <p className={`text-[14px] font-semibold tabular-nums ${tooLong ? 'text-danger' : 'text-primary'}`}>
          {from && to
            ? tooLong
              ? t('tripDetail.dates.tooLong', { max: MAX_DAYS })
              : `${format(from, 'EEEEEE d. M.', { locale: dateLocale })} – ${format(to, 'EEEEEE d. M. yyyy', { locale: dateLocale })} · ${t('tripDetail.notebook.days', { count: days })}`
            : from
              ? t('tripDetail.dates.pickEnd', { date: format(from, 'EEEEEE d. M.', { locale: dateLocale }) })
              : t('tripDetail.dates.pick')}
        </p>
        {note && <p className={`text-[13px] font-medium ${note.warn ? 'text-danger' : 'text-muted'}`}>{note.text}</p>}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 px-4 rounded-2xl text-[14px] font-semibold text-secondary hover:bg-field transition-colors cursor-pointer"
        >
          {t('tripDetail.dates.cancel')}
        </button>
        <button
          type="button"
          disabled={!from || !to || tooLong || unchanged}
          onClick={() => onSave(startIso, endIso)}
          className="h-11 px-5 rounded-2xl bg-accent text-white text-[14px] font-semibold hover:bg-accent-hover disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-white/5 dark:disabled:text-gray-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {t('tripDetail.dates.save')}
        </button>
      </div>
    </div>
  );
};

export default TripDatesEditor;
