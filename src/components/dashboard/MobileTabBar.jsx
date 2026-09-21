import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';

// Extracted from DashboardLayout so the same pill renders identically
// wherever it's needed — including floated on top of the fullscreen mobile
// map, which isn't part of DashboardLayout's own DOM flow.
const MobileTabBar = ({ items, activePath, onNavigate, elevated = false }) => {
  const bar = (
    <div
      // `elevated`: floats above the map's own peek-height bottom sheet
      // (150px, see BottomSheet's SNAP_HEIGHTS.peek) instead of sitting flush
      // against the safe area, so it doesn't paint over the sheet's card.
      className={`md:hidden fixed left-4 right-4 flex justify-center pointer-events-none ${
        elevated
          ? 'z-[130] bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+150px)]'
          : 'z-50 bottom-[max(1.25rem,env(safe-area-inset-bottom))]'
      }`}
    >
      <nav className="glass-panel w-full max-w-[300px] rounded-[2rem] flex justify-around items-center px-1.5 py-2 pointer-events-auto">
        {items.map(({ icon: Icon, label, path }) => (
          <Link
            key={path}
            to={path}
            onClick={(e) => onNavigate(path, e)}
            aria-current={activePath === path ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 min-h-[48px] rounded-2xl transition-all duration-300 py-1.5 ${
              activePath === path ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 active:text-gray-700 dark:active:text-gray-300'
            } cursor-pointer disabled:cursor-not-allowed`}
          >
            <Icon size={21} strokeWidth={activePath === path ? 2.5 : 2} aria-hidden="true" />
            <span className={`text-[10px] font-semibold max-w-full truncate px-0.5 transition-colors ${activePath === path ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
              {label.split(' ')[0]}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );

  // `elevated` (used above the fullscreen mobile map) must portal to <body>:
  // the map's own overlay also portals there, and CSS z-index only ranks
  // siblings within the same stacking context — nested one level inside
  // DashboardLayout's `<main>` (which has its own `relative z-10`), no
  // z-index could ever out-rank a sibling of `<main>` like the map portal.
  return elevated ? createPortal(bar, document.body) : bar;
};

export default MobileTabBar;
