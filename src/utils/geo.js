// Geometrie nad souřadnicemi míst. Bez závislosti na Leafletu, aby to
// šlo použít i tam, kde se mapa vůbec nenačítá (statistiky, PDF).

const EARTH_RADIUS_KM = 6371;
const toRad = (deg) => (deg * Math.PI) / 180;

// Vzdušná vzdálenost dvou bodů v km (haversine).
export const distanceKm = (a, b) => {
  if (!a || !b) return 0;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
};

// Součet vzdáleností po trase (pole bodů v pořadí).
export const routeDistanceKm = (points = []) =>
  points.reduce((sum, point, i) => (i === 0 ? 0 : sum + distanceKm(points[i - 1], point)), 0);

// Zaokrouhlení pro UI: pod 10 km má smysl desetinné místo, výš už ne.
export const formatDistanceKm = (km, locale = 'cs') => {
  if (!Number.isFinite(km) || km <= 0) return '0 km';
  const rounded = km < 10 ? Math.round(km * 10) / 10 : Math.round(km);
  return `${rounded.toLocaleString(locale)} km`;
};
