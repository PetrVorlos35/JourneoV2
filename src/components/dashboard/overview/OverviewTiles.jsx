import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wallet, Scale, Globe2, Plane, ArrowRight } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, useReducedMotion } from 'framer-motion';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { formatCurrencyShort } from '../../../utils/currency';
import { countryFlag } from '../../../utils/country';

const EASE = [0.22, 1, 0.36, 1];

/**
 * One quiet metric tile. Deliberately a plain border rather than glass — the
 * hero and the trip cards own the glass so content and chrome stay tellable
 * apart. `sub` is where the tile explains itself; `children` is for the odd
 * tile that needs a bar or a row of flags.
 */
const Tile = ({ icon: Icon, accent, label, value, sub, to, delay = 0, children }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.45, delay, ease: EASE }}
      className={`relative snap-start shrink-0 min-w-[158px] md:min-w-0 md:shrink rounded-[1.5rem] border border-gray-200/60 dark:border-white/[0.07] p-4 sm:p-5 flex flex-col justify-center min-h-[112px] transition-colors ${
        to ? 'hover:bg-gray-50 dark:hover:bg-white/[0.03] hover:border-gray-300/70 dark:hover:border-white/[0.14]' : ''
      }`}
    >
      {/* Overlay link keeps the whole tile clickable while the content stays
          plain text — the same pattern the hero and trip cards use. */}
      {to && (
        <Link
          to={to}
          aria-label={`${label}: ${value}`}
          className="absolute inset-0 z-10 rounded-[1.5rem] outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-inset"
        />
      )}
      <div className="flex items-center gap-2.5 mb-3">
        <span
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accent}15` }}
        >
          <Icon size={16} strokeWidth={2.2} style={{ color: accent }} aria-hidden="true" />
        </span>
        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-none truncate">
        {value}
      </p>
      {sub && (
        <p className="text-[12px] font-medium text-gray-500 dark:text-gray-400 mt-1.5 truncate">{sub}</p>
      )}
      {children}
    </motion.div>
  );
};

/**
 * The metric strip under the hero. A four-column grid on desktop; on mobile it
 * becomes a full-bleed horizontal snap rail so all four stay reachable with a
 * thumb instead of pushing the trip list a screen and a half down.
 */
const OverviewTiles = ({ budget, balances, places, tripCounts }) => {
  const { t, i18n } = useTranslation();
  const { currency } = useCurrency();
  const locale = i18n.language || 'cs';

  const money = (amount) => formatCurrencyShort(amount, currency, locale);

  // ── Budget ──
  const budgetTile = (() => {
    if (!budget) return { value: '—', sub: t('tripsOverview.tiles.budgetEmpty') };
    if (budget.target) {
      const pct = Math.min(Math.round((budget.spent / budget.target) * 100), 999);
      return {
        value: money(budget.spent),
        sub: t('tripsOverview.tiles.budgetOf', { target: money(budget.target), pct }),
        pct: Math.min(pct, 100),
        over: budget.spent > budget.target,
      };
    }
    return { value: money(budget.spent), sub: t('tripsOverview.tiles.budgetTotal') };
  })();

  // ── Settle up ──
  const balanceTile = (() => {
    if (!balances) return { value: '—', sub: t('tripsOverview.tiles.balanceUnknown') };
    const { owedToMe = 0, iOwe = 0, counterparties = [] } = balances;
    if (owedToMe === 0 && iOwe === 0) {
      return { value: t('tripsOverview.tiles.balanceSettled'), sub: t('tripsOverview.tiles.balanceSettledSub') };
    }
    // Lead with whichever side is bigger — that's the one that needs action.
    const owing = iOwe >= owedToMe;
    const people = counterparties.filter((c) => c.direction === (owing ? 'iOwe' : 'owedToMe')).length;
    return {
      value: money(owing ? iOwe : owedToMe),
      sub: owing
        ? t('tripsOverview.tiles.balanceIOwe', { count: people })
        : t('tripsOverview.tiles.balanceOwedToMe', { count: people }),
      accent: owing ? '#f87171' : '#34d399',
    };
  })();

  // ── Geography ──
  const geoTile = (() => {
    if (!places) return { value: '—', sub: t('tripsOverview.tiles.countriesEmpty') };
    const countries = [...new Set(places.map((p) => p.countryCode).filter(Boolean))];
    if (countries.length === 0) {
      return { value: '—', sub: t('tripsOverview.tiles.countriesEmpty') };
    }
    const visited = places.filter((p) => p.status === 'visited').length;
    return {
      value: countries.length,
      sub: t('tripsOverview.tiles.placesVisited', { visited, total: places.length }),
      flags: countries.slice(0, 5),
      extra: Math.max(countries.length - 5, 0),
    };
  })();

  return (
    <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
      <Tile
        icon={Wallet}
        accent="#60a5fa"
        label={t('tripsOverview.tiles.budget')}
        value={budgetTile.value}
        sub={budgetTile.sub}
        to="/dashboard/budget"
        delay={0}
      >
        {typeof budgetTile.pct === 'number' && (
          <div className="mt-2.5 h-1.5 w-full rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden">
            <div
              className={`h-full rounded-full ${budgetTile.over ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${budgetTile.pct}%` }}
            />
          </div>
        )}
      </Tile>

      <Tile
        icon={Scale}
        accent={balanceTile.accent || '#a78bfa'}
        label={t('tripsOverview.tiles.balance')}
        value={balanceTile.value}
        sub={balanceTile.sub}
        to="/dashboard/budget"
        delay={0.05}
      />

      <Tile
        icon={Globe2}
        accent="#34d399"
        label={t('tripsOverview.tiles.countries')}
        value={geoTile.value}
        sub={geoTile.sub}
        to="/dashboard/map"
        delay={0.1}
      >
        {geoTile.flags && (
          <p className="mt-2 text-[15px] leading-none tracking-wide" aria-hidden="true">
            {geoTile.flags.map(countryFlag).join(' ')}
            {geoTile.extra > 0 && (
              <span className="ml-1 text-[11px] font-semibold text-gray-400 align-middle">+{geoTile.extra}</span>
            )}
          </p>
        )}
      </Tile>

      <Tile
        icon={Plane}
        accent="#fbbf24"
        label={t('tripsOverview.tiles.trips')}
        value={tripCounts.total}
        sub={t('tripsOverview.tiles.tripsUpcoming', { count: tripCounts.upcoming })}
        to="/dashboard/all-trips"
        delay={0.15}
      />
    </div>
  );
};

/**
 * Pending friend requests. Rendered only when there actually are some — a
 * permanently empty tile is worse than no tile, so this lives as a contextual
 * row instead of taking a slot in the grid.
 */
export const FriendRequestsRow = ({ count }) => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  if (!count) return null;

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4, ease: EASE }}
    >
      <Link
        to="/dashboard/friends"
        className="flex items-center gap-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 px-4 min-h-[48px] py-2.5 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/[0.16] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
      >
        <span className="flex items-center justify-center w-6 h-6 shrink-0 rounded-full bg-blue-600 text-white text-[12px] font-bold">
          {count}
        </span>
        <span className="text-[14px] font-semibold flex-1 min-w-0 truncate">
          {t('tripsOverview.friendRequests', { count })}
        </span>
        <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
      </Link>
    </motion.div>
  );
};

export default OverviewTiles;
