import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

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
    const [users] = await pool.query('SELECT token_version FROM users WHERE id = ?', [decoded.userId]);
    if (users.length === 0 || (decoded.tv ?? 0) !== users[0].token_version) {
      return res.status(401).json({ error: 'Neplatný nebo vypršelý token.' });
    }

    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Chyba serveru při ověřování.' });
  }
};

export default auth;
