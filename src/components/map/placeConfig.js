import { Landmark, UtensilsCrossed, BedDouble, Trees, Ticket, TramFront, MapPin } from 'lucide-react';

// Kategorie a stavy míst. Jediný zdroj pravdy pro barvy, ikony i i18n
// klíče — sdílí ho seznam míst, filtry i markery na mapě (markerIcon.js).
// Hodnoty `key` musí sedět na ENUM v tabulce `trip_places`.
export const PLACE_CATEGORIES = [
  { key: 'sight',     color: '#818cf8', icon: Landmark },
  { key: 'food',      color: '#34d399', icon: UtensilsCrossed },
  { key: 'stay',      color: '#f472b6', icon: BedDouble },
  { key: 'nature',    color: '#4ade80', icon: Trees },
  { key: 'activity',  color: '#fbbf24', icon: Ticket },
  { key: 'transport', color: '#60a5fa', icon: TramFront },
  { key: 'other',     color: '#94a3b8', icon: MapPin },
];

export const PLACE_STATUSES = ['visited', 'wishlist'];

const byKey = new Map(PLACE_CATEGORIES.map((c) => [c.key, c]));

export const getCategory = (key) => byKey.get(key) || byKey.get('other');

export const categoryColor = (key) => getCategory(key).color;

// i18n klíče: map.categories.<key> / map.statuses.<key>
export const categoryLabelKey = (key) => `map.categories.${getCategory(key).key}`;
export const statusLabelKey = (status) => `map.statuses.${status === 'visited' ? 'visited' : 'wishlist'}`;
