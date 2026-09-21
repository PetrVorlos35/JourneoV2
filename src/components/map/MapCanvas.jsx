import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { buildMarkerIcon, escapeHtml } from './markerIcon';
import useIsDark from '../../hooks/useIsDark';

// Rastrové dlaždice CARTO nad daty OSM, se světlou i tmavou variantou.
// CARTO od 28. 8. 2026 vyžaduje i pro tenhle bezplatný raster tier API
// klíč (do 5 mil. požadavků/měsíc zdarma) — bez klíče vrací dlaždici
// s nápisem "API KEY REQUIRED" místo mapy. Klíč: carto.com/basemaps/apikey.
// Načítají se jako <img>, což prochází i přísnou CSP (img-src https:).
const CARTO_API_KEY = import.meta.env.VITE_CARTO_API_KEY;
const TILE_URLS = {
  light: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`,
  dark: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`,
};
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

const DEFAULT_CENTER = [49.8, 15.5]; // střed Česka, než dorazí data
const DEFAULT_ZOOM = 5;

/**
 * Tenký imperativní wrapper nad Leafletem. Záměrně bez react-leaflet:
 * jedna závislost navíc, kterou by bylo potřeba držet v souladu s verzí
 * Reactu, a přímý přístup k mapě se tady stejně hodí (fitBounds, flyTo).
 *
 * Props:
 *  - places        pole míst k vykreslení
 *  - route         pole bodů v pořadí → spojnice mezi nimi
 *  - selectedId    id zvýrazněného místa
 *  - onSelectPlace klik na marker
 *  - onMapClick    klik do mapy (přidání místa); null = jen prohlížení
 *  - focus         { lat, lng, zoom } — mapa na něj přeletí při změně
 *  - fitKey        změna hodnoty vyvolá nové doladění výřezu na data
 *  - showDayLabels čísla dnů v markerech (mapa výletu)
 *  - draggableId   id místa, jehož špendlík jde přetáhnout
 *  - onPlaceMove   (place, { lat, lng }) po dotažení špendlíku
 *  - interactive   false = statický náhled bez ovládání
 */
