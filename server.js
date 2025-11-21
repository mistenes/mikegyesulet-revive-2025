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
const IMAGEKIT_PUBLIC_KEY = process.env.IMAGEKIT_PUBLIC_KEY || '';
const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY || '';
const IMAGEKIT_URL_ENDPOINT = process.env.IMAGEKIT_URL_ENDPOINT || '';
const IMAGEKIT_GALLERY_FOLDER = process.env.IMAGEKIT_GALLERY_FOLDER || '';
const HASH_ITERATIONS = 310000;
const PAGE_SIZE_DEFAULT = 9;

const defaultPageContent = {
  hero_content: {
    hu: {
      title: 'ÜDVÖZLÜNK A MAGYAR IFJÚSÁGI KONFERENCIA HONLAPJÁN!',
      description: 'A Magyar Ifjúsági Konferencia Egyesület összeköti a Kárpát-medence magyar fiataljait.',
      primaryButtonText: 'TAGSZERVEZETI PORTÁL',
      primaryButtonUrl: 'https://dashboard.mikegyesulet.hu',
      secondaryButtonText: 'TUDJ MEG TÖBBET',
    },
    en: {
      title: 'VOICE OF HUNGARIAN YOUTH',
      description: 'The Hungarian Youth Conference Association unites young Hungarians across the Carpathian Basin.',
      primaryButtonText: 'MEMBER PORTAL',
      primaryButtonUrl: 'https://dashboard.mikegyesulet.hu',
      secondaryButtonText: 'LEARN MORE',
    },
  },
  hero_stats: {
    hu: {
      stats: [
        { value: '2000+', label: 'Aktív tag' },
        { value: '10', label: 'Régió' },
        { value: '150+', label: 'Projekt' },
      ],
    },
    en: {
      stats: [
        { value: '2000+', label: 'Active members' },
        { value: '10', label: 'Regions' },
        { value: '150+', label: 'Projects' },
      ],
    },
  },
  news_section: {
    hu: {
      subtitle: 'FRISS HÍREINK, ÍRÁSAINK',
      title: 'TÁJÉKOZÓDJ SZÜLŐFÖLDÜNKRŐL!',
      description: 'Olvasd el legfrissebb híreinket a magyar fiatalokról a Kárpát-medencében.',
      buttonText: 'MINDEN HÍR',
    },
    en: {
      subtitle: 'OUR LATEST UPDATES',
      title: 'STAY INFORMED ABOUT HUNGARIAN COMMUNITIES',
      description: 'Read the latest stories about Hungarian youth living across the Carpathian Basin.',
      buttonText: 'VIEW ALL NEWS',
    },
  },
  regions_section: {
    hu: {
      eyebrow: 'RÉGIÓK',
      title: 'Közösségeink a Kárpát-medencében',
      description: 'Több mint 10 régióban képviseljük a magyar fiatalokat.',
      buttonText: 'Fedezd fel a régiókat',
      chips: ['Erdély', 'Felvidék', 'Kárpátalja', 'Vajdaság', 'Horvátország', 'Szlovénia'],
    },
    en: {
      eyebrow: 'REGIONS',
      title: 'Our communities across the Carpathian Basin',
      description: 'We represent young Hungarians in more than 10 regions.',
      buttonText: 'Discover the regions',
      chips: ['Transylvania', 'Upper Hungary', 'Transcarpathia', 'Vojvodina', 'Croatia', 'Slovenia'],
    },
  },
  about_section: {
    hu: {
      badge: 'RÓLUNK',
      title: 'KIK VAGYUNK MI?',
      subtitle: 'Magyar fiatalok összefogása',
      description: 'Kattints, hogy megtudd, kik alkotják a MIK-et, hogyan oszlik meg a munka, és ismerd meg szervezeti struktúránkat.',
      buttonText: 'Magunkról',
      ctaBadge: 'ALAPÍTÓ NYILATKOZAT',
      ctaTitle: 'Célkitűzéseink',
      ctaDescription: 'Alapítóink világosan leírták, miért kell a magyar fiataloknak közös egyeztető fórum.',
      ctaButton: 'Megnyitás',
    },
    en: {
      badge: 'ABOUT',
      title: 'WHO ARE WE?',
      subtitle: 'Uniting Hungarian youth',
      description: 'Learn who keeps HYCA running, how we work together and how the organisation is structured.',
      buttonText: 'About us',
      ctaBadge: 'FOUNDERS\' STATEMENT',
      ctaTitle: 'Our mission',
      ctaDescription: 'The founders outlined why Hungarian youth needs a shared platform across the world.',
      ctaButton: 'Open',
    },
  },
};

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

