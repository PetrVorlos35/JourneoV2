import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { GUEST_COLUMNS, guestState } from '../lib/guest.js';

// Host po konci zkoušky smí jen číst (prohlížet, stáhnout PDF) a smazat
// svá data; registraci řeší /api/auth bez tohoto omezení.
const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const isAllowedWhenExpired = (req) =>
  READ_METHODS.has(req.method) ||
  (req.method === 'DELETE' && req.originalUrl.split('?')[0] === '/api/auth/account');

const auth = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Přístup odepřen. Přihlaste se prosím.' });
  }

  const token = header.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Neplatný nebo vypršelý token.' });
  }

  try {
    // Revokace: token nese verzi (`tv`), která musí sedět na users.token_version.
    // Změna/reset hesla verzi zvýší a tím zneplatní všechny starší tokeny.
    // Tokeny vydané před zavedením verzí `tv` nemají — počítají se jako verze 0.
    const [users] = await pool.query(`SELECT token_version, ${GUEST_COLUMNS} FROM users WHERE id = ?`, [decoded.userId]);
    if (users.length === 0 || (decoded.tv ?? 0) !== users[0].token_version) {
      return res.status(401).json({ error: 'Neplatný nebo vypršelý token.' });
    }

    const guest = guestState(users[0]);
    if (guest?.ended) {
      return res.status(401).json({ error: 'Zkušební režim skončil.', code: 'GUEST_ENDED' });
    }
    if (guest?.readOnly && !isAllowedWhenExpired(req)) {
      return res.status(403).json({
        error: 'Zkušební režim skončil. Zaregistruj se a pokračuj, výlety ti zůstanou.',
        code: 'GUEST_EXPIRED',
      });
    }

    req.userId = decoded.userId;
    req.isGuest = Boolean(guest);
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Chyba serveru při ověřování.' });
  }
};

export default auth;
