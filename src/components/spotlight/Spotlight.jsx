import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Search, CornerDownLeft, ArrowUp, ArrowDown, Clock, Sparkles, X } from 'lucide-react';
import { cs, enUS } from 'date-fns/locale';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { tokenize, scoreFields, toRanges } from '../../utils/fuzzy';
import { buildItems, GROUP_ORDER, TYPE_STYLES } from './items';

const RECENT_KEY = 'journeo_spotlight_recent';
const RECENT_LIMIT = 5;
const GROUP_LIMIT = 6;
const TOTAL_LIMIT = 40;

const readRecent = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY));
    return Array.isArray(raw) ? raw.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

/** Název s podbarvenými úseky, které odpovídají dotazu. */
const Highlighted = ({ text, positions }) => {
  const ranges = useMemo(() => toRanges(positions), [positions]);
  if (!ranges.length) return text;

  const parts = [];
  let cursor = 0;
  ranges.forEach(([start, end], i) => {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={i} className="bg-transparent text-blue-600 dark:text-blue-400 font-bold">
        {text.slice(start, end)}
      </mark>
    );
    cursor = end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
};

const ResultRow = ({ entry, active, onSelect, onHover, rowRef }) => {
  const { item, positions } = entry;
  const Icon = item.icon;
  return (
    <button
      ref={rowRef}
      type="button"
      role="option"
      aria-selected={active}
      onClick={onSelect}
      onMouseMove={onHover}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-colors duration-150 cursor-pointer ${
        active ? 'bg-gray-100 dark:bg-white/[0.08]' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
      }`}
    >
      <span className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${TYPE_STYLES[item.type] || TYPE_STYLES.page}`}>
        <Icon size={17} strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-gray-900 dark:text-white truncate">
          <Highlighted text={item.title} positions={positions} />
        </span>
        {item.subtitle && (
          <span className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {item.subtitle}
          </span>
        )}
      </span>
      {item.meta && (
        <span className="shrink-0 text-[11px] font-semibold text-gray-400 dark:text-gray-500 tabular-nums">
          {item.meta}
        </span>
      )}
      {item.shortcut && (
        <kbd className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-200/70 dark:bg-white/[0.07] text-gray-500 dark:text-gray-400">
          {item.shortcut}
        </kbd>
      )}
      <CornerDownLeft
        size={14}
        strokeWidth={2.25}
        aria-hidden="true"
        className={`shrink-0 text-gray-400 dark:text-gray-500 transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}
      />
    </button>
  );
};

/**
 * Spotlight — ⌘K/Ctrl+K paleta nad celým dashboardem.
 *
 * Prohledává stránky, akce a *obsah*: výlety, dny programu, výdaje, balicí
 * seznam, poznámky, místa na mapě a přátele. Hledá se bez ohledu na
 * diakritiku a s tolerancí k překlepům (viz utils/fuzzy).
 *
 * Výlety chodí z dashboardu jako prop; místa a přátele si paleta dotáhne
 * sama při prvním otevření, ať kvůli hledání nic neběží na pozadí předem.
 */
const Spotlight = ({ isOpen, onClose, trips = [], onCreateTrip, onLogout }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { setTheme } = useTheme();
  const { currency } = useCurrency();
  const shouldReduceMotion = useReducedMotion();

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [places, setPlaces] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loadedExtras, setLoadedExtras] = useState(false);
  const [recentIds, setRecentIds] = useState(readRecent);

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const rowRefs = useRef([]);
  const restoreFocusRef = useRef(null);

  const locale = i18n.language?.startsWith('en') ? 'en' : 'cs';
  const dateLocale = locale === 'en' ? enUS : cs;

  // Místa a přátele dotahujeme jednou za relaci, až když je paleta poprvé
  // otevřená. Selhání je tiché — hledání ve výletech funguje dál.
  useEffect(() => {
    if (!isOpen || loadedExtras) return;
    setLoadedExtras(true);
    api.places.getAll().then((data) => setPlaces(data.places || []), () => {});
    api.friends.getAll().then((data) => setFriends(data.friends || []), () => {});
  }, [isOpen, loadedExtras]);

  const toggleLanguage = useCallback(() => {
    const next = (i18n.language?.slice(0, 2) || 'cs') === 'cs' ? 'en' : 'cs';
    i18n.changeLanguage(next);
    localStorage.setItem('journeo_lang', next);
    api.settings.update({ language: next }).catch(() => {});
  }, [i18n]);

  const items = useMemo(
    () =>
      buildItems({
        trips,
        places,
        friends,
        t,
        dateLocale,
        locale,
        currency,
        isAdmin,
        actions: {
          createTrip: onCreateTrip,
          logout: onLogout,
          setTheme,
          toggleLanguage,
        },
      }),
    [trips, places, friends, t, dateLocale, locale, currency, isAdmin, onCreateTrip, onLogout, setTheme, toggleLanguage]
  );

  // Výsledky ve skupinách. Bez dotazu se ukáže „poslední použité“ a pár
  // rozumných startovních bodů, s dotazem fuzzy shody seřazené podle skóre.
  const groups = useMemo(() => {
    const tokens = tokenize(query);

    if (!tokens.length) {
      const byId = new Map(items.map((it) => [it.id, it]));
      const recent = recentIds.map((id) => byId.get(id)).filter(Boolean).slice(0, RECENT_LIMIT);
      const recentSet = new Set(recent.map((it) => it.id));

      // Nadcházející a probíhající výlety jsou to, kvůli čemu sem člověk
      // nejčastěji jde — nabídneme je dřív než stránky.
      const suggested = items
        .filter((it) => it.type === 'trip' && it.phase !== 'past' && !recentSet.has(it.id))
        .slice(0, 4);

      const starters = items
        .filter((it) => (it.type === 'action' && it.id === 'action:create-trip') || it.type === 'page')
        .filter((it) => !recentSet.has(it.id))
        .slice(0, 5);

      return [
        recent.length && { type: 'recent', entries: recent.map((it) => ({ item: it, positions: [] })) },
        suggested.length && { type: 'trip', entries: suggested.map((it) => ({ item: it, positions: [] })) },
        starters.length && { type: 'suggested', entries: starters.map((it) => ({ item: it, positions: [] })) },
      ].filter(Boolean);
    }

    const scored = [];
    for (const it of items) {
      const hit = scoreFields(it.fields, tokens);
      if (hit) scored.push({ item: it, score: hit.score, positions: hit.positions });
    }
    scored.sort((a, b) => b.score - a.score);

    const byType = new Map();
    let taken = 0;
    for (const entry of scored) {
      if (taken >= TOTAL_LIMIT) break;
      const bucket = byType.get(entry.item.type) || { type: entry.item.type, entries: [], best: entry.score };
      if (bucket.entries.length >= GROUP_LIMIT) continue;
      bucket.entries.push(entry);
      byType.set(entry.item.type, bucket);
      taken += 1;
    }

    return [...byType.values()].sort(
      (a, b) => b.best - a.best || GROUP_ORDER.indexOf(a.type) - GROUP_ORDER.indexOf(b.type)
    );
  }, [items, query, recentIds]);

  // Plochý seznam kvůli klávesnici — index odpovídá pořadí na obrazovce.
  const flat = useMemo(() => groups.flatMap((g) => g.entries), [groups]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (activeIndex >= flat.length) setActiveIndex(0);
  }, [flat.length, activeIndex]);

  // Otevření: prázdný dotaz, čerstvá historie, fokus v inputu. Zavření
  // vrátí fokus tam, odkud se paleta otevřela.
  useEffect(() => {
    if (!isOpen) {
      restoreFocusRef.current?.focus?.();
      restoreFocusRef.current = null;
      return;
    }
    restoreFocusRef.current = document.activeElement;
    setQuery('');
    setActiveIndex(0);
    setRecentIds(readRecent());
    // Fokus hned, jak je pole v DOM; rAF je pojistka pro případ, že ho
    // nástupní animace ještě nestihla zpřístupnit.
    inputRef.current?.focus();
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  // Aktivní řádek musí zůstat vidět i při procházení šipkami.
  useEffect(() => {
    rowRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, groups]);

  const run = useCallback(
    (entry) => {
      if (!entry) return;
      const { item } = entry;

      const next = [item.id, ...readRecent().filter((id) => id !== item.id)].slice(0, RECENT_LIMIT);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // Soukromý režim bez localStorage — historie prostě nebude.
      }
      setRecentIds(next);

      onClose();
      // Až po zavření: navigace i modály chtějí mít paletu z cesty.
      if (item.to) navigate(item.to);
      else item.run?.();
    },
    [navigate, onClose]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      setActiveIndex((i) => (flat.length ? (i + 1) % flat.length : 0));
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      setActiveIndex((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(flat[activeIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const groupLabel = (type) => {
    if (type === 'recent') return t('spotlight.groups.recent');
    if (type === 'suggested') return t('spotlight.groups.suggested');
    return t(`spotlight.groups.${type}`);
  };

  rowRefs.current = [];
  let rowIndex = -1;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        // Pod potvrzovacím dialogem (10000) a toasty — paleta se zavírá
        // dřív, než cokoli z toho naskočí.
        <div className="fixed inset-0 z-[9500] flex items-start justify-center sm:p-6 sm:pt-[12vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-md"
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t('spotlight.title')}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
            transition={shouldReduceMotion ? { duration: 0.12 } : { type: 'spring', stiffness: 400, damping: 32 }}
            className="relative w-full sm:max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[68vh] flex flex-col overflow-hidden bg-white dark:bg-[#1C1C1E] sm:rounded-[1.75rem] border-0 sm:border border-black/5 dark:border-white/10 shadow-2xl"
          >
            {/* Vyhledávací pole */}
            <div className="flex items-center gap-3 px-4 sm:px-5 pb-3 pt-[max(0.875rem,env(safe-area-inset-top))] sm:pt-4 border-b border-gray-100 dark:border-white/[0.07] shrink-0">
              <Search size={18} strokeWidth={2.25} className="shrink-0 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('spotlight.placeholder')}
                aria-label={t('spotlight.placeholder')}
                aria-autocomplete="list"
                aria-controls="spotlight-results"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                // 16px, aby Safari na iOS při fokusu nezoomoval stránku
                className="flex-1 min-w-0 bg-transparent text-[16px] font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
              />
              <kbd className="hidden sm:block shrink-0 text-[10px] font-mono px-1.5 py-1 rounded bg-gray-100 dark:bg-white/[0.07] text-gray-400 dark:text-gray-500">
                ESC
              </kbd>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('common.close')}
                className="sm:hidden shrink-0 w-9 h-9 -mr-1 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 active:bg-gray-100 dark:active:bg-white/10 cursor-pointer"
              >
                <X size={20} strokeWidth={2.25} />
              </button>
            </div>

            {/* Výsledky */}
            <div
              ref={listRef}
              id="spotlight-results"
              role="listbox"
              aria-label={t('spotlight.title')}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar px-2 py-2"
            >
              {flat.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <div className="w-11 h-11 mx-auto mb-3 rounded-2xl bg-gray-100 dark:bg-white/[0.07] flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <Search size={18} strokeWidth={2.25} aria-hidden="true" />
                  </div>
                  <p className="text-[14px] font-bold text-gray-900 dark:text-white">{t('spotlight.empty.title')}</p>
                  <p className="text-[12px] font-medium text-gray-500 dark:text-gray-400 mt-1">
                    {t('spotlight.empty.hint')}
                  </p>
                </div>
              ) : (
                groups.map((group) => (
                  <div key={group.type} className="mb-1 last:mb-0">
                    <div className="flex items-center gap-1.5 px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                      {group.type === 'recent' && <Clock size={11} strokeWidth={2.5} aria-hidden="true" />}
                      {group.type === 'suggested' && <Sparkles size={11} strokeWidth={2.5} aria-hidden="true" />}
                      {groupLabel(group.type)}
                    </div>
                    {group.entries.map((entry) => {
                      rowIndex += 1;
                      const index = rowIndex;
                      return (
                        <ResultRow
                          key={entry.item.id}
                          entry={entry}
                          active={index === activeIndex}
                          rowRef={(el) => { rowRefs.current[index] = el; }}
                          onSelect={() => run(entry)}
                          onHover={() => setActiveIndex(index)}
                        />
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Nápověda ke klávesnici — na mobilu zbytečná, tam se klepe */}
            <div className="hidden sm:flex items-center gap-4 px-5 py-2.5 border-t border-gray-100 dark:border-white/[0.07] text-[11px] font-medium text-gray-400 dark:text-gray-500 shrink-0">
              <span className="flex items-center gap-1.5">
                <ArrowUp size={11} strokeWidth={2.5} aria-hidden="true" />
                <ArrowDown size={11} strokeWidth={2.5} aria-hidden="true" />
                {t('spotlight.hints.move')}
              </span>
              <span className="flex items-center gap-1.5">
                <CornerDownLeft size={11} strokeWidth={2.5} aria-hidden="true" />
                {t('spotlight.hints.open')}
              </span>
              <span className="ml-auto">{t('spotlight.hints.count', { count: flat.length })}</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Spotlight;
