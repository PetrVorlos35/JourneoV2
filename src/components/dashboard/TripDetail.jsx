import { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Pencil, PackageOpen, Link as LinkIcon, Users, Eye, Heart, Wallet, FileDown, MapPinned, NotebookText, Plus, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { format, eachDayOfInterval, differenceInCalendarDays, startOfDay } from 'date-fns';
import { cs, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useDialog } from '../ui/DialogModal';
import CharCount from '../ui/CharCount';
import LikeButton from '../ui/LikeButton';
import ShareTripModal from './ShareTripModal';
import TripPdfExport from './TripPdfExport';
import TripPdfOptionsModal from './TripPdfOptionsModal';
import Budget from './Budget';
import DayStrip from './trip/DayStrip';
import DayPage from './trip/DayPage';
import PackingTool from './trip/PackingTool';
import NotesTool from './trip/NotesTool';
import WelcomeChecklist from './trip/WelcomeChecklist';
import { getWelcome, updateWelcome } from '../../utils/onboarding';
import { useCurrency } from '../../contexts/CurrencyContext';
import { formatCurrency } from '../../utils/currency';

// Mapa se stahuje až při otevření záložky — Leaflet a jeho CSS tak
// nezatěžují detail výletu, který se otevírá mnohem častěji.
const TripMap = lazy(() => import('./TripMap'));

const TOOL_VIEWS = ['packing', 'documents', 'map', 'budget'];
const AUTOSAVE_DELAY = 800;

// Stránky programu pro každý den výletu, doplněné o uložené aktivity.
const buildDailyPlans = (trip) => {
  const days = eachDayOfInterval({ start: new Date(trip.startDate), end: new Date(trip.endDate) });
  const existing = trip.activities || [];
  return days.map((date, index) => ({
    date,
    title: existing[index]?.title || `Den ${index + 1}`,
    plan: existing[index]?.plan || '',
    location: existing[index]?.location || '',
  }));
};

const isEditableTarget = (el) =>
  el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);

const SaveStatus = ({ state, onRetry, t }) => {
  if (state === 'idle') return null;
  if (state === 'error') {
    return (
      <button onClick={onRetry} className="inline-flex items-center gap-1.5 text-danger font-semibold hover:underline underline-offset-2 cursor-pointer">
        <AlertCircle size={14} strokeWidth={2.5} aria-hidden="true" /> {t('tripDetail.notebook.saveError')}
      </button>
    );
  }
  const busy = state === 'pending' || state === 'saving';
  return (
    <span role="status" className="inline-flex items-center gap-1.5 text-muted">
      {busy
        ? <Loader2 size={13} strokeWidth={2.5} className="animate-spin" aria-hidden="true" />
        : <Check size={14} strokeWidth={2.5} className="text-success" aria-hidden="true" />}
      {busy ? t('tripDetail.notebook.saving') : t('tripDetail.notebook.saved')}
    </span>
  );
};

