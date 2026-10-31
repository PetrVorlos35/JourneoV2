// Společné kusy analytiky a chyb v adminu.

export const eventLabel = (t, e) =>
  e.name === 'pageview' ? e.path || '/' : t(`admin.analytics.events.${e.name}`, { defaultValue: e.name });

export const relativeTime = (value, locale) => {
  if (!value) return '—';
  const diff = (new Date(value).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), 'second');
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day');
  return new Date(value).toLocaleDateString(locale);
};

// Vodorovné pruhy pro žebříčky (stránky, zdroje, zařízení). Jedna řada =
// jedna barva; hodnota stojí v textu vedle, ne v barvě.
export const BarList = ({ rows, empty, valueLabel }) => {
  if (!rows?.length) return <p className="py-3 text-[14px] font-medium text-muted">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => (
        <li key={r.label} className="relative flex items-center justify-between gap-3 h-9 px-3 rounded-lg">
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 rounded-lg bg-blue-600/10 dark:bg-blue-500/15"
            style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }}
          />
          <span className="relative min-w-0 truncate text-[14px] font-medium text-primary">{r.label}</span>
          <span className="relative shrink-0 text-[13px] font-semibold tabular-nums text-secondary" title={valueLabel}>
            {r.value.toLocaleString()}
          </span>
        </li>
      ))}
    </ul>
  );
};

export const Card = ({ title, aside, children, className = '' }) => (
  <section className={`bg-page border border-gray-200/80 dark:border-white/10 rounded-[1.75rem] p-5 sm:p-8 ${className}`}>
    {(title || aside) && (
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        {title && <h2 className="text-[18px] font-bold tracking-tight text-primary">{title}</h2>}
        {aside && <div className="text-[13px] font-medium text-muted">{aside}</div>}
      </div>
    )}
    {children}
  </section>
);

// Segmentový přepínač (rozsah dní, otevřené/vyřešené chyby).
export const Segmented = ({ label, value, options, onChange }) => (
  <div role="radiogroup" aria-label={label} className="inline-flex p-1 rounded-2xl bg-gray-100 dark:bg-white/[0.06]">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        role="radio"
        aria-checked={o.value === value}
        onClick={() => onChange(o.value)}
        className={`px-3.5 h-9 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer ${
          o.value === value
            ? 'bg-white dark:bg-[#2c2c2e] text-primary shadow-[0_1px_2px_rgba(17,24,39,0.08)]'
            : 'text-gray-600 dark:text-gray-400 hover:text-primary'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);