async function ensureProjectsTables() {
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sort_order INTEGER NOT NULL DEFAULT 0,
        hero_image_url TEXT,
        hero_image_alt TEXT,
        location TEXT,
        date_range TEXT,
        link_url TEXT,
        published BOOLEAN NOT NULL DEFAULT TRUE,
        translations JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(
      'CREATE INDEX IF NOT EXISTS projects_sort_order_idx ON projects(sort_order, created_at DESC);',
    );
    await client.query(
      'CREATE INDEX IF NOT EXISTS projects_published_idx ON projects(published, sort_order);',
    );
  } finally {
    client.release();
  }
}

async function ensureGalleryTables() {
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    await client.query(`
      CREATE TABLE IF NOT EXISTS gallery_albums (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        subtitle TEXT DEFAULT '',
        event_date DATE,
        cover_image_url TEXT NOT NULL,
        cover_image_alt TEXT DEFAULT '',
        images JSONB NOT NULL DEFAULT '[]',
        sort_order INTEGER NOT NULL DEFAULT 0,
        published BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(
      'CREATE INDEX IF NOT EXISTS gallery_sort_idx ON gallery_albums(sort_order, created_at DESC);',
    );
    await client.query(
      'CREATE INDEX IF NOT EXISTS gallery_published_idx ON gallery_albums(published, sort_order);',
    );
  } finally {
    client.release();
  }
}

async function ensurePageContentTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS page_content (
        section_key TEXT PRIMARY KEY,
        translations JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    for (const [sectionKey, translations] of Object.entries(defaultPageContent)) {
      await client.query(
        `INSERT INTO page_content (section_key, translations)
         VALUES ($1, $2)
         ON CONFLICT (section_key) DO NOTHING`,
        [sectionKey, translations],
      );
    }
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

function mapProjectRow(row) {
  return {
    id: row.id,
    sortOrder: row.sort_order ?? 0,
    heroImageUrl: row.hero_image_url || '',
    heroImageAlt: row.hero_image_alt || '',
    location: row.location || '',
    dateRange: row.date_range || '',
    linkUrl: row.link_url || '',
    published: row.published,
    translations: row.translations || { hu: {}, en: {} },
    createdAt: row.created_at ? row.created_at.toISOString() : '',
    updatedAt: row.updated_at ? row.updated_at.toISOString() : '',
  };
}

function mapGalleryRow(row) {
  const eventDate = row.event_date instanceof Date ? row.event_date.toISOString().split('T')[0] : null;

  return {
    id: row.id,
    title: row.title || '',
    subtitle: row.subtitle || '',
    eventDate,
    coverImageUrl: row.cover_image_url || '',
    coverImageAlt: row.cover_image_alt || '',
    images: Array.isArray(row.images) ? row.images : [],
    sortOrder: row.sort_order ?? 0,
    published: row.published,
    createdAt: row.created_at ? row.created_at.toISOString() : '',
    updatedAt: row.updated_at ? row.updated_at.toISOString() : '',
  };
}

function mapPageContentRows(rows) {
  const store = { ...defaultPageContent };
  rows.forEach((row) => {
    store[row.section_key] = row.translations || { hu: {}, en: {} };
  });
  return store;
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

function normalizeFolderPath(baseFolder, requestedFolder) {
  const base = (baseFolder || '').replace(/\/$/, '');
  if (!requestedFolder) {
    return base;
  }

  const requested = requestedFolder.toString().trim().replace(/\/$/, '');
  if (!requested) {
    return base;
  }

  if (!base || requested === base || requested.startsWith(`${base}/`)) {
    return requested;
  }

  return base;
}

app.get('/api/gallery/imagekit-auth', authenticateRequest, async (req, res) => {
  if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
    return res.status(500).json({ message: 'ImageKit konfiguráció hiányzik a szerveren' });
  }

  const baseFolder = IMAGEKIT_GALLERY_FOLDER || '';
  const requestedFolder = (req.query.folder || '').toString();
  const folder = normalizeFolderPath(baseFolder, requestedFolder);

  const token = crypto.randomBytes(16).toString('hex');
  const expire = Math.floor(Date.now() / 1000) + 10 * 60; // 10 minutes
  const signature = crypto
    .createHmac('sha1', IMAGEKIT_PRIVATE_KEY)
    .update(token + expire)
    .digest('hex');

  return res.status(200).json({
    token,
    expire,
    signature,
    publicKey: IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: IMAGEKIT_URL_ENDPOINT.replace(/\/$/, ''),
    folder,
  });
});

app.get('/api/gallery/imagekit-files', authenticateRequest, async (req, res) => {
  if (!IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
    return res.status(500).json({ message: 'ImageKit konfiguráció hiányzik a szerveren' });
  }

  const limit = Math.min(Math.max(Number(req.query.limit) || 40, 1), 100);
  const search = (req.query.search || '').toString().trim();
  const requestedPath = (req.query.path || '').toString().trim();
  const baseFolder = IMAGEKIT_GALLERY_FOLDER || '/';
  const path = normalizeFolderPath(baseFolder, requestedPath) || baseFolder;

  const params = new URLSearchParams({
    path,
    sort: 'ASC_NAME',
    limit: limit.toString(),
    includeFolder: 'true',
    includeFiles: 'true',
  });

  if (search) {
    params.set('searchQuery', `name:"${search}"`);
  }

  const authHeader = Buffer.from(`${IMAGEKIT_PRIVATE_KEY}:`).toString('base64');

  try {
    const response = await fetch(`https://api.imagekit.io/v1/files?${params.toString()}`, {
      headers: {
        Authorization: `Basic ${authHeader}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const message = `ImageKit list hiba: ${response.status}`;
      console.error(message, await response.text());
      return res.status(502).json({ message: 'Nem sikerült lekérni az ImageKit fájlokat' });
    }

    const payload = (await response.json()) || [];
    const files = Array.isArray(payload)
      ? payload.map((item) => ({
          id: item.fileId || item.folderId || `${item.type}:${item.name}`,
          name: item.name,
          url: item.url,
          thumbnailUrl: item.thumbnail,
          width: item.width,
          height: item.height,
          createdAt: item.createdAt,
          isFolder: item.type === 'folder',
          path: item.filePath || item.folderPath || `${path.replace(/\/$/, '')}/${item.name}`,
        }))
      : [];

    return res.status(200).json({ files, folder: path, baseFolder });
  } catch (error) {
    console.error('ImageKit list error', error);
    return res.status(500).json({ message: 'Nem sikerült lekérni az ImageKit fájlokat' });
  }
});

app.post('/api/gallery/imagekit-folders', authenticateRequest, async (req, res) => {
  if (!IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
    return res.status(500).json({ message: 'ImageKit konfiguráció hiányzik a szerveren' });
  }

  const name = (req.body?.name || '').toString().trim();
  const requestedParent = (req.body?.parentPath || '').toString().trim();
  const baseFolder = IMAGEKIT_GALLERY_FOLDER || '/';
  const parentFolderPath = normalizeFolderPath(baseFolder, requestedParent) || baseFolder;

  if (!name || /[\\/]/.test(name)) {
    return res.status(400).json({ message: 'Érvénytelen mappanév' });
  }

  const authHeader = Buffer.from(`${IMAGEKIT_PRIVATE_KEY}:`).toString('base64');

  try {
    const response = await fetch('https://upload.imagekit.io/api/v1/folder', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderName: name,
        parentFolderPath,
      }),
    });

    if (!response.ok) {
      const message = `ImageKit folder hiba: ${response.status}`;
      console.error(message, await response.text());
      return res.status(502).json({ message: 'Nem sikerült létrehozni a mappát az ImageKitben' });
    }

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('ImageKit folder error', error);
    return res.status(500).json({ message: 'Nem sikerült létrehozni a mappát az ImageKitben' });
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

app.get('/api/page-content/public', async (_req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT section_key, translations FROM page_content');
    return res.status(200).json({ sections: mapPageContentRows(result.rows) });
  } catch (error) {
    console.error('Public page content error', error);
    return res.status(500).json({ message: 'Nem sikerült betölteni az oldal tartalmait' });
  } finally {
    client.release();
  }
});

app.get('/api/page-content', authenticateRequest, async (_req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT section_key, translations FROM page_content');
    return res.status(200).json({ sections: mapPageContentRows(result.rows) });
  } catch (error) {
    console.error('Admin page content error', error);
    return res.status(500).json({ message: 'Nem sikerült betölteni az oldal tartalmait' });
  } finally {
    client.release();
  }
});

app.put('/api/page-content/:sectionKey', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  const sectionKey = req.params.sectionKey;
  const translations = req.body?.translations;

  if (!translations || typeof translations !== 'object') {
    return res.status(400).json({ message: 'Érvénytelen tartalom' });
  }

  try {
    const result = await client.query(
      `INSERT INTO page_content (section_key, translations)
       VALUES ($1, $2)
       ON CONFLICT (section_key)
       DO UPDATE SET translations = EXCLUDED.translations, updated_at = NOW()
       RETURNING section_key, translations`,
      [sectionKey, translations],
    );

    const row = result.rows[0];
    return res.status(200).json({ sectionKey: row.section_key, translations: row.translations });
  } catch (error) {
    console.error('Save page content error', error);
    return res.status(500).json({ message: 'Nem sikerült menteni a tartalmat' });
  } finally {
    client.release();
  }
});

app.get('/api/gallery', authenticateRequest, async (_req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM gallery_albums ORDER BY sort_order ASC, event_date DESC NULLS LAST, created_at DESC',
    );
    return res.json({ items: result.rows.map(mapGalleryRow) });
  } catch (error) {
    console.error('Get gallery error', error);
    return res.status(500).json({ message: 'Nem sikerült betölteni a galériákat' });
  } finally {
    client.release();
  }
});

app.get('/api/projects', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  const search = (req.query.search || '').toString().trim();
  const status = (req.query.status || 'all').toString();

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
      `(LOWER(translations -> 'hu' ->> 'title') LIKE LOWER($${values.length})
        OR LOWER(translations -> 'en' ->> 'title') LIKE LOWER($${values.length})
        OR LOWER(translations -> 'hu' ->> 'description') LIKE LOWER($${values.length})
        OR LOWER(translations -> 'en' ->> 'description') LIKE LOWER($${values.length})
        OR LOWER(location) LIKE LOWER($${values.length}))`,
    );
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  try {
    const result = await client.query(
      `SELECT *
       FROM projects
       ${whereClause}
       ORDER BY sort_order ASC, created_at DESC`,
      values,
    );

    const items = result.rows.map(mapProjectRow);
    return res.status(200).json({ items });
  } catch (error) {
    console.error('List projects error', error);
    return res.status(500).json({ message: 'Nem sikerült betölteni a projekteket' });
  } finally {
    client.release();
  }
});

app.get('/api/projects/public', async (_req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT *
       FROM projects
       WHERE published = TRUE
       ORDER BY sort_order ASC, created_at DESC`,
    );

    return res.status(200).json({ items: result.rows.map(mapProjectRow) });
  } catch (error) {
    console.error('Public projects error', error);
    return res.status(500).json({ message: 'Nem sikerült betölteni a projekteket' });
  } finally {
    client.release();
  }
});

