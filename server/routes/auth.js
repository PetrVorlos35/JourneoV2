import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import auth from '../middleware/auth.js';

const router = Router();

// ── POST /api/auth/register ─────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail a heslo jsou povinné.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Heslo musí mít alespoň 6 znaků.' });
    }

    // Check if user already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Tento e-mail je již zaregistrovaný, zkuste se přihlásit.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)',
      [email, passwordHash, first_name || null, last_name || null]
    );

    const userId = result.insertId;

    // Create default settings
    await pool.query(
      'INSERT INTO user_settings (user_id, theme, currency) VALUES (?, ?, ?)',
      [userId, 'dark', 'CZK']
    );

    // Generate JWT
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: { id: userId, email, first_name: first_name || null, last_name: last_name || null, avatar_url: null, bio: null }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Chyba serveru při registraci.' });
  }
});

// ── POST /api/auth/login ────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail a heslo jsou povinné.' });
    }

    // Find user
    const [users] = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, avatar_url, bio FROM users WHERE email = ?', 
      [email]
    );
    if (users.length === 0) {
      return res.status(401).json({ error: 'Tento e-mail není v databázi, musíte se zaregistrovat.' });
    }

    const user = users[0];

    // Compare password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Špatné heslo nebo e-mail.' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: { 
        id: user.id, 
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        bio: user.bio
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Chyba serveru při přihlášení.' });
  }
});

// ── POST /api/auth/google ───────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { access_token } = req.body;
    
    if (!access_token) {
      return res.status(400).json({ error: 'Chybí access_token.' });
    }

    // Fetch user info from Google
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    if (!response.ok) {
      return res.status(401).json({ error: 'Neplatný token z Google.' });
    }

    const googleUser = await response.json();
    const email = googleUser.email;
    const firstName = googleUser.given_name || null;
    const lastName = googleUser.family_name || null;
    const avatarUrl = googleUser.picture || null;

    if (!email) {
      return res.status(400).json({ error: 'Z Google se nepodařilo získat e-mail.' });
    }

    let userId;
    let finalUser;

    // Check if user already exists
    const [users] = await pool.query(
      'SELECT id, email, first_name, last_name, avatar_url, bio FROM users WHERE email = ?', 
      [email]
    );

    if (users.length > 0) {
      // User exists, log them in
      const user = users[0];
      userId = user.id;
      finalUser = user;
      
      // Optionally update their avatar if they didn't have one
      if (!user.avatar_url && avatarUrl) {
        await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, userId]);
        finalUser.avatar_url = avatarUrl;
      }
    } else {
      // User doesn't exist, create account
      // We still need a password hash field due to schema, we'll generate a random string as password hash 
      // since they will login with Google.
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      const [result] = await pool.query(
        'INSERT INTO users (email, password_hash, first_name, last_name, avatar_url) VALUES (?, ?, ?, ?, ?)',
        [email, passwordHash, firstName, lastName, avatarUrl]
      );
      userId = result.insertId;

      await pool.query(
        'INSERT INTO user_settings (user_id, theme, currency) VALUES (?, ?, ?)',
        [userId, 'dark', 'CZK']
      );

      finalUser = {
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        avatar_url: avatarUrl,
        bio: null
      };
    }

    // Generate JWT
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: finalUser
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Chyba serveru při přihlášení přes Google.' });
  }
});

// ── GET /api/auth/me ────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, email, first_name, last_name, avatar_url, bio, created_at FROM users WHERE id = ?', 
      [req.userId]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: 'Uživatel nenalezen.' });
    }

    res.json({ user: users[0] });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Chyba serveru.' });
  }
});

// ── PUT /api/auth/profile ────────────────────────────────────
router.put('/profile', auth, async (req, res) => {
  try {
    const { first_name, last_name, avatar_url, bio } = req.body;

    await pool.query(
      'UPDATE users SET first_name = ?, last_name = ?, avatar_url = ?, bio = ? WHERE id = ?',
      [first_name, last_name, avatar_url, bio, req.userId]
    );

    const [users] = await pool.query(
      'SELECT id, email, first_name, last_name, avatar_url, bio, created_at FROM users WHERE id = ?',
      [req.userId]
    );

    res.json({ user: users[0] });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Chyba serveru při aktualizaci profilu.' });
  }
});

export default router;
