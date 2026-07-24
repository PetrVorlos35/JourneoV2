import { useEffect, useRef, useState } from 'react';
import { Search, Loader2, X, LocateFixed, SlidersHorizontal, MapPin } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { PLACE_CATEGORIES, categoryLabelKey } from './placeConfig';

const SEARCH_DEBOUNCE_MS = 450;
const MIN_QUERY_LENGTH = 3;

/**
 * Horní lišta mapy: hledání místa (skok na výsledek + rovnou návrh na
 * uložení), tlačítko „moje poloha“ a filtry stavu/kategorie/výletu.
 * Filtry se na mobilu schovávají pod přepínač, ať mapa zůstane vidět.
 */
const MapFilters = ({
  filters,
  onChange,
  trips = [],
  showTripFilter = true,
  onPickSearchResult,
  onLocate,
  isLocating = false,
}) => {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleQueryChange = (value) => {
    setQuery(value);
    setShowResults(true);
    clearTimeout(debounceRef.current);

    if (value.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await api.geo.search(value.trim(), i18n.language);
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
  };

  const pickResult = (result) => {
    setShowResults(false);
    setQuery(result.name);
    onPickSearchResult(result);
  };

  const activeFilterCount =
    (filters.status ? 1 : 0) + (filters.category ? 1 : 0) + (filters.tripId ? 1 : 0);

  const chipClass = (active) =>
    `min-h-[36px] px-3.5 rounded-full text-[12px] font-semibold border transition-colors cursor-pointer ${
      active
        ? 'bg-blue-600 border-blue-600 text-white'
        : 'bg-white/80 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-blue-400'
    }`;

  return (
    <div ref={containerRef} className="relative z-[600] space-y-2">
      <div className="flex items-center gap-2">
        {/* Hledání */}
        <div className="relative flex-1 min-w-0">
          <Search
            size={16}
            strokeWidth={2.5}
            aria-hidden="true"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => query.length >= MIN_QUERY_LENGTH && setShowResults(true)}
            placeholder={t('map.filters.searchPlaceholder')}
            aria-label={t('map.filters.searchPlaceholder')}
            className="w-full min-h-[44px] pl-11 pr-11 rounded-2xl glass-card border border-gray-200 dark:border-white/10 text-base sm:text-[14px] font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {isSearching ? (
              <Loader2 size={16} className="text-blue-500 animate-spin" aria-hidden="true" />
            ) : query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                }}
                aria-label={t('friends.search.clear')}
                className="p-2 -m-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <X size={15} strokeWidth={2.5} />
              </button>
            ) : null}
          </div>

          <AnimatePresence>
            {showResults && results.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18 }}
                className="absolute left-0 right-0 top-full mt-2 glass-card rounded-2xl border border-gray-100 dark:border-white/10 shadow-2xl p-2 max-h-[300px] overflow-y-auto custom-scrollbar"
              >
                {results.map((result) => (
                  <li key={`${result.lat},${result.lng}`}>
                    <button
                      type="button"
                      onClick={() => pickResult(result)}
                      className="w-full min-h-[44px] text-left px-3 py-2.5 rounded-xl flex items-start gap-3 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group cursor-pointer"
                    >
                      <MapPin
                        size={16}
                        strokeWidth={2}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-gray-400 group-hover:text-blue-500 transition-colors"
                      />
                      <span className="min-w-0">
                        <span className="block text-[14px] font-bold text-gray-900 dark:text-white truncate">
                          {result.name}
                        </span>
                        {result.address && (
                          <span className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate">
                            {result.address}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* Moje poloha */}
        <button
          type="button"
          onClick={onLocate}
          disabled={isLocating}
          aria-label={t('map.filters.locate')}
          title={t('map.filters.locate')}
          className="w-11 h-11 shrink-0 rounded-2xl glass-card border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLocating ? (
            <Loader2 size={17} className="animate-spin" aria-hidden="true" />
          ) : (
            <LocateFixed size={17} strokeWidth={2.5} aria-hidden="true" />
          )}
        </button>

        {/* Přepínač filtrů */}
        <button
          type="button"
          onClick={() => setShowFilters((prev) => !prev)}
          aria-expanded={showFilters}
          aria-label={t('map.filters.toggle')}
          className={`relative w-11 h-11 shrink-0 rounded-2xl border flex items-center justify-center transition-colors cursor-pointer ${
            showFilters || activeFilterCount > 0
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'glass-card border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-blue-600'
          }`}
        >
          <SlidersHorizontal size={17} strokeWidth={2.5} aria-hidden="true" />
          {activeFilterCount > 0 && !showFilters && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-blue-600 text-[10px] font-extrabold leading-[18px] text-center shadow">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="glass-card rounded-2xl border border-gray-200 dark:border-white/10 p-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ ...filters, status: null })}
                  className={chipClass(!filters.status)}
                >
                  {t('map.filters.all')}
                </button>
                {['visited', 'wishlist'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onChange({ ...filters, status })}
                    className={chipClass(filters.status === status)}
                  >
                    {t(`map.statuses.${status}`)}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {/* eslint-disable-next-line no-unused-vars */}
                {PLACE_CATEGORIES.map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      onChange({ ...filters, category: filters.category === key ? null : key })
                    }
                    className={`${chipClass(filters.category === key)} inline-flex items-center gap-1.5`}
                  >
                    <Icon size={13} strokeWidth={2.5} aria-hidden="true" />
                    {t(categoryLabelKey(key))}
                  </button>
                ))}
              </div>

              {showTripFilter && trips.length > 0 && (
                <select
                  value={filters.tripId ?? ''}
                  onChange={(e) => onChange({ ...filters, tripId: e.target.value || null })}
                  aria-label={t('map.filters.tripLabel')}
                  className="w-full min-h-[44px] px-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-base sm:text-[13px] font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                  <option value="">{t('map.filters.allTrips')}</option>
                  {trips.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      {trip.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapFilters;
