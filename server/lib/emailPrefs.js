import pool from '../config/db.js';

// Volitelné e-maily → sloupec v user_settings. Ověřovací kódy sem nepatří,
// chodí vždycky.
export const EMAIL_PREFS = {
  friendRequests: 'email_friend_requests',
  settlements: 'email_settlements',
  tripTransfers: 'email_trip_transfers',
};

// Bez řádku v user_settings = výchozí stav, tedy zapnuto. Chyba dotazu
// nesmí shodit akci, ke které e-mail patří, takže pak raději pošleme.
export const wantsEmail = async (userId, kind) => {
  const column = EMAIL_PREFS[kind];
  try {
    const [[row]] = await pool.query(
      `SELECT ${column} AS enabled FROM user_settings WHERE user_id = ?`,
      [userId]
    );
    return row ? Boolean(row.enabled) : true;
  } catch (err) {
    console.error('Email prefs lookup error:', err);
    return true;
  }
};
