import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import auth from '../middleware/auth.js';
import { sendVerificationCode, sendTripTransferredEmail } from '../lib/mailer.js';
import { track, isBot } from '../lib/analytics.js';
import { guestLimiter, otpAttemptLimiter, checkEmailLimiter } from '../middleware/rateLimit.js';
import {
  GUEST_COLUMNS, GUEST_GRACE_DAYS, GUEST_TRIAL_DAYS, blockGuests, claimGuest, createSampleTrip,
  guestEmail, guestFields, guestState, isGuestEmail,
} from '../lib/guest.js';
import { getCodeCooldownRemaining } from '../lib/otpThrottle.js';
import { waitUntil } from '@vercel/functions';

const router = Router();

// 6místný ověřovací kód z kryptograficky bezpečného generátoru.
const generateOtpCode = () => crypto.randomInt(100000, 1000000).toString();

// Nedoručitelné adresy hostů (…@guest.journeo.invalid) nikdy nevstupují
// do přihlášení, registrace ani resetu hesla — na zkušební účet se jde
// jen jeho tokenem.
router.use((req, res, next) => {
  if (isGuestEmail(req.body?.email)) {
    return res.status(400).json({ error: 'Neplatný e-mail.' });
  }
  next();
});

// ── POST /api/auth/guest ────────────────────────────────────
// Spustí zkušební režim: dočasný účet na 3 dny s ukázkovým výletem.
// Bez e-mailu a hesla, přihlášení drží jen token v tomto prohlížeči.
const GUEST_HOURLY_CAP = parseInt(process.env.GUEST_HOURLY_CAP, 10) || 200;

