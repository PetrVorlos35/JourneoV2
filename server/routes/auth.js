import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import auth from '../middleware/auth.js';
import { sendVerificationCode } from '../lib/mailer.js';
import { getCodeCooldownRemaining } from '../lib/otpThrottle.js';
import { waitUntil } from '@vercel/functions';

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
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user — catch duplicate email from concurrent requests
    let result;
    try {
      [result] = await pool.query(
        'INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)',
        [email, passwordHash, first_name || null, last_name || null]
      );
    } catch (insertErr) {
      if (insertErr.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Tento e-mail je již zaregistrovaný, zkuste se přihlásit.' });
      }
      throw insertErr;
    }

    const userId = result.insertId;

    // Create default settings
    await pool.query(
      'INSERT INTO user_settings (user_id, theme, currency) VALUES (?, ?, ?)',
      [userId, 'dark', 'CZK']
    );

    // Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Save token
    await pool.query(
      'INSERT INTO verification_tokens (email, token, type, expires_at) VALUES (?, ?, ?, ?)',
      [email, code, 'REGISTER', expiresAt]
    );

    // Send email (non-blocking)
    waitUntil(
      sendVerificationCode(email, code, 'REGISTER').catch(err => 
        console.error('Email sending failed:', err)
      )
    );

    // Return success without JWT
    res.status(201).json({ message: 'Registrace úspěšná, zkontrolujte svůj e-mail.' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Chyba serveru při registraci.' });
  }
});

// ── POST /api/auth/verify ───────────────────────────────────
router.post('/verify', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'E-mail a kód jsou povinné.' });
    }

    const [tokens] = await pool.query(
      'SELECT id, expires_at FROM verification_tokens WHERE email = ? AND token = ? AND type = "REGISTER" ORDER BY created_at DESC LIMIT 1',
      [email, code]
    );

    if (tokens.length === 0) {
      return res.status(400).json({ error: 'Neplatný nebo nesprávný kód.' });
    }

    const tokenRecord = tokens[0];
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Platnost kódu vypršela. Nechte si zaslat nový.' });
    }

    // Mark user as verified
    await pool.query('UPDATE users SET is_verified = 1 WHERE email = ?', [email]);

    // Delete used token
    await pool.query('DELETE FROM verification_tokens WHERE id = ?', [tokenRecord.id]);

    res.json({ message: 'E-mail byl úspěšně ověřen. Nyní se můžete přihlásit.' });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Chyba serveru při ověřování.' });
  }
});

// ── POST /api/auth/resend-otp ───────────────────────────────
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'E-mail je povinný.' });

    // Check if user exists and is not verified
    const [users] = await pool.query('SELECT is_verified FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Uživatel nenalezen.' });
    }
    if (users[0].is_verified) {
      return res.status(400).json({ error: 'Tento účet je již ověřen.' });
    }

    // Cooldown – kód lze poslat nejvýš jednou za 30 vteřin
    const cooldown = await getCodeCooldownRemaining(email, 'REGISTER');
    if (cooldown > 0) {
      res.set('Retry-After', String(cooldown));
      return res.status(429).json({
        error: `Nový kód můžete poslat až za ${cooldown} s.`,
        retryAfter: cooldown,
      });
    }

    // Invalidate old tokens
    await pool.query('DELETE FROM verification_tokens WHERE email = ? AND type = "REGISTER"', [email]);

    // Generate new OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Save token
    await pool.query(
      'INSERT INTO verification_tokens (email, token, type, expires_at) VALUES (?, ?, ?, ?)',
      [email, code, 'REGISTER', expiresAt]
    );

    // Send email (non-blocking)
    waitUntil(
      sendVerificationCode(email, code, 'REGISTER').catch(err => 
        console.error('Email sending failed:', err)
      )
    );

    res.json({ message: 'Nový kód byl odeslán na váš e-mail.' });
  } catch (err) {
    console.error('Resend error:', err);
    res.status(500).json({ error: 'Chyba při odesílání nového kódu.' });
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
      'SELECT id, email, password_hash, first_name, last_name, avatar_url, bio, bank_account, role, is_verified FROM users WHERE email = ?',
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

    if (!user.is_verified) {
      return res.status(403).json({ error: 'E-mail ještě nebyl ověřen.', needsVerification: true });
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
        bio: user.bio,
        bank_account: user.bank_account,
        role: user.role || 'user'
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
      'SELECT id, email, first_name, last_name, avatar_url, bio, role FROM users WHERE email = ?', 
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
      const salt = await bcrypt.genSalt(10);
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
        bio: null,
        role: 'user'
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
      'SELECT id, email, first_name, last_name, avatar_url, bio, bank_account, role, created_at FROM users WHERE id = ?',
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
    const { first_name, last_name, avatar_url, bio, bank_account } = req.body;

    // bank_account is updated only when provided (COALESCE keeps the existing
    // value when undefined; pass '' to clear it).
    await pool.query(
      'UPDATE users SET first_name = ?, last_name = ?, avatar_url = ?, bio = ?, bank_account = COALESCE(?, bank_account) WHERE id = ?',
      [first_name, last_name, avatar_url, bio, bank_account ?? null, req.userId]
    );

    const [users] = await pool.query(
      'SELECT id, email, first_name, last_name, avatar_url, bio, bank_account, role, created_at FROM users WHERE id = ?',
      [req.userId]
    );

    res.json({ user: users[0] });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Chyba serveru při aktualizaci profilu.' });
  }
});

