import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronRight, Coins, Search } from 'lucide-react';
import { CURRENCIES, currencyName, currencySymbol } from '../../utils/currency';

// Naposledy použité měny výdajů — jen pohodlí v jednom prohlížeči.
const RECENT_KEY = 'journeo_recent_currencies';

export const getRecentCurrencies = () => {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(list) ? list.filter((c) => CURRENCIES.includes(c)) : [];
  } catch {
    return [];
  }
};

export const rememberCurrency = (code) => {
  try {
    const next = [code, ...getRecentCurrencies().filter((c) => c !== code)].slice(0, 4);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // bez úložiště se jen nepamatuje pořadí
  }
};

/**
 * Seznam měn s hledáním. Nahoře `pinned` (měna výletu, hlavní, naposledy
 * použité), pod nimi všechny ostatní. Ovládá se i klávesnicí: šipky
 * projíždějí měny, Enter vybere zvýrazněnou (fokus zůstává v hledání).
 */
export const CurrencyList = ({ value, onSelect, pinned = [], autoFocus = true, listMaxHeight = null }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'cs';
  const [query, setQuery] = useState('');
  const listId = useId();

  const items = useMemo(
    () => CURRENCIES.map((code) => ({ code, name: currencyName(code, locale) })),
    [locale]
  );
  const q = query.trim().toLowerCase();
  const matches = (c) => !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    || currencySymbol(c.code).toLowerCase() === q;

  const pinnedCodes = [...new Set(pinned.filter(Boolean))];
  const top = q ? [] : pinnedCodes.map((code) => items.find((c) => c.code === code)).filter(Boolean);
  const rest = items.filter((c) => matches(c) && (q || !pinnedCodes.includes(c.code)));
  const flat = [...top, ...rest];

  // Zvýrazněná položka: na začátku vybraná měna, po hledání první shoda.
  const [activeIndex, setActiveIndex] = useState(() => Math.max(flat.findIndex((c) => c.code === value), 0));
  const listRef = useRef(null);
  const active = flat[Math.min(activeIndex, flat.length - 1)];

  useEffect(() => {
    if (!active) return;
    listRef.current?.querySelector(`[data-code="${active.code}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  const onKeyDown = (e) => {
    const last = flat.length - 1;
    const moves = {
      ArrowDown: () => (activeIndex >= last ? 0 : activeIndex + 1),
      ArrowUp: () => (activeIndex <= 0 ? last : activeIndex - 1),
      Home: () => 0,
      End: () => last,
    };
    if (moves[e.key] && flat.length > 0) {
      e.preventDefault();
      setActiveIndex(moves[e.key]());
    } else if (e.key === 'Enter') {
      // Enter neodešle formulář, ve kterém seznam je.
      e.preventDefault();
      if (active) onSelect(active.code);
    }
  };

  const row = (c, index) => {
    const selected = c.code === value;
    const highlighted = active?.code === c.code;
    return (
      <li key={c.code} id={`${listId}-${c.code}`} role="option" aria-selected={selected} data-code={c.code}>
        <button
          type="button"
          tabIndex={-1}
          onClick={() => onSelect(c.code)}
          onMouseMove={() => { if (!highlighted) setActiveIndex(index); }}
          className={`w-full flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-left transition-colors cursor-pointer ${
            selected ? 'bg-active' : highlighted ? 'bg-field' : ''
          } ${highlighted ? 'ring-2 ring-blue-500/30' : ''}`}
        >
          <span className="w-12 shrink-0 text-[14px] font-bold tabular-nums text-primary">{c.code}</span>
          <span className="flex-1 min-w-0 truncate text-[14px] font-medium text-secondary">{c.name}</span>
          {currencySymbol(c.code) !== c.code && (
            <span className="shrink-0 text-[13px] font-semibold text-muted">{currencySymbol(c.code)}</span>
          )}
          {selected && <Check size={16} strokeWidth={2.5} className="shrink-0 text-accent" aria-hidden="true" />}
        </button>
      </li>
    );
  };

  return (
    <div className="rounded-2xl border border-default bg-page p-2">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden="true" />
        <input
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={active ? `${listId}-${active.code}` : undefined}
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
          onKeyDown={onKeyDown}
          placeholder={t('currencyPicker.search')}
          aria-label={t('currencyPicker.search')}
          className="w-full h-11 pl-9 pr-3 rounded-xl bg-field border border-transparent focus:bg-page focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-base sm:text-[14px] font-medium text-primary placeholder:text-placeholder"
        />
      </div>
      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={t('currencyPicker.all')}
        className="mt-1 max-h-64 overflow-y-auto overscroll-contain"
        style={listMaxHeight ? { maxHeight: Math.min(listMaxHeight, 256) } : undefined}
      >
        {top.length > 0 && (
          <>
            <p role="presentation" className="px-3 pt-2 pb-1 text-[12px] font-semibold text-muted">{t('currencyPicker.frequent')}</p>
            <ul role="presentation">{top.map((c, i) => row(c, i))}</ul>
            <p role="presentation" className="px-3 pt-3 pb-1 text-[12px] font-semibold text-muted">{t('currencyPicker.all')}</p>
          </>
        )}
        {rest.length > 0
          ? <ul role="presentation">{rest.map((c, i) => row(c, top.length + i))}</ul>
          : <p className="px-3 py-4 text-[14px] font-medium text-muted">{t('currencyPicker.noResults')}</p>}
      </div>
    </div>
  );
};

/**
 * „Měna výletu · EUR“ v rozpočtu: seznam se otevře jako vrstva pod tlačítkem
 * (nebo nad ním, když dole není místo), takže stránka neposkočí. Esc a klik
 * mimo ho zavřou; vybranou měnu předá dál (přepočet a potvrzení řeší rodič).
 */
export const TripCurrencyControl = ({ currency, onChange, mainCurrency, busy = false, className = '' }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  const toggle = () => {
    if (!open) {
      const rect = buttonRef.current?.getBoundingClientRect();
      const needed = 360;
      setAbove(!!rect && window.innerHeight - rect.bottom < needed && rect.top > needed);
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const onPointerDown = (e) => {
      if (panelRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        disabled={busy}
        className="inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-[40px] text-[13px] font-semibold text-gray-600 dark:text-gray-400 hover:text-accent transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
      >
        <Coins size={14} strokeWidth={2} aria-hidden="true" />
        {t('currencyPicker.tripCurrency', { currency })}
        <ChevronRight size={14} strokeWidth={2.5} className={`transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div
          ref={panelRef}
          className={`absolute left-0 z-30 w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl shadow-[0_24px_48px_-16px_rgba(17,24,39,0.28)] ${
            above ? 'bottom-full mb-2' : 'top-full mt-1'
          }`}
        >
          <CurrencyList
            value={currency}
            pinned={[currency, mainCurrency, ...getRecentCurrencies()]}
            onSelect={(code) => { setOpen(false); if (code !== currency) onChange(code); }}
          />
        </div>
      )}
    </div>
  );
};
