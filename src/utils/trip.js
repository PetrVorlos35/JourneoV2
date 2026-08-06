import { differenceInCalendarDays } from 'date-fns';

/**
 * Where a trip sits relative to now. Start is normalised to the beginning of
 * its day and end to the end of its day, so a trip is "ongoing" for the whole
 * of its last day rather than expiring at midnight.
 */
export const categorizeTrip = (trip) => {
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const now = new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  if (end < now) return 'past';
  if (start <= now && end >= now) return 'ongoing';
  return 'upcoming';
};

/** Total number of calendar days the trip covers, inclusive of both ends. */
export const tripDayCount = (trip) => {
  if (!trip?.startDate || !trip?.endDate) return 0;
  return Math.max(1, differenceInCalendarDays(new Date(trip.endDate), new Date(trip.startDate)) + 1);
};

/** 1-based number of the day the trip is on today, or null if it isn't running. */
export const currentTripDay = (trip) => {
  if (categorizeTrip(trip) !== 'ongoing') return null;
  return differenceInCalendarDays(new Date(), new Date(trip.startDate)) + 1;
};

/** Whole-day countdown to a trip's start. Negative once it has begun. */
export const daysUntilStart = (trip) =>
  differenceInCalendarDays(new Date(trip.startDate), new Date());

/** Sum of every expense on a trip, in the trip's own currency. */
export const tripSpend = (trip) =>
  (trip?.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
