import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';

// Spodní lišta celé aplikace na mobilu — stejný tvar jako lišta v detailu
// výletu (přes celou šířku, prostřední akce vystouplá), ať je navigace všude
// jeden systém. Renderuje se i uvnitř celoobrazovkové mapy (MapWorkspaceView),
// kde se předává bez `onCreate`: kulaté „+“ nad mapou by každý četl jako
// „přidat místo“, takže tam zůstanou jen čtyři cíle.
const MobileTabBar = ({ items, activePath, onNavigate, onCreate }) => {
  const { t } = useTranslation();
  const slots = onCreate
    ? [items[0], items[1], 'create', ...items.slice(2)]
    : items;

  return (
    <nav
      aria-label={t('dashboardLayout.navLabel')}
      className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-white/10 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className={`max-w-xl mx-auto grid ${onCreate ? 'grid-cols-5' : 'grid-cols-4'} items-end px-2 pt-1.5`}>
        {slots.map((slot) => {
          if (slot === 'create') {
            return (
              <button
                key="create"
                type="button"
                onClick={onCreate}
                className="flex flex-col items-center gap-1 pb-1.5 cursor-pointer group"
              >
                <span className="-mt-5 w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-[0_8px_20px_-8px_rgba(37,99,235,0.7)] group-active:scale-95 transition-transform">
                  <Plus size={26} strokeWidth={2.5} aria-hidden="true" />
                </span>
                <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">{t('dashboardLayout.navShort.create')}</span>
              </button>
            );
          }
          const { icon: Icon, short, label, path } = slot;
          const active = activePath === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={(e) => onNavigate(path, e)}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 py-1.5 min-h-[52px] rounded-xl transition-colors ${
                active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-white/5'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
              <span className="text-[11px] font-semibold max-w-full truncate px-0.5">{short || label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileTabBar;