const MapCanvas = ({
  places = [],
  route = null,
  selectedId = null,
  onSelectPlace,
  onMapClick,
  onPlaceMove,
  onMapReady,
  draggableId = null,
  focus = null,
  focusOffsetY = 0,
  focusOffsetX = 0,
  fitPaddingBottom = 0,
  fitPaddingLeft = 0,
  fitKey = 'default',
  showDayLabels = false,
  interactive = true,
  ariaLabel,
  className = '',
}) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileRef = useRef(null);
  const markerLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const fittedKeyRef = useRef(null);
  // Callbacky drží ref, aby se listenery mapy nemusely přepojovat
  // při každém renderu rodiče.
  const handlersRef = useRef({});
  handlersRef.current = { onSelectPlace, onMapClick, onPlaceMove };
  // Odsazení kvůli překrytí panelem (na mobilu přes spodek mapy sedí sheet,
  // na desktopu vlevo boční panel). Drží ho ref, aby jeho změna sama o sobě
  // nevyvolala přelet ani nové doladění výřezu — čte se až ve chvíli, kdy se
  // opravdu někam letí.
  const overlayRef = useRef({ focusOffsetY, focusOffsetX, fitPaddingBottom, fitPaddingLeft });
  overlayRef.current = { focusOffsetY, focusOffsetX, fitPaddingBottom, fitPaddingLeft };

  const isDark = useIsDark();

  // ── Inicializace mapy (jednou za život komponenty) ────────
  useEffect(() => {
    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: 2,
      zoomControl: false,
      worldCopyJump: true,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
    });

    map.attributionControl.setPrefix('');
    if (interactive) L.control.zoom({ position: 'bottomright' }).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);

    map.on('click', (e) => {
      handlersRef.current.onMapClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapRef.current = map;
    onMapReady?.(map);

    // Mapa se často montuje do panelu, který se teprve rozbaluje —
    // bez invalidateSize by zůstala vykreslená na špatný rozměr.
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // onMapReady se předává jako stabilní callback; mapa se kvůli němu
    // nesmí přestavovat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  // ── Dlaždice podle motivu ─────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const layer = L.tileLayer(isDark ? TILE_URLS.dark : TILE_URLS.light, {
      attribution: ATTRIBUTION,
      maxZoom: 19,
      subdomains: 'abcd',
      detectRetina: true,
    }).addTo(map);
    layer.setZIndex(1);

    if (tileRef.current) map.removeLayer(tileRef.current);
    tileRef.current = layer;
  }, [isDark]);

  // ── Markery ───────────────────────────────────────────────
  useEffect(() => {
    const layer = markerLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    places.forEach((place) => {
      const isDraggable = interactive && draggableId != null && String(place.id) === String(draggableId);

      const marker = L.marker([place.lat, place.lng], {
        icon: buildMarkerIcon({
          category: place.category,
          status: place.status,
          selected: String(place.id) === String(selectedId),
          label: showDayLabels && place.dayIndex != null ? place.dayIndex + 1 : null,
          draggable: isDraggable,
        }),
        keyboard: interactive,
        title: place.name,
        riseOnHover: true,
        draggable: isDraggable,
        autoPan: isDraggable,
      });

      if (interactive) {
        marker.bindTooltip(escapeHtml(place.name), { direction: 'top', offset: [0, -6] });
        marker.on('click', () => handlersRef.current.onSelectPlace?.(place));
      }

      if (isDraggable) {
        marker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          handlersRef.current.onPlaceMove?.(place, { lat, lng });
        });
      }

      marker.addTo(layer);
    });
  }, [places, selectedId, showDayLabels, interactive, draggableId]);

  // ── Trasa mezi místy ──────────────────────────────────────
  useEffect(() => {
    const layer = routeLayerRef.current;
    if (!layer) return;

    layer.clearLayers();
    if (!route || route.length < 2) return;

    L.polyline(
      route.map((point) => [point.lat, point.lng]),
      {
        color: isDark ? '#60a5fa' : '#2563eb',
        weight: 3,
        opacity: 0.7,
        dashArray: '6 8',
        lineCap: 'round',
      }
    ).addTo(layer);
  }, [route, isDark]);

  // ── Doladění výřezu na data ───────────────────────────────
  // Jen jednou pro každý `fitKey`, aby mapa neposkakovala pokaždé,
  // když uživatel přidá nebo upraví místo.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || places.length === 0 || fittedKeyRef.current === fitKey) return;

    const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, {
      paddingTopLeft: [56 + overlayRef.current.fitPaddingLeft, 56],
      paddingBottomRight: [56, 56 + overlayRef.current.fitPaddingBottom],
      maxZoom: 13,
      animate: false,
    });
    fittedKeyRef.current = fitKey;
  }, [places, fitKey]);

  // ── Přelet na konkrétní bod ───────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;

    const zoom = focus.zoom ?? 14;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Když panel zakrývá kraj mapy, posuneme střed tak, aby cíl vyšel vedle
    // něj — jinak uživatel klepne na špendlík a ten mu zmizí pod panel.
    // Sheet zdola posouvá střed nahoru, boční panel zleva doprava.
    const { focusOffsetY, focusOffsetX } = overlayRef.current;
    let target = L.latLng(focus.lat, focus.lng);
    if (focusOffsetY || focusOffsetX) {
      const point = map.project(target, zoom).subtract([focusOffsetX / 2, focusOffsetY / 2]);
      target = map.unproject(point, zoom);
    }

    if (reduceMotion) map.setView(target, zoom);
    else map.flyTo(target, zoom, { duration: 0.8 });
  }, [focus]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label={ariaLabel}
      className={`jn-map ${onMapClick ? 'jn-map--pinning' : ''} ${className}`}
    />
  );
};

export default MapCanvas;