router.post('/guest', guestLimiter, async (req, res) => {
  if (isBot(req.headers['user-agent'])) {
    return res.status(403).json({ error: 'Zkušební režim není dostupný.' });
  }
  const language = req.body?.language === 'en' ? 'en' : 'cs';

  const connection = await pool.getConnection();
  try {
    // Pojistka proti zahlcení napříč IP adresami: nad strop už jen registrace.
    const [[{ recent }]] = await connection.query(
      'SELECT COUNT(*) AS recent FROM users WHERE is_guest = 1 AND created_at >= NOW() - INTERVAL 1 HOUR'
    );
    if (Number(recent) >= GUEST_HOURLY_CAP) {
      return res.status(503).json({
        error: 'Zkušební režim je teď vytížený. Zaregistruj se, je to zdarma a zabere minutu.',
        code: 'GUEST_UNAVAILABLE',
      });
    }

    // Náhodné heslo jen kvůli NOT NULL — host se heslem nikdy nepřihlašuje.
    const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO users (email, password_hash, is_verified, is_guest, guest_expires_at)
       VALUES (?, ?, 0, 1, NOW() + INTERVAL ? DAY)`,
      [guestEmail(), passwordHash, GUEST_TRIAL_DAYS]
    );
    const userId = result.insertId;
    await connection.query(
      'INSERT INTO user_settings (user_id, theme, currency, language) VALUES (?, ?, ?, ?)',
      [userId, 'light', language === 'en' ? 'EUR' : 'CZK', language]
    );
    try {
      // Kdo přišel přes „Zkopírovat si výlet“, ukázku nepotřebuje.
      if (req.body?.sample !== false) await createSampleTrip(connection, userId);
    } catch (err) {
      // Bez ukázky to pořád funguje — host si udělá vlastní výlet.
      console.error('Sample trip error:', err);
    }
    await connection.commit();

    const [[user]] = await connection.query(
      `SELECT id, email, first_name, last_name, avatar_url, bio, bank_account, role, created_at, ${GUEST_COLUMNS}
       FROM users WHERE id = ?`,
      [userId]
    );
    const token = jwt.sign({ userId, tv: 0 }, process.env.JWT_SECRET, {
      expiresIn: `${GUEST_TRIAL_DAYS + GUEST_GRACE_DAYS}d`,
    });
    track(req, 'guest_started', { userId });

    const { is_guest: _g, guest_seconds_left: _s, ...publicUser } = user;
    res.status(201).json({ token, user: { ...publicUser, ...guestFields(user) } });
  } catch (err) {
    await connection.rollback().catch(() => {});
    console.error('Start guest error:', err);
    res.status(500).json({ error: 'Zkušební režim se nepodařilo spustit.' });
  } finally {
    connection.release();
  }
});

// ── POST /api/auth/guest/claim  { guestToken } ──────────────
// Po registraci nebo přihlášení převede výlety ze zkoušky na skutečný účet
// (volá se s tokenem nového účtu). Token hosta zná jen prohlížeč, ve kterém
// zkouška běžela, takže cizí výlety si takhle nikdo nepřivlastní.
router.post('/guest/claim', auth, async (req, res) => {
  if (req.isGuest) return res.status(400).json({ error: 'Nejdřív se zaregistruj nebo přihlas.' });

  let guestId;
  try {
    guestId = jwt.verify(String(req.body?.guestToken || ''), process.env.JWT_SECRET).userId;
  } catch {
    return res.status(404).json({ error: 'Zkušební účet nenalezen.' });
  }
  if (!guestId || guestId === req.userId) return res.status(404).json({ error: 'Zkušební účet nenalezen.' });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[guest]] = await connection.query(
      `SELECT id, ${GUEST_COLUMNS} FROM users WHERE id = ? AND is_guest = 1 FOR UPDATE`,
      [guestId]
    );
    const state = guestState(guest);
    if (!state || state.ended) {
      await connection.rollback();
      return res.status(404).json({ error: 'Zkušební účet už neexistuje.' });
    }
    const movedTrips = await claimGuest(connection, guestId, req.userId);
    await connection.commit();
    track(req, 'guest_converted', { props: { trips: movedTrips, readOnly: state.readOnly } });
    res.json({ movedTrips });
  } catch (err) {
    await connection.rollback().catch(() => {});
    console.error('Claim guest error:', err);
    res.status(500).json({ error: 'Výlety ze zkoušky se nepodařilo převést.' });
  } finally {
    connection.release();
  }
});

// ── POST /api/auth/check-email ──────────────────────────────
// První krok sjednoceného přihlášení/registrace: podle e-mailu se frontend
// rozhodne, jestli ukáže pole pro heslo (existující účet), nebo formulář
// pro vytvoření účtu. Neověřený účet bereme jako nový — registraci lze
// dokončit znovu (viz /register). Existenci účtu tím ze své podstaty
// prozrazuje, proto má vlastní přísný limit (checkEmailLimiter).
router.post('/check-email', checkEmailLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'E-mail je povinný.' });

    const [users] = await pool.query('SELECT is_verified FROM users WHERE email = ?', [email]);
    res.json({ exists: users.length > 0 && !!users[0].is_verified });
  } catch (err) {
    console.error('Check email error:', err);
    res.status(500).json({ error: 'Chyba serveru.' });
  }
});

// ── POST /api/auth/register ─────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail a heslo jsou povinné.' });
    }

    // Stejná pravidla jako reset-password / change-password, aby slabé heslo
    // z registrace nemohlo obejít přísnější politiku jinde.
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Heslo musí mít alespoň 8 znaků, velké písmeno a číslici.' });
    }

    // Check if user already exists
    const [existing] = await pool.query('SELECT id, is_verified FROM users WHERE email = ?', [email]);
    if (existing.length > 0 && existing[0].is_verified) {
      return res.status(409).json({ error: 'Tento e-mail je již zaregistrovaný, zkuste se přihlásit.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (existing.length > 0) {
      // Neověřený účet (registrace nedokončená, nebo ji založil někdo, kdo
      // k e-mailu nemá přístup) — přepíšeme heslo a pošleme nový kód.
      // Účet bez ověření se nikdy nepřihlásil, takže nic nepřepisujeme.
      const cooldown = await getCodeCooldownRemaining(email, 'REGISTER');
      if (cooldown > 0) {
        res.set('Retry-After', String(cooldown));
        return res.status(429).json({
          error: `Nový kód můžete poslat až za ${cooldown} s.`,
          retryAfter: cooldown,
        });
      }
      await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, existing[0].id]);
      await pool.query('DELETE FROM verification_tokens WHERE email = ? AND type = "REGISTER"', [email]);
    } else {
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

      // Create default settings
      await pool.query(
        'INSERT INTO user_settings (user_id, theme, currency) VALUES (?, ?, ?)',
        [result.insertId, 'light', 'CZK']
      );
    }

    // Generate OTP
    const code = generateOtpCode(); // 6-digit code
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
router.post('/verify', otpAttemptLimiter('REGISTER'), async (req, res) => {
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

    // Ověřením kódu uživatel prokázal vlastnictví e-mailu i znalost hesla
    // (zadal ho o krok dřív), takže ho rovnou přihlásíme a onboarding
    // pokračuje bez dalšího zadávání hesla.
    const [users] = await pool.query(
      'SELECT id, email, first_name, last_name, avatar_url, bio, bank_account, role, token_version FROM users WHERE email = ?',
      [email]
    );
    const { token_version, ...user } = users[0];
    const token = jwt.sign({ userId: user.id, tv: token_version }, process.env.JWT_SECRET, { expiresIn: '30d' });

    track(req, 'signup', { userId: user.id, props: { method: 'email' } });
    res.json({
      message: 'E-mail byl úspěšně ověřen.',
      token,
      user: { ...user, role: user.role || 'user' },
    });
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
    // Neexistující i už ověřený účet dostane stejnou odpověď jako úspěch,
    // ať tenhle endpoint neprozrazuje, které e-maily mají účet.
    if (users.length === 0 || users[0].is_verified) {
      return res.json({ message: 'Nový kód byl odeslán na váš e-mail.' });
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
    const code = generateOtpCode();
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
      'SELECT id, email, password_hash, first_name, last_name, avatar_url, bio, bank_account, role, is_verified, token_version FROM users WHERE email = ?',
      [email]
    );
    if (users.length === 0) {
      return res.status(401).json({ error: 'Špatné heslo nebo e-mail.' });
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

    // Generate JWT. `tv` (token version) umožňuje revokaci — viz middleware/auth.js.
    const token = jwt.sign({ userId: user.id, tv: user.token_version }, process.env.JWT_SECRET, { expiresIn: '30d' });
    track(req, 'login', { userId: user.id, props: { method: 'password' } });

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
// The client ID this app's Google tokens must be issued for. Set GOOGLE_CLIENT_ID
// on the server (falls back to the build-time VITE_GOOGLE_CLIENT_ID for local dev).
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;

router.post('/google', async (req, res) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ error: 'Chybí access_token.' });
    }

    if (!GOOGLE_CLIENT_ID) {
      // Fail closed: without the expected client ID we cannot safely verify tokens.
      console.error('Google auth misconfigured: GOOGLE_CLIENT_ID / VITE_GOOGLE_CLIENT_ID not set.');
      return res.status(500).json({ error: 'Přihlášení přes Google není správně nakonfigurováno.' });
    }

    // SECURITY: verify the access token was actually issued for THIS app before
    // trusting the email behind it. A bare access token is a bearer credential —
    // Google's userinfo endpoint accepts a token minted for *any* OAuth client, so
    // without this check an attacker could replay a token obtained from an unrelated
    // app to sign in as an arbitrary Journeo user (token substitution / confused deputy).
    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(access_token)}`
    );
    if (!tokenInfoRes.ok) {
      return res.status(401).json({ error: 'Neplatný token z Google.' });
    }
    const tokenInfo = await tokenInfoRes.json();
    if (tokenInfo.aud !== GOOGLE_CLIENT_ID && tokenInfo.azp !== GOOGLE_CLIENT_ID) {
      return res.status(401).json({ error: 'Token nebyl vydán pro tuto aplikaci.' });
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
    let tokenVersion = 0;
    let isNew = false;

    // Check if user already exists
    const [users] = await pool.query(
      'SELECT id, email, first_name, last_name, avatar_url, bio, role, token_version FROM users WHERE email = ?',
      [email]
    );

    if (users.length > 0) {
      // User exists, log them in
      const user = users[0];
      userId = user.id;
      tokenVersion = user.token_version;
      delete user.token_version;
      finalUser = user;
      
      // Google ručí za vlastnictví e-mailu — účet tím považujeme za ověřený
      // (jinak by ho /check-email bral jako nedokončenou registraci).
      await pool.query('UPDATE users SET is_verified = 1 WHERE id = ? AND is_verified = 0', [userId]);

      // Optionally update their avatar if they didn't have one
      if (!user.avatar_url && avatarUrl) {
        await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, userId]);
        finalUser.avatar_url = avatarUrl;
      }
    } else {
      // User doesn't exist, create account
      // We still need a password hash field due to schema, we'll generate a random string as password hash 
      // since they will login with Google.
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      const [result] = await pool.query(
        'INSERT INTO users (email, password_hash, first_name, last_name, avatar_url, is_verified) VALUES (?, ?, ?, ?, ?, 1)',
        [email, passwordHash, firstName, lastName, avatarUrl]
      );
      userId = result.insertId;
      isNew = true;

      await pool.query(
        'INSERT INTO user_settings (user_id, theme, currency) VALUES (?, ?, ?)',
        [userId, 'light', 'CZK']
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

    // Generate JWT. `tv` (token version) umožňuje revokaci — viz middleware/auth.js.
    const token = jwt.sign({ userId, tv: tokenVersion }, process.env.JWT_SECRET, { expiresIn: '30d' });
    track(req, isNew ? 'signup' : 'login', { userId, props: { method: 'google' } });

    res.json({
      token,
      user: finalUser,
      isNew
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
      `SELECT id, email, first_name, last_name, avatar_url, bio, bank_account, role, created_at, ${GUEST_COLUMNS}
       FROM users WHERE id = ?`,
      [req.userId]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: 'Uživatel nenalezen.' });
    }

    const { is_guest: _g, guest_seconds_left: _s, ...user } = users[0];
    res.json({ user: { ...user, ...guestFields(users[0]) } });
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

    const code = generateOtpCode();
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

// Kód pro obnovu hesla: platný a nevypršelý, jinak text chyby pro uživatele.
const findResetToken = async (email, code) => {
  const [tokens] = await pool.query(
    'SELECT id, expires_at FROM verification_tokens WHERE email = ? AND token = ? AND type = "RESET" ORDER BY created_at DESC LIMIT 1',
    [email, code]
  );
  if (tokens.length === 0) return { error: 'Neplatný nebo nesprávný kód.' };
  if (new Date(tokens[0].expires_at) < new Date()) {
    return { error: 'Platnost kódu vypršela. Žádejte o obnovu znovu.' };
  }
  return { tokenRecord: tokens[0] };
};

// ── POST /api/auth/verify-reset-code ────────────────────────
// Jen ověří kód (nespotřebuje ho), aby šlo nové heslo zadávat až po správném
// kódu. Sdílí limiter s /reset-password, takže pokusy se sčítají.
router.post('/verify-reset-code', otpAttemptLimiter('RESET'), async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'E-mail a kód jsou povinné.' });
    }
    const { error } = await findResetToken(email, code);
    if (error) return res.status(400).json({ error });
    res.json({ valid: true });
  } catch (err) {
    console.error('Verify reset code error:', err);
    res.status(500).json({ error: 'Chyba serveru při ověřování kódu.' });
  }
});

