import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import auth from '../middleware/auth.js';

const router = Router();

// ── POST /api/auth/register ─────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail a heslo jsou povinné.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Heslo musí mít alespoň 6 znaků.' });
    }

    // Check if user already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Uživatel s tímto e-mailem již existuje.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, passwordHash]
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
      user: { id: userId, email }
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
    const [users] = await pool.query('SELECT id, email, password_hash FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Nesprávný e-mail nebo heslo.' });
    }

    const user = users[0];

    // Compare password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Nesprávný e-mail nebo heslo.' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Chyba serveru při přihlášení.' });
  }
});

// ── GET /api/auth/me ────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, email, created_at FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Uživatel nenalezen.' });
    }

    res.json({ user: users[0] });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Chyba serveru.' });
  }
});

export default router;