// ── POST /api/auth/forgot-password ──────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'E-mail je povinný.' });

    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      // Vracíme stejnou hlášku z bezpečnostních důvodů (aby nešlo zjistit, jaké maily existují)
      return res.json({ message: 'Pokud existuje účet s tímto e-mailem, byl na něj odeslán odkaz pro obnovu.' });
    }

    // Cooldown – kód lze poslat nejvýš jednou za 30 vteřin.
    // Kontrolujeme až tady (až po ověření existence účtu), aby
    // 429 neprozrazovala, které e-maily v databázi existují.
    const cooldown = await getCodeCooldownRemaining(email, 'RESET');
    if (cooldown > 0) {
      res.set('Retry-After', String(cooldown));
      return res.status(429).json({
        error: `Nový kód můžete poslat až za ${cooldown} s.`,
        retryAfter: cooldown,
      });
    }

    // Invalidate old RESET tokens
    await pool.query('DELETE FROM verification_tokens WHERE email = ? AND type = "RESET"', [email]);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      'INSERT INTO verification_tokens (email, token, type, expires_at) VALUES (?, ?, ?, ?)',
      [email, code, 'RESET', expiresAt]
    );

    // Send email (non-blocking)
    waitUntil(
      sendVerificationCode(email, code, 'RESET').catch(err => 
        console.error('Email sending failed:', err)
      )
    );

    res.json({ message: 'Pokud existuje účet s tímto e-mailem, byl na něj odeslán odkaz pro obnovu.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Chyba serveru při žádosti o obnovu.' });
  }
});

// ── POST /api/auth/reset-password ───────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, new_password } = req.body;

    if (!email || !code || !new_password) {
      return res.status(400).json({ error: 'Vyplňte všechny údaje.' });
    }

    if (new_password.length < 8 || !/[A-Z]/.test(new_password) || !/[0-9]/.test(new_password)) {
      return res.status(400).json({ error: 'Heslo nesplňuje bezpečnostní požadavky.' });
    }

    const [tokens] = await pool.query(
      'SELECT id, expires_at FROM verification_tokens WHERE email = ? AND token = ? AND type = "RESET" ORDER BY created_at DESC LIMIT 1',
      [email, code]
    );

    if (tokens.length === 0) {
      return res.status(400).json({ error: 'Neplatný nebo nesprávný kód.' });
    }

    const tokenRecord = tokens[0];
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Platnost kódu vypršela. Žádejte o obnovu znovu.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(new_password, salt);

    await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [passwordHash, email]);
    await pool.query('DELETE FROM verification_tokens WHERE id = ?', [tokenRecord.id]);

    res.json({ message: 'Vaše heslo bylo úspěšně změněno. Můžete se přihlásit.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Chyba serveru při změně hesla.' });
  }
});

// ── POST /api/auth/change-password ──────────────────────────
router.post('/change-password', auth, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(400).json({ error: 'Vyplňte obě hesla.' });
    }

    if (new_password.length < 8 || !/[A-Z]/.test(new_password) || !/[0-9]/.test(new_password)) {
      return res.status(400).json({ error: 'Nové heslo nesplňuje bezpečnostní požadavky.' });
    }

    const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Uživatel nenalezen.' });
    }

    const isValid = await bcrypt.compare(old_password, users[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Současné heslo je nesprávné.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(new_password, salt);

    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, req.userId]);

    res.json({ message: 'Heslo bylo úspěšně změněno.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Chyba serveru při změně hesla.' });
  }
});

export default router;
