import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Desktopový protějšek `BottomSheet` — plovoucí karta ukotvená vlevo nad mapou.
 * Drží stejný obsah (hlavička + scrollovatelné tělo), jen místo tažení a snap
 * poloh nabízí sbalení/rozbalení, aby šla vidět celá mapa.
 *
 * Props:
 *  - collapsed    true = zobrazí se jen úzké tlačítko pro rozbalení
 *  - onToggle     přepnutí sbaleno/rozbaleno
 *  - canCollapse  false = chevron pro sbalení se skryje (režim umisťování)
 *  - width        šířka rozbaleného panelu v px
 *  - header       obsah hlavičky (nescrolluje)
 *  - children     obsah těla (scrolluje, pokud bodyScroll)
 *  - bodyScroll   false = scrollování si řídí obsah sám (formulář místa)
 */
const SidePanel = ({
  collapsed = false,
  onToggle,
  canCollapse = true,
  width = 360,
  header,
  children,
  bodyScroll = true,
  ariaLabel,
}) => {
  const { t } = useTranslation();

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-label={t('map.panel.expand')}
        title={t('map.panel.expand')}
        className="absolute top-4 left-4 z-[20] w-11 h-11 rounded-2xl glass-card border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
      >
        <PanelLeftOpen size={18} strokeWidth={2.5} aria-hidden="true" />
      </button>
    );
  }

  return (
    <section
      role="region"
      aria-label={ariaLabel}
      style={{ width }}
      className="absolute top-4 left-4 bottom-4 z-[20] flex flex-col glass-card rounded-3xl border border-gray-200 dark:border-white/10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.35)] overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200"
    >
      {canCollapse && (
        <div className="shrink-0 flex justify-end px-2 pt-2">
          <button
            type="button"
            onClick={onToggle}
            aria-label={t('map.panel.collapse')}
            title={t('map.panel.collapse')}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <PanelLeftClose size={16} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      )}

      {header && <div className="shrink-0">{header}</div>}

      <div
        className={`flex-1 min-h-0 px-4 ${
          bodyScroll ? 'overflow-y-auto overscroll-contain custom-scrollbar pb-4' : 'overflow-hidden'
        }`}
      >
        {children}
      </div>
    </section>
  );
};

export default SidePanel;
