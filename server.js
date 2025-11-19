import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from 'pg';

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_PATH = path.join(__dirname, 'dist');

const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'change-me';
const COOKIE_NAME = 'mik_admin_session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || process.env.RENDER_EXTERNAL_URL || '';
const LOCAL_DEV_ORIGIN = process.env.LOCAL_DEV_ORIGIN || 'http://localhost:5173';
const HASH_ITERATIONS = 310000;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL must be set to start the API server.');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const app = express();

const allowedOrigins = [FRONTEND_ORIGIN, LOCAL_DEV_ORIGIN].filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

function signSession(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, 64, 'sha512').toString('hex');
  return `${HASH_ITERATIONS}$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  const [iterations = '0', salt = '', hashedPassword = ''] = stored.split('$');
  const derived = crypto.pbkdf2Sync(password, salt, Number(iterations), 64, 'sha512').toString('hex');
  const storedBuffer = Buffer.from(hashedPassword, 'hex');
  const derivedBuffer = Buffer.from(derived, 'hex');

  if (storedBuffer.length !== derivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, derivedBuffer);
}

function verifySession(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

async function ensureAdminUser() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        email TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && adminPassword) {
      const passwordHash = createPasswordHash(adminPassword);
      await client.query(
        `INSERT INTO admin_users (email, password_hash)
         VALUES ($1, $2)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
        [adminEmail, passwordHash],
      );
      console.log('Default admin user ensured');
    }
  } finally {
    client.release();
  }
}

async function authenticateRequest(req, res, next) {
  const bearer = req.headers.authorization?.replace('Bearer ', '');
  const token = req.cookies[COOKIE_NAME] || bearer;

  if (!token) {
    return res.status(401).json({ message: 'Nincs aktív munkamenet' });
  }

  const session = verifySession(token);

  if (!session) {
    return res.status(401).json({ message: 'Érvénytelen vagy lejárt munkamenet' });
  }

  req.user = session;
  return next();
}

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Az e-mail és jelszó megadása kötelező' });
  }

  const client = await pool.connect();
  try {
    const result = await client.query('SELECT email, password_hash FROM admin_users WHERE email = $1', [email]);

    if (!result.rows.length) {
      return res.status(401).json({ message: 'Helytelen belépési adatok' });
    }

    const user = result.rows[0];
    const isValid = verifyPassword(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ message: 'Helytelen belépési adatok' });
    }

    const token = signSession({ email: user.email });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_MAX_AGE_MS,
      path: '/',
    });

    return res.status(200).json({ user: { email: user.email } });
  } catch (error) {
    console.error('Login error', error);
    return res.status(500).json({ message: 'Váratlan hiba történt' });
  } finally {
    client.release();
  }
});

app.get('/api/auth/me', authenticateRequest, async (req, res) => {
  return res.status(200).json({ user: { email: req.user.email } });
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  return res.status(200).json({ success: true });
});

app.use(express.static(DIST_PATH));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'Nem található erőforrás' });
  }

  return res.sendFile(path.join(DIST_PATH, 'index.html'));
});

ensureAdminUser()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start API server', error);
    process.exit(1);
  });
