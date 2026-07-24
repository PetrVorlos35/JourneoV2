import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Plus, Pencil, Move, Trash2, Crosshair, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useMediaQuery from '../../hooks/useMediaQuery';
import useSlideOverA11y from '../../hooks/useSlideOverA11y';
import MapCanvas from './MapCanvas';
import MapFilters from './MapFilters';
import PlaceList from './PlaceList';
import PlaceForm from './PlaceForm';
import BottomSheet, { SNAP_HEIGHTS } from './BottomSheet';
import SidePanel from './SidePanel';
import { getCategory, categoryLabelKey } from './placeConfig';
import { DRAFT_MARKER_ID } from '../../hooks/useMapWorkspace';

const BAR_HEIGHT = SNAP_HEIGHTS.bar();
// Šířka bočního panelu na desktopu. Odečítá se při centrování křížku i při
// doladění výřezu, aby špendlíky a cíl nezmizely pod panelem.
const DESKTOP_PANEL_WIDTH = 360;

/**
 * Sjednocená plocha mapy míst — stejná pro globální mapu i mapu výletu, na
 * mobilu i desktopu. Mapa vyplňuje plochu, informace žijí v panelu vedle ní:
 * na mobilu v taženém bottom sheetu, na desktopu v plovoucím bočním panelu.
 *
 * Polohu se nezadává klepnutím, ale zaměřovačem: panel ustoupí, uprostřed
 * viditelné části mapy drží křížek a uživatel pod něj posouvá mapu. Prst ani
 * kurzor tak nikdy nezakrývá cíl — stejná interakce na obou zařízeních.
 */