// ── POST /api/auth/reset-password ───────────────────────────
router.post('/reset-password', otpAttemptLimiter('RESET'), async (req, res) => {
  try {
    const { email, code, new_password } = req.body;

    if (!email || !code || !new_password) {
      return res.status(400).json({ error: 'Vyplňte všechny údaje.' });
    }

    if (new_password.length < 8 || !/[A-Z]/.test(new_password) || !/[0-9]/.test(new_password)) {
      return res.status(400).json({ error: 'Heslo nesplňuje bezpečnostní požadavky.' });
    }

    const { tokenRecord, error } = await findResetToken(email, code);
    if (error) return res.status(400).json({ error });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(new_password, salt);

    // Bump token_version → všechny dosud vydané JWT tohoto uživatele přestanou platit.
    await pool.query(
      'UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE email = ?',
      [passwordHash, email]
    );
    await pool.query('DELETE FROM verification_tokens WHERE id = ?', [tokenRecord.id]);

    res.json({ message: 'Vaše heslo bylo úspěšně změněno. Můžete se přihlásit.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Chyba serveru při změně hesla.' });
  }
});

// ── POST /api/auth/change-password ──────────────────────────
router.post('/change-password', auth, blockGuests, async (req, res) => {
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

    // Bump token_version → všechny dosud vydané JWT přestanou platit (odhlásí
    // ostatní zařízení). Aktuální session dostane čerstvý token s novou verzí.
    await pool.query(
      'UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?',
      [passwordHash, req.userId]
    );

    const [updated] = await pool.query('SELECT token_version FROM users WHERE id = ?', [req.userId]);
    const token = jwt.sign(
      { userId: req.userId, tv: updated[0].token_version },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ message: 'Heslo bylo úspěšně změněno.', token });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Chyba serveru při změně hesla.' });
  }
});

