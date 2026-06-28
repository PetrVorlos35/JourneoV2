import pool from '../config/db.js';

// Minimální prodleva mezi dvěma odeslanými ověřovacími kódy
// na stejný e-mail a typ (REGISTER / RESET).
export const CODE_COOLDOWN_SECONDS = 30;

/**
 * Vrátí počet sekund, které ještě zbývají do možnosti odeslat
 * nový ověřovací kód pro daný e-mail a typ. 0 = lze odeslat hned.
 *
 * Výpočet probíhá v databázi (TIMESTAMPDIFF + NOW()), takže není
 * závislý na časové zóně Node procesu ani na rozjetých hodinách
 * mezi aplikací a DB, a je spolehlivý i na serverless.
 *
 * @param {string} email
 * @param {'REGISTER' | 'RESET'} type
 * @returns {Promise<number>} zbývající sekundy cooldownu
 */
export async function getCodeCooldownRemaining(email, type) {
  const [rows] = await pool.query(
    `SELECT TIMESTAMPDIFF(SECOND, created_at, NOW()) AS elapsed
       FROM verification_tokens
      WHERE email = ? AND type = ?
      ORDER BY created_at DESC
      LIMIT 1`,
    [email, type]
  );

  if (rows.length === 0) return 0;

  const elapsed = Number(rows[0].elapsed);
  const remaining = CODE_COOLDOWN_SECONDS - elapsed;
  return remaining > 0 ? remaining : 0;
}