const MapWorkspaceView = ({
  workspace,
  trips = [],
  tripId = null,
  dayCount = 0,
  canEdit = true,
  title,
  onBack,
  listExtra = null,
}) => {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const {
    places,
    visiblePlaces,
    markers,
    selectedPlace,
    selectedId,
    loading,
    saving,
    draft,
    filters,
    setFilters,
    focus,
    focusPlace,
    editPlace,
    handlePlaceMove,
    placeAt,
    handleSearchResult,
    handleLocate,
    isLocating,
    setIsMoving,
    setSelectedId,
    handleSave,
    handleDelete,
    closeDraft,
  } = workspace;

  const [isPlacing, setIsPlacing] = useState(false);
  const [snap, setSnap] = useState('peek');
  const [collapsed, setCollapsed] = useState(false);
  // Bumpnutím se změní fitKey a mapa znovu doladí výřez na všechna místa —
  // používá se při návratu z detailu zpět na přehled (mapa se oddálí).
  const [fitNonce, setFitNonce] = useState(0);
  const mapRef = useRef(null);
  // Kam se vrátit po zrušení umisťování — podle toho, odkud se spustilo.
  const placingReturnRef = useRef('list');

  const mode = isPlacing ? 'placing' : draft ? 'form' : selectedPlace ? 'place' : 'list';

  // Callback musí mít stálou identitu: useSlideOverA11y na jeho změnu
  // znovu přebírá fokus, a s inline arrow funkcí od rodiče by tak fokus
  // utekl z vyhledávacího pole po každém znaku.
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const requestBack = useCallback(() => onBackRef.current?.(), []);
  // Focus trap dává smysl jen v celoobrazovkové mobilní vrstvě; na desktopu
  // je mapa jen výsek dashboardu a nav vedle ní musí zůstat ovladatelná.
  const panelRef = useSlideOverA11y(!isDesktop, requestBack);

  // Každý režim má svoji výchozí polohu mobilního sheetu; uživatel s ní pak
  // může hýbat. Sbalení panelu (desktop) drží jen seznam — jakmile se otevře
  // detail, formulář nebo umisťování, panel se vždy rozbalí, ať je obsah vidět.
  useEffect(() => {
    if (mode === 'placing') setSnap('bar');
    else if (mode === 'form') setSnap('full');
    else setSnap('peek');
    if (mode !== 'list') setCollapsed(false);
  }, [mode]);

  const startPlacing = useCallback(() => {
    placingReturnRef.current = 'list';
    setIsPlacing(true);
  }, []);

  const cancelPlacing = useCallback(() => {
    setIsPlacing(false);
    setIsMoving(false);
    // Přesun spuštěný z náhledu místa po zrušení nesmí skončit v editaci —
    // uživatel chtěl couvnout, ne otevřít formulář.
    if (placingReturnRef.current === 'peek') closeDraft();
  }, [setIsMoving, closeDraft]);

  // Návrat na přehled: odznačí místo a mapu oddálí zpět na všechna místa.
  const backToOverview = useCallback(() => {
    setSelectedId(null);
    setFitNonce((n) => n + 1);
  }, [setSelectedId]);

  // Šipka zpět couvá po úrovních v rámci mapy: umisťování → zpět na předchozí
  // obsah, formulář → detail/seznam, detail → přehled (a mapa se oddálí na
  // všechna místa). Mapu nezavírá — z přehledu odejdeš navigací dashboardu
  // nebo záložkami výletu. Výjimkou je mobil, kde mapa překrývá celou
  // obrazovku, takže z přehledu je šipka jediná cesta ven.
  const handleBack = useCallback(() => {
    if (isPlacing) cancelPlacing();
    else if (draft) closeDraft();
    else if (selectedPlace) backToOverview();
    else if (!isDesktop) onBack?.();
  }, [isPlacing, cancelPlacing, draft, closeDraft, selectedPlace, backToOverview, isDesktop, onBack]);

  // Rozbalený panel na desktopu ukusuje z levé strany mapy — o tuhle šířku
  // se posouvá střed (křížek, přelet, doladění výřezu), ať cíl zůstane vpravo
  // od panelu. Při umisťování panel ustoupí kompaktní liště dole, takže se
  // střed nikam neposouvá a křížek míří doprostřed celé mapy.
  const panelInset = isDesktop && mode !== 'placing' && !collapsed ? DESKTOP_PANEL_WIDTH : 0;

  // Zaměřovač míří do středu *viditelné* části mapy: na mobilu nad pruh sheetu,
  // na desktopu vpravo od bočního panelu.
  const confirmPlacing = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const size = map.getSize();
    const point = isDesktop
      ? [(panelInset + size.x) / 2, size.y / 2]
      : [size.x / 2, (size.y - BAR_HEIGHT) / 2];
    const target = map.containerPointToLatLng(point);
    setIsPlacing(false);
    placeAt(target.lat, target.lng);
  }, [placeAt, isDesktop, panelInset]);

  const startMovingSelected = useCallback(
    (place) => {
      placingReturnRef.current = 'peek';
      editPlace(place);
      setIsMoving(true);
      setIsPlacing(true);
    },
    [editPlace, setIsMoving]
  );

  // Přesun spuštěný z otevřeného formuláře — po zrušení zůstane formulář.
  const startMovingFromForm = useCallback(() => {
    placingReturnRef.current = 'form';
    setIsMoving(true);
    setIsPlacing(true);
  }, [setIsMoving]);

  const actionButton =
    'min-h-[44px] px-4 rounded-2xl inline-flex items-center justify-center gap-2 text-[13px] font-semibold transition-colors cursor-pointer';

  // ── Obsah panelu podle režimu ─────────────────────────────
  let header = null;
  let body = null;
  let snapPoints = ['peek', 'half', 'full'];
  let bodyScroll = true;

  if (mode === 'placing') {
    snapPoints = ['bar'];
    header = (
      <div className="px-4 py-3 flex items-center gap-2">
        <button type="button" onClick={cancelPlacing} className={`${actionButton} flex-1 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200`}>
          {t('map.mobile.cancel')}
        </button>
        <button type="button" onClick={confirmPlacing} className={`${actionButton} flex-[1.4] bg-blue-600 text-white hover:bg-blue-700`}>
          <Crosshair size={16} strokeWidth={2.5} aria-hidden="true" />
          {t('map.mobile.placeHere')}
        </button>
      </div>
    );
  } else if (mode === 'form') {
    snapPoints = ['half', 'full'];
    bodyScroll = false;
    body = isDesktop ? (
      <div className="h-full min-h-0">
        <PlaceForm
          place={draft}
          variant="panel"
          trips={trips}
          lockedTripId={tripId}
          dayCount={dayCount}
          isSaving={saving}
          onToggleMove={startMovingFromForm}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={closeDraft}
        />
      </div>
    ) : (
      <div className="h-full min-h-0 -mx-4 px-4">
        <PlaceForm
          place={draft}
          variant="sheet"
          trips={trips}
          lockedTripId={tripId}
          dayCount={dayCount}
          isSaving={saving}
          onToggleMove={startMovingFromForm}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={closeDraft}
        />
      </div>
    );
  } else if (mode === 'place') {
    const { icon: Icon, color } = getCategory(selectedPlace.category);
    header = (
      <div className="px-4 pt-1 pb-3">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 w-9 h-9 shrink-0 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}22`, color }}
          >
            <Icon size={17} strokeWidth={2.5} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-bold text-gray-900 dark:text-white truncate">{selectedPlace.name}</h2>
            <p className="text-[12px] font-medium text-gray-500 dark:text-gray-400 truncate">
              {[
                t(`map.statuses.${selectedPlace.status}`),
                t(categoryLabelKey(selectedPlace.category)),
                selectedPlace.dayIndex != null
                  ? t('map.sheet.dayOption', { number: selectedPlace.dayIndex + 1 })
                  : null,
                selectedPlace.tripTitle,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>

        {canEdit && (
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => editPlace(selectedPlace)}
              className={`${actionButton} flex-1 bg-blue-600 text-white hover:bg-blue-700`}
            >
              <Pencil size={15} strokeWidth={2.5} aria-hidden="true" />
              {t('map.mobile.edit')}
            </button>
            <button
              type="button"
              onClick={() => startMovingSelected(selectedPlace)}
              className={`${actionButton} flex-1 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200`}
            >
              <Move size={15} strokeWidth={2.5} aria-hidden="true" />
              {t('map.mobile.move')}
            </button>
            <button
              type="button"
              onClick={() => handleDelete(selectedPlace)}
              aria-label={t('map.mobile.delete')}
              className="w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors cursor-pointer"
            >
              <Trash2 size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    );
    body = (
      <div className="space-y-4 pt-2">
        {selectedPlace.address && (
          <p className="flex items-start gap-2 text-[13px] font-medium text-gray-600 dark:text-gray-300">
            <MapPin size={14} strokeWidth={2.5} className="mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />
            {selectedPlace.address}
          </p>
        )}
        {selectedPlace.note && (
          <p className="text-[13px] font-medium text-gray-600 dark:text-gray-300 whitespace-pre-line">
            {selectedPlace.note}
          </p>
        )}
        <p className="text-[12px] font-semibold text-gray-400 tabular-nums">
          {selectedPlace.lat.toFixed(5)}, {selectedPlace.lng.toFixed(5)}
        </p>
      </div>
    );
  } else {
    header = (
      <div className="px-4 pt-1 pb-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-bold text-gray-900 dark:text-white truncate">{title}</h2>
          <p className="text-[12px] font-medium text-gray-500 dark:text-gray-400">
            {loading ? t('map.loading') : t('map.subtitle', { count: places.length })}
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={startPlacing}
            className={`${actionButton} shrink-0 bg-blue-600 text-white hover:bg-blue-700`}
          >
            <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
            {t('map.mobile.addPlace')}
          </button>
        )}
      </div>
    );
    body = (
      <div className="pt-2 space-y-4">
        {listExtra}
        <PlaceList
          places={visiblePlaces}
          selectedId={selectedId}
          onSelect={(place) => {
            focusPlace(place);
            if (!isDesktop) setSnap('peek');
          }}
          onEdit={editPlace}
          canEdit={canEdit}
          emptyLabel={places.length === 0 ? t('map.empty.title') : t('map.empty.filtered')}
        />
      </div>
    );
  }

  const canvas = (
    <MapCanvas
      places={markers}
      // Trasa dává smysl jen uvnitř výletu; na globální mapě by spojila
      // místa z různých výletů podle indexu dne.
      route={tripId ? workspace.route : null}
      selectedId={draft && !draft.id ? DRAFT_MARKER_ID : selectedId}
      onSelectPlace={focusPlace}
      onPlaceMove={handlePlaceMove}
      onMapReady={(map) => {
        mapRef.current = map;
      }}
      draggableId={canEdit ? (draft?.id ?? null) : null}
      focus={focus}
      // Po výběru sedí panel u kraje mapy — o jeho rozměr posuneme střed, aby
      // vybraný špendlík zůstal vidět (na mobilu nad sheetem, na desktopu
      // vpravo od panelu).
      focusOffsetY={isDesktop ? 0 : SNAP_HEIGHTS.peek()}
      fitPaddingBottom={isDesktop ? 0 : SNAP_HEIGHTS.peek()}
      focusOffsetX={panelInset}
      fitPaddingLeft={panelInset}
      fitKey={`${tripId ?? 'global'}:${fitNonce}`}
      showDayLabels={Boolean(tripId)}
      ariaLabel={title}
    />
  );

  const crosshair = isPlacing && (
    <div
      className="pointer-events-none absolute inset-0 z-[25] flex items-center justify-center"
      style={isDesktop ? { paddingLeft: panelInset } : { paddingBottom: BAR_HEIGHT }}
    >
      <div className="jn-crosshair" aria-hidden="true" />
      <p className="absolute top-[calc(50%+2.5rem)] px-3 py-1.5 rounded-full bg-black/70 text-white text-[12px] font-semibold">
        {t('map.mobile.placingHint')}
      </p>
    </div>
  );

  // Horní lišta musí minout panel (rozbalený i sbalený rail), aby se tlačítko
  // zpět a filtry nekryly s jeho pravým okrajem. 16px = odsazení panelu (left-4),
  // 44px = šířka sbaleného railu, 12px = mezera.
  const controlsLeftPad = isDesktop
    ? panelInset
      ? 16 + panelInset + 12
      : 16 + 44 + 12
    : undefined;

  // Na desktopu je šipka jen pro couvání v rámci mapy — na přehledu, odkud by
  // musela mapu zavřít, se skryje (odejdeš navigací). Na mobilu je vždy, tam
  // slouží i jako východ z celoobrazovkové mapy.
  const showBack = !isDesktop || mode !== 'list';

  const controls = (
    // Lišta je průhledná a na desktopu překrývá horní část panelu — proto
    // pointer-events-none na obalu a auto jen na vlastních prvcích, ať se
    // klik na tlačítko sbalení panelu pod ní neztratí.
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-[30] flex items-start gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
      style={isDesktop ? { paddingLeft: controlsLeftPad } : undefined}
    >
      {showBack && (
        <button
          type="button"
          onClick={handleBack}
          aria-label={t('map.mobile.back')}
          className="pointer-events-auto w-11 h-11 shrink-0 rounded-2xl glass-card border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-700 dark:text-gray-200 cursor-pointer"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>
      )}
      <div className="pointer-events-auto flex-1 min-w-0 lg:max-w-xl">
        <MapFilters
          filters={filters}
          onChange={setFilters}
          trips={trips}
          showTripFilter={!tripId}
          onPickSearchResult={handleSearchResult}
          onLocate={handleLocate}
          isLocating={isLocating}
        />
      </div>
    </div>
  );

  // ── Desktop: plovoucí boční panel, vyplní obsahovou plochu ─
  if (isDesktop) {
    return (
      <div role="region" aria-label={title} className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0">{canvas}</div>
        {crosshair}
        {controls}
        {mode === 'placing' ? (
          // Umisťování: místo celé výšky panelu jen kompaktní lišta dole,
          // ať zůstane vidět co nejvíc mapy pod křížkem.
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[30] w-[min(360px,calc(100%-2rem))] glass-card rounded-2xl border border-gray-200 dark:border-white/10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.35)]">
            {header}
          </div>
        ) : (
          <SidePanel
            collapsed={collapsed}
            onToggle={() => setCollapsed((prev) => !prev)}
            width={DESKTOP_PANEL_WIDTH}
            header={header}
            bodyScroll={bodyScroll}
            ariaLabel={title}
          >
            {body}
          </SidePanel>
        )}
      </div>
    );
  }

  // ── Mobil: celoobrazovková vrstva s taženým bottom sheetem ─
  return createPortal(
    <div
      ref={panelRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[120] bg-[#fbfbfd] dark:bg-black overflow-hidden"
    >
      <div className="absolute inset-0">{canvas}</div>
      {crosshair}
      {controls}

      <BottomSheet
        snap={snap}
        onSnapChange={setSnap}
        snapPoints={snapPoints}
        header={header}
        bodyScroll={bodyScroll}
        ariaLabel={title}
      >
        {body}
      </BottomSheet>
    </div>,
    document.body
  );
};

export default MapWorkspaceView;
