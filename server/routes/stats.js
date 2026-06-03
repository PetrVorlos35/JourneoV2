import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

// ── GET /api/stats ──────────────────────────────────────────
// Returns advanced aggregated statistics for the authenticated user
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;

    // Run all queries in parallel for maximum performance
    const [
      [totalSpentRows],
      [expenseBreakdownRows],
      [mostExpensiveTripRows],
      [uniqueLocationsRows],
      [favoriteMonthRows],
      [longestTripRows],
      [packingDisciplineRows],
      [communityScoreRows],
      [mostPopularTripRows],
    ] = await Promise.all([

      // ─── 1. Financial: Total money spent across all trips ──────
      pool.query(`
        SELECT COALESCE(SUM(e.amount), 0) AS total_spent
        FROM trip_expenses e
        JOIN trips t ON e.trip_id = t.id
        WHERE t.user_id = ?
      `, [userId]),

      // ─── 2. Financial: Expense breakdown by category ───────────
      pool.query(`
        SELECT
          e.category,
          SUM(e.amount) AS category_total,
          ROUND(
            SUM(e.amount) * 100.0 / NULLIF((
              SELECT SUM(e2.amount)
              FROM trip_expenses e2
              JOIN trips t2 ON e2.trip_id = t2.id
              WHERE t2.user_id = ?
            ), 0),
          1) AS percentage
        FROM trip_expenses e
        JOIN trips t ON e.trip_id = t.id
        WHERE t.user_id = ?
        GROUP BY e.category
        ORDER BY category_total DESC
      `, [userId, userId]),

      // ─── 3. Financial: Most expensive trip ─────────────────────
      pool.query(`
        SELECT
          t.id AS trip_id,
          t.title,
          COALESCE(SUM(e.amount), 0) AS trip_total
        FROM trips t
        LEFT JOIN trip_expenses e ON e.trip_id = t.id
        WHERE t.user_id = ?
        GROUP BY t.id, t.title
        ORDER BY trip_total DESC
        LIMIT 1
      `, [userId]),

      // ─── 4. Travel Habits: Unique locations visited ────────────
      pool.query(`
        SELECT COUNT(DISTINCT a.location) AS unique_locations
        FROM trip_activities a
        JOIN trips t ON a.trip_id = t.id
        WHERE t.user_id = ?
          AND a.location IS NOT NULL
          AND a.location != ''
      `, [userId]),

      // ─── 5. Travel Habits: Favorite travel month ───────────────
      pool.query(`
        SELECT
          MONTH(t.start_date) AS month_number,
          COUNT(*) AS trip_count
        FROM trips t
        WHERE t.user_id = ?
        GROUP BY MONTH(t.start_date)
        ORDER BY trip_count DESC, month_number ASC
        LIMIT 1
      `, [userId]),

      // ─── 6. Travel Habits: Longest trip ────────────────────────
      pool.query(`
        SELECT
          t.id AS trip_id,
          t.title,
          DATEDIFF(t.end_date, t.start_date) AS duration_days
        FROM trips t
        WHERE t.user_id = ?
        ORDER BY duration_days DESC
        LIMIT 1
      `, [userId]),

      // ─── 7. Productivity: Packing discipline ──────────────────
      pool.query(`
        SELECT
          COUNT(*) AS total_items,
          SUM(CASE WHEN p.checked = 1 THEN 1 ELSE 0 END) AS checked_items,
          ROUND(
            SUM(CASE WHEN p.checked = 1 THEN 1 ELSE 0 END) * 100.0
            / NULLIF(COUNT(*), 0),
          1) AS checked_percentage
        FROM trip_packing_items p
        JOIN trips t ON p.trip_id = t.id
        WHERE t.user_id = ?
      `, [userId]),

      // ─── 8. Social: Total community score ──────────────────────
      pool.query(`
        SELECT COALESCE(SUM(v.value), 0) AS community_score
        FROM votes v
        JOIN trips t ON v.trip_id = t.id
        WHERE t.user_id = ?
      `, [userId]),

      // ─── 9. Social: Most popular trip ──────────────────────────
      pool.query(`
        SELECT
          t.id AS trip_id,
          t.title,
          COALESCE(SUM(v.value), 0) AS net_score
        FROM trips t
        LEFT JOIN votes v ON v.trip_id = t.id
        WHERE t.user_id = ?
        GROUP BY t.id, t.title
        ORDER BY net_score DESC
        LIMIT 1
      `, [userId]),
    ]);

    // ── Czech month names mapping ─────────────────────────────
    const monthNames = {
      1: 'Leden', 2: 'Únor', 3: 'Březen', 4: 'Duben',
      5: 'Květen', 6: 'Červen', 7: 'Červenec', 8: 'Srpen',
      9: 'Září', 10: 'Říjen', 11: 'Listopad', 12: 'Prosinec',
    };

    // ── Build response ────────────────────────────────────────
    const stats = {
      financial: {
        totalSpent: parseFloat(totalSpentRows[0]?.total_spent ?? 0),
        expenseBreakdown: expenseBreakdownRows.map(row => ({
          category: row.category,
          total: parseFloat(row.category_total),
          percentage: parseFloat(row.percentage ?? 0),
        })),
        mostExpensiveTrip: mostExpensiveTripRows[0]
          ? {
              tripId: mostExpensiveTripRows[0].trip_id?.toString() ?? null,
              title: mostExpensiveTripRows[0].title ?? null,
              total: parseFloat(mostExpensiveTripRows[0].trip_total ?? 0),
            }
          : null,
      },
      travelHabits: {
        uniqueLocations: parseInt(uniqueLocationsRows[0]?.unique_locations ?? 0),
        favoriteMonth: favoriteMonthRows[0]
          ? {
              monthNumber: favoriteMonthRows[0].month_number,
              monthName: monthNames[favoriteMonthRows[0].month_number] ?? 'Neznámý',
              tripCount: parseInt(favoriteMonthRows[0].trip_count),
            }
          : null,
        longestTrip: longestTripRows[0]
          ? {
              tripId: longestTripRows[0].trip_id?.toString() ?? null,
              title: longestTripRows[0].title ?? null,
              durationDays: parseInt(longestTripRows[0].duration_days ?? 0),
            }
          : null,
      },
      productivity: {
        packingDiscipline: {
          totalItems: parseInt(packingDisciplineRows[0]?.total_items ?? 0),
          checkedItems: parseInt(packingDisciplineRows[0]?.checked_items ?? 0),
          percentage: parseFloat(packingDisciplineRows[0]?.checked_percentage ?? 0),
        },
      },
      social: {
        communityScore: parseInt(communityScoreRows[0]?.community_score ?? 0),
        mostPopularTrip: mostPopularTripRows[0]
          ? {
              tripId: mostPopularTripRows[0].trip_id?.toString() ?? null,
              title: mostPopularTripRows[0].title ?? null,
              netScore: parseInt(mostPopularTripRows[0].net_score ?? 0),
            }
          : null,
      },
    };

    res.json({ stats });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Chyba při načítání statistik.' });
  }
});

export default router;