app.get('/api/gallery/public', async (_req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM gallery_albums
       WHERE published = true
       ORDER BY sort_order ASC, event_date DESC NULLS LAST, created_at DESC`,
    );
    return res.json({ items: result.rows.map(mapGalleryRow) });
  } catch (error) {
    console.error('Get public gallery error', error);
    return res.status(500).json({ message: 'Nem sikerült betölteni a galériát' });
  } finally {
    client.release();
  }
});

function validateProjectPayload(payload) {
  if (!payload?.translations?.hu?.title || !payload?.translations?.en?.title) {
    const error = new Error('A magyar és angol cím megadása kötelező');
    error.status = 400;
    throw error;
  }

  if (!payload?.translations?.hu?.description || !payload?.translations?.en?.description) {
    const error = new Error('A magyar és angol leírás megadása kötelező');
    error.status = 400;
    throw error;
  }
}

function validateGalleryPayload(payload) {
  if (!payload?.title) {
    const error = new Error('A galéria cím megadása kötelező');
    error.status = 400;
    throw error;
  }

  if (!payload?.coverImageUrl) {
    const error = new Error('Add meg a borítókép URL-jét');
    error.status = 400;
    throw error;
  }

  const images = Array.isArray(payload?.images)
    ? payload.images.filter((img) => typeof img === 'string' && img.trim())
    : [];

  if (!images.length) {
    const error = new Error('Legalább egy kép megadása kötelező');
    error.status = 400;
    throw error;
  }
}

app.post('/api/projects', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  const payload = req.body || {};

  try {
    validateProjectPayload(payload);

    const orderResult = await client.query('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM projects');
    const nextOrder = Number(orderResult.rows[0]?.next_order || 1);

    const result = await client.query(
      `INSERT INTO projects
       (sort_order, hero_image_url, hero_image_alt, location, date_range, link_url, published, translations)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        payload.sortOrder ?? nextOrder,
        payload.heroImageUrl || null,
        payload.heroImageAlt || null,
        payload.location || null,
        payload.dateRange || null,
        payload.linkUrl || null,
        Boolean(payload.published),
        payload.translations,
      ],
    );

    return res.status(201).json(mapProjectRow(result.rows[0]));
  } catch (error) {
    console.error('Create project error', error);
    const status = error.status || 500;
    return res.status(status).json({ message: error.message || 'Nem sikerült létrehozni a projektet' });
  } finally {
    client.release();
  }
});

