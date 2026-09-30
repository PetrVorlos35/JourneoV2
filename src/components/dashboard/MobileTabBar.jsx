import { Link } from 'react-router-dom';

// Extracted from DashboardLayout so the same pill renders identically
// wherever it's needed — including inside the fullscreen mobile map's own
// portal (MapWorkspaceView), which mounts it directly as a child so it
// stacks above the map/sheet via z-index alone, no extra portal needed.
const MobileTabBar = ({ items, activePath, onNavigate }) => (
  <div className="md:hidden fixed left-4 right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-50 flex justify-center pointer-events-none">
    {/* glass-panel's own backdrop-blur is what makes content scrolling
        underneath (map, place list) legible instead of needing a reserved
        empty margin — the pill just floats over it, frosted. */}
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

export default MobileTabBar;
