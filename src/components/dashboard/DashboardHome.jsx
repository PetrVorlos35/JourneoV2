import React, { Suspense, lazy, useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import DashboardLayout from './DashboardLayout';
import DashboardNotFound from './DashboardNotFound';
import CreateTripModal from './CreateTripModal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { pushUndo, clearUndo } from '../../hooks/undoStack';
import {
  TripsOverviewSkeleton,
  AllTripsSkeleton,
  TripDetailSkeleton,
  StatisticsSkeleton,
  SettingsSkeleton,
  BudgetSkeleton,
  FriendsSkeleton,
  FriendProfileSkeleton,
  TripViewSkeleton,
  ContentSkeleton,
  MapSkeleton,
} from '../ui/Skeletons';

// Lazy load dashboard sub-components
const TripsOverview = lazy(() => import('./TripsOverview'));
const TripDetail = lazy(() => import('./TripDetail'));
const AdminHome = lazy(() => import('../admin/AdminHome'));
const Statistics = lazy(() => import('./Statistics'));
const Settings = lazy(() => import('./Settings'));
const Budget = lazy(() => import('./Budget'));
const AllTrips = lazy(() => import('./AllTrips'));
const Friends = lazy(() => import('./Friends'));
const FriendProfile = lazy(() => import('./FriendProfile'));
const AddFriendInvite = lazy(() => import('./AddFriendInvite'));
const ReadOnlyTripView = lazy(() => import('./ReadOnlyTripView'));
const Trash = lazy(() => import('./Trash'));
// Leaflet i jeho CSS jedou až s tímhle chunkem — na ostatní stránky se nestáhnou.
const MapPage = lazy(() => import('./MapPage'));

// Wrap a lazy route element in its own Suspense boundary with a matching
// skeleton fallback. Because each matched route mounts a *new* boundary,
// React shows the fallback immediately on navigation (instead of preserving
// the previous page during the transition while the chunk loads).
const withSuspense = (element, fallback) => (
  <Suspense fallback={fallback}>{element}</Suspense>
);

const DashboardHome = () => {
  const { isAdmin } = useAuth();
  const { t } = useTranslation();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Ochrana proti přepsání: ke každému výletu si pamatujeme verzi, se kterou
  // jsou naše data v souladu, a server odmítne uložení ze starší verze (409).
  // Verze je v refu, ne ve stavu, aby druhé uložení hned po prvním neposlalo
  // starou verzi dřív, než React překreslí, a nedostalo 409 samo od sebe.
  // Uložení jednoho výletu jdou za sebou (TripDetail i Budget sdílí frontu)
  // a ta, která čekala ve frontě během konfliktu, se zahodí, protože by
  // přepsala právě načtené cizí změny.
  const versionsRef = useRef(new Map());
  const saveChainsRef = useRef(new Map());
  const conflictGenRef = useRef(new Map());

  // Load trips from API on mount. A failure is tracked in state, not just
  // toasted — otherwise the overview renders an empty dashboard and reads as
  // "you have no trips" when the truth is "we couldn't load them".
  const fetchTrips = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.trips.getAll();
      versionsRef.current = new Map(data.trips.map(tr => [tr.id, tr.version]));
      setTrips(data.trips);
      setLoadError(false);
    } catch (err) {
      console.error('Failed to fetch trips:', err);
      setLoadError(true);
      toast.error(t('dashboardHome.loadError'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleAddTrip = async (newTrip) => {
    try {
      const data = await api.trips.create({
        title: newTrip.title,
        startDate: newTrip.startDate,
        endDate: newTrip.endDate,
      });
      
      const createdTrip = data.trip;
      versionsRef.current.set(createdTrip.id, createdTrip.version);
      setTrips(prev => [...prev, createdTrip]);
      toast.success(t('dashboardHome.tripReady'));

      return createdTrip;
    } catch (err) {
      toast.error(err.message || t('dashboardHome.createError'));
      throw err;
    }
  };

  // Instant delete with a 5s Undo toast (no confirm modal). The trip is
  // removed from the UI optimistically and soft-deleted on the server right
  // away — it lands in the trash, restorable for 30 days — so a closed tab
  // mid-toast can't lose or resurrect anything. Undo (toast button or
  // Cmd/Ctrl+Z, via the shared undo stack) calls the restore endpoint.
  const handleDeleteTrip = (id) => {
    const trip = trips.find(tr => tr.id === id);
    if (!trip) return;

    setTrips(prev => prev.filter(tr => tr.id !== id));

    let toastId;
    let deleteRequest;

    const undoAction = {
      undo: async () => {
        clearUndo(undoAction);
        toast.dismiss(toastId);
        if (!(await deleteRequest)) return;
        try {
          await api.trips.restore(id);
          setTrips(prev => (prev.some(tr => tr.id === id) ? prev : [...prev, trip]));
          toast.success(t('dashboardHome.tripRestored'));
        } catch (err) {
          toast.error(err.message || t('dashboardHome.restoreError'));
        }
      },
    };

    // Resolves true once the soft delete landed. On failure the optimistic
    // removal is rolled back and the undo offer withdrawn.
    deleteRequest = api.trips.delete(id).then(
      () => true,
      (err) => {
        clearUndo(undoAction);
        toast.dismiss(toastId);
        setTrips(prev => (prev.some(tr => tr.id === id) ? prev : [...prev, trip]));
        toast.error(err.message || t('dashboardHome.deleteError'));
        return false;
      }
    );

    pushUndo(undoAction);
    toastId = toast.custom(
      (ts) => (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: ts.visible ? 1 : 0, y: 0, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="relative w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-page border border-black/5 dark:border-white/10 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4)]"
        >
          <div className="flex items-center gap-3 pl-4 pr-3 py-3.5">
            <div className="w-9 h-9 shrink-0 rounded-full bg-danger-wash text-red-500 flex items-center justify-center">
              <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-primary truncate">{trip.title}</p>
              <p className="text-[12px] font-medium text-muted">{t('dashboardHome.tripDeleted')}</p>
            </div>
            <button
              onClick={() => undoAction.undo()}
              className="shrink-0 px-3.5 py-1.5 rounded-xl bg-accent text-white text-[13px] font-semibold hover:bg-accent-hover transition-colors cursor-pointer"
            >
              {t('dashboardHome.undo')}
            </button>
          </div>
          <motion.div
            className="h-[3px] bg-blue-500/70 dark:bg-blue-400/70 origin-left"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 5, ease: 'linear' }}
          />
        </motion.div>
      ),
      { duration: 5000 }
    );
  };

  const handleUpdateTrip = (updatedTrip) => {
    const id = updatedTrip.id;
    const gen = conflictGenRef.current.get(id) || 0;
    const previous = saveChainsRef.current.get(id) || Promise.resolve();

    const run = previous.catch(() => {}).then(async () => {
      if ((conflictGenRef.current.get(id) || 0) !== gen) return null;
      try {
        const data = await api.trips.update(id, {
          ...updatedTrip,
          version: versionsRef.current.get(id) ?? updatedTrip.version,
        });
        versionsRef.current.set(id, data.trip.version);
        setTrips(prev => prev.map(trip => trip.id === data.trip.id ? data.trip : trip));
        return data.trip;
      } catch (err) {
        if (err.code === 'TRIP_CONFLICT' && err.trip) {
          conflictGenRef.current.set(id, gen + 1);
          versionsRef.current.set(id, err.trip.version);
          setTrips(prev => prev.map(trip => trip.id === id ? err.trip : trip));
          toast.error(t('dashboardHome.conflict'), { id: `trip-conflict-${id}`, duration: 7000 });
        } else {
          toast.error(err.message || t('dashboardHome.updateError'));
        }
        throw err;
      }
    });

    saveChainsRef.current.set(id, run);
    return run;
  };

  // Converting rewrites every expense amount in the DB irreversibly, so the
  // rate comes from the server (live ECB data) and the whole operation fails
  // closed — no conversion happens if the current rate can't be fetched.
  const handleConvertCurrency = async (oldCurr, newCurr) => {
    try {
      const { rate } = await api.settings.getExchangeRate(oldCurr, newCurr);
      const convertedTrips = trips.map(trip => {
        if (!trip.expenses || trip.expenses.length === 0) return trip;
        return {
          ...trip,
          expenses: trip.expenses.map(exp => ({
            ...exp,
            amount: parseFloat((exp.amount * rate).toFixed(2)),
            splits: Array.isArray(exp.splits)
              ? exp.splits.map(s => ({ ...s, amount: parseFloat((s.amount * rate).toFixed(2)) }))
              : exp.splits,
          }))
        };
      });

      const saved = await Promise.all(
        convertedTrips
          .filter(trip => trip.expenses && trip.expenses.length > 0)
          .map(trip => api.trips.update(trip.id, { ...trip, version: versionsRef.current.get(trip.id) ?? trip.version }))
      );
      const savedById = new Map(saved.map(({ trip }) => [trip.id, trip]));
      savedById.forEach((trip, id) => versionsRef.current.set(id, trip.version));
      setTrips(convertedTrips.map(trip => savedById.get(trip.id) || trip));
      return true;
    } catch (err) {
      toast.error(err.message || t('dashboardHome.currencyError'));
      return false;
    }
  };

  if (loading) {
    return (
      <DashboardLayout trips={trips}>
        <TripsOverviewSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout trips={trips} onOpenCreateModal={() => setIsCreateModalOpen(true)}>
      <CreateTripModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAddTrip={handleAddTrip}
      />
      {/* Per-route Suspense boundaries: navigating mounts a fresh boundary,
          so the matching skeleton shows instantly instead of the page freezing
          on the previous view while the lazy chunk downloads. */}
      <Routes>
        <Route
          path="/"
          element={withSuspense(
            <TripsOverview
              trips={trips}
              onDeleteTrip={handleDeleteTrip}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              error={loadError}
              onRetry={() => fetchTrips()}
            />,
            <TripsOverviewSkeleton />
          )}
        />
        <Route
          path="/all-trips"
          element={withSuspense(<AllTrips trips={trips} onDeleteTrip={handleDeleteTrip} />, <AllTripsSkeleton />)}
        />
        <Route
          path="/trip/:id"
          element={withSuspense(<TripDetail trips={trips} onUpdateTrip={handleUpdateTrip} />, <TripDetailSkeleton />)}
        />
        <Route
          path="/map"
          element={withSuspense(<MapPage trips={trips} />, <MapSkeleton />)}
        />
        <Route
          path="/trash"
          element={withSuspense(<Trash onTripsChanged={() => fetchTrips(true)} />, <ContentSkeleton />)}
        />
        <Route
          path="/statistics"
          element={withSuspense(<Statistics trips={trips} />, <StatisticsSkeleton />)}
        />
        <Route
          path="/settings"
          element={withSuspense(<Settings onConvertCurrency={handleConvertCurrency} />, <SettingsSkeleton />)}
        />
        <Route
          path="/budget"
          element={withSuspense(<Budget trips={trips} onUpdateTrip={handleUpdateTrip} />, <BudgetSkeleton />)}
        />
        <Route
          path="/friends"
          element={withSuspense(<Friends />, <FriendsSkeleton />)}
        />
        <Route
          path="/add-friend/:token"
          element={withSuspense(<AddFriendInvite />, <ContentSkeleton />)}
        />
        <Route
          path="/profile/:userId"
          element={withSuspense(<FriendProfile />, <FriendProfileSkeleton />)}
        />
        <Route
          path="/profile/:userId/trip/:tripId"
          element={withSuspense(<ReadOnlyTripView />, <TripViewSkeleton />)}
        />
        <Route
          path="/admin/*"
          element={isAdmin ? withSuspense(<AdminHome />, <ContentSkeleton />) : <Navigate to="/dashboard" replace />}
        />
        <Route path="*" element={withSuspense(<DashboardNotFound />, <ContentSkeleton />)} />
      </Routes>
    </DashboardLayout>
  );
};

export default DashboardHome;
