import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

/**
 * Desktopový protějšek `BottomSheet` — plovoucí karta ukotvená vlevo nad mapou.
 * Drží stejný obsah (hlavička + scrollovatelné tělo), jen místo tažení a snap
 * poloh nabízí sbalení/rozbalení, aby šla vidět celá mapa.
 *
 * Sbalený rail a rozbalený panel se do sebe přelévají přes AnimatePresence —
 * jeden vyjede/vybledne doleva, druhý zároveň najede, ať přechod neblikne.
 *
 * Props:
 *  - collapsed    true = zobrazí se jen úzké tlačítko pro rozbalení
 *  - onToggle     přepnutí sbaleno/rozbaleno
 *  - canCollapse  false = chevron pro sbalení se skryje (režim umisťování)
 *  - width        šířka rozbaleného panelu v px
 *  - leftOffset   px přičtené k základnímu odsazení zleva (viz níže)
 *  - header       obsah hlavičky (nescrolluje)
 *  - children     obsah těla (scrolluje, pokud bodyScroll)
 *  - bodyScroll   false = scrollování si řídí obsah sám (formulář místa)
 */
const SidePanel = ({
  collapsed = false,
  onToggle,
  canCollapse = true,
  width = 360,
  // Kolik pixelů přičíst k základnímu odsazení zleva (16px). Na globální mapě
  // odsune panel za plovoucí navigační sidebar, pod který se mapa protahuje.
  leftOffset = 0,
  header,
  children,
  bodyScroll = true,
  ariaLabel,
}) => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const left = 16 + leftOffset;

  // Skrytý stav = mírně posunuté doleva + vybledlé; se zjednodušenými pohyby
  // jen průhlednost, ať přechod respektuje „reduce motion".
  const hidden = shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -14, scale: 0.98 };
  const shown = { opacity: 1, x: 0, scale: 1 };
  const transition = shouldReduceMotion
    ? { duration: 0.15 }
    : { type: 'spring', stiffness: 420, damping: 36, mass: 0.7 };

  return (
    <AnimatePresence initial={false}>
      {collapsed ? (
        <motion.button
          key="rail"
          type="button"
          onClick={onToggle}
          aria-label={t('map.panel.expand')}
          title={t('map.panel.expand')}
          style={{ left }}
          initial={hidden}
          animate={shown}
          exit={hidden}
          transition={transition}
          className="absolute top-4 z-[20] w-11 h-11 rounded-2xl glass-card border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
        >
          <PanelLeftOpen size={18} strokeWidth={2.5} aria-hidden="true" />
        </motion.button>
      ) : (
        <motion.section
          key="panel"
          role="region"
          aria-label={ariaLabel}
          style={{ width, left }}
          initial={hidden}
          animate={shown}
          exit={hidden}
          transition={transition}
          className="absolute top-4 bottom-4 z-[20] flex flex-col glass-card rounded-3xl border border-gray-200 dark:border-white/10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.35)] overflow-hidden"
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
        </motion.section>
      )}
    </AnimatePresence>
  );
};

export default SidePanel;
