import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ArrowRight } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, useReducedMotion } from 'framer-motion';
import HeroCard from './overview/HeroCard';
import ReadinessCard from './overview/ReadinessCard';
import OverviewTiles, { FriendRequestsRow } from './overview/OverviewTiles';
import TripCard from './overview/TripCard';
import useOverviewData from './overview/useOverviewData';
import { categorizeTrip, tripSpend } from '../../utils/trip';

// How many trips the overview shows before handing off to /all-trips. The
// overview answers "what's next", not "show me everything" — search, filters
// and sorting all live on the All trips page, in a better form.
const MAX_TRIPS = 6;

const TripsOverview = ({ trips, onDeleteTrip, onOpenCreateModal, error, onRetry }) => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const { places, balances, friendRequests } = useOverviewData();

  // Every derivation runs once per trips change instead of on every render.
  const { ongoing, upcoming, past } = useMemo(() => {
    const buckets = { ongoing: [], upcoming: [], past: [] };
    for (const trip of trips) buckets[categorizeTrip(trip)].push(trip);
    buckets.ongoing.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
    buckets.upcoming.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    buckets.past.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
    return buckets;
  }, [trips]);

  // The hero follows what the user is actually doing: a trip in progress wins,
  // then the nearest one ahead, then the most recent memory.
  const { heroTrip, heroState } = useMemo(() => {
    if (ongoing.length > 0) return { heroTrip: ongoing[0], heroState: 'ongoing' };
    if (upcoming.length > 0) return { heroTrip: upcoming[0], heroState: 'upcoming' };
    if (past.length > 0) return { heroTrip: past[0], heroState: 'past' };
    return { heroTrip: null, heroState: 'empty' };
  }, [ongoing, upcoming, past]);

  const heroPlaceCount = useMemo(() => {
    if (!places || !heroTrip) return null;
    return places.filter((p) => p.tripId === heroTrip.id).length;
  }, [places, heroTrip]);

  const budget = useMemo(() => {
    if (!heroTrip) {
      const spent = trips.reduce((sum, trip) => sum + tripSpend(trip), 0);
      return spent > 0 ? { spent, target: null } : null;
    }
    const spent = tripSpend(heroTrip);
    const target = heroTrip.budgetTarget || null;
    if (spent === 0 && !target) {
      const allSpent = trips.reduce((sum, trip) => sum + tripSpend(trip), 0);
      return allSpent > 0 ? { spent: allSpent, target: null } : null;
    }
    return { spent, target };
  }, [heroTrip, trips]);

  // Ongoing first, then what's coming up. Only once there's neither do past
  // trips fill the list, so it's never empty while the user has any trips.
  const listedTrips = useMemo(() => {
    const upNext = [...ongoing, ...upcoming];
    return (upNext.length > 0 ? upNext : past).slice(0, MAX_TRIPS);
  }, [ongoing, upcoming, past]);

  if (error) {
    return (
      <div className="w-full pb-10">
        <h1 className="text-3xl sm:text-4xl text-gray-900 dark:text-white tracking-tight font-bold mb-8">
          {t('tripsOverview.title')}
        </h1>
        <div className="glass-card rounded-[2rem] p-8 sm:p-12 flex flex-col items-center justify-center text-center min-h-[40dvh] space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center">
            <AlertCircle size={26} strokeWidth={2} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-1.5">
              {t('tripsOverview.error.title')}
            </p>
            <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400 max-w-sm">
              {t('tripsOverview.error.description')}
            </p>
          </div>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-2xl px-5 min-h-[44px] bg-blue-600 text-white text-[15px] font-semibold hover:bg-blue-700 transition-all active:scale-[0.97] cursor-pointer"
          >
            {t('tripsOverview.error.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 w-full pb-10">
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl text-gray-900 dark:text-white tracking-tight font-bold" style={{ textWrap: 'balance' }}>
          {t('tripsOverview.title')}
        </h1>
        <p className="text-[14px] sm:text-[15px] font-medium text-gray-500 dark:text-gray-400">
          {t('tripsOverview.subtitle')}
        </p>
      </div>

      <FriendRequestsRow count={friendRequests} />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        <div className={heroTrip ? 'md:col-span-8' : 'md:col-span-12'}>
          <HeroCard
            trip={heroTrip}
            state={heroState}
            placeCount={heroPlaceCount}
            onCreate={onOpenCreateModal}
          />
        </div>
        {heroTrip && (
          <div className="md:col-span-4">
            <ReadinessCard trip={heroTrip} placeCount={heroPlaceCount} />
          </div>
        )}
      </div>

      <OverviewTiles
        budget={budget}
        balances={balances}
        places={places}
        tripCounts={{ total: trips.length, upcoming: upcoming.length }}
      />

      {listedTrips.length > 0 && (
        <>
          {/* Sticks under the mobile topbar while the list scrolls. The glass
              backdrop is a separate md:hidden layer rather than a class on the
              header itself — `.glass` is unlayered CSS, so md: utilities can't
              cascade it away. The negative margin lets it reach the screen
              edges inside the padded scroll container. */}
          <div className="sticky top-0 z-20 -mx-4 px-4 py-3 md:static md:mx-0 md:px-0 md:py-0 md:pt-2 flex items-center justify-between gap-4">
            <span className="absolute inset-0 -z-10 glass md:hidden" aria-hidden="true" />
            <h2 className="text-[15px] sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight truncate">
              {t('tripsOverview.yourTrips')}
              <span className="ml-2 text-gray-400 dark:text-gray-500 font-semibold">{listedTrips.length}</span>
            </h2>
            <Link
              to="/dashboard/all-trips"
              className="inline-flex items-center gap-1.5 shrink-0 text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors"
            >
              {t('tripsOverview.allTrips')}
              <ArrowRight size={14} strokeWidth={2.5} aria-hidden="true" />
            </Link>
          </div>

          <motion.div
            initial={shouldReduceMotion ? false : 'hidden'}
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: shouldReduceMotion ? 0 : 0.05 } },
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {listedTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onDeleteTrip={onDeleteTrip} />
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default TripsOverview;
