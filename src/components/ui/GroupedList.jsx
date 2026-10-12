import { useId } from 'react';

// Tichý seznam ve stylu iOS: popisek skupiny nad bílým blokem, řádky
// oddělené vlasovou linkou. Používá Nastavení i Přátelé.

export const Group = ({ title, count, children, className = '' }) => {
  const id = useId();
  return (
    <section aria-labelledby={id} className={`space-y-2 ${className}`}>
      <h2 id={id} className="px-1 text-[13px] font-semibold text-muted">
        {title}
        {count != null && <span className="tabular-nums"> · {count}</span>}
      </h2>
      <div className="bg-page border border-default rounded-soft shadow-card [&>*+*]:border-t [&>*+*]:border-subtle">
        {children}
      </div>
    </section>
  );
};

export const Row = ({ title, titleId, htmlFor, hint, hintId, align = 'center', children }) => (
  <div className={`px-5 sm:px-6 py-4 sm:py-5 flex flex-col gap-3 sm:flex-row sm:justify-between sm:gap-8 ${align === 'start' ? 'sm:items-start' : 'sm:items-center'}`}>
    <div className="min-w-0">
      {htmlFor
        ? <label htmlFor={htmlFor} id={titleId} className="block text-[14px] font-semibold text-primary">{title}</label>
        : <p id={titleId} className="text-[14px] font-semibold text-primary">{title}</p>}
      {hint && <p id={hintId} className="mt-0.5 text-[13px] font-medium text-muted max-w-[60ch]">{hint}</p>}
    </div>
    {children && <div className="sm:shrink-0">{children}</div>}
  </div>
);
