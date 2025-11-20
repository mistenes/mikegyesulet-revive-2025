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
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '';
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || '';
const LOCAL_DEV_ORIGIN = process.env.LOCAL_DEV_ORIGIN || 'http://localhost:5173';
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || process.env.VITE_MAPBOX_TOKEN || '';
const HASH_ITERATIONS = 310000;
const PAGE_SIZE_DEFAULT = 9;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL must be set to start the API server.');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const app = express();

const allowedOrigins = [FRONTEND_ORIGIN, RENDER_EXTERNAL_URL, LOCAL_DEV_ORIGIN].filter(Boolean);
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

async function ensureNewsTables() {
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    await client.query(`
      CREATE TABLE IF NOT EXISTS news_articles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category TEXT NOT NULL,
        image_url TEXT,
        image_alt TEXT,
        published BOOLEAN NOT NULL DEFAULT FALSE,
        published_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        slug_hu TEXT NOT NULL,
        slug_en TEXT NOT NULL,
        translations JSONB NOT NULL
      );
    `);

    await client.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS news_slug_hu_idx ON news_articles(slug_hu);',
    );
    await client.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS news_slug_en_idx ON news_articles(slug_en);',
    );
    await client.query(
      'CREATE INDEX IF NOT EXISTS news_published_idx ON news_articles(published, published_at DESC, created_at DESC);',
    );
  } finally {
    client.release();
  }
}

function mapNewsRow(row) {
  return {
    id: row.id,
    category: row.category,
    imageUrl: row.image_url || undefined,
    imageAlt: row.image_alt || '',
    published: row.published,
    publishedAt: row.published_at ? row.published_at.toISOString() : null,
    createdAt: row.created_at ? row.created_at.toISOString() : '',
    updatedAt: row.updated_at ? row.updated_at.toISOString() : '',
    translations: row.translations || { hu: {}, en: {} },
  };
}

async function validateUniqueSlugs(client, { slugHu, slugEn, excludeId }) {
  const params = [slugHu, slugEn];
  let query = 'SELECT id, slug_hu, slug_en FROM news_articles WHERE slug_hu = $1 OR slug_en = $2';

  if (excludeId) {
    params.push(excludeId);
    query += ' AND id <> $3';
  }

  const existing = await client.query(query, params);
  if (existing.rows.length) {
    const conflict = existing.rows[0];
    const conflictSlug = conflict.slug_hu === slugHu ? slugHu : slugEn;
    const language = conflict.slug_hu === slugHu ? 'magyar' : 'angol';
    const message = `A(z) ${language} slug (${conflictSlug}) már létezik.`;
    const error = new Error(message);
    error.status = 409;
    throw error;
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

app.get('/api/public/mapbox-token', (_req, res) => {
  if (!MAPBOX_TOKEN) {
    return res.status(404).json({ message: 'Mapbox token is not configured' });
  }

  return res.status(200).json({ token: MAPBOX_TOKEN });
});

app.get('/api/news', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  const search = (req.query.search || '').toString().trim();
  const status = (req.query.status || 'all').toString();
  const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
  const pageSize = Number(req.query.pageSize) > 0 ? Number(req.query.pageSize) : PAGE_SIZE_DEFAULT;

  const filters = [];
  const values = [];

  if (status === 'published') {
    filters.push('published = TRUE');
  } else if (status === 'draft') {
    filters.push('published = FALSE');
  }

  if (search) {
    values.push(`%${search}%`);
    filters.push(
      `(LOWER(category) LIKE LOWER($${values.length})
        OR LOWER(translations -> 'hu' ->> 'title') LIKE LOWER($${values.length})
        OR LOWER(translations -> 'en' ->> 'title') LIKE LOWER($${values.length})
        OR LOWER(translations -> 'hu' ->> 'excerpt') LIKE LOWER($${values.length})
        OR LOWER(translations -> 'en' ->> 'excerpt') LIKE LOWER($${values.length}))`,
    );
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;

  try {
    const countResult = await client.query(`SELECT COUNT(*) FROM news_articles ${whereClause}`, values);
    const total = Number(countResult.rows[0]?.count || 0);

    const listResult = await client.query(
      `SELECT *
       FROM news_articles
       ${whereClause}
       ORDER BY published_at DESC NULLS LAST, created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, pageSize, offset],
    );

    const items = listResult.rows.map(mapNewsRow);
    return res.status(200).json({ items, total, page, pageSize });
  } catch (error) {
    console.error('List news error', error);
    return res.status(500).json({ message: 'Nem sikerült betölteni a híreket' });
  } finally {
    client.release();
  }
});

app.get('/api/news/public', async (req, res) => {
  const client = await pool.connect();
  const search = (req.query.search || '').toString().trim();
  const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 6;

  const filters = ['published = TRUE'];
  const values = [];

  if (search) {
    values.push(`%${search}%`);
    filters.push(
      `(LOWER(category) LIKE LOWER($${values.length})
        OR LOWER(translations -> 'hu' ->> 'title') LIKE LOWER($${values.length})
        OR LOWER(translations -> 'en' ->> 'title') LIKE LOWER($${values.length})
        OR LOWER(translations -> 'hu' ->> 'excerpt') LIKE LOWER($${values.length})
        OR LOWER(translations -> 'en' ->> 'excerpt') LIKE LOWER($${values.length}))`,
    );
  }

  const whereClause = `WHERE ${filters.join(' AND ')}`;

  try {
    const result = await client.query(
      `SELECT *
       FROM news_articles
       ${whereClause}
       ORDER BY published_at DESC NULLS LAST, created_at DESC
       LIMIT $${values.length + 1}`,
      [...values, limit],
    );

    return res.status(200).json({ items: result.rows.map(mapNewsRow) });
  } catch (error) {
    console.error('Public news error', error);
    return res.status(500).json({ message: 'Nem sikerült betölteni a híreket' });
  } finally {
    client.release();
  }
});

app.get('/api/news/slug/:slug', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM news_articles
       WHERE (slug_hu = $1 OR slug_en = $1) AND published = TRUE
       LIMIT 1`,
      [req.params.slug],
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'A hír nem található' });
    }

    return res.status(200).json(mapNewsRow(result.rows[0]));
  } catch (error) {
    console.error('Fetch news by slug error', error);
    return res.status(500).json({ message: 'Nem sikerült betölteni a hírt' });
  } finally {
    client.release();
  }
});

