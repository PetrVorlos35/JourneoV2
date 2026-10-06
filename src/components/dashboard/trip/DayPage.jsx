import { useLayoutEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import LocationAutocomplete from '../../ui/LocationAutocomplete';
import CharCount from '../../ui/CharCount';

// Počítadlo znaků jen když se blížíme limitu — „0 / 2000" pod každým polem
// je šum, který nic neříká.
const NearLimit = ({ value, max }) => ((value ?? '').length >= max * 0.8 ? <CharCount value={value} max={max} /> : null);

// Textarea, která roste s obsahem — stránka dne se posouvá jako celek,
// místo aby měla vlastní malé okno se scrollbarem.
const GrowingTextarea = ({ value, onChange, ...props }) => {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return <textarea ref={ref} value={value} onChange={onChange} {...props} />;
};

const DayNavButton = ({ day, index, direction, onClick, dateLocale, label }) => {
  if (!day) return <span />;
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={() => onClick(index)}
      className={`group flex items-center gap-3 min-w-0 max-w-[48%] rounded-2xl px-3 py-2.5 -mx-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${direction === 'next' ? 'flex-row-reverse text-right' : ''}`}
    >
      <Icon size={18} strokeWidth={2.5} className="shrink-0 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
      <span className="min-w-0">
        <span className="sr-only">{label}: </span>
        <span className="block text-[12px] font-medium text-gray-500 dark:text-gray-400">
          {format(new Date(day.date), 'EEEEEE d. M.', { locale: dateLocale })}
        </span>
        <span className="block text-[14px] font-semibold text-gray-900 dark:text-white truncate">{day.title}</span>
      </span>
    </button>
  );
};

const DayPage = ({ day, index, days, isViewer, onChange, onNavigate, dateLocale }) => {
  const { t } = useTranslation();
  const total = days.length;
  const n = index + 1;
  const date = new Date(day.date);

  return (
    <div className="flex-1 flex flex-col">
      <header className="px-5 sm:px-10 pt-6 sm:pt-9">
        {isViewer ? (
          <h2 className="text-[28px] sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight" style={{ textWrap: 'balance' }}>
            {day.title || t('tripDetail.notebook.dayTitlePlaceholder', { n })}
          </h2>
        ) : (
          <>
            <input
              value={day.title}
              maxLength={255}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder={t('tripDetail.notebook.dayTitlePlaceholder', { n })}
              aria-label={t('tripDetail.notebook.dayTitleAria')}
              className="w-full -mx-2 px-2 py-1 rounded-xl bg-transparent text-[28px] sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 hover:bg-gray-50 dark:hover:bg-white/5 focus:bg-gray-50 dark:focus:bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/25 transition-colors"
            />
            <div className="flex justify-end"><NearLimit value={day.title} max={255} /></div>
          </>
        )}

        <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2">
          <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 shrink-0">
            {t('tripDetail.notebook.dayOf', { n, total })}
            <span className="mx-2 text-gray-300 dark:text-gray-600" aria-hidden="true">·</span>
            {format(date, 'EEEE d. MMMM', { locale: dateLocale })}
          </p>

          <div className="relative flex-1 min-w-0 sm:max-w-sm">
            <MapPin size={16} strokeWidth={2.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 pointer-events-none z-10" aria-hidden="true" />
            {isViewer ? (
              <p className="pl-9 py-2 text-[15px] font-semibold text-gray-900 dark:text-white truncate">
                {day.location || <span className="text-gray-400 font-medium">{t('tripDetail.itinerary.noLocation')}</span>}
              </p>
            ) : (
              <div>
                <LocationAutocomplete
                  value={day.location}
                  onChange={(value) => onChange({ location: value })}
                  placeholder={t('tripDetail.itinerary.locationPlaceholder')}
                  maxLength={255}
                  className="w-full !pl-9 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 focus:bg-white dark:focus:bg-white/10 focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-[15px] font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 placeholder:font-medium transition-colors"
                />
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 px-5 sm:px-10 pt-5 sm:pt-7 pb-4">
        {isViewer ? (
          <div className="ruled-paper min-h-[16rem] text-[16px] text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {day.plan || <span className="text-gray-400 dark:text-gray-500">{t('tripDetail.itinerary.planPlaceholder')}</span>}
          </div>
        ) : (
          <>
            <GrowingTextarea
              value={day.plan}
              maxLength={2000}
              onChange={(e) => onChange({ plan: e.target.value })}
              placeholder={t('tripDetail.itinerary.planPlaceholder')}
              aria-label={t('tripDetail.notebook.planAria')}
              rows={8}
              className="ruled-paper block w-full min-h-[12rem] sm:min-h-[13rem] resize-none bg-transparent border-0 p-0 text-[16px] text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none caret-blue-600"
            />
            <div className="flex justify-end mt-1"><NearLimit value={day.plan} max={2000} /></div>
          </>
        )}
      </div>

      <footer className="flex items-center justify-between gap-4 px-5 sm:px-10 py-4 border-t border-gray-100 dark:border-white/10">
        <DayNavButton day={days[index - 1]} index={index - 1} direction="prev" onClick={onNavigate} dateLocale={dateLocale} label={t('tripDetail.notebook.prevDay')} />
        <DayNavButton day={days[index + 1]} index={index + 1} direction="next" onClick={onNavigate} dateLocale={dateLocale} label={t('tripDetail.notebook.nextDay')} />
      </footer>
    </div>
  );
};

export default DayPage;