app.put('/api/projects/:id', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  const payload = req.body || {};
  const projectId = req.params.id;

  try {
    validateProjectPayload(payload);

    const existing = await client.query('SELECT * FROM projects WHERE id = $1 LIMIT 1', [projectId]);
    if (!existing.rows.length) {
      return res.status(404).json({ message: 'A projekt nem található' });
    }

    const result = await client.query(
      `UPDATE projects
       SET sort_order = $1,
           hero_image_url = $2,
           hero_image_alt = $3,
           location = $4,
           date_range = $5,
           link_url = $6,
           published = $7,
           translations = $8,
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        payload.sortOrder ?? existing.rows[0].sort_order,
        payload.heroImageUrl || null,
        payload.heroImageAlt || null,
        payload.location || null,
        payload.dateRange || null,
        payload.linkUrl || null,
        Boolean(payload.published),
        payload.translations,
        projectId,
      ],
    );

    return res.status(200).json(mapProjectRow(result.rows[0]));
  } catch (error) {
    console.error('Update project error', error);
    const status = error.status || 500;
    return res.status(status).json({ message: error.message || 'Nem sikerült frissíteni a projektet' });
  } finally {
    client.release();
  }
});

app.put('/api/projects/reorder', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  const order = Array.isArray(req.body?.order) ? req.body.order : [];

  if (!order.length) {
    return res.status(400).json({ message: 'Érvénytelen rendezési sorrend' });
  }

  try {
    await client.query('BEGIN');
    for (let index = 0; index < order.length; index += 1) {
      const id = order[index];
      await client.query('UPDATE projects SET sort_order = $1, updated_at = NOW() WHERE id = $2', [index + 1, id]);
    }
    await client.query('COMMIT');
    return res.status(200).json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reorder projects error', error);
    return res.status(500).json({ message: 'Nem sikerült frissíteni a sorrendet' });
  } finally {
    client.release();
  }
});

app.delete('/api/projects/:id', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    return res.status(204).send();
  } catch (error) {
    console.error('Delete project error', error);
    return res.status(500).json({ message: 'Nem sikerült törölni a projektet' });
  } finally {
    client.release();
  }
});

app.post('/api/gallery', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  const payload = req.body || {};
  const images = Array.isArray(payload.images)
    ? payload.images.filter((img) => typeof img === 'string' && img.trim())
    : [];

  try {
    validateGalleryPayload({ ...payload, images });

    const orderResult = await client.query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM gallery_albums',
    );
    const nextOrder = Number(orderResult.rows[0]?.next_order || 1);

    const result = await client.query(
      `INSERT INTO gallery_albums
       (title, subtitle, event_date, cover_image_url, cover_image_alt, images, sort_order, published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        payload.title,
        payload.subtitle || '',
        payload.eventDate || null,
        payload.coverImageUrl,
        payload.coverImageAlt || '',
        JSON.stringify(images),
        payload.sortOrder ?? nextOrder,
        Boolean(payload.published),
      ],
    );

    return res.status(201).json(mapGalleryRow(result.rows[0]));
  } catch (error) {
    console.error('Create gallery error', error);
    const status = error.status || 500;
    return res.status(status).json({ message: error.message || 'Nem sikerült létrehozni a galériát' });
  } finally {
    client.release();
  }
});

