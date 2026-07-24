import pool from '../config/db.js';

// Returns 'owner' | 'editor' | 'viewer' | null (no access).
// Trips sitting in the trash (deleted_at set) count as not found for
// everyone — they're only reachable via the trash endpoints in routes/trips.js.
export const getTripRole = async (tripId, userId) => {
  const [[owned]] = await pool.query(
    'SELECT id FROM trips WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [tripId, userId]
  );
  if (owned) return 'owner';

  const [[collab]] = await pool.query(
    `SELECT tc.role FROM trip_collaborators tc
     JOIN trips t ON t.id = tc.trip_id AND t.deleted_at IS NULL
     WHERE tc.trip_id = ? AND tc.user_id = ?`,
    [tripId, userId]
  );
  return collab ? collab.role : null;
};

export default getTripRole;
