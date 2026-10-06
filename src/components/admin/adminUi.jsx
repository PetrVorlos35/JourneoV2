import { ArrowLeft, Search } from 'lucide-react';

// Společné kusy admin sekce: stránka seznamu vedle stránky detailu.
// Na desktopu jsou vedle sebe; na mobilu se ukazuje vždy jen jedna z nich
// (detail přes celou šířku s tlačítkem zpět).

export const displayName = (u, fallback) => {
  const name = `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim();
  return name || fallback;
};

export const avatarUser = (u) => ({
  first_name: u?.firstName,
  last_name: u?.lastName,
  email: u?.email,
  avatar_url: u?.avatarUrl,
});

export const formatDate = (value, locale) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString(locale, { day: 'numeric', month: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
};

export const MasterDetail = ({ list, detail, hasSelection }) => (
  <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,5fr)_7fr] gap-5 items-start">
    <section className={`${hasSelection ? 'hidden lg:flex' : 'flex'} flex-col min-w-0 bg-white dark:bg-[#1C1C1E] border border-gray-200/80 dark:border-white/10 rounded-[1.75rem] overflow-hidden`}>
      {list}
    </section>
    <section className={`${hasSelection ? 'block' : 'hidden lg:block'} min-w-0 lg:sticky lg:top-0 bg-white dark:bg-[#1C1C1E] border border-gray-200/80 dark:border-white/10 rounded-[1.75rem] shadow-[0_1px_2px_rgba(17,24,39,0.04),0_12px_32px_-16px_rgba(17,24,39,0.12)]`}>
      {detail}
    </section>
  </div>
);

export const ListToolbar = ({ value, onChange, placeholder, children }) => (
  <div className="flex gap-2 p-3 border-b border-gray-100 dark:border-white/10">
    <div className="relative flex-1 min-w-0">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full h-10 pl-9 pr-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-base sm:text-[14px] font-medium text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:bg-white dark:focus:bg-white/10 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20 transition-colors"
      />
    </div>
    {children}
  </div>
);

export const ListRow = ({ selected, onClick, children }) => (
  <li>
    <button
      type="button"
      onClick={onClick}
      aria-current={selected ? 'true' : undefined}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-100 dark:border-white/[0.06] transition-colors cursor-pointer focus-visible:outline-none focus-visible:bg-gray-50 dark:focus-visible:bg-white/5 ${
        selected ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
      }`}
    >
      {children}
    </button>
  </li>
);

export const LoadMore = ({ visible, loading, onClick, label }) =>
  visible ? (
    <div className="p-3">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="w-full h-10 rounded-xl text-[14px] font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 transition-colors cursor-pointer"
      >
        {label}
      </button>
    </div>
  ) : null;

export const BackToList = ({ onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    className="lg:hidden inline-flex items-center gap-2 px-5 pt-5 text-[13px] font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
  >
    <ArrowLeft size={16} strokeWidth={2.5} /> {label}
  </button>
);

export const DetailSection = ({ title, count, children }) => (
  <section className="px-5 sm:px-8 pt-7">
    <h3 className="text-[18px] font-bold tracking-tight text-gray-900 dark:text-white">
      {title}
      {count != null && <span className="ml-2 font-medium text-gray-500 dark:text-gray-400 tabular-nums">· {count}</span>}
    </h3>
    <div className="mt-2">{children}</div>
  </section>
);

export const Badge = ({ tone = 'gray', children }) => {
  const tones = {
    gray: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    red: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-semibold whitespace-nowrap ${tones[tone]}`}>{children}</span>;
};

export const EmptyDetail = ({ text }) => (
  <div className="hidden lg:flex items-center justify-center min-h-[420px] px-8 text-center text-[15px] font-medium text-gray-500 dark:text-gray-400">
    {text}
  </div>
);