// ── DELETE /api/auth/account ────────────────────────────────
// Self-service smazání účtu (GDPR – právo na výmaz). Potvrzuje se opsáním
// vlastního e-mailu — funguje stejně pro heslo i Google účty (ty mají jen
// náhodný password_hash).
//
// Vlastněné výlety, které mají aspoň jednoho editora, se předají tomu
// editorovi, který byl k výletu přidán nejdřív. Výlety jen s viewery (nebo
// bez sdílení, nebo v koši) se smažou. Zbytek mažou ON DELETE CASCADE cizí
// klíče; výdaje, které uživatel platil v cizích výletech, zůstanou s
// paid_by = NULL.
router.delete('/account', auth, async (req, res) => {
  const confirmEmail = String(req.body?.confirm_email || '').trim().toLowerCase();

  const connection = await pool.getConnection();
  try {
    const [users] = await connection.query(
      'SELECT email, first_name, last_name FROM users WHERE id = ?',
      [req.userId]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: 'Uživatel nenalezen.' });
    }

    const { email, first_name, last_name } = users[0];
    const ownerName = [first_name, last_name].filter(Boolean).join(' ').trim() || email;
    if (!confirmEmail || confirmEmail !== email.toLowerCase()) {
      return res.status(400).json({ error: 'Zadaný e-mail neodpovídá vašemu účtu.' });
    }

    await connection.beginTransaction();

    // Nejstarší editor každého vlastněného (nesmazaného) výletu.
    const [heirs] = await connection.query(
      `SELECT tc.trip_id, tc.user_id, t.title, u.email, us.language,
              COALESCE(us.email_trip_transfers, 1) AS wantsEmail
       FROM trip_collaborators tc
       JOIN trips t ON t.id = tc.trip_id
       JOIN users u ON u.id = tc.user_id
       LEFT JOIN user_settings us ON us.user_id = tc.user_id
       WHERE t.user_id = ? AND t.deleted_at IS NULL AND tc.role = 'editor'
         AND tc.id = (SELECT MIN(tc2.id) FROM trip_collaborators tc2
                      WHERE tc2.trip_id = tc.trip_id AND tc2.role = 'editor')
       FOR UPDATE`,
      [req.userId]
    );

    for (const { trip_id, user_id } of heirs) {
      await connection.query('UPDATE trips SET user_id = ? WHERE id = ?', [user_id, trip_id]);
      // Nový vlastník už není spolupracovník — vlastnictví plyne z trips.user_id.
      await connection.query('DELETE FROM trip_collaborators WHERE trip_id = ? AND user_id = ?', [trip_id, user_id]);
    }

    // Místa, která uživatel přidal do výletů, jež mu (už) nepatří, přejdou na
    // vlastníka výletu — jinak by je CASCADE na trip_places.user_id smazal.
    await connection.query(
      `UPDATE trip_places p JOIN trips t ON t.id = p.trip_id
       SET p.user_id = t.user_id
       WHERE p.user_id = ? AND t.user_id <> ?`,
      [req.userId, req.userId]
    );

    await connection.query('DELETE FROM verification_tokens WHERE email = ?', [email]);
    await connection.query('DELETE FROM users WHERE id = ?', [req.userId]);

    await connection.commit();

    // Oznámení novým vlastníkům až po commitu — jejich selhání nesmí
    // zablokovat smazání účtu (fire-and-forget, jako settlement e-maily).
    for (const heir of heirs) {
      waitUntil(
        pool.query(
          `INSERT INTO notifications (user_id, type, reference_id, message) VALUES (?, 'TRIP_TRANSFERRED', ?, ?)`,
          [heir.user_id, heir.trip_id, ownerName]
        ).catch((err) => console.error('Trip transferred notification error:', err))
      );
      if (!heir.wantsEmail) continue;
      waitUntil(
        sendTripTransferredEmail(heir.email, {
          previousOwnerName: ownerName,
          tripName: heir.title,
          tripId: heir.trip_id,
          locale: heir.language || 'cs',
        }).catch((err) => console.error('Trip transferred email error:', err))
      );
    }

    track(req, 'account_deleted', { userId: null });
    res.json({ message: 'Účet byl smazán.', transferredTrips: heirs.length });
  } catch (err) {
    await connection.rollback();
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Chyba serveru při mazání účtu.' });
  } finally {
    connection.release();
  }
});

export default router;
