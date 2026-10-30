import { Router } from 'express';
import pool from '../config/db.js';
import { getUserCurrency, makeConverter } from '../lib/rates.js';

const router = Router();

// ── GET /api/stats ──────────────────────────────────────────
// Returns advanced aggregated statistics for the authenticated user
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;

    // Run all queries in parallel for maximum performance
    const [
      [financeRows],
      [uniqueLocationsRows],
      [favoriteMonthRows],
      [longestTripRows],
      [packingDisciplineRows],
      [communityScoreRows],
      [mostPopularTripRows],
    ] = await Promise.all([

      // ─── 1. Financial: útrata po výletech a kategoriích ────────
      // Každý výlet má svou měnu, takže se sčítá až v JS po přepočtu
      // do hlavní měny uživatele.
      pool.query(`
        SELECT t.id AS trip_id, t.title, t.currency, e.category, SUM(e.amount) AS total
        FROM trips t
        JOIN trip_expenses e ON e.trip_id = t.id
        WHERE t.user_id = ? AND t.deleted_at IS NULL
        GROUP BY t.id, t.title, t.currency, e.category
      `, [userId]),

      // ─── 4. Travel Habits: Unique locations visited ────────────
      pool.query(`
        SELECT COUNT(DISTINCT a.location) AS unique_locations
        FROM trip_activities a
        JOIN trips t ON a.trip_id = t.id
        WHERE t.user_id = ? AND t.deleted_at IS NULL
          AND a.location IS NOT NULL
          AND a.location != ''
      `, [userId]),

      // ─── 5. Travel Habits: Favorite travel month ───────────────
      pool.query(`
        SELECT
          MONTH(t.start_date) AS month_number,
          COUNT(*) AS trip_count
        FROM trips t
        WHERE t.user_id = ? AND t.deleted_at IS NULL
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
        WHERE t.user_id = ? AND t.deleted_at IS NULL
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
        WHERE t.user_id = ? AND t.deleted_at IS NULL
      `, [userId]),

      // ─── 8. Social: Total community score ──────────────────────
      pool.query(`
        SELECT COUNT(v.id) AS community_score
        FROM votes v
        JOIN trips t ON v.trip_id = t.id
        WHERE t.user_id = ? AND t.deleted_at IS NULL AND v.value = 1
      `, [userId]),

      // ─── 9. Social: Most popular trip ──────────────────────────
      pool.query(`
        SELECT
          t.id AS trip_id,
          t.title,
          COUNT(v.id) AS net_score
        FROM trips t
        LEFT JOIN votes v ON v.trip_id = t.id AND v.value = 1
        WHERE t.user_id = ? AND t.deleted_at IS NULL
        GROUP BY t.id, t.title
        ORDER BY net_score DESC
        LIMIT 1
      `, [userId]),
    ]);

    // ─── Finance v hlavní měně (výlety bez kurzu se vynechají) ───
    const currency = await getUserCurrency(pool, userId);
    const toMain = await makeConverter(currency, financeRows.map((r) => r.currency));
    const byCategory = new Map();
    const byTrip = new Map();
    let totalSpent = 0;
    for (const row of financeRows) {
      const amount = toMain(parseFloat(row.total), row.currency);
      if (amount == null) continue;
      totalSpent += amount;
      byCategory.set(row.category, (byCategory.get(row.category) || 0) + amount);
      const trip = byTrip.get(row.trip_id) || { tripId: row.trip_id.toString(), title: row.title, total: 0 };
      trip.total += amount;
      byTrip.set(row.trip_id, trip);
    }
    const round2 = (v) => Math.round(v * 100) / 100;
    const mostExpensive = [...byTrip.values()].sort((a, b) => b.total - a.total)[0];
    const financial = {
      currency,
      totalSpent: round2(totalSpent),
      expenseBreakdown: [...byCategory.entries()]
        .map(([category, total]) => ({
          category,
          total: round2(total),
          percentage: totalSpent > 0 ? Math.round((total * 1000) / totalSpent) / 10 : 0,
        }))
        .sort((a, b) => b.total - a.total),
      mostExpensiveTrip: mostExpensive ? { ...mostExpensive, total: round2(mostExpensive.total) } : null,
    };

    // ── Czech month names mapping ─────────────────────────────
    const monthNames = {
      1: 'Leden', 2: 'Únor', 3: 'Březen', 4: 'Duben',
      5: 'Květen', 6: 'Červen', 7: 'Červenec', 8: 'Srpen',
      9: 'Září', 10: 'Říjen', 11: 'Listopad', 12: 'Prosinec',
    };

    // ── Build response ────────────────────────────────────────
    const stats = {
      financial,
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
