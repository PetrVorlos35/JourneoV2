import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../services/api';
import usePlaces from './usePlaces';
import { useDialog } from '../components/ui/DialogModal';

// Rozpracované místo má na mapě vlastní špendlík — tímhle id se pozná.
export const DRAFT_MARKER_ID = '__draft__';

/**
 * Stav a chování mapy míst: výběr, rozpracované místo, přesouvání špendlíku,
 * ukládání a mazání. Sdílí ho globální mapa (MapPage) i mapa výletu (TripMap)
 * skrze společnou immerzivní plochu (MapWorkspaceView), aby stejná interakce
 * nežila ve více kopiích.
 *
 * `tripId` váže vznikající místa na výlet (a přednastaví je jako navštívená);
 * bez něj jde o osobní místa na globální mapě.
 */
export default function useMapWorkspace({ tripId = null, canEdit = true } = {}) {
  const { t, i18n } = useTranslation();
  const { confirmDialog, ModalPortal } = useDialog();
  const { places, loading, saving, refresh, savePlace, deletePlace } = usePlaces({ tripId });

  const [filters, setFilters] = useState({ status: null, category: null, tripId: null });
  const [selectedId, setSelectedId] = useState(null);
  const [focus, setFocus] = useState(null);
  const [draft, setDraft] = useState(null);
  const [isMoving, setIsMoving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Stabilní identita rozpracovaného místa: přesun mění souřadnice, ale
  // formulář se kvůli tomu nesmí resetovat (viz PlaceForm).
  const draftKeyRef = useRef(0);
  const nextDraftKey = () => (draftKeyRef.current += 1);

  const defaultStatus = tripId ? 'visited' : 'wishlist';

  const visiblePlaces = useMemo(
    () =>
      places.filter(
        (place) =>
          (!filters.status || place.status === filters.status) &&
          (!filters.category || place.category === filters.category) &&
          (!filters.tripId || String(place.tripId) === String(filters.tripId))
      ),
    [places, filters]
  );

  // Rozepsané místo dostane vlastní špendlík, upravované uložené místo se
  // kreslí na (možná přesunuté) pozici z formuláře — obojí proto, aby bylo
  // vidět, o kterém bodě se zrovna bavíme. Do DB jde až uložení.
  const markers = useMemo(() => {
    if (!draft) return visiblePlaces;
    if (draft.id) {
      return visiblePlaces.map((place) =>
        String(place.id) === String(draft.id) ? { ...place, lat: draft.lat, lng: draft.lng } : place
      );
    }
    return [
      ...visiblePlaces,
      {
        id: DRAFT_MARKER_ID,
        lat: draft.lat,
        lng: draft.lng,
        name: draft.name || t('map.sheet.newTitle'),
        category: draft.category || 'sight',
        status: draft.status || defaultStatus,
      },
    ];
  }, [visiblePlaces, draft, defaultStatus, t]);

  const selectedPlace = useMemo(
    () => places.find((place) => String(place.id) === String(selectedId)) || null,
    [places, selectedId]
  );

  // Trasa vede přes místa přiřazená ke dnům, v jejich pořadí. Počítá se
  // z markerů, takže při přesouvání špendlíku jde spojnice hned s ním.
  const route = useMemo(
    () =>
      markers
        .filter((place) => place.dayIndex != null)
        .sort((a, b) => a.dayIndex - b.dayIndex)
        .map((place) => ({ lat: place.lat, lng: place.lng })),
    [markers]
  );

  const focusPlace = useCallback((place) => {
    setSelectedId(place.id);
    setFocus({ lat: place.lat, lng: place.lng, zoom: 14 });
  }, []);

  // Adresa, město a země ke kliknutému bodu. Je to jen bonus — když
  // Nominatim mlčí, místo se uloží se samotnými souřadnicemi.
  const fillAddress = useCallback(
    async (lat, lng) => {
      try {
        const { result } = await api.geo.reverse(lat, lng, i18n.language);
        if (!result) return;
        setDraft((prev) =>
          prev && prev.lat === lat && prev.lng === lng
            ? { ...prev, name: result.name, address: result.address, countryCode: result.countryCode, city: result.city }
            : prev
        );
      } catch {
        // Ticho záměrně — formulář už je otevřený a adresa není povinná.
      }
    },
    [i18n.language]
  );

  const closeDraft = useCallback(() => {
    setDraft(null);
    setIsMoving(false);
  }, []);

  // Založení nového místa na daných souřadnicích.
  const startCreate = useCallback(
    (lat, lng) => {
      if (!canEdit) return;
      setDraft({
        draftKey: nextDraftKey(),
        lat,
        lng,
        ...(tripId ? { tripId } : {}),
        source: 'manual',
        status: defaultStatus,
        category: 'sight',
      });
      fillAddress(lat, lng);
    },
    [canEdit, tripId, defaultStatus, fillAddress]
  );

  // Přesun rozpracovaného špendlíku — vyplněná pole zůstávají, název se
  // dotáhne znovu (a přepíše jen ten, který uživatel neupravil).
  const moveDraft = useCallback(
    (lat, lng) => {
      setDraft((prev) =>
        prev ? { ...prev, lat, lng, name: undefined, address: null, countryCode: null, city: null } : prev
      );
      fillAddress(lat, lng);
    },
    [fillAddress]
  );

  // Přesun uloženého místa. Souřadnice žijí v rozpracovaném stavu, do
  // databáze je zapíše až uložení formuláře — dokud neuložíš, jde couvnout.
  const movePlace = useCallback(
    (lat, lng) => {
      setDraft((prev) => (prev ? { ...prev, lat, lng, address: null, countryCode: null, city: null } : prev));
      setIsMoving(false);
      fillAddress(lat, lng);
      toast.success(t('map.toasts.moved'));
    },
    [fillAddress, t]
  );

  // Souřadnice odkudkoli (klik do mapy, zaměřovač na mobilu) → podle stavu
  // buď zakládají místo, nebo přesouvají to rozpracované či upravované.
  const placeAt = useCallback(
    (lat, lng) => {
      if (!canEdit) return;
      if (draft?.id) {
        if (isMoving) movePlace(lat, lng);
        return;
      }
      if (draft) moveDraft(lat, lng);
      else startCreate(lat, lng);
    },
    [canEdit, draft, isMoving, movePlace, moveDraft, startCreate]
  );

  const handleMapClick = useCallback(({ lat, lng }) => placeAt(lat, lng), [placeAt]);

  // Dotažení špendlíku myší — jen u místa, které je zrovna otevřené.
  const handlePlaceMove = useCallback(
    (place, coords) => {
      if (!draft?.id || String(place.id) !== String(draft.id)) return;
      movePlace(coords.lat, coords.lng);
    },
    [draft, movePlace]
  );

  // Klik na špendlík rovnou otevře jeho formulář (prohlížeč jen přeletí).
  const handleSelectPlace = useCallback(
    (place) => {
      if (place.id === DRAFT_MARKER_ID) return;
      focusPlace(place);
      if (!canEdit) return;
      setIsMoving(false);
      setDraft(place);
    },
    [canEdit, focusPlace]
  );

  // Výběr ze seznamu — mapa na místo přeletí a otevře se jeho editace.
  const editPlace = useCallback(
    (place) => {
      focusPlace(place);
      setIsMoving(false);
      setDraft(place);
    },
    [focusPlace]
  );

  const handleSearchResult = useCallback(
    (result) => {
      setFocus({ lat: result.lat, lng: result.lng, zoom: 14 });
      if (!canEdit) return;
      setDraft({
        draftKey: nextDraftKey(),
        ...result,
        ...(tripId ? { tripId } : {}),
        source: 'search',
        status: defaultStatus,
        category: 'sight',
      });
    },
    [canEdit, tripId, defaultStatus]
  );

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error(t('map.errors.geolocationUnsupported'));
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setIsLocating(false);
        const { latitude: lat, longitude: lng } = coords;
        setFocus({ lat, lng, zoom: 15 });
        if (!canEdit) return;
        setDraft({
          draftKey: nextDraftKey(),
          lat,
          lng,
          ...(tripId ? { tripId } : {}),
          source: 'gps',
          status: 'visited',
          category: 'sight',
        });
        fillAddress(lat, lng);
      },
      () => {
        setIsLocating(false);
        toast.error(t('map.errors.geolocationDenied'));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [canEdit, tripId, fillAddress, t]);

  const handleSave = useCallback(
    async (payload) => {
      const saved = await savePlace(tripId ? { ...payload, tripId } : payload);
      if (saved) {
        closeDraft();
        setSelectedId(saved.id);
      }
      return saved;
    },
    [savePlace, tripId, closeDraft]
  );

  const handleDelete = useCallback(
    async (place) => {
      const ok = await confirmDialog({
        title: t('map.confirmDelete.title'),
        message: t('map.confirmDelete.message', { name: place.name }),
        variant: 'danger',
        confirmLabel: t('map.confirmDelete.confirm'),
      });
      if (!ok) return false;

      const deleted = await deletePlace(place);
      if (deleted) {
        closeDraft();
        setSelectedId(null);
      }
      return deleted;
    },
    [confirmDialog, deletePlace, closeDraft, t]
  );

  return {
    // data
    places,
    visiblePlaces,
    markers,
    route,
    selectedPlace,
    selectedId,
    loading,
    saving,
    refresh,
    // stav editace
    draft,
    isMoving,
    setIsMoving,
    isLocating,
    filters,
    setFilters,
    focus,
    setFocus,
    setSelectedId,
    // akce
    focusPlace,
    editPlace,
    handleSelectPlace,
    handleMapClick,
    handlePlaceMove,
    placeAt,
    startCreate,
    handleSearchResult,
    handleLocate,
    handleSave,
    handleDelete,
    closeDraft,
    // potvrzovací dialog patřící k mazání
    ModalPortal,
  };
}
