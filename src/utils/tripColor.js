// Deterministic colour per trip, hashed from its title — the same trip keeps
// the same colour everywhere it appears (overview, all-trips) without storing
// anything on the server.

const CARD_COLORS = [
  { bg: 'bg-blue-50 dark:bg-blue-500/10',      icon: 'text-blue-600 dark:text-blue-400'    },
  { bg: 'bg-violet-50 dark:bg-violet-500/10',  icon: 'text-violet-600 dark:text-violet-400' },
  { bg: 'bg-emerald-50 dark:bg-emerald-500/10',icon: 'text-emerald-600 dark:text-emerald-400' },
  { bg: 'bg-amber-50 dark:bg-amber-500/10',    icon: 'text-amber-600 dark:text-amber-400'  },
  { bg: 'bg-rose-50 dark:bg-rose-500/10',      icon: 'text-rose-600 dark:text-rose-400'    },
  { bg: 'bg-cyan-50 dark:bg-cyan-500/10',      icon: 'text-cyan-600 dark:text-cyan-400'    },
  { bg: 'bg-orange-50 dark:bg-orange-500/10',  icon: 'text-orange-600 dark:text-orange-400' },
  { bg: 'bg-indigo-50 dark:bg-indigo-500/10',  icon: 'text-indigo-600 dark:text-indigo-400' },
];

export const getTripColor = (title = '') => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash + title.charCodeAt(i)) | 0;
  }
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
};

export default getTripColor;
