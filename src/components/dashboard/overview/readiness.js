import { tripDayCount } from '../../../utils/trip';

// How much each pillar is worth. Itinerary and packing carry the weight
// because they're the two things that actually stop a departure; documents
// and pinned places are finishing touches.
const WEIGHTS = { itinerary: 40, packing: 30, places: 15, documents: 15 };

/**
 * Readiness of a single trip, as a percentage plus the concrete items behind
 * it. The score is never shown on its own — every pillar is listed underneath
 * so the number is explainable rather than magic.
 *
 * @param {object} trip fully hydrated trip from GET /api/trips
 * @param {number|null} placeCount pinned places for this trip, or null while unknown
 * @returns {{ score:number, items:Array<{key:string, done:boolean, count:number, total:number, view:string}> }}
 */
export const computeReadiness = (trip, placeCount) => {
  if (!trip) return { score: 0, items: [] };

  const totalDays = tripDayCount(trip);
  const plannedDays = (trip.activities || []).filter((a) => a.plan && a.plan.trim()).length;

  const packing = trip.packingList || [];
  const packed = packing.filter((p) => p.checked).length;

  const documents = (trip.documents || []).length;
  const places = typeof placeCount === 'number' ? placeCount : 0;

  const ratios = {
    itinerary: totalDays > 0 ? Math.min(plannedDays / totalDays, 1) : 0,
    packing: packing.length > 0 ? packed / packing.length : 0,
    places: places > 0 ? 1 : 0,
    documents: documents > 0 ? 1 : 0,
  };

  const score = Math.round(
    Object.entries(WEIGHTS).reduce((sum, [key, weight]) => sum + ratios[key] * weight, 0)
  );

  const items = [
    { key: 'itinerary', done: ratios.itinerary === 1, count: plannedDays, total: totalDays, view: null },
    { key: 'packing', done: packing.length > 0 && packed === packing.length, count: packed, total: packing.length, view: 'packing' },
    { key: 'places', done: places > 0, count: places, total: null, view: 'map' },
    { key: 'documents', done: documents > 0, count: documents, total: null, view: 'documents' },
  ];

  return { score, items };
};

export default computeReadiness;