app.post('/api/news', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  const payload = req.body || {};

  if (!payload.translations?.hu?.slug || !payload.translations?.en?.slug) {
    return res.status(400).json({ message: 'A magyar és angol slug mező megadása kötelező' });
  }

  try {
    await validateUniqueSlugs(client, {
      slugHu: payload.translations.hu.slug,
      slugEn: payload.translations.en.slug,
    });

    const publishedAt = payload.published ? new Date().toISOString() : null;

    const result = await client.query(
      `INSERT INTO news_articles
       (category, image_url, image_alt, published, published_at, slug_hu, slug_en, translations)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        payload.category,
        payload.imageUrl || null,
        payload.imageAlt || null,
        Boolean(payload.published),
        publishedAt,
        payload.translations.hu.slug,
        payload.translations.en.slug,
        payload.translations,
      ],
    );

    return res.status(201).json(mapNewsRow(result.rows[0]));
  } catch (error) {
    console.error('Create news error', error);
    const status = error.status || 500;
    return res.status(status).json({ message: error.message || 'Nem sikerült létrehozni a hírt' });
  } finally {
    client.release();
  }
});

app.put('/api/news/:id', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  const payload = req.body || {};
  const newsId = req.params.id;

  if (!payload.translations?.hu?.slug || !payload.translations?.en?.slug) {
    return res.status(400).json({ message: 'A magyar és angol slug mező megadása kötelező' });
  }

  try {
    await validateUniqueSlugs(client, {
      slugHu: payload.translations.hu.slug,
      slugEn: payload.translations.en.slug,
      excludeId: newsId,
    });

    const existing = await client.query('SELECT * FROM news_articles WHERE id = $1 LIMIT 1', [newsId]);
    if (!existing.rows.length) {
      return res.status(404).json({ message: 'A hír nem található' });
    }

    const current = existing.rows[0];
    const publishedAt = payload.published
      ? current.published_at || new Date().toISOString()
      : null;

    const result = await client.query(
      `UPDATE news_articles
       SET category = $1,
           image_url = $2,
           image_alt = $3,
           published = $4,
           published_at = $5,
           slug_hu = $6,
           slug_en = $7,
           translations = $8,
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        payload.category,
        payload.imageUrl || null,
        payload.imageAlt || null,
        Boolean(payload.published),
        publishedAt,
        payload.translations.hu.slug,
        payload.translations.en.slug,
        payload.translations,
        newsId,
      ],
    );

    return res.status(200).json(mapNewsRow(result.rows[0]));
  } catch (error) {
    console.error('Update news error', error);
    const status = error.status || 500;
    return res.status(status).json({ message: error.message || 'Nem sikerült frissíteni a hírt' });
  } finally {
    client.release();
  }
});

app.delete('/api/news/:id', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM news_articles WHERE id = $1', [req.params.id]);
    return res.status(204).send();
  } catch (error) {
    console.error('Delete news error', error);
    return res.status(500).json({ message: 'Nem sikerült törölni a hírt' });
  } finally {
    client.release();
  }
});

app.use(express.static(DIST_PATH));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'Nem található erőforrás' });
  }

  return res.sendFile(path.join(DIST_PATH, 'index.html'));
});

Promise.all([ensureAdminUser(), ensureNewsTables()])
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start API server', error);
    process.exit(1);
  });
