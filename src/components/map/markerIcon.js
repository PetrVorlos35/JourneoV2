import L from 'leaflet';
import { categoryColor } from './placeConfig';

// Glyfy markerů. Lucide komponenty tady použít nejde — Leaflet chce
// hotový HTML string, ne React strom — takže jsou to jednoduché ručně
// psané tvary ve stejném duchu (24×24, stroke 2, zaoblené konce).
const GLYPHS = {
  sight: '<path d="M12 4l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 9.3l5-.7z"/>',
  food: '<path d="M8 4v5a2 2 0 0 0 4 0V4M10 11v9M16.5 4c-1.2 1.2-1.5 3-1.5 4.5s.4 2.5 1.5 2.5v9"/>',
  stay: '<path d="M4 18v-8M4 14h16v4M12 10h5a3 3 0 0 1 3 3"/><circle cx="8.5" cy="11.5" r="1.5"/>',
  nature: '<path d="M3 19h18L14 8l-2 3-2.5-4z"/>',
  activity: '<path d="M6 20V4M6 5h11l-2.5 3.5L17 12H6"/>',
  transport: '<rect x="5" y="5" width="14" height="10" rx="2"/><path d="M5 11h14M8.5 19v-2.5M15.5 19v-2.5"/>',
  other: '<circle cx="12" cy="12" r="3.5"/>',
};

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]
  );

// Marker: barevný špendlík podle kategorie. Navštívená místa jsou plná,
// wishlist má jen obrys — rozdíl je čitelný i bez barvy (a11y).
export const buildMarkerIcon = ({ category, status, selected = false, label = null, draggable = false }) => {
  const color = categoryColor(category);
  const glyph = GLYPHS[category] || GLYPHS.other;
  const classes = [
    'jn-pin',
    status === 'visited' ? 'jn-pin--visited' : 'jn-pin--wishlist',
    selected ? 'jn-pin--selected' : '',
    draggable ? 'jn-pin--draggable' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return L.divIcon({
    className: 'jn-pin-wrapper',
    html: `<div class="${classes}" style="--pin-color:${color}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${glyph}</svg>
        ${label != null ? `<span class="jn-pin__label">${escapeHtml(label)}</span>` : ''}
      </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
    tooltipAnchor: [0, -18],
  });
};

export { escapeHtml };