app.put('/api/gallery/:id', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  const payload = req.body || {};
  const albumId = req.params.id;
  const images = Array.isArray(payload.images)
    ? payload.images.filter((img) => typeof img === 'string' && img.trim())
    : [];

  try {
    validateGalleryPayload({ ...payload, images });

    const existing = await client.query('SELECT * FROM gallery_albums WHERE id = $1 LIMIT 1', [albumId]);
    if (!existing.rows.length) {
      return res.status(404).json({ message: 'A galéria nem található' });
    }

    const result = await client.query(
      `UPDATE gallery_albums
       SET title = $1,
           subtitle = $2,
           event_date = $3,
           cover_image_url = $4,
           cover_image_alt = $5,
           images = $6,
           sort_order = $7,
           published = $8,
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        payload.title,
        payload.subtitle || '',
        payload.eventDate || null,
        payload.coverImageUrl,
        payload.coverImageAlt || '',
        JSON.stringify(images),
        payload.sortOrder ?? existing.rows[0].sort_order,
        Boolean(payload.published),
        albumId,
      ],
    );

    return res.status(200).json(mapGalleryRow(result.rows[0]));
  } catch (error) {
    console.error('Update gallery error', error);
    const status = error.status || 500;
    return res.status(status).json({ message: error.message || 'Nem sikerült frissíteni a galériát' });
  } finally {
    client.release();
  }
});

app.put('/api/gallery/reorder', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  const order = Array.isArray(req.body?.order) ? req.body.order : [];

  if (!order.length) {
    return res.status(400).json({ message: 'Érvénytelen rendezési sorrend' });
  }

  try {
    await client.query('BEGIN');
    for (let index = 0; index < order.length; index += 1) {
      const id = order[index];
      await client.query(
        'UPDATE gallery_albums SET sort_order = $1, updated_at = NOW() WHERE id = $2',
        [index + 1, id],
      );
    }
    await client.query('COMMIT');
    return res.status(200).json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reorder gallery error', error);
    return res.status(500).json({ message: 'Nem sikerült frissíteni a sorrendet' });
  } finally {
    client.release();
  }
});

app.delete('/api/gallery/:id', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM gallery_albums WHERE id = $1', [req.params.id]);
    return res.status(204).send();
  } catch (error) {
    console.error('Delete gallery error', error);
    return res.status(500).json({ message: 'Nem sikerült törölni a galériát' });
  } finally {
    client.release();
  }
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
  const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
  const pageSizeParam = Number(req.query.pageSize);
  const limitParam = Number(req.query.limit);
  const pageSize = pageSizeParam > 0 ? pageSizeParam : limitParam > 0 ? limitParam : 6;

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

    return res.status(200).json({
      items: listResult.rows.map(mapNewsRow),
      total,
      page,
      pageSize,
    });
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

Promise.all([
  ensureAdminUser(),
  ensureNewsTables(),
  ensureProjectsTables(),
  ensureGalleryTables(),
  ensurePageContentTable(),
])
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start API server', error);
    process.exit(1);
  });