const TripDetail = ({ trips, onUpdateTrip }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get('from');
  const { confirmDialog, ModalPortal } = useDialog();
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();
  const trip = trips.find(tr => tr.id === id);

  const dateLocale = i18n.language?.startsWith('en') ? enUS : cs;
  const backHref = fromParam === 'all' ? '/dashboard/all-trips' : '/dashboard';
  const backText = t(fromParam === 'all' ? 'tripDetail.backToAll' : 'tripDetail.backToDashboard');

  // ?view=packing|documents|map|budget otevře rovnou nástroj (odkazuje sem
  // karta připravenosti na přehledu), ?day=3 konkrétní den (1-based, ze
  // Spotlightu).
  const viewParam = searchParams.get('view');
  const dayParam = parseInt(searchParams.get('day'), 10);
  const deepLinkedDay = Number.isInteger(dayParam) && dayParam > 0 ? dayParam - 1 : null;
  const isToolView = TOOL_VIEWS.includes(viewParam);

  const [view, setView] = useState(isToolView ? viewParam : 'program');
  const [dayIndex, setDayIndex] = useState(deepLinkedDay ?? 0);
  const [flipDir, setFlipDir] = useState(1);
  const lastNonMapView = useRef('program');

  const [dailyPlans, setDailyPlans] = useState([]);
  const [packingList, setPackingList] = useState(trip?.packingList || []);
  const [documents, setDocuments] = useState(trip?.documents || []);
  const [tripTitle, setTripTitle] = useState(trip?.title || '');
  const [editingTitle, setEditingTitle] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);
  // Uvítací checklist u výletu založeného v onboardingu nebo zkopírovaného.
  const [welcome, setWelcome] = useState(() => getWelcome(id));
  const [showPdfOptions, setShowPdfOptions] = useState(false);
  const [pdfSections, setPdfSections] = useState(null);
  const [addExpenseRequest, setAddExpenseRequest] = useState(0);
  const { currency } = useCurrency();

  // ── Autosave ────────────────────────────────────────────────────────────
  // Každá úprava zvýší verzi; po krátké pauze v psaní se uloží poslední stav.
  // Ukládání běží za sebou (řetěz promisů), aby starší požadavek nepřepsal
  // novější. Při odchodu ze stránky se rozepsaná změna dopíše hned.
  const [editVersion, setEditVersion] = useState(0);
  const [saveState, setSaveState] = useState('idle');
  const pendingRef = useRef(false);
  const chainRef = useRef(Promise.resolve());
  const latestRef = useRef(null);
  latestRef.current = { trip, tripTitle, dailyPlans, packingList, documents };

  // Rodič předává onUpdateTrip jako novou funkci při každém renderu; přes ref
  // zůstane flushSave stabilní a debounce/flush při odchodu se neresetují.
  const onUpdateTripRef = useRef(onUpdateTrip);
  onUpdateTripRef.current = onUpdateTrip;

  const markDirty = () => setEditVersion(v => v + 1);

  const flushSave = useCallback(() => {
    pendingRef.current = false;
    setSaveState('saving');
    chainRef.current = chainRef.current.then(async () => {
      const s = latestRef.current;
      if (!s?.trip) return;
      try {
        await onUpdateTripRef.current({
          ...s.trip,
          title: s.tripTitle,
          activities: s.dailyPlans,
          packingList: s.packingList,
          documents: s.documents,
        });
        if (!pendingRef.current) setSaveState('saved');
      } catch (err) {
        // Někdo výlet mezitím uložil jinde: převezmi jeho verzi (hlášku ukáže
        // DashboardHome). latestRef se přepisuje hned, protože další uložení
        // ve frontě může běžet dřív, než React překreslí, a poslalo by staré
        // rozepsané údaje, které by cizí změny znovu přepsaly.
        if (err?.code === 'TRIP_CONFLICT' && err.trip) {
          const plans = buildDailyPlans(err.trip);
          const fresh = err.trip;
          latestRef.current = {
            trip: fresh,
            tripTitle: fresh.title,
            dailyPlans: plans,
            packingList: fresh.packingList || [],
            documents: fresh.documents || [],
          };
          pendingRef.current = false;
          setTripTitle(fresh.title);
          setDailyPlans(plans);
          setPackingList(fresh.packingList || []);
          setDocuments(fresh.documents || []);
          setSaveState('idle');
          return;
        }
        setSaveState('error');
      }
    });
  }, []);

  useEffect(() => {
    if (!editVersion) return;
    pendingRef.current = true;
    setSaveState('pending');
    const timer = setTimeout(flushSave, AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
  }, [editVersion, flushSave]);

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (pendingRef.current) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      if (pendingRef.current) flushSave();
    };
  }, [flushSave]);

  // ── Data výletu ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (trip) setTripTitle(trip.title);
  }, [trip?.id]);

  useEffect(() => {
    setWelcome(getWelcome(id));
  }, [id]);

  useEffect(() => {
    if (!trip) return;
    const plans = buildDailyPlans(trip);
    setDailyPlans(plans);
    setPackingList(trip.packingList || []);
    setDocuments(trip.documents || []);

    // Bez deep-linku otevři dnešek, pokud výlet právě probíhá.
    const today = startOfDay(new Date()).getTime();
    const todayIndex = plans.findIndex(d => startOfDay(new Date(d.date)).getTime() === today);
    if (todayIndex !== -1 && !isToolView && deepLinkedDay === null) setDayIndex(todayIndex);
  }, [trip?.id]);

  // Deep-link se může změnit i bez přemontování (Spotlight skočí ze dne 2
  // na den 5 téhož výletu).
  useEffect(() => {
    if (isToolView) setView(viewParam);
    else if (deepLinkedDay !== null) { setDayIndex(deepLinkedDay); setView('program'); }
  }, [trip?.id, viewParam, deepLinkedDay, isToolView]);

  // ── Navigace ve stránkách ───────────────────────────────────────────────
  const goToDay = useCallback((index) => {
    if (index < 0 || index >= dailyPlans.length) return;
    setFlipDir(index >= dayIndex ? 1 : -1);
    setDayIndex(index);
    setView('program');
  }, [dailyPlans.length, dayIndex]);

  const openView = (next) => {
    if (next !== 'map') lastNonMapView.current = next;
    setFlipDir(1);
    setView(next);
  };

  // Šipky ←/→ listují dny, pokud se zrovna nepíše do pole.
  useEffect(() => {
    const onKey = (e) => {
      if (view !== 'program' || e.altKey || e.ctrlKey || e.metaKey || isEditableTarget(document.activeElement)) return;
      if (e.key === 'ArrowLeft') goToDay(dayIndex - 1);
      if (e.key === 'ArrowRight') goToDay(dayIndex + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, dayIndex, goToDay]);

  // Swipe mezi dny na dotykových zařízeních — jen jasně vodorovné a rychlé
  // gesto, aby nekolidovalo se scrollováním a výběrem textu.
  const touchRef = useRef(null);
  const onTouchStart = (e) => {
    if (view !== 'program' || e.target.tagName === 'INPUT') { touchRef.current = null; return; }
    const p = e.touches[0];
    touchRef.current = { x: p.clientX, y: p.clientY, time: Date.now() };
  };
  const onTouchEnd = (e) => {
    const start = touchRef.current;
    touchRef.current = null;
    if (!start) return;
    const p = e.changedTouches[0];
    const dx = p.clientX - start.x;
    const dy = p.clientY - start.y;
    if (Math.abs(dx) > 70 && Math.abs(dy) < 45 && Date.now() - start.time < 600) {
      goToDay(dayIndex + (dx < 0 ? 1 : -1));
    }
  };

  if (!trip) {
    return (
      <div className="text-center py-20 text-muted font-bold text-xl">
        {t('tripDetail.notFound')}
        <br />
        <Link to="/dashboard" className="text-accent hover:text-blue-500 transition-colors mt-4 inline-block text-[13px] font-semibold">
          {t('tripDetail.backToOverview')}
        </Link>
      </div>
    );
  }

  const isViewer = trip.role === 'viewer';
  const isOwner = trip.role === 'owner';

  // ── Úpravy ──────────────────────────────────────────────────────────────
  const updateDay = (index, patch) => {
    setDailyPlans(prev => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
    markDirty();
  };

  const addPackingItem = (text) => {
    setPackingList(prev => [...prev, { id: Date.now().toString(), text, checked: false }]);
    markDirty();
  };

  const togglePackingItem = (itemId) => {
    setPackingList(prev => prev.map(item => (item.id === itemId ? { ...item, checked: !item.checked } : item)));
    markDirty();
  };

  const deletePackingItem = async (itemId) => {
    const ok = await confirmDialog({
      title: t('tripDetail.packing.delete.title'),
      message: t('tripDetail.packing.delete.message'),
      confirmLabel: t('tripDetail.packing.delete.confirm'),
      variant: 'danger',
    });
    if (!ok) return;
    setPackingList(prev => prev.filter(item => item.id !== itemId));
    markDirty();
  };

  const addDocument = (title, content) => {
    setDocuments(prev => [...prev, { id: Date.now().toString(), title, content }]);
    markDirty();
  };

  const deleteDocument = async (docId) => {
    const ok = await confirmDialog({
      title: t('tripDetail.documents.delete.title'),
      message: t('tripDetail.documents.delete.message'),
      confirmLabel: t('tripDetail.documents.delete.confirm'),
      variant: 'danger',
    });
    if (!ok) return;
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
    markDirty();
  };

  // ── Odvozené údaje ──────────────────────────────────────────────────────
  const start = startOfDay(new Date(trip.startDate));
  const end = startOfDay(new Date(trip.endDate));
  const today = startOfDay(new Date());
  const tripLength = differenceInCalendarDays(end, start) + 1;
  const untilStart = differenceInCalendarDays(start, today);
  const timing = untilStart > 0
    ? t('tripDetail.notebook.countdown', { count: untilStart })
    : untilStart === 0
      ? t('tripDetail.notebook.departsToday')
      : today > end
        ? t('tripDetail.notebook.ended')
        : t('tripDetail.notebook.traveling', { n: differenceInCalendarDays(today, start) + 1 });

  const expensesTotal = (trip.expenses || []).reduce((s, e) => s + e.amount, 0);
  const packedCount = packingList.filter(i => i.checked).length;

  const tabs = [
    { id: 'program', Icon: NotebookText, label: t('tripDetail.notebook.program'), short: t('tripDetail.notebook.program'), status: dailyPlans.length ? t('tripDetail.notebook.programStatus', { n: dayIndex + 1, total: dailyPlans.length }) : '' },
    { id: 'packing', Icon: PackageOpen, label: t('tripDetail.notebook.packing'), short: t('tripDetail.notebook.packing'), status: packingList.length ? `${packedCount}/${packingList.length}` : '—' },
    { id: 'documents', Icon: LinkIcon, label: t('tripDetail.tools.documents'), short: t('tripDetail.mobile.links'), status: documents.length ? String(documents.length) : '—' },
    { id: 'map', Icon: MapPinned, label: t('tripDetail.tools.map'), short: t('tripDetail.tools.map'), status: t('tripDetail.notebook.mapStatus') },
    { id: 'budget', Icon: Wallet, label: t('tripDetail.tools.budget'), short: t('tripDetail.mobile.budget'), status: expensesTotal > 0 ? formatCurrency(expensesTotal, currency, i18n.language) : t('tripDetail.notebook.noExpenses') },
  ];
  const activeTab = tabs.find(tab => tab.id === view);

  const pdfAvailability = {
    itinerary: dailyPlans.length > 0,
    packing: packingList.length > 0,
    documents: documents.length > 0,
    budget: (trip.expenses?.length > 0) || !!trip.budgetTarget,
  };
  const pdfCounts = {
    itinerary: `${dailyPlans.length} ${t('pdf.days')}`,
    packing: `${packedCount}/${packingList.length} ${t('tripDetail.mobile.items')}`,
    documents: `${documents.length} ${t('tripDetail.mobile.records')}`,
    budget: expensesTotal > 0 ? formatCurrency(expensesTotal, currency, i18n.language) : t('tripDetail.mobile.budgetEmpty'),
  };

  const pageKey = view === 'program' ? `day-${dayIndex}` : view;
  const flip = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0.05 } } }
    : {
        // Odchozí stránka zmizí skoro hned — rozpočet je namontovaný mimo
        // animaci, takže pomalý odchod by se s ním na chvíli překrýval.
        initial: { opacity: 0, x: 28 * flipDir },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, transition: { duration: 0.05 } },
      };

  const iconButton = 'w-11 h-11 flex items-center justify-center rounded-2xl bg-white dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-soft hover:bg-gray-50 dark:hover:bg-white/10 hover:text-primary active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0';

  const day = dailyPlans[dayIndex];

  const markInvited = () => {
    updateWelcome(trip.id, { invited: true });
    setWelcome(w => (w ? { ...w, invited: true } : w));
  };
  const dismissWelcome = () => {
    updateWelcome(trip.id, { dismissed: true });
    setWelcome(null);
  };
  const welcomeTasks = welcome && !isViewer ? [
    { id: 'created', label: t(welcome.source === 'copy' ? 'onboarding.checklist.copied' : 'onboarding.checklist.created'), done: true },
    // Předvyplněné balení se odškrtává, prázdné se teprve píše.
    welcome.prefilledPacking === false
      ? { id: 'packing', label: t('onboarding.checklist.packingOwn'), done: packingList.length > 0, onClick: () => openView('packing') }
      : { id: 'packing', label: t('onboarding.checklist.packing'), done: packingList.some(i => i.checked), onClick: () => openView('packing') },
    { id: 'plan', label: t('onboarding.checklist.plan'), done: dailyPlans.some(d => d.plan?.trim()), onClick: () => goToDay(0) },
    ...(isOwner ? [{ id: 'invite', label: t('onboarding.checklist.invite'), done: !!welcome.invited, onClick: () => setShowShareModal(true) }] : []),
  ] : null;

  const headerActions = (
    <>
            <div className="hidden sm:flex items-center mr-2">
              {isOwner ? (
                <span className="flex items-center gap-1.5 text-gray-400 dark:text-white/30 select-none">
                  <Heart size={16} strokeWidth={2} />
                  <span className="text-[13px] font-semibold tabular-nums">{trip.likes || 0}</span>
                </span>
              ) : (
                <LikeButton tripId={trip.id} initialLikes={trip.likes || 0} initialIsLiked={trip.isLiked || false} />
              )}
            </div>
            <button
              onClick={() => openView('map')}
              className={`${iconButton} lg:hidden`}
              title={t('tripDetail.tools.map')}
              aria-label={t('tripDetail.tools.map')}
            >
              <MapPinned size={18} strokeWidth={2.25} />
            </button>
            <button
              onClick={() => setShowPdfOptions(true)}
              disabled={!!pdfSections}
              className={iconButton}
              title={t('tripDetail.exportPdf')}
              aria-label={t('tripDetail.exportPdf')}
            >
              <FileDown size={18} strokeWidth={2.25} />
            </button>
            {isOwner && (
              <button
                onClick={() => setShowShareModal(true)}
                aria-label={t('shareModal.shareButton')}
                className="h-11 w-11 sm:w-auto sm:px-5 flex items-center justify-center gap-2 rounded-2xl bg-ink text-white dark:text-gray-900 text-[14px] font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Users size={17} strokeWidth={2.5} />
                <span className="hidden sm:inline">{t('shareModal.shareButton')}</span>
              </button>
            )}
    </>
  );

  return (
    <div className="w-full flex flex-col pb-40 lg:pb-12">
      {ModalPortal}
      <ShareTripModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} trip={trip} onInvited={markInvited} />
      <TripPdfOptionsModal
        isOpen={showPdfOptions}
        onClose={() => setShowPdfOptions(false)}
        availability={pdfAvailability}
        counts={pdfCounts}
        onConfirm={setPdfSections}
      />
      {pdfSections && (
        <TripPdfExport
          trip={trip}
          dailyPlans={dailyPlans}
          packingList={packingList}
          documents={documents}
          sections={pdfSections}
          onDone={() => setPdfSections(null)}
        />
      )}

      {/* ── Hlavička ── */}
      <header className="mb-5 sm:mb-8">
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => navigate(backHref)} className="inline-flex items-center py-2 -my-2 text-[13px] font-semibold text-muted hover:text-primary transition-colors cursor-pointer">
            <ArrowLeft size={16} className="mr-2" strokeWidth={2.5} /> {backText}
          </button>
          {/* Na mobilu akce v řádku se zpětným odkazem, aby měl název celou šířku */}
          <div className="flex sm:hidden items-center gap-2">{headerActions}</div>
        </div>

        <div className="mt-3 sm:mt-5 flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            {!isViewer && editingTitle ? (
              <div>
                <input
                  value={tripTitle}
                  maxLength={255}
                  autoFocus
                  aria-label={t('tripDetail.rename')}
                  onChange={e => { setTripTitle(e.target.value); markDirty(); }}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(false); }}
                  onBlur={() => setEditingTitle(false)}
                  className="w-full -mx-2 px-2 py-0.5 rounded-2xl bg-white dark:bg-white/5 border border-blue-500/40 ring-4 ring-blue-500/10 text-[26px] sm:text-5xl font-bold tracking-tight text-primary focus:outline-none"
                />
                {tripTitle.length >= 200 && <div className="mt-1"><CharCount value={tripTitle} max={255} /></div>}
              </div>
            ) : (
              <h1 className="text-[26px] sm:text-5xl font-bold tracking-tight leading-[1.1] text-primary break-words" style={{ textWrap: 'balance' }}>
                {isViewer ? tripTitle : (
                  <button
                    onClick={() => setEditingTitle(true)}
                    title={t('tripDetail.rename')}
                    className="group text-left -mx-2 px-2 rounded-2xl hover:bg-gray-100/70 dark:hover:bg-white/5 transition-colors cursor-text"
                  >
                    {tripTitle}
                    <Pencil size={20} strokeWidth={2} className="inline-block ml-3 -mt-1 align-middle text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                  </button>
                )}
              </h1>
            )}

            <div className="mt-2.5 sm:mt-3 overflow-hidden">
            <p className="meta-dots -ml-5 flex flex-wrap items-center gap-y-1 text-[14px] font-medium text-muted">
              <span className="text-primary font-semibold">
                {format(start, 'd. MMM', { locale: dateLocale })} – {format(end, 'd. MMM yyyy', { locale: dateLocale })}
              </span>
              <span className="whitespace-nowrap">{t('tripDetail.notebook.days', { count: tripLength })}</span>
              <span className="whitespace-nowrap">{timing}</span>
              {trip.role && !isOwner && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${
                  isViewer ? 'bg-readonly text-readonly' : 'bg-editor text-editor'
                }`}>
                  {isViewer ? <Eye size={12} strokeWidth={2.5} /> : <Pencil size={12} strokeWidth={2.5} />}
                  {t(`tripDetail.roles.${trip.role}`)}
                </span>
              )}
              {!isViewer && saveState !== 'idle' && (
                <span className="whitespace-nowrap inline-flex items-center">
                  <SaveStatus state={saveState} onRetry={flushSave} t={t} />
                </span>
              )}
            </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 shrink-0 pt-1">{headerActions}</div>
        </div>

        {isViewer && (
          <p className="mt-5 inline-flex items-center gap-2.5 px-4 py-2.5 bg-readonly rounded-2xl text-[13px] font-semibold text-readonly">
            <Eye size={15} strokeWidth={2.5} className="shrink-0" />
            {t('tripDetail.viewerBanner')}
          </p>
        )}
      </header>

      <AnimatePresence initial={false}>
        {welcomeTasks && (
          <WelcomeChecklist
            key="welcome"
            title={t(welcome.source === 'copy' ? 'onboarding.checklist.titleCopy' : 'onboarding.checklist.title')}
            tasks={welcomeTasks}
            onDismiss={dismissWelcome}
          />
        )}
      </AnimatePresence>

      {/* ── Pás dnů ── */}
      <div className="mb-4 sm:mb-5 lg:pr-[176px]">
        <DayStrip days={dailyPlans} activeIndex={dayIndex} dimmed={view !== 'program'} onSelect={goToDay} dateLocale={dateLocale} />
      </div>

      {/* ── Stránka + záložky ── */}
      <div className="flex items-start">
        <section
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          aria-label={activeTab?.label}
          className={`relative flex flex-col flex-1 min-w-0 bg-page border border-gray-200/80 dark:border-white/10 rounded-[1.75rem] shadow-[0_1px_2px_rgba(17,24,39,0.04),0_12px_32px_-16px_rgba(17,24,39,0.12)] min-h-[calc(100dvh-22rem)] lg:min-h-[calc(100dvh-22rem)] ${view === 'map' ? 'overflow-hidden' : ''}`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pageKey}
              {...flip}
              transition={{ duration: reduceMotion ? 0.12 : 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col"
            >
              {view === 'program' && day && (
                <DayPage
                  day={day}
                  index={dayIndex}
                  days={dailyPlans}
                  isViewer={isViewer}
                  onChange={(patch) => updateDay(dayIndex, patch)}
                  onNavigate={goToDay}
                  dateLocale={dateLocale}
                />
              )}

              {(view === 'packing' || view === 'documents' || view === 'budget') && (
                <div>
                  <div className="flex items-center justify-between gap-4 px-5 sm:px-10 pt-6 sm:pt-9 pb-6">
                    <h2 className="text-[28px] sm:text-4xl font-bold tracking-tight text-primary">{activeTab.label}</h2>
                    <button
                      onClick={() => setView('program')}
                      aria-label={t('tripDetail.notebook.backToProgram')}
                      title={t('tripDetail.notebook.backToProgram')}
                      className="hidden lg:flex w-10 h-10 items-center justify-center rounded-xl text-gray-400 hover:text-primary hover:bg-subtle transition-colors cursor-pointer"
                    >
                      <X size={20} strokeWidth={2.25} />
                    </button>
                  </div>
                  <div className="px-5 sm:px-10 pb-8 sm:pb-10">
                    {view === 'packing' && (
                      <PackingTool items={packingList} isViewer={isViewer} onAdd={addPackingItem} onToggle={togglePackingItem} onDelete={deletePackingItem} />
                    )}
                    {view === 'documents' && (
                      <NotesTool documents={documents} isViewer={isViewer} onAdd={addDocument} onDelete={deleteDocument} />
                    )}
                  </div>
                </div>
              )}

              {/* Mapa — montuje se až po otevření, aby se Leaflet neinicializoval
                  do skrytého kontejneru. Na mobilu si TripMap vykreslí vlastní
                  celoobrazovkovou vrstvu (portál), proto je box jen pro lg+. */}
              {view === 'map' && (
                <div className="hidden lg:flex flex-col h-[calc(100dvh-17rem)] min-h-[560px]">
                  <Suspense fallback={<div className="flex-1 skeleton" />}>
                    <TripMap
                      trip={trip}
                      dayCount={dailyPlans.length}
                      canEdit={!isViewer}
                      onExit={() => setView(lastNonMapView.current)}
                    />
                  </Suspense>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Rozpočet zůstává namontovaný, aby šlo „+ Výdaj“ otevřít odkudkoli. */}
          <div className={view === 'budget' ? 'px-5 sm:px-10 pb-8 sm:pb-10 -mt-2' : 'hidden'}>
            <Budget trips={[trip]} onUpdateTrip={onUpdateTrip} hideHeader addRequest={addExpenseRequest} />
          </div>
        </section>

        {/* Záložky na hraně stránky (desktop) */}
        <nav aria-label={t('tripDetail.tabs.tools')} className="hidden lg:flex flex-col w-[176px] shrink-0 sticky top-6 pt-8">
          {tabs.map(({ id: tabId, Icon, label, status }) => {
            const active = view === tabId;
            return (
              <button
                key={tabId}
                onClick={() => (tabId === 'program' ? setView('program') : openView(tabId))}
                aria-current={active ? 'page' : undefined}
                className={`relative -mt-px first:mt-0 flex items-start gap-3 text-left pr-3 py-3.5 rounded-r-xl border border-l-0 transition-[background-color,color,margin,padding] duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
                  active
                    ? '-ml-px pl-[17px] mr-0 z-10 bg-page border-default text-primary shadow-[6px_4px_14px_-8px_rgba(17,24,39,0.16)]'
                    : 'pl-4 mr-3 bg-[#f1f1f4] dark:bg-[#151517] border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-400 hover:mr-1.5 hover:text-primary'
                }`}
              >
                <Icon size={18} strokeWidth={2.25} className={`mt-0.5 shrink-0 ${active ? 'text-accent' : ''}`} aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold leading-tight">{label}</span>
                  <span className="block text-[12px] font-medium mt-0.5 truncate tabular-nums text-gray-600 dark:text-gray-400">{status}</span>
                </span>
              </button>
            );
          })}
          {!isViewer && (
            <button
              onClick={() => setAddExpenseRequest(n => n + 1)}
              className="mt-4 mr-3 h-11 flex items-center justify-center gap-2 rounded-2xl bg-accent text-white text-[14px] font-semibold hover:bg-accent-hover active:scale-95 transition-all shadow-[0_6px_16px_-8px_rgba(37,99,235,0.7)] cursor-pointer"
            >
              <Plus size={17} strokeWidth={2.5} /> {t('tripDetail.notebook.addExpense')}
            </button>
          )}
        </nav>
      </div>

      {/* ── Mobilní spodní lišta: Program · Balení · [+ Výdaj] · Odkazy · Rozpočet ── */}
      <nav
        aria-label={t('tripDetail.tabs.tools')}
        className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-page/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-white/10 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="max-w-xl mx-auto grid grid-cols-5 items-end px-2 pt-1.5">
          {['program', 'packing', 'add', 'documents', 'budget'].map((slot) => {
            if (slot === 'add') {
              return isViewer ? <span key="add" /> : (
                <button
                  key="add"
                  onClick={() => setAddExpenseRequest(n => n + 1)}
                  aria-label={t('budget.addExpense')}
                  className="flex flex-col items-center gap-1 pb-1.5 cursor-pointer group"
                >
                  <span className="-mt-5 w-14 h-14 rounded-2xl bg-accent text-white flex items-center justify-center shadow-[0_8px_20px_-8px_rgba(37,99,235,0.7)] group-active:scale-95 transition-transform">
                    <Plus size={26} strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <span className="text-[11px] font-semibold text-active">{t('tripDetail.notebook.addExpense')}</span>
                </button>
              );
            }
            const { Icon, short } = tabs.find(tab => tab.id === slot);
            const active = view === slot;
            return (
              <button
                key={slot}
                onClick={() => (slot === 'program' ? setView('program') : openView(slot))}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 py-1.5 min-h-[52px] rounded-xl transition-colors cursor-pointer ${
                  active ? 'text-accent' : 'text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-white/5'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                <span className="text-[11px] font-semibold">{short}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default TripDetail;
