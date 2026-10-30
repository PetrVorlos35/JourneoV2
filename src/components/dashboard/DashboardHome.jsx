import React, { Suspense, lazy, useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import DashboardLayout from './DashboardLayout';
import DashboardNotFound from './DashboardNotFound';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { showUndoToast } from '../ui/undoToast';
import { pushUndo, clearUndo } from '../../hooks/undoStack';
import { buildStarterDays, buildStarterPacking, startWelcome } from '../../utils/onboarding';
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
const TripComposer = lazy(() => import('./TripComposer'));
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

// Výdaje ze serveru dostanou ID výdajů, které už klient má (shoda podle
// obsahu), aby se řádky po uložení nepřemountovaly a znovu neanimovaly.
const expenseSignature = (e) => [e.description, Number(e.amount), e.category, e.date, e.paidBy ?? '', e.originalCurrency ?? '', Number(e.originalAmount ?? 0)].join('|');
const keepExpenseIds = (serverExpenses = [], localExpenses = []) => {
  const pool = new Map();
  for (const e of localExpenses) {
    const key = expenseSignature(e);
    if (!pool.has(key)) pool.set(key, []);
    pool.get(key).push(e.id);
  }
  return serverExpenses.map((e) => {
    const ids = pool.get(expenseSignature(e));
    return ids?.length ? { ...e, id: ids.shift() } : e;
  });
};

const DashboardHome = () => {
  const { isAdmin } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchParams] = useSearchParams();

  // Zakládání výletu je vlastní stránka (/dashboard/new), takže funguje
  // šipka zpět i odkaz a sidebar zůstává na místě.
  const openNewTrip = (destination = '') => {
    navigate(destination ? `/dashboard/new?plan=${encodeURIComponent(destination)}` : '/dashboard/new');
  };

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
  const saveSeqRef = useRef(new Map());
  const confirmedRef = useRef(new Map());

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

  // Každý nový výlet (z onboardingu i z „+ Vytvořit výlet“) se založí rovnou
  // vyplněný: dny, balení podle typu výletu, destinace na mapě. Každý hotový
  // krok se hlásí přes onStep, kroky mají krátké minimum, ať je průběh vidět,
  // i když server odpoví hned. Uvítací checklist dostane jen první výlet.
  const handleCreateStarterTrip = async ({ title, startDate, endDate, place, type }, onStep) => {
    const beat = () => new Promise(resolve => setTimeout(resolve, 350));
    const isFirstTrip = trips.length === 0;
    let created = null;
    const finish = (trip) => {
      setTrips(prev => (prev.some(tr => tr.id === trip.id) ? prev : [...prev, trip]));
      // replace: šipka zpět z nového výletu nemá vést znovu na zakládání.
      navigate(`/dashboard/trip/${trip.id}?from=dashboard`, { replace: true });
    };
    try {
      [{ trip: created }] = await Promise.all([api.trips.create({ title, startDate, endDate }), beat()]);
      // Do seznamu výletů až na konci: s prvním výletem by přehled hned
      // vyměnil průběh za běžný dashboard.
      versionsRef.current.set(created.id, created.version);
      onStep('trip');

      const activities = buildStarterDays(t, startDate, endDate, title);
      await beat();
      onStep('days');

      // Balení jen když si uživatel vybral typ výletu, jinak si ho napíše sám.
      const packingList = type ? buildStarterPacking(t, type) : [];
      const [filled] = await Promise.all([handleUpdateTrip({ ...created, activities, packingList }), beat()]);
      if (type) onStep('packing');

      if (place) {
        // Místo k prvnímu dni jako z itineráře, takže ho pozdější import
        // z programu nezaloží podruhé. Bez mapy se výlet obejde.
        await Promise.all([
          api.places.create({
            tripId: created.id,
            dayIndex: 0,
            name: place.name,
            address: place.address,
            lat: place.lat,
            lng: place.lng,
            countryCode: place.countryCode,
            city: place.city,
            source: 'itinerary',
          }).catch(err => console.error('Starter place failed:', err)),
          beat(),
        ]);
        onStep('map');
      }

      if (isFirstTrip) startWelcome(created.id, 'starter', { prefilledPacking: !!type });
      await beat();
      finish(filled || created);
    } catch (err) {
      // Výlet už existuje, jen se nepovedlo ho vyplnit: pustit uživatele
      // dovnitř, ať druhým pokusem nevznikne duplikát.
      if (created) {
        finish(created);
        return;
      }
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
    toastId = showUndoToast({
      title: trip.title,
      message: t('dashboardHome.tripDeleted'),
      undoLabel: t('dashboardHome.undo'),
      onUndo: () => undoAction.undo(),
    });
  };

  // Výdaje a limit rozpočtu se ukážou hned (optimisticky), server je jen
  // potvrdí. Ostatní části výletu si drží TripDetail ve vlastním stavu.
  //  - Odpověď serveru se použije jen z posledního uložení ve frontě, jinak
  //    by odpověď na první výdaj na chvíli schovala druhý, přidaný mezitím.
  //  - Server dává výdajům při každém uložení nová ID; shodné výdaje si
  //    nechají ta dosavadní, ať se řádky znovu nepřekreslují s animací.
  //  - Když uložení selže, výdaje se vrátí na poslední potvrzený stav.
  const handleUpdateTrip = (updatedTrip) => {
    const id = updatedTrip.id;
    const gen = conflictGenRef.current.get(id) || 0;
    const previous = saveChainsRef.current.get(id) || Promise.resolve();
    const seq = (saveSeqRef.current.get(id) || 0) + 1;
    saveSeqRef.current.set(id, seq);

    const optimistic = {};
    if (updatedTrip.expenses !== undefined) optimistic.expenses = updatedTrip.expenses;
    if (updatedTrip.budgetTarget !== undefined) optimistic.budgetTarget = updatedTrip.budgetTarget;
    if (Object.keys(optimistic).length > 0) {
      setTrips(prev => prev.map(trip => {
        if (trip.id !== id) return trip;
        if (!confirmedRef.current.has(id)) {
          confirmedRef.current.set(id, { expenses: trip.expenses, budgetTarget: trip.budgetTarget });
        }
        return { ...trip, ...optimistic };
      }));
    }

    const run = previous.catch(() => {}).then(async () => {
      if ((conflictGenRef.current.get(id) || 0) !== gen) return null;
      try {
        const data = await api.trips.update(id, {
          ...updatedTrip,
          version: versionsRef.current.get(id) ?? updatedTrip.version,
        });
        versionsRef.current.set(id, data.trip.version);
        confirmedRef.current.set(id, { expenses: data.trip.expenses, budgetTarget: data.trip.budgetTarget });
        if (saveSeqRef.current.get(id) === seq) {
          setTrips(prev => prev.map(trip => (trip.id === id
            ? { ...data.trip, expenses: keepExpenseIds(data.trip.expenses, trip.expenses) }
            : trip)));
        } else {
          setTrips(prev => prev.map(trip => (trip.id === id ? { ...trip, version: data.trip.version } : trip)));
        }
        return data.trip;
      } catch (err) {
        if (err.code === 'TRIP_CONFLICT' && err.trip) {
          conflictGenRef.current.set(id, gen + 1);
          versionsRef.current.set(id, err.trip.version);
          confirmedRef.current.set(id, { expenses: err.trip.expenses, budgetTarget: err.trip.budgetTarget });
          setTrips(prev => prev.map(trip => trip.id === id ? err.trip : trip));
          toast.error(t('dashboardHome.conflict'), { id: `trip-conflict-${id}`, duration: 7000 });
        } else {
          const confirmed = confirmedRef.current.get(id);
          if (confirmed && Object.keys(optimistic).length > 0) {
            setTrips(prev => prev.map(trip => (trip.id === id ? { ...trip, ...confirmed } : trip)));
          }
          toast.error(err.message || t('dashboardHome.updateError'));
        }
        throw err;
      }
    });

    saveChainsRef.current.set(id, run);
    return run;
  };

  // Změna měny výletu jde přes vlastní endpoint (přepočet všech částek dělá
  // server v jedné transakci), ale řadí se do stejné fronty jako ukládání.
  const handleChangeTripCurrency = (trip, currency, convert) => {
    const id = trip.id;
    const previous = saveChainsRef.current.get(id) || Promise.resolve();
    const run = previous.catch(() => {}).then(async () => {
      try {
        const data = await api.trips.changeCurrency(id, {
          currency,
          convert,
          version: versionsRef.current.get(id) ?? trip.version,
        });
        versionsRef.current.set(id, data.trip.version);
        setTrips(prev => prev.map(tr => (tr.id === id ? data.trip : tr)));
        return data.trip;
      } catch (err) {
        if (err.code === 'TRIP_CONFLICT' && err.trip) {
          conflictGenRef.current.set(id, (conflictGenRef.current.get(id) || 0) + 1);
          versionsRef.current.set(id, err.trip.version);
          setTrips(prev => prev.map(tr => (tr.id === id ? err.trip : tr)));
          toast.error(t('dashboardHome.conflict'), { id: `trip-conflict-${id}`, duration: 7000 });
        } else {
          toast.error(err.message || t('dashboardHome.currencyError'));
        }
        throw err;
      }
    });
    saveChainsRef.current.set(id, run);
    return run;
  };

  // ?plan=… z landing page: kdo už výlety má, jde rovnou na zakládání
  // s předvyplněnou destinací (bez výletů to řeší onboarding na přehledu).
  const planParam = searchParams.get('plan');
  useEffect(() => {
    if (loading || !planParam || trips.length === 0) return;
    navigate(`/dashboard/new?plan=${encodeURIComponent(planParam.slice(0, 255))}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, planParam]);

  if (loading) {
    return (
      <DashboardLayout trips={trips}>
        <TripsOverviewSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout trips={trips} onOpenCreateModal={() => openNewTrip()}>
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
              onOpenCreateModal={() => openNewTrip()}
              onCreateStarterTrip={handleCreateStarterTrip}
              error={loadError}
              onRetry={() => fetchTrips()}
            />,
            <TripsOverviewSkeleton />
          )}
        />
        <Route
          path="/new"
          element={withSuspense(
            <TripComposer
              key={planParam || 'new'}
              variant="new"
              initialDestination={(planParam || '').slice(0, 255)}
              onCreate={handleCreateStarterTrip}
            />,
            <ContentSkeleton />
          )}
        />
        <Route
          path="/all-trips"
          element={withSuspense(<AllTrips trips={trips} onDeleteTrip={handleDeleteTrip} />, <AllTripsSkeleton />)}
        />
        <Route
          path="/trip/:id"
          element={withSuspense(<TripDetail trips={trips} onUpdateTrip={handleUpdateTrip} onChangeCurrency={handleChangeTripCurrency} />, <TripDetailSkeleton />)}
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
          element={withSuspense(<Settings />, <SettingsSkeleton />)}
        />
        <Route
          path="/budget"
          element={withSuspense(<Budget trips={trips} onUpdateTrip={handleUpdateTrip} onChangeCurrency={handleChangeTripCurrency} />, <BudgetSkeleton />)}
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
