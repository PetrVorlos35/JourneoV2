import { useEffect, useRef, useState } from 'react';
import { format, isToday } from 'date-fns';
import { useTranslation } from 'react-i18next';

// Pás dnů nad stránkou zápisníku. Vybraný den je vyplněný, dnešek má
// modrou tečku. Při změně dne se pás sám dorolluje, aby vybraný den
// nezůstal schovaný za okrajem (důležité u delších výletů a na mobilu).
const DayStrip = ({ days, activeIndex, dimmed = false, onSelect, dateLocale }) => {
  const { t } = useTranslation();
  const itemRefs = useRef([]);
  const scrollerRef = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  // Okraj se rozpouští jen na straně, kde pás opravdu pokračuje.
  const measure = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  };
  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [days.length]);

  useEffect(() => {
    const el = itemRefs.current[activeIndex];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeIndex]);

  return (
    <div
      role="tablist"
      aria-label={t('tripDetail.notebook.program')}
      ref={scrollerRef}
      onScroll={measure}
      style={{
        maskImage: `linear-gradient(to right, ${edges.left ? 'transparent 0, #000 1.5rem' : '#000 0'}, ${edges.right ? '#000 calc(100% - 1.5rem), transparent 100%' : '#000 100%'})`,
      }}
      className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-1 sm:px-1 py-1"
    >
      {days.map((day, index) => {
        const date = new Date(day.date);
        const selected = index === activeIndex;
        const today = isToday(date);
        return (
          <button
            key={index}
            ref={(el) => { itemRefs.current[index] = el; }}
            role="tab"
            aria-selected={selected && !dimmed}
            onClick={() => onSelect(index)}
            className={`group relative flex-1 min-w-[92px] sm:min-w-[104px] max-w-[160px] shrink-0 text-left rounded-2xl px-3.5 pt-2.5 pb-3 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
              selected
                ? dimmed
                  ? 'bg-gray-200/70 dark:bg-white/10 text-primary'
                  : 'bg-accent text-white shadow-[0_6px_16px_-8px_rgba(37,99,235,0.7)]'
                : 'bg-white dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/10 text-primary hover:border-gray-300 dark:hover:border-white/20'
            }`}
          >
            <span className="flex items-center gap-1.5 text-[12px] font-medium">
              <span className={selected && !dimmed ? 'text-blue-100' : 'text-muted'}>
                {format(date, 'EEEEEE', { locale: dateLocale })}
              </span>
              {today && (
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${selected && !dimmed ? 'text-white' : 'text-accent'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${selected && !dimmed ? 'bg-white' : 'bg-blue-600 dark:bg-blue-400'}`} aria-hidden="true" />
                  {t('tripDetail.notebook.today')}
                </span>
              )}
            </span>
            <span className="block text-[26px] font-bold tracking-tight leading-none mt-1 tabular-nums">
              {format(date, 'd.')}
            </span>
            <span className={`block text-[12px] font-medium truncate mt-1.5 ${selected && !dimmed ? 'text-blue-100' : day.location ? 'text-muted' : 'text-gray-300 dark:text-gray-600'}`}>
              {day.location ? day.location.split(',')[0] : '—'}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default DayStrip;
