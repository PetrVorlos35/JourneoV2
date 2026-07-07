import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const adminAuth = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Přístup odepřen. Přihlaste se prosím.' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;

    // Check admin role in database + token revocation (see middleware/auth.js)
    const [users] = await pool.query('SELECT role, token_version FROM users WHERE id = ?', [decoded.userId]);
    if (users.length === 0 || (decoded.tv ?? 0) !== users[0].token_version) {
      return res.status(401).json({ error: 'Neplatný nebo vypršelý token.' });
    }
    if (users[0].role !== 'admin') {
      return res.status(403).json({ error: 'Nemáte oprávnění administrátora.' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Neplatný nebo vypršelý token.' });
  }
};

export default adminAuth;
