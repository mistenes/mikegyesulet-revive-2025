import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pkg from 'pg';
import speakeasy from 'speakeasy';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { defaultDocuments as defaultDocumentSeed } from './server-default-documents.js';

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_PATH = path.join(__dirname, 'dist');
const DEFAULT_SITE_TITLE = 'MIK - Magyar Ifjúsági Konferencia';
const DEFAULT_SITE_DESCRIPTION =
  'A magyar ifjúság egyeztetőfóruma, amely hatékonyan képviseli a Kárpát-medence és a világ magyar ifjúságát.';

const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'change-me';
const COOKIE_NAME = 'mik_admin_session';
const REFRESH_COOKIE_NAME = 'mik_admin_refresh';
const CSRF_COOKIE_NAME = 'mik_admin_csrf';
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '';
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || '';
const LOCAL_DEV_ORIGIN = process.env.LOCAL_DEV_ORIGIN || 'http://localhost:5173';
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || process.env.VITE_MAPBOX_TOKEN || '';
const IMAGEKIT_PUBLIC_KEY = process.env.IMAGEKIT_PUBLIC_KEY || '';
const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY || '';
const IMAGEKIT_URL_ENDPOINT = process.env.IMAGEKIT_URL_ENDPOINT || '';
const IMAGEKIT_GALLERY_FOLDER = process.env.IMAGEKIT_GALLERY_FOLDER || '';
const BUNNY_CDN_HOSTNAME = process.env.VITE_BUNNY_CDN_HOSTNAME || process.env.BUNNY_CDN_HOSTNAME || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_FROM_EMAIL = process.env.BREVO_FROM_EMAIL || process.env.ADMIN_EMAIL || '';
const BREVO_FROM_NAME = process.env.BREVO_FROM_NAME || 'MIK Admin';
const INVITE_BASE_URL =
  process.env.INVITE_BASE_URL || FRONTEND_ORIGIN || 'https://mikegyesulet.hu' || RENDER_EXTERNAL_URL || LOCAL_DEV_ORIGIN;
const HASH_ITERATIONS = 310000;
const PAGE_SIZE_DEFAULT = 9;
const LOGIN_RATE_LIMIT_WINDOW_MS = 60_000;
const LOGIN_RATE_LIMIT_MAX = 10;
const LOGIN_MAX_FAILED_ATTEMPTS = 5;
const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000;
const PASSWORD_HISTORY_LIMIT = 5;
const PASSWORD_MIN_LENGTH = 12;
const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const BUNNY_STORAGE_ZONE = process.env.VITE_BUNNY_STORAGE_ZONE || process.env.BUNNY_STORAGE_ZONE || '';
const BUNNY_STORAGE_KEY = process.env.VITE_BUNNY_STORAGE_KEY || process.env.BUNNY_STORAGE_KEY || '';
const BUNNY_STORAGE_HOST = process.env.VITE_BUNNY_STORAGE_HOST || process.env.BUNNY_STORAGE_HOST || 'storage.bunnycdn.com';
function decodeGaPrivateKey(value) {
  if (!value) {
    return { key: '', valid: false };
  }

  const trimmed = value.trim();
  const candidates = [trimmed];

  if (!trimmed.includes('BEGIN PRIVATE KEY')) {
    try {
      const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
      if (decoded.includes('BEGIN PRIVATE KEY')) {
        candidates.unshift(decoded.trim());
      }
    } catch (error) {
      console.warn('Failed to base64 decode GA private key, continuing with raw value', error);
    }
  }

  for (const candidate of candidates) {
    const normalized = candidate.replace(/\\n/g, '\n');
    if (normalized.includes('BEGIN PRIVATE KEY')) {
      return { key: normalized, valid: true };
    }
  }

  return { key: candidates[0].replace(/\\n/g, '\n'), valid: false };
}

const GA_MEASUREMENT_ID = process.env.VITE_GA_MEASUREMENT_ID || process.env.GA_MEASUREMENT_ID || '';
const GA_PROPERTY_ID = process.env.GA4_PROPERTY_ID || process.env.GA_PROPERTY_ID || '';
const GA_CLIENT_EMAIL = process.env.GA4_CLIENT_EMAIL || process.env.GA_CLIENT_EMAIL || '';
const { key: GA_PRIVATE_KEY, valid: GA_PRIVATE_KEY_VALID } = decodeGaPrivateKey(
  process.env.GA4_PRIVATE_KEY ||
  process.env.GA_PRIVATE_KEY ||
  process.env.GA4_PRIVATE_KEY_BASE64 ||
  process.env.GA_PRIVATE_KEY_BASE64,
);

const defaultSiteSettings = {
  siteFavicon: '',
  siteSearchTitle: DEFAULT_SITE_TITLE,
  siteSearchDescription: DEFAULT_SITE_DESCRIPTION,
};

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

const analyticsPropertyIdValid = GA_PROPERTY_ID && !GA_PROPERTY_ID.startsWith('G-');

const analyticsClient =
  analyticsPropertyIdValid && GA_CLIENT_EMAIL && GA_PRIVATE_KEY_VALID && GA_PRIVATE_KEY
    ? new BetaAnalyticsDataClient({
      credentials: {
        client_email: GA_CLIENT_EMAIL,
        private_key: GA_PRIVATE_KEY,
      },
    })
    : null;

const analyticsDefaults = {
  pastHour: 0,
  past24Hours: 0,
  thisWeek: 0,
  thisMonth: 0,
  thisYear: 0,
};

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

const analyticsProperty = analyticsPropertyIdValid ? `properties/${GA_PROPERTY_ID}` : '';

function getAnalyticsConfigStatus() {
  const missingEnv = [];

  if (!GA_PROPERTY_ID) missingEnv.push('GA4_PROPERTY_ID');
  if (!GA_CLIENT_EMAIL) missingEnv.push('GA4_CLIENT_EMAIL');
  if (!GA_PRIVATE_KEY || !GA_PRIVATE_KEY_VALID) missingEnv.push('GA4_PRIVATE_KEY (vagy GA4_PRIVATE_KEY_BASE64)');

  const propertyLooksLikeMeasurementId = GA_PROPERTY_ID?.startsWith('G-');

  let message = '';
  const hints = [];

  if (missingEnv.length) {
    message = `A Google Analytics nincs beállítva. Állítsd be a következő környezeti változókat a Renderen: ${missingEnv.join(', ')}.`;
  } else if (propertyLooksLikeMeasurementId) {
    message = 'A GA4 property ID nem lehet a G- kezdetű Measurement ID. Add meg a numerikus GA4 property azonosítót (pl. 123456789).';
  } else if (!GA_PRIVATE_KEY_VALID) {
    message = 'A GA4 privát kulcs formátuma érvénytelen. Használj PEM formátumot (-----BEGIN PRIVATE KEY-----) vagy base64-kódolt változatot.';
    hints.push('Győződj meg róla, hogy a kulcs tartalmazza a BEGIN/END PRIVATE KEY blokkokat és a sorvégeket \\n helyett új sorokkal.');
  }

  return { missingEnv, propertyLooksLikeMeasurementId, message, invalidPrivateKey: !GA_PRIVATE_KEY_VALID, hints };
}


async function getSiteSettings() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT site_favicon, site_search_title, site_search_description FROM site_settings WHERE id = 1 LIMIT 1',
    );

    if (!result.rows.length) {
      return { ...defaultSiteSettings };
    }

    const row = result.rows[0];
    return {
      siteFavicon: (row.site_favicon || '').toString().trim(),
      siteSearchTitle: (row.site_search_title || defaultSiteSettings.siteSearchTitle).toString().trim(),
      siteSearchDescription: (row.site_search_description || defaultSiteSettings.siteSearchDescription).toString().trim(),
    };
  } catch (error) {
    console.error('Get site settings error', error);
    return { ...defaultSiteSettings };
  } finally {
    client.release();
  }
}

function sanitizeSeoText(value, fallback = '') {
  return (value || fallback || '')
    .toString()
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function upsertHeadTag(html, pattern, replacement) {
  if (pattern.test(html)) {
    return html.replace(pattern, replacement);
  }

  return html.replace('</head>', `    ${replacement}
  </head>`);
}

async function renderIndexHtmlWithSeo() {
  const [htmlTemplate, siteSettings] = await Promise.all([
    fs.readFile(path.join(DIST_PATH, 'index.html'), 'utf8'),
    getSiteSettings(),
  ]);

  const title = sanitizeSeoText(siteSettings.siteSearchTitle, DEFAULT_SITE_TITLE);
  const description = sanitizeSeoText(siteSettings.siteSearchDescription, DEFAULT_SITE_DESCRIPTION);
  const favicon = sanitizeSeoText(siteSettings.siteFavicon, '');

  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);
  const escapedFavicon = escapeHtml(favicon || '/favicon.ico');

  let html = htmlTemplate.replace(/<title>[^<]*<\/title>/, `<title>${escapedTitle}</title>`);

  html = upsertHeadTag(
    html,
    /<meta name="description" content="[^"]*"\s*\/>/,
    `<meta name="description" content="${escapedDescription}" />`,
  );
  html = upsertHeadTag(
    html,
    /<meta property="og:title" content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${escapedTitle}" />`,
  );
  html = upsertHeadTag(
    html,
    /<meta property="og:description" content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${escapedDescription}" />`,
  );
  html = upsertHeadTag(
    html,
    /<meta name="twitter:title" content="[^"]*"\s*\/>/,
    `<meta name="twitter:title" content="${escapedTitle}" />`,
  );
  html = upsertHeadTag(
    html,
    /<meta name="twitter:description" content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${escapedDescription}" />`,
  );

  if (/<link rel="icon"[^>]*>/.test(html)) {
    html = html.replace(/<link rel="icon"[^>]*>/, `<link rel="icon" type="image/png" href="${escapedFavicon}" />`);
  } else {
    html = html.replace('</head>', `    <link rel="icon" type="image/png" href="${escapedFavicon}" />
  </head>`);
  }

  return html;
}

async function getRealtimeActiveUsersSum() {
  if (!analyticsClient || !analyticsProperty) return analyticsDefaults.pastHour;

  const [response] = await analyticsClient.runRealtimeReport({
    property: analyticsProperty,
    metrics: [{ name: 'activeUsers' }],
    dimensions: [{ name: 'minute' }],
    limit: 60,
  });

  return (response.rows || []).reduce((total, row) => total + Number(row.metricValues?.[0]?.value || 0), 0);
}

async function getRangeActiveUsers(startDate, endDate) {
  if (!analyticsClient || !analyticsProperty) return 0;

  const [response] = await analyticsClient.runReport({
    property: analyticsProperty,
    dateRanges: [{ startDate, endDate }],
    metrics: [{ name: 'activeUsers' }],
  });

  return Number(response.rows?.[0]?.metricValues?.[0]?.value || 0);
}

async function fetchVisitorCounts() {
  if (!analyticsClient || !analyticsProperty) {
    const { message } = getAnalyticsConfigStatus();
    return {
      ...analyticsDefaults,
      configured: false,
      message: message || 'A Google Analytics nincs beállítva',
    };
  }

  const [pastHour, past24Hours, thisWeek, thisMonth, thisYear] = await Promise.all([
    getRealtimeActiveUsersSum(),
    getRangeActiveUsers('1daysAgo', 'today'),
    getRangeActiveUsers('7daysAgo', 'today'),
    getRangeActiveUsers('30daysAgo', 'today'),
    getRangeActiveUsers('365daysAgo', 'today'),
  ]);

  return {
    pastHour,
    past24Hours,
    thisWeek,
    thisMonth,
    thisYear,
    configured: true,
  };
}

const loginRateLimitBuckets = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (Array.isArray(forwarded)) {
    return forwarded[0];
  }

  if (typeof forwarded === 'string' && forwarded.includes(',')) {
    return forwarded.split(',')[0].trim();
  }

  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.trim();
  }

  return req.ip;
}

function loginRateLimiter(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();
  const bucket = loginRateLimitBuckets.get(ip) || { count: 0, start: now };

  if (now - bucket.start > LOGIN_RATE_LIMIT_WINDOW_MS) {
    bucket.start = now;
    bucket.count = 0;
  }

  bucket.count += 1;
  loginRateLimitBuckets.set(ip, bucket);

  if (bucket.count > LOGIN_RATE_LIMIT_MAX) {
    const retryAfterSeconds = Math.ceil((LOGIN_RATE_LIMIT_WINDOW_MS - (now - bucket.start)) / 1000);
    return res
      .status(429)
      .json({ message: 'Túl sok bejelentkezési kísérlet. Próbáld újra később.', retryAfterSeconds });
  }

  return next();
}

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: Math.floor(ACCESS_TOKEN_MAX_AGE_MS / 1000) });
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, 64, 'sha512').toString('hex');
  return `${HASH_ITERATIONS}$${salt}$${hash}`;
}

function validatePasswordComplexity(password, email = '') {
  const issues = [];

  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    issues.push(`A jelszónak legalább ${PASSWORD_MIN_LENGTH} karakter hosszúnak kell lennie.`);
  }

  if (!/[A-Z]/.test(password)) {
    issues.push('Legalább egy nagybetűt tartalmaznia kell.');
  }

  if (!/[a-z]/.test(password)) {
    issues.push('Legalább egy kisbetűt tartalmaznia kell.');
  }

  if (!/[0-9]/.test(password)) {
    issues.push('Legalább egy számjegyet tartalmaznia kell.');
  }

  if (!/[!@#$%^&*(),.?":{}|<>\-_+=\[\];'/\\`~]/.test(password)) {
    issues.push('Legalább egy speciális karakter szükséges.');
  }

  if (email && password.toLowerCase().includes(email.toLowerCase())) {
    issues.push('A jelszó nem tartalmazhatja az e-mail címet.');
  }

  return issues;
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

async function isPasswordReused(client, email, newPassword) {
  const current = await client.query('SELECT password_hash FROM admin_users WHERE email = $1', [email]);

  if (current.rows[0]?.password_hash && verifyPassword(newPassword, current.rows[0].password_hash)) {
    return true;
  }

  const history = await client.query(
    'SELECT password_hash FROM admin_password_history WHERE email = $1 ORDER BY created_at DESC LIMIT $2',
    [email, PASSWORD_HISTORY_LIMIT],
  );

  return history.rows.some((row) => verifyPassword(newPassword, row.password_hash));
}

async function recordPasswordHistory(client, email, passwordHash) {
  await client.query(
    `INSERT INTO admin_password_history (email, password_hash, created_at)
     VALUES ($1, $2, NOW())`,
    [email, passwordHash],
  );
}

function generateRecoveryCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i += 1) {
    codes.push(crypto.randomBytes(5).toString('hex').toUpperCase());
  }
  return codes;
}

function hashRecoveryCodes(codes) {
  return codes.map((code) => hashToken(code.replace(/\s+/g, '').toUpperCase()));
}

async function storeMfaEnrollment(client, email, secret, recoveryCodes) {
  await client.query(
    `INSERT INTO admin_mfa_enrollments (email, secret, recovery_codes, created_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (email) DO UPDATE SET secret = EXCLUDED.secret, recovery_codes = EXCLUDED.recovery_codes, created_at = NOW()`,
    [email, secret, recoveryCodes],
  );
}

async function getMfaEnrollment(client, email) {
  const result = await client.query('SELECT secret, recovery_codes FROM admin_mfa_enrollments WHERE email = $1', [email]);
  return result.rows[0];
}

async function clearMfaEnrollment(client, email) {
  await client.query('DELETE FROM admin_mfa_enrollments WHERE email = $1', [email]);
}

async function createUserToken(client, email, type, ttlMs = INVITE_TOKEN_TTL_MS) {
  const token = crypto.randomBytes(48).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ttlMs);

  await client.query(
    `INSERT INTO admin_user_tokens (email, token_hash, type, expires_at, used, created_at)
     VALUES ($1, $2, $3, $4, FALSE, NOW())`,
    [email, tokenHash, type, expiresAt],
  );

  return { token, expiresAt };
}

async function consumeUserToken(client, token, type) {
  const tokenHash = hashToken(token);
  const result = await client.query(
    `SELECT * FROM admin_user_tokens
     WHERE token_hash = $1 AND type = $2 AND used = FALSE AND expires_at > NOW()`,
    [tokenHash, type],
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  await client.query('UPDATE admin_user_tokens SET used = TRUE WHERE id = $1', [row.id]);
  return row;
}

function buildInviteLink(token) {
  const baseUrl = INVITE_BASE_URL.replace(/\/$/, '');
  return `${baseUrl}/admin/accept-invite?token=${encodeURIComponent(token)}`;
}

function buildPasswordResetLink(token) {
  const baseUrl = INVITE_BASE_URL.replace(/\/$/, '');
  return `${baseUrl}/admin/reset-password?token=${encodeURIComponent(token)}`;
}

async function sendInviteEmail(email, inviteLink) {
  if (!BREVO_API_KEY || !BREVO_FROM_EMAIL) {
    throw new Error('Brevo nincs konfigurálva a meghívók küldéséhez');
  }

  const payload = {
    sender: { email: BREVO_FROM_EMAIL, name: BREVO_FROM_NAME || undefined },
    to: [{ email }],
    subject: 'Admin felhasználói meghívó',
    htmlContent: `
    <p>Üdvözlünk! Meghívtak, hogy szerkeszd a MIK admin felületét.</p>
    <p>Kattints az alábbi gombra, hogy beállítsd a jelszavad és a kétlépcsős azonosítást:</p>
    <p><a href="${inviteLink}" style="display:inline-block;padding:12px 18px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:6px">Meghívó elfogadása</a></p>
    <p>Ha a gomb nem működik, másold be ezt a linket a böngészőbe:</p>
    <p>${inviteLink}</p>
    <p>A meghívó 7 napig érvényes.</p>
  `,
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': BREVO_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Brevo invite send failed (${response.status}): ${body || response.statusText}`);
  }
}

async function sendPasswordResetEmail(email, resetLink) {
  if (!BREVO_API_KEY || !BREVO_FROM_EMAIL) {
    throw new Error('Brevo nincs konfigurálva a jelszó-emlékeztetőhöz');
  }

  const payload = {
    sender: { email: BREVO_FROM_EMAIL, name: BREVO_FROM_NAME || undefined },
    to: [{ email }],
    subject: 'Admin jelszó visszaállítása',
    htmlContent: `
    <p>Jelszó-visszaállítási kérés érkezett a fiókodra.</p>
    <p>Kattints az alábbi gombra, hogy új jelszót állíts be:</p>
    <p><a href="${resetLink}" style="display:inline-block;padding:12px 18px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:6px">Jelszó visszaállítása</a></p>
    <p>Ha a gomb nem működik, másold be ezt a linket a böngészőbe:</p>
    <p>${resetLink}</p>
    <p>A link 24 óráig érvényes.</p>
  `,
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': BREVO_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Brevo reset send failed (${response.status}): ${body || response.statusText}`);
  }
}

async function sendBugReportEmail({ reporterEmail, title, description, stepsToReproduce, expectedResult, actualResult, severity }) {
  if (!BREVO_API_KEY || !BREVO_FROM_EMAIL) {
    throw new Error('Brevo nincs konfigurálva a hibajelentéshez');
  }

  const payload = {
    sender: { email: BREVO_FROM_EMAIL, name: BREVO_FROM_NAME || undefined },
    to: [{ email: 'mistenes@me.com' }],
    subject: 'URGENT - bug report',
    htmlContent: `
      <p>Új hibajelentés érkezett az admin felületről.</p>
      <p><strong>Küldő:</strong> ${reporterEmail || 'Ismeretlen'}</p>
      <p><strong>Cím:</strong> ${title || 'Nincs megadva'}</p>
      <p><strong>Súlyosság:</strong> ${severity || 'Nem jelölve'}</p>
      <p><strong>Leírás:</strong><br/>${description || 'Nincs leírás'}</p>
      <p><strong>Lépések a reprodukáláshoz:</strong><br/>${stepsToReproduce || 'Nincs megadva'}</p>
      <p><strong>Várt eredmény:</strong><br/>${expectedResult || 'Nincs megadva'}</p>
      <p><strong>Kapott eredmény:</strong><br/>${actualResult || 'Nincs megadva'}</p>
    `,
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': BREVO_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Brevo bug report send failed (${response.status}): ${body || response.statusText}`);
  }
}

async function sendNewsletterVerificationEmail(email, name, token) {
  if (!BREVO_API_KEY || !BREVO_FROM_EMAIL) {
    throw new Error('Brevo nincs konfigurálva a hírlevélhez');
  }

  const verifyLink = `${INVITE_BASE_URL.replace(/\/$/, '')}/newsletter/verify?token=${encodeURIComponent(token)}`;

  const payload = {
    sender: { email: BREVO_FROM_EMAIL, name: BREVO_FROM_NAME || undefined },
    to: [{ email, name }],
    subject: 'Megerősítés - Hírlevél feliratkozás',
    htmlContent: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Kedves ${name || 'Érdeklődő'}!</h2>
      <p>Köszönjük, hogy feliratkoztál a Magyar Ifjúsági Konferencia hírlevelére.</p>
      <p>Hogy biztosak legyünk benne, te adtad meg ezt az email címet, kérjük, erősítsd meg a feliratkozást az alábbi gombra kattintva:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${verifyLink}" style="display:inline-block;padding:12px 24px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Feliratkozás megerősítése</a>
      </p>
      <p>Ha a gomb nem működik, másold be az alábbi linket a böngésződbe:</p>
      <p><a href="${verifyLink}">${verifyLink}</a></p>
      <p>Ha nem te iratkoztál fel, kérjük, hagyd figyelmen kívül ezt az üzenetet.</p>
    </div>
  `,
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': BREVO_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Brevo newsletter verify send failed (${response.status}): ${body || response.statusText}`);
  }
}

async function sendNewsletterEmailToSubscribers(subscribers, subject, htmlContent) {
  if (!BREVO_API_KEY || !BREVO_FROM_EMAIL) {
    throw new Error('Brevo nincs konfigurálva a hírlevélhez');
  }

  // Send individually to personally signing the unsubscribe link
  const results = await Promise.allSettled(subscribers.map(async (sub) => {
    // Determine unsubscribe URL
    // If we don't have an unsubscribe token, we should probably generate one, 
    // but we ran a migration above. If it's still missing, we could fallback or fail.
    // Assuming token exists.
    const unsubscribeUrl = `${INVITE_BASE_URL.replace(/\/$/, '')}/newsletter/unsubscribe?token=${sub.unsubscribe_token}`;

    // Append footer
    // Use a robust footer compatible with most email clients
    const footerHtml = `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-family: sans-serif; font-size: 12px; color: #6b7280; text-align: center;">
      <p>Ezt a hírlevelet azért kaptad, mert feliratkoztál a Magyar Ifjúsági Konferencia hírlevelére.</p>
      <p>
        <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Leiratkozás</a>
      </p>
    </div>
    `;

    // Check if html body ends with </body>
    let finalHtml = htmlContent;
    if (finalHtml.includes('</body>')) {
      finalHtml = finalHtml.replace('</body>', `${footerHtml}</body > `);
    } else {
      finalHtml += footerHtml;
    }

    const payload = {
      sender: { email: BREVO_FROM_EMAIL, name: BREVO_FROM_NAME || undefined },
      to: [{ email: sub.email, name: sub.name }],
      subject: subject,
      htmlContent: finalHtml,
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Log detailed error for debugging
      const errText = await response.text();
      console.error(`Failed sending to ${sub.email}: ${response.status} ${errText} `);
      throw new Error(`Failed to send to ${sub.email} `);
    }
  }));

  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0) {
    console.error(`Failed to send ${failed.length} newsletter emails out of ${subscribers.length} `);
  }

  return { sent: subscribers.length - failed.length, failed: failed.length };
}

async function ensureAdminUser() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users(
      email TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      mfa_secret TEXT,
      mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      recovery_codes TEXT[] NOT NULL DEFAULT ARRAY[]:: TEXT[],
      must_reset_password BOOLEAN NOT NULL DEFAULT FALSE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      last_login_at TIMESTAMPTZ,
      last_password_change TIMESTAMPTZ
    );
    `);

    await client.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS mfa_secret TEXT');
    await client.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE');
    await client.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS recovery_codes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]');
    await client.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS must_reset_password BOOLEAN NOT NULL DEFAULT FALSE');
    await client.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE');
    await client.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ');
    await client.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMPTZ');

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && adminPassword) {
      const errors = validatePasswordComplexity(adminPassword, adminEmail);
      if (errors.length) {
        console.error('Alapértelmezett admin jelszó nem elég erős:', errors.join(' '));
      }

      const passwordHash = createPasswordHash(adminPassword);
      await client.query(
        `INSERT INTO admin_users(email, password_hash)
    VALUES($1, $2)
         ON CONFLICT(email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
        [adminEmail, passwordHash],
      );
      console.log('Default admin user ensured');
    }
  } finally {
    client.release();
  }
}

async function ensureAdminSecurityTables() {
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_password_history(
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    `);
    await client.query('CREATE INDEX IF NOT EXISTS admin_password_history_email_idx ON admin_password_history(email);');

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_user_tokens(
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      type TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    `);
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS admin_user_tokens_hash_idx ON admin_user_tokens(token_hash);');
    await client.query('CREATE INDEX IF NOT EXISTS admin_user_tokens_email_idx ON admin_user_tokens(email);');

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_mfa_enrollments(
      email TEXT PRIMARY KEY,
      secret TEXT NOT NULL,
      recovery_codes TEXT[] NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    `);
  } finally {
    client.release();
  }
}

async function ensureLoginAttemptTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_login_attempts(
      email TEXT NOT NULL,
      ip TEXT NOT NULL,
      failed_attempts INTEGER NOT NULL DEFAULT 0,
      last_failed_at TIMESTAMPTZ,
      locked_until TIMESTAMPTZ,
      PRIMARY KEY(email, ip)
    );
    `);
  } finally {
    client.release();
  }
}

async function ensureSiteSettingsTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS site_settings(
      id SMALLINT PRIMARY KEY DEFAULT 1,
      site_favicon TEXT,
      site_search_title TEXT,
      site_search_description TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT site_settings_singleton CHECK (id = 1)
    );
    `);

    await client.query('ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS site_search_title TEXT');

    await client.query(
      `INSERT INTO site_settings(id, site_favicon, site_search_title, site_search_description)
       VALUES (1, $1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [defaultSiteSettings.siteFavicon, defaultSiteSettings.siteSearchTitle, defaultSiteSettings.siteSearchDescription],
    );
  } finally {
    client.release();
  }
}

async function ensureNewsletterTables() {
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await client.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers(
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      verified BOOLEAN NOT NULL DEFAULT FALSE,
      verification_token TEXT,
      unsubscribe_token TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      verified_at TIMESTAMPTZ,
      unsubscribed_at TIMESTAMPTZ
    );
    `);

    // Add columns if they don't exist
    await client.query('ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT');
    await client.query('ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ');

    // Generate unsubscribe tokens for existing users who might be missing it
    await client.query(`
      UPDATE newsletter_subscribers 
      SET unsubscribe_token = encode(digest(random():: text, 'sha256'), 'hex') 
      WHERE unsubscribe_token IS NULL
      `);

    await client.query('CREATE INDEX IF NOT EXISTS newsletter_subscribers_email_idx ON newsletter_subscribers(email);');
    await client.query('CREATE INDEX IF NOT EXISTS newsletter_subscribers_verified_idx ON newsletter_subscribers(verified);');

    await client.query(`
      CREATE TABLE IF NOT EXISTS newsletter_drafts(
        id SERIAL PRIMARY KEY,
        subject TEXT,
        content_json JSONB,
        content_html TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

  } finally {
    client.release();
  }
}

// ... existing verify/subscribe routes ...



app.post('/api/newsletter/unsubscribe', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE newsletter_subscribers 
       SET verified = FALSE, unsubscribed_at = NOW() 
       WHERE unsubscribe_token = $1 AND verified = TRUE
       RETURNING id, email`,
      [token]
    );

    if (result.rows.length === 0) {
      // Could be already unsubscribed or invalid token. 
      // Check if it exists at all to give better error? 
      // For security / privacy, generic success or "not found" is maybe better.
      // Let's check if the token exists but is already unsubscribed.
      const check = await client.query('SELECT id FROM newsletter_subscribers WHERE unsubscribe_token = $1', [token]);
      if (check.rows.length > 0) {
        return res.status(200).json({ message: 'Már leiratkoztál.' });
      }
      return res.status(404).json({ message: 'A leiratkozási link érvénytelen.' });
    }

    return res.status(200).json({ message: 'Sikeresen leiratkoztál a hírlevélről.' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return res.status(500).json({ message: 'Hiba a leiratkozás során' });
  } finally {
    client.release();
  }
});

app.get('/api/admin/newsletter/draft', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM newsletter_drafts ORDER BY id DESC LIMIT 1');
    return res.status(200).json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching draft:', error);
    return res.status(500).json({ message: 'Error fetching draft' });
  } finally {
    client.release();
  }
});

app.post('/api/admin/newsletter/draft', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  try {
    const { subject, content_json, content_html } = req.body;

    // We'll treat this as a singleton "current draft" for simplicity, or latest.
    // Let's check if a draft exists
    const existing = await client.query('SELECT id FROM newsletter_drafts ORDER BY id DESC LIMIT 1');

    if (existing.rows.length > 0) {
      const id = existing.rows[0].id;
      await client.query(
        'UPDATE newsletter_drafts SET subject = $1, content_json = $2, content_html = $3, updated_at = NOW() WHERE id = $4',
        [subject, content_json, content_html, id]
      );
    } else {
      await client.query(
        'INSERT INTO newsletter_drafts (subject, content_json, content_html) VALUES ($1, $2, $3)',
        [subject, content_json, content_html]
      );
    }

    return res.status(200).json({ message: 'Draft saved' });
  } catch (error) {
    console.error('Error saving draft:', error);
    return res.status(500).json({ message: 'Error saving draft' });
  } finally {
    client.release();
  }
});

async function ensureNewsTables() {
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    await client.query(`
      CREATE TABLE IF NOT EXISTS news_categories(
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name_hu TEXT NOT NULL,
      name_en TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS news_articles(
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category TEXT NOT NULL,
      category_id UUID REFERENCES news_categories(id),
      image_url TEXT,
      image_alt TEXT,
      sticky BOOLEAN NOT NULL DEFAULT FALSE,
      news_date DATE NOT NULL DEFAULT CURRENT_DATE,
      published BOOLEAN NOT NULL DEFAULT FALSE,
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      slug_hu TEXT,
      slug_en TEXT,
      language_availability TEXT NOT NULL DEFAULT 'both',
      translations JSONB NOT NULL
    );
    `);

    await client.query('DROP INDEX IF EXISTS news_slug_hu_idx;');
    await client.query('DROP INDEX IF EXISTS news_slug_en_idx;');
    await client.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS news_slug_hu_published_idx ON news_articles(slug_hu) WHERE published = TRUE;',
    );
    await client.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS news_slug_en_published_idx ON news_articles(slug_en) WHERE published = TRUE;',
    );
    await client.query(
      'CREATE INDEX IF NOT EXISTS news_published_idx ON news_articles(published, published_at DESC, created_at DESC);',
    );
    await client.query(
      'ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES news_categories(id);',
    );
    await client.query(
      'ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS sticky BOOLEAN NOT NULL DEFAULT FALSE;',
    );
    await client.query(
      'ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS news_date DATE NOT NULL DEFAULT CURRENT_DATE;',
    );
    await client.query(
      "ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS language_availability TEXT NOT NULL DEFAULT 'both';",
    );
    await client.query("ALTER TABLE news_articles ALTER COLUMN slug_hu DROP NOT NULL;");
    await client.query("ALTER TABLE news_articles ALTER COLUMN slug_en DROP NOT NULL;");

    const distinctCategories = await client.query(
      'SELECT DISTINCT category FROM news_articles WHERE category IS NOT NULL',
    );

    const existingCategories = await client.query('SELECT id, name_hu FROM news_categories');
    const categoryMap = new Map(existingCategories.rows.map((row) => [row.name_hu, row.id]));

    for (const row of distinctCategories.rows) {
      const name = row.category;
      if (!name || categoryMap.has(name)) continue;

      const inserted = await client.query(
        'INSERT INTO news_categories (name_hu, name_en) VALUES ($1, $2) RETURNING id',
        [name, name],
      );

      categoryMap.set(name, inserted.rows[0].id);
    }

    for (const [name, id] of categoryMap.entries()) {
      await client.query('UPDATE news_articles SET category_id = $1 WHERE category = $2', [id, name]);
    }
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
      CREATE TABLE IF NOT EXISTS projects(
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sort_order INTEGER NOT NULL DEFAULT 0,
      hero_image_url TEXT,
      hero_image_alt TEXT,
      location TEXT,
      date_range TEXT,
      link_url TEXT,
      slug_hu TEXT,
      slug_en TEXT,
      language_availability TEXT NOT NULL DEFAULT 'both',
      published BOOLEAN NOT NULL DEFAULT TRUE,
      translations JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    `);

    await client.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug_hu TEXT;");
    await client.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug_en TEXT;");
    await client.query(
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS language_availability TEXT NOT NULL DEFAULT 'both';",
    );

    await client.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_hu_idx ON projects(slug_hu) WHERE slug_hu IS NOT NULL;',
    );
    await client.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_en_idx ON projects(slug_en) WHERE slug_en IS NOT NULL;',
    );

    await client.query(
      'CREATE INDEX IF NOT EXISTS projects_sort_order_idx ON projects(sort_order, created_at DESC);',
    );
    await client.query(
      'CREATE INDEX IF NOT EXISTS projects_published_idx ON projects(published, sort_order);',
    );

    const existingProjects = await client.query(
      'SELECT id, translations, slug_hu, slug_en, language_availability FROM projects',
    );

    const usedHu = new Set();
    const usedEn = new Set();

    const collapseRepeatedOneSuffix = (slug = '') => slug.replace(/(?:-1)(?:-1)+$/g, '-1');

    for (const row of existingProjects.rows) {
      const translations = row.translations || { hu: {}, en: {} };
      const normalizedTranslations = normalizeProjectTranslations(translations);
      let slugHu = collapseRepeatedOneSuffix(row.slug_hu || slugifyText(normalizedTranslations.hu?.title || ''));
      let slugEn = collapseRepeatedOneSuffix(row.slug_en || slugifyText(normalizedTranslations.en?.title || ''));

      if (!slugHu) {
        slugHu = slugifyText(`projekt - ${row.id} `);
      }

      if (!slugEn) {
        slugEn = slugifyText(`project - ${row.id} `);
      }

      slugHu = ensureUniqueSlug(slugHu, usedHu);
      slugEn = ensureUniqueSlug(slugEn, usedEn);

      const languageAvailability = row.language_availability || 'both';
      const translationsChanged = JSON.stringify(normalizedTranslations) !== JSON.stringify(translations);

      if (
        slugHu !== row.slug_hu ||
        slugEn !== row.slug_en ||
        languageAvailability !== row.language_availability ||
        translationsChanged
      ) {
        await client.query(
          'UPDATE projects SET slug_hu = $1, slug_en = $2, language_availability = $3, translations = $4 WHERE id = $5',
          [slugHu, slugEn, languageAvailability, normalizedTranslations, row.id],
        );
      }
    }
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
      CREATE TABLE IF NOT EXISTS gallery_albums(
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      subtitle TEXT DEFAULT '',
      event_date DATE,
      slug TEXT NOT NULL DEFAULT '',
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
      "ALTER TABLE gallery_albums ADD COLUMN IF NOT EXISTS slug TEXT NOT NULL DEFAULT '';",
    );

    await client.query(
      'CREATE INDEX IF NOT EXISTS gallery_sort_idx ON gallery_albums(sort_order, created_at DESC);',
    );
    await client.query(
      'CREATE INDEX IF NOT EXISTS gallery_published_idx ON gallery_albums(published, sort_order);',
    );

    const existingAlbums = await client.query('SELECT id, title, slug FROM gallery_albums ORDER BY created_at ASC');
    const usedSlugs = new Set(existingAlbums.rows.map((row) => row.slug).filter(Boolean));

    for (const row of existingAlbums.rows) {
      let baseSlug = (row.slug || '').trim();
      if (!baseSlug) {
        baseSlug = slugifyText(row.title || 'galeria');
      } else {
        baseSlug = slugifyText(baseSlug);
      }

      const uniqueSlug = ensureUniqueSlug(baseSlug, usedSlugs);
      await client.query('UPDATE gallery_albums SET slug = $1 WHERE id = $2', [uniqueSlug, row.id]);
    }

    await client.query('ALTER TABLE gallery_albums ALTER COLUMN slug SET NOT NULL;');
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS gallery_slug_idx ON gallery_albums(slug);');
  } finally {
    client.release();
  }
}

async function ensurePageContentTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS page_content(
      section_key TEXT PRIMARY KEY,
      translations JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    `);

    for (const [sectionKey, translations] of Object.entries(defaultPageContent)) {
      await client.query(
        `INSERT INTO page_content(section_key, translations)
    VALUES($1, $2)
         ON CONFLICT(section_key) DO NOTHING`,
        [sectionKey, translations],
      );
    }
  } finally {
    client.release();
  }
}

async function ensureDocumentsTables() {
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    await client.query(`
      CREATE TABLE IF NOT EXISTS documents(
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      title_en TEXT NOT NULL,
      location TEXT,
      event_date TEXT DEFAULT '',
      url TEXT NOT NULL,
      category TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    `);

    await client.query('CREATE INDEX IF NOT EXISTS documents_category_idx ON documents(category);');
    await client.query('CREATE INDEX IF NOT EXISTS documents_date_idx ON documents(event_date);');

    const count = await client.query('SELECT COUNT(*)::int AS count FROM documents');
    if ((count.rows[0]?.count || 0) === 0) {
      for (const doc of defaultDocumentSeed) {
        await client.query(
          `INSERT INTO documents(title, title_en, location, event_date, url, category)
    VALUES($1, $2, $3, $4, $5, $6)`,
          [doc.title, doc.titleEn || doc.title, doc.location || null, doc.date || '', doc.url, doc.category],
        );
      }
    }
  } finally {
    client.release();
  }
}

const seedTeamMembers = [
  // Leadership
  { name: "Turi Ádám", position: "Elnök", email: "elnok@mikegyesulet.hu", section: "leadership", sort_order: 1 },
  { name: "Tuba Adrián", position: "Alelnök", email: "adrian.tuba@mikegyesulet.hu", section: "leadership", sort_order: 2 },
  { name: "Hatos Attila", position: "Alelnök", email: "attila.hatos@mikegyesulet.hu", section: "leadership", sort_order: 3 },
  // Standing Committee
  { name: "Hatos Attila", position: "Bánság és regát", email: "", section: "standing_committee", sort_order: 4 },
  { name: "Somogyi Attila", position: "Burgenland", email: "somogyi@gmx.net", section: "standing_committee", sort_order: 5 },
  { name: "Szilágyi Dóra Emese", position: "Erdély", email: "", section: "standing_committee", sort_order: 6 },
  { name: "Heringes Walter", position: "Felvidék", email: "", section: "standing_committee", sort_order: 7 },
  { name: "Tuba Adrián", position: "Kárpátalja", email: "", section: "standing_committee", sort_order: 8 },
  { name: "Turi Ádám", position: "Magyarország", email: "", section: "standing_committee", sort_order: 9 },
  { name: "Bogar Patrik", position: "Muravidék", email: "patrik.bogar@gmail.com", section: "standing_committee", sort_order: 10 },
  { name: "Németh Alexander", position: "Nyugati Diaszpóra", email: "martin.paszti@hunyouth.org", section: "standing_committee", sort_order: 11 },
  { name: "Albert Éva", position: "Vajdaság", email: "bognaremese02@gmail.com", section: "standing_committee", sort_order: 12 },
  { name: "", position: "Horvátország", email: "", section: "standing_committee", sort_order: 13 },
  // Supervisory Board
  { name: "Brunner Tibor", position: "Elnök", email: "tibor.brunner@gmail.com", section: "supervisory_board", sort_order: 14 },
  { name: "Tőkés Lehel", position: "Tag", email: "tokeslehel@gmail.com", section: "supervisory_board", sort_order: 15 },
  { name: "Boncsarovszky Péter", position: "Tag", email: "peter.boncsarovszky@mikegyesulet.hu", section: "supervisory_board", sort_order: 16 },
  // HYCA
  { name: "Mészáros János", position: "Elnök", email: "", section: "hyca", sort_order: 17 },
  // HYCA Supervisory Board
  { name: "Búcsú Ákos", position: "Tag", email: "", section: "hyca_supervisory_board", sort_order: 18 },
  { name: "Bence Norbert", position: "Tag", email: "", section: "hyca_supervisory_board", sort_order: 19 },
  { name: "Bogar Patrik", position: "Tag", email: "", section: "hyca_supervisory_board", sort_order: 20 },
  // Operational Team
  { name: "Bokor Boglárka", position: "Titkár", email: "titkarsag@mikegyesulet.hu", section: "operational_team", sort_order: 21 },
  { name: "Mészáros János", position: "Gazdasági vezető", email: "janos.meszaros@mikegyesulet.hu", section: "operational_team", sort_order: 22 },
  { name: "Boncsarovszky Péter", position: "Kommunikációs vezető", email: "peter.boncsarovszky@mikegyesulet.hu", section: "operational_team", sort_order: 23 },
  { name: "Vincze Barnabás", position: "Kommunikációs gyakornok", email: "barnabas.vincze@mikegyesulet.hu", section: "operational_team", sort_order: 24 },
];

async function ensureTeamMembersTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_members(
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT DEFAULT '',
        position TEXT DEFAULT '',
        email TEXT DEFAULT '',
        section TEXT NOT NULL,
        image_url TEXT,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Seed data if empty
    const count = await client.query('SELECT COUNT(*) AS count FROM team_members');
    if (Number(count.rows[0]?.count || 0) === 0) {
      console.log('Seeding team members...');
      for (const member of seedTeamMembers) {
        await client.query(
          `INSERT INTO team_members(name, position, email, section, sort_order)
           VALUES($1, $2, $3, $4, $5)`,
          [member.name, member.position, member.email, member.section, member.sort_order]
        );
      }
    }
  } finally {
    client.release();
  }
}

function mapNewsRow(row) {
  const categoryTranslations = {
    hu: row.category_name_hu || row.category || '',
    en: row.category_name_en || row.category || '',
  };

  const translations = normalizeNewsTranslations(row.translations || { hu: {}, en: {} }, row.language_availability);

  return {
    id: row.id,
    categoryId: row.category_id || null,
    category: categoryTranslations.hu,
    categoryTranslations,
    imageUrl: row.image_url || undefined,
    imageAlt: row.image_alt || '',
    sticky: Boolean(row.sticky),
    date: row.news_date ? row.news_date.toISOString().slice(0, 10) : undefined,
    published: row.published,
    publishedAt: row.published_at ? row.published_at.toISOString() : null,
    createdAt: row.created_at ? row.created_at.toISOString() : '',
    updatedAt: row.updated_at ? row.updated_at.toISOString() : '',
    languageAvailability: row.language_availability || 'both',
    translations,
  };
}

function mapNewsCategory(row) {
  return {
    id: row.id,
    name: {
      hu: row.name_hu,
      en: row.name_en,
    },
    createdAt: row.created_at ? row.created_at.toISOString() : '',
  };
}

function mapDocumentRow(row) {
  return {
    id: row.id,
    title: row.title,
    titleEn: row.title_en || row.title,
    location: row.location || undefined,
    date: row.event_date || '',
    url: row.url,
    category: row.category || 'other',
  };
}

const DOCUMENT_CATEGORIES = new Set(['statute', 'founding', 'closing-statement', 'other']);

function normalizeDocumentPayload(payload = {}) {
  const title = (payload.title || '').toString().trim();
  const titleEn = (payload.titleEn || title).toString().trim() || title;
  const location = (payload.location || '').toString().trim();
  const date = (payload.date || '').toString().trim();
  const url = (payload.url || '').toString().trim();
  const category = (payload.category || '').toString().trim();

  if (!title) {
    const error = new Error('A cím megadása kötelező');
    error.status = 400;
    throw error;
  }

  if (!url) {
    const error = new Error('A dokumentum elérhetősége kötelező');
    error.status = 400;
    throw error;
  }

  if (!DOCUMENT_CATEGORIES.has(category)) {
    const error = new Error('Érvénytelen kategória');
    error.status = 400;
    throw error;
  }

  return {
    title,
    titleEn,
    location: location || null,
    date,
    url,
    category,
  };
}

function normalizeDocumentImportPayload(payload = {}) {
  const base = normalizeDocumentPayload({ ...payload, url: payload.sourceUrl || payload.url || '' });
  const targetPath = (payload.targetPath || '').toString().trim().replace(/^\/+/, '').replace(/\/+$/, '');

  if (!targetPath) {
    const error = new Error('A célútvonal megadása kötelező');
    error.status = 400;
    throw error;
  }

  return {
    ...base,
    sourceUrl: (payload.sourceUrl || '').toString().trim(),
    targetPath,
  };
}

function extractStoragePath(url = '') {
  const raw = (url || '').toString().trim();
  if (!raw) return '';

  try {
    const parsed = new URL(raw);
    return parsed.pathname.replace(/^\/+/, '');
  } catch (error) {
    // If it's not a valid URL, try to strip a potential host manually
  }

  return raw.replace(/^https?:\/\/[^/]+\//i, '').replace(/^\/+/, '');
}

function buildUniqueTargetPath(targetPath = '', usedPaths = new Set()) {
  const cleaned = targetPath.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!cleaned) return '';

  if (!usedPaths.has(cleaned)) {
    usedPaths.add(cleaned);
    return cleaned;
  }

  const lastSlash = cleaned.lastIndexOf('/');
  const directory = lastSlash >= 0 ? cleaned.slice(0, lastSlash + 1) : '';
  const fileName = lastSlash >= 0 ? cleaned.slice(lastSlash + 1) : cleaned;
  const dotIndex = fileName.lastIndexOf('.');
  const baseName = dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName;
  const extension = dotIndex >= 0 ? fileName.slice(dotIndex) : '';

  let counter = 2;
  let candidate = cleaned;

  while (usedPaths.has(candidate)) {
    candidate = `${directory}${baseName} -${counter}${extension} `;
    counter += 1;
  }

  usedPaths.add(candidate);
  return candidate;
}

async function uploadDocumentFromSource(sourceUrl, targetPath) {
  if (!BUNNY_STORAGE_ZONE || !BUNNY_STORAGE_KEY) {
    const error = new Error('A Bunny storage nincs konfigurálva.');
    error.status = 503;
    throw error;
  }

  const downloadResponse = await fetch(sourceUrl);
  if (!downloadResponse.ok) {
    const error = new Error('Nem sikerült letölteni a forrásdokumentumot.');
    error.status = 400;
    throw error;
  }

  const buffer = Buffer.from(await downloadResponse.arrayBuffer());
  const uploadUrl = buildBunnyUrl(targetPath);
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      AccessKey: BUNNY_STORAGE_KEY,
      'content-type': downloadResponse.headers.get('content-type') || 'application/octet-stream',
    },
    body: buffer,
  });

  if (!uploadResponse.ok) {
    const error = new Error('Nem sikerült feltölteni a dokumentumot a tárhelyre.');
    error.status = 502;
    throw error;
  }

  return buildBunnyCdnUrl(targetPath) || sourceUrl;
}

async function resolveNewsCategory(client, payload) {
  const requestedId = payload.categoryId || null;
  let categoryNameHu = (payload.categoryTranslations?.hu || payload.category || '').toString().trim();
  let categoryNameEn = (payload.categoryTranslations?.en || payload.category || '').toString().trim();

  if (requestedId) {
    const existing = await client.query('SELECT * FROM news_categories WHERE id = $1 LIMIT 1', [requestedId]);
    if (!existing.rows.length) {
      const error = new Error('A megadott kategória nem található');
      error.status = 400;
      throw error;
    }

    const row = existing.rows[0];
    return { categoryId: requestedId, categoryNameHu: row.name_hu, categoryNameEn: row.name_en };
  }

  if (!categoryNameHu) {
    const error = new Error('A kategória megadása kötelező');
    error.status = 400;
    throw error;
  }

  if (!categoryNameEn) {
    categoryNameEn = categoryNameHu;
  }

  const matched = await client.query('SELECT * FROM news_categories WHERE LOWER(name_hu) = LOWER($1) LIMIT 1', [categoryNameHu]);

  if (matched.rows.length) {
    const row = matched.rows[0];
    return { categoryId: row.id, categoryNameHu: row.name_hu, categoryNameEn: row.name_en };
  }

  const created = await client.query(
    'INSERT INTO news_categories (name_hu, name_en) VALUES ($1, $2) RETURNING *',
    [categoryNameHu, categoryNameEn],
  );

  const row = created.rows[0];
  return { categoryId: row.id, categoryNameHu: row.name_hu, categoryNameEn: row.name_en };
}

async function fetchNewsWithCategory(client, id) {
  const result = await client.query(
    `SELECT a.*, c.name_hu AS category_name_hu, c.name_en AS category_name_en
     FROM news_articles a
     LEFT JOIN news_categories c ON a.category_id = c.id
     WHERE a.id = $1
     LIMIT 1`,
    [id],
  );

  return result.rows[0];
}

function normalizeProjectTranslations(translations = { hu: {}, en: {} }) {
  return {
    hu: {
      title: translations.hu?.title || '',
      shortDescription:
        translations.hu?.shortDescription || translations.hu?.description || translations.hu?.title || '',
      description: translations.hu?.description || '',
    },
    en: {
      title: translations.en?.title || '',
      shortDescription:
        translations.en?.shortDescription || translations.en?.description || translations.en?.title || '',
      description: translations.en?.description || '',
    },
  };
}

function mapProjectRow(row) {
  const translations = normalizeProjectTranslations(row.translations || { hu: {}, en: {} });
  return {
    id: row.id,
    sortOrder: row.sort_order ?? 0,
    slugHu: row.slug_hu || '',
    slugEn: row.slug_en || '',
    languageAvailability: row.language_availability || 'both',
    heroImageUrl: row.hero_image_url || '',
    heroImageAlt: row.hero_image_alt || '',
    location: row.location || '',
    dateRange: row.date_range || '',
    linkUrl: row.link_url || '',
    published: row.published,
    translations,
    createdAt: row.created_at ? row.created_at.toISOString() : '',
    updatedAt: row.updated_at ? row.updated_at.toISOString() : '',
  };
}

function sanitizeNewsTranslation(data = {}) {
  return {
    title: (data.title || '').toString(),
    slug: (data.slug || '').toString(),
    excerpt: (data.excerpt || '').toString(),
    content: (data.content || '').toString(),
  };
}

function normalizeNewsTranslations(translations = { hu: {}, en: {} }, availability = 'both') {
  const allowedHu = availability !== 'en';
  const allowedEn = availability !== 'hu';
  return {
    hu: allowedHu ? sanitizeNewsTranslation(translations.hu) : sanitizeNewsTranslation(),
    en: allowedEn ? sanitizeNewsTranslation(translations.en) : sanitizeNewsTranslation(),
  };
}

function slugifyText(text) {
  return (text || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function ensureUniqueSlug(base, usedSet) {
  const safeBase = base || 'projekt';
  let candidate = safeBase;
  let suffix = 1;

  while (usedSet.has(candidate)) {
    candidate = `${safeBase} -${suffix} `;
    suffix += 1;
  }

  usedSet.add(candidate);
  return candidate;
}

async function generateUniqueGallerySlug(client, title, excludeId) {
  const base = slugifyText(title || 'galeria') || 'galeria';
  let candidate = base;
  let suffix = 1;

  while (true) {
    const params = excludeId ? [candidate, excludeId] : [candidate];
    const existing = await client.query(
      excludeId
        ? 'SELECT 1 FROM gallery_albums WHERE slug = $1 AND id <> $2 LIMIT 1'
        : 'SELECT 1 FROM gallery_albums WHERE slug = $1 LIMIT 1',
      params,
    );

    if (!existing.rows.length) {
      return candidate;
    }

    candidate = `${base} -${suffix} `;
    suffix += 1;
  }
}

function mapGalleryRow(row) {
  const eventDate = row.event_date instanceof Date ? row.event_date.toISOString().split('T')[0] : null;

  return {
    id: row.id,
    title: row.title || '',
    subtitle: row.subtitle || '',
    slug: row.slug || '',
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
    // Add visibility flag to the checked language versions (or top level if structure allows, 
    // but typically we want it on the content object or handled separately. 
    // Based on types, LocalizedSectionContent is Record<LanguageCode, SectionContent>.
    // SectionContent is Record<string, unknown>.
    // We'll inject isVisible into each language variant for easier consumption on frontend
    // or we might need to adjust the type to hold it at root.
    // The current type definition suggests LocalizedSectionContent is just the languages.
    // Let's attach it to the translations objects for now, or check how we planned it.
    // Plan: "Update LocalizedSectionContent to include optional isVisible?: boolean"
    // So it should be on the object that contains keys 'hu', 'en'. 
    // Wait, LocalizedSectionContent IS the object { hu: {...}, en: {...} }
    // So we can add isVisible to IT.
    store[row.section_key].isVisible = row.is_visible !== false; // Default true if null/undefined
  });
  return store;
}

async function validateUniqueSlugs(client, { slugHu, slugEn, excludeId }) {
  const conditions = [];
  const params = [];

  if (slugHu) {
    params.push(slugHu);
    conditions.push(`slug_hu = $${params.length} `);
  }

  if (slugEn) {
    params.push(slugEn);
    conditions.push(`slug_en = $${params.length} `);
  }

  if (!conditions.length) return;

  let query = `SELECT id, slug_hu, slug_en FROM news_articles WHERE(${conditions.join(' OR ')}) AND published = TRUE`;

  if (excludeId) {
    params.push(excludeId);
    query += ` AND id <> $${params.length} `;
  }

  const existing = await client.query(query, params);
  if (existing.rows.length) {
    const conflict = existing.rows[0];
    const conflictSlug = conflict.slug_hu === slugHu ? slugHu : slugEn;
    const language = conflict.slug_hu === slugHu ? 'magyar' : 'angol';
    const message = `A(z) ${language} slug(${conflictSlug}) már létezik.`;
    const error = new Error(message);
    error.status = 409;
    throw error;
  }
}

async function getLoginAttempt(client, emailKey, ip) {
  const result = await client.query(
    'SELECT failed_attempts, locked_until FROM admin_login_attempts WHERE email = $1 AND ip = $2',
    [emailKey, ip],
  );

  return result.rows[0];
}

async function recordFailedLogin(client, emailKey, ip) {
  const current = await getLoginAttempt(client, emailKey, ip);
  const nextFailures = (current?.failed_attempts || 0) + 1;
  const shouldLock = nextFailures >= LOGIN_MAX_FAILED_ATTEMPTS;
  const lockedUntil = shouldLock ? new Date(Date.now() + LOGIN_LOCK_DURATION_MS) : current?.locked_until || null;

  await client.query(
    `INSERT INTO admin_login_attempts(email, ip, failed_attempts, last_failed_at, locked_until)
    VALUES($1, $2, $3, NOW(), $4)
     ON CONFLICT(email, ip) DO UPDATE SET
    failed_attempts = EXCLUDED.failed_attempts,
      last_failed_at = EXCLUDED.last_failed_at,
      locked_until = EXCLUDED.locked_until`,
    [emailKey, ip, nextFailures, lockedUntil],
  );

  return {
    failedAttempts: nextFailures,
    lockedUntil,
    remainingAttempts: Math.max(LOGIN_MAX_FAILED_ATTEMPTS - nextFailures, 0),
  };
}

async function resetLoginAttempts(client, emailKey, ip) {
  await client.query('DELETE FROM admin_login_attempts WHERE email = $1 AND ip = $2', [emailKey, ip]);
}

async function ensureAdminSessionsTable() {
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_sessions(
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL,
        refresh_token_hash TEXT NOT NULL,
        csrf_token TEXT NOT NULL,
        token_nonce TEXT NOT NULL,
        revoked BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query('CREATE INDEX IF NOT EXISTS admin_sessions_email_idx ON admin_sessions(email);');
    await client.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS admin_sessions_refresh_hash_idx ON admin_sessions(refresh_token_hash);',
    );
  } finally {
    client.release();
  }
}

async function revokeSessionsForEmail(client, email) {
  await client.query('DELETE FROM admin_sessions WHERE email = $1', [email]);
}

async function getSessionById(client, sessionId) {
  const result = await client.query('SELECT * FROM admin_sessions WHERE id = $1', [sessionId]);
  return result.rows[0];
}

async function getSessionByRefreshHash(client, refreshHash) {
  const result = await client.query(
    'SELECT * FROM admin_sessions WHERE refresh_token_hash = $1 AND revoked = FALSE',
    [refreshHash],
  );

  return result.rows[0];
}

async function persistSession(client, sessionId, email, refreshToken, csrfToken, tokenNonce) {
  const refreshTokenHash = hashToken(refreshToken);
  await client.query(
    `INSERT INTO admin_sessions(id, email, refresh_token_hash, csrf_token, token_nonce)
    VALUES($1, $2, $3, $4, $5)
     ON CONFLICT(id) DO UPDATE SET
    refresh_token_hash = EXCLUDED.refresh_token_hash,
      csrf_token = EXCLUDED.csrf_token,
      token_nonce = EXCLUDED.token_nonce,
      revoked = FALSE,
      updated_at = NOW()`,
    [sessionId, email, refreshTokenHash, csrfToken, tokenNonce],
  );
}

async function updateSessionWithRotation(client, sessionId, refreshToken, csrfToken, tokenNonce) {
  const refreshTokenHash = hashToken(refreshToken);
  await client.query(
    `UPDATE admin_sessions SET
    refresh_token_hash = $1,
      csrf_token = $2,
      token_nonce = $3,
      revoked = FALSE,
      updated_at = NOW()
   WHERE id = $4`,
    [refreshTokenHash, csrfToken, tokenNonce, sessionId],
  );
}

async function createFreshSession(client, email) {
  await revokeSessionsForEmail(client, email);

  const sessionId = crypto.randomUUID();
  const refreshToken = crypto.randomBytes(48).toString('hex');
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const tokenNonce = crypto.randomBytes(16).toString('hex');
  const accessToken = signAccessToken({ email, sid: sessionId, nonce: tokenNonce });

  await persistSession(client, sessionId, email, refreshToken, csrfToken, tokenNonce);

  return { sessionId, accessToken, refreshToken, csrfToken, tokenNonce };
}

async function rotateSession(client, sessionId, email) {
  const refreshToken = crypto.randomBytes(48).toString('hex');
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const tokenNonce = crypto.randomBytes(16).toString('hex');
  const accessToken = signAccessToken({ email, sid: sessionId, nonce: tokenNonce });

  await updateSessionWithRotation(client, sessionId, refreshToken, csrfToken, tokenNonce);

  return { sessionId, accessToken, refreshToken, csrfToken, tokenNonce };
}

function setSessionCookies(res, accessToken, refreshToken, csrfToken) {
  res.cookie(COOKIE_NAME, accessToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    path: '/',
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    path: '/',
  });

  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    sameSite: 'strict',
    secure: true,
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    path: '/',
  });
}

async function authenticateRequest(req, res, next) {
  const bearer = req.headers.authorization?.replace('Bearer ', '');
  const token = req.cookies[COOKIE_NAME] || bearer;

  if (!token) {
    return res.status(401).json({ message: 'Nincs aktív munkamenet' });
  }

  const payload = verifyAccessToken(token);

  if (!payload?.sid || !payload?.email || !payload?.nonce) {
    return res.status(401).json({ message: 'Érvénytelen vagy lejárt munkamenet' });
  }

  const client = await pool.connect();

  try {
    const session = await getSessionById(client, payload.sid);

    if (!session || session.revoked || session.email !== payload.email || session.token_nonce !== payload.nonce) {
      return res.status(401).json({ message: 'Érvénytelen vagy lejárt munkamenet' });
    }

    const unsafeMethod = !['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase());
    if (unsafeMethod) {
      const csrfCookie = req.cookies[CSRF_COOKIE_NAME];
      const csrfHeader = req.headers['x-csrf-token'];
      if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader || csrfCookie !== session.csrf_token) {
        return res.status(403).json({ message: 'CSRF token hiányzik vagy érvénytelen' });
      }
    }

    req.user = { email: payload.email, sessionId: payload.sid };
    return next();
  } catch (error) {
    console.error('Auth error', error);
    return res.status(500).json({ message: 'Váratlan hiba történt' });
  } finally {
    client.release();
  }
}

app.post('/api/auth/login', loginRateLimiter, async (req, res) => {
  const { email, password, mfaCode, recoveryCode } = req.body || {};
  const emailKey = (email || 'unknown').toLowerCase();
  const ip = getClientIp(req);

  if (!email || !password) {
    return res.status(400).json({ message: 'Az e-mail és jelszó megadása kötelező' });
  }

  const client = await pool.connect();
  try {
    const attempt = await getLoginAttempt(client, emailKey, ip);
    const lockExpiry = attempt?.locked_until ? new Date(attempt.locked_until) : null;

    if (lockExpiry && lockExpiry.getTime() > Date.now()) {
      const retryAfterSeconds = Math.max(1, Math.ceil((lockExpiry.getTime() - Date.now()) / 1000));
      return res.status(429).json({
        message: 'A fiók átmenetileg zárolva túl sok sikertelen próbálkozás miatt.',
        lockedUntil: lockExpiry.toISOString(),
        remainingAttempts: 0,
        retryAfterSeconds,
      });
    }

    const result = await client.query(
      'SELECT email, password_hash, mfa_enabled, mfa_secret, recovery_codes, must_reset_password, is_active FROM admin_users WHERE email = $1',
      [email],
    );

    if (!result.rows.length) {
      const failed = await recordFailedLogin(client, emailKey, ip);
      const status = failed.lockedUntil ? 429 : 401;
      return res.status(status).json({
        message: 'Helytelen belépési adatok',
        lockedUntil: failed.lockedUntil ? new Date(failed.lockedUntil).toISOString() : undefined,
        remainingAttempts: failed.remainingAttempts,
      });
    }

    const user = result.rows[0];

    if (user.is_active === false) {
      return res.status(403).json({ message: 'A fiók le van tiltva' });
    }

    const isValid = verifyPassword(password, user.password_hash);

    if (!isValid) {
      const failed = await recordFailedLogin(client, emailKey, ip);
      const status = failed.lockedUntil ? 429 : 401;
      return res.status(status).json({
        message: 'Helytelen belépési adatok',
        lockedUntil: failed.lockedUntil ? new Date(failed.lockedUntil).toISOString() : undefined,
        remainingAttempts: failed.remainingAttempts,
      });
    }

    if (user.must_reset_password) {
      return res.status(403).json({ message: 'A fiók új jelszót igényel. Ellenőrizd az e-mailt.', resetRequired: true });
    }

    if (user.mfa_enabled) {
      if (!mfaCode && !recoveryCode) {
        return res.status(401).json({ message: 'Add meg az ellenőrző kódot a belépéshez', requiresMfa: true });
      }

      const isTotpValid = mfaCode
        ? speakeasy.totp.verify({ secret: user.mfa_secret, encoding: 'base32', token: mfaCode, window: 1 })
        : false;

      let isRecoveryValid = false;
      if (!isTotpValid && recoveryCode && Array.isArray(user.recovery_codes)) {
        const normalized = recoveryCode.replace(/\s+/g, '').toUpperCase();
        const matchingIndex = user.recovery_codes.findIndex((code) => hashToken(normalized) === code);
        if (matchingIndex >= 0) {
          isRecoveryValid = true;
          const nextCodes = [...user.recovery_codes];
          nextCodes.splice(matchingIndex, 1);
          await client.query('UPDATE admin_users SET recovery_codes = $1 WHERE email = $2', [nextCodes, user.email]);
        }
      }

      if (!isTotpValid && !isRecoveryValid) {
        const failed = await recordFailedLogin(client, emailKey, ip);
        const status = failed.lockedUntil ? 429 : 401;
        return res.status(status).json({
          message: 'Érvénytelen vagy lejárt ellenőrző kód',
          lockedUntil: failed.lockedUntil ? new Date(failed.lockedUntil).toISOString() : undefined,
          remainingAttempts: failed.remainingAttempts,
          requiresMfa: true,
        });
      }
    }

    await resetLoginAttempts(client, emailKey, ip);
    const sessionTokens = await createFreshSession(client, user.email);
    setSessionCookies(res, sessionTokens.accessToken, sessionTokens.refreshToken, sessionTokens.csrfToken);

    await client.query('UPDATE admin_users SET last_login_at = NOW() WHERE email = $1', [user.email]);

    return res
      .status(200)
      .json({ user: { email: user.email, mfaEnabled: Boolean(user.mfa_enabled) }, csrfToken: sessionTokens.csrfToken });
  } catch (error) {
    console.error('Login error', error);
    return res.status(500).json({ message: 'Váratlan hiba történt' });
  } finally {
    client.release();
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME];

  if (!refreshToken) {
    return res.status(401).json({ message: 'A munkamenet lejárt, jelentkezz be újra' });
  }

  const client = await pool.connect();
  try {
    const refreshHash = hashToken(refreshToken);
    const session = await getSessionByRefreshHash(client, refreshHash);

    if (!session) {
      res.clearCookie(COOKIE_NAME, { path: '/' });
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
      res.clearCookie(CSRF_COOKIE_NAME, { path: '/' });
      return res.status(401).json({ message: 'A munkamenet lejárt, jelentkezz be újra' });
    }

    const csrfCookie = req.cookies[CSRF_COOKIE_NAME];
    const csrfHeader = req.headers['x-csrf-token'];

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader || csrfCookie !== session.csrf_token) {
      return res.status(403).json({ message: 'CSRF token hiányzik vagy érvénytelen' });
    }

    const userResult = await client.query('SELECT mfa_enabled FROM admin_users WHERE email = $1', [session.email]);
    const rotated = await rotateSession(client, session.id, session.email);
    setSessionCookies(res, rotated.accessToken, rotated.refreshToken, rotated.csrfToken);

    return res
      .status(200)
      .json({ user: { email: session.email, mfaEnabled: Boolean(userResult.rows[0]?.mfa_enabled) }, csrfToken: rotated.csrfToken });
  } catch (error) {
    console.error('Refresh error', error);
    return res.status(500).json({ message: 'Váratlan hiba történt' });
  } finally {
    client.release();
  }
});

app.post('/api/auth/complete-invite', async (req, res) => {
  const { token, password } = req.body || {};

  if (!token || !password) {
    return res.status(400).json({ message: 'Hiányzó meghívó token vagy jelszó' });
  }

  const client = await pool.connect();
  try {
    const invite = await consumeUserToken(client, token, 'invite');
    if (!invite) {
      return res.status(400).json({ message: 'A meghívó lejárt vagy már felhasználták' });
    }

    const issues = validatePasswordComplexity(password, invite.email);
    if (issues.length) {
      return res.status(400).json({ message: issues[0] });
    }

    const reused = await isPasswordReused(client, invite.email, password);
    if (reused) {
      return res.status(400).json({ message: 'Ne használj korábbi jelszót' });
    }

    const passwordHash = createPasswordHash(password);
    await recordPasswordHistory(client, invite.email, passwordHash);
    await revokeSessionsForEmail(client, invite.email);

    await client.query(
      `UPDATE admin_users
       SET password_hash = $1, must_reset_password = FALSE, last_password_change = NOW()
       WHERE email = $2`,
      [passwordHash, invite.email],
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Complete invite error', error);
    return res.status(500).json({ message: 'Nem sikerült aktiválni a fiókot' });
  } finally {
    client.release();
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body || {};

  if (!token || !password) {
    return res.status(400).json({ message: 'Hiányzó token vagy jelszó' });
  }

  const client = await pool.connect();
  try {
    const resetToken = await consumeUserToken(client, token, 'reset');
    if (!resetToken) {
      return res.status(400).json({ message: 'A jelszó-visszaállító link lejárt vagy már felhasználták' });
    }

    const issues = validatePasswordComplexity(password, resetToken.email);
    if (issues.length) {
      return res.status(400).json({ message: issues[0] });
    }

    const reused = await isPasswordReused(client, resetToken.email, password);
    if (reused) {
      return res.status(400).json({ message: 'Ne használj korábbi jelszót' });
    }

    const passwordHash = createPasswordHash(password);
    await recordPasswordHistory(client, resetToken.email, passwordHash);
    await revokeSessionsForEmail(client, resetToken.email);

    await client.query(
      `UPDATE admin_users
       SET password_hash = $1, must_reset_password = FALSE, last_password_change = NOW()
       WHERE email = $2`,
      [passwordHash, resetToken.email],
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Complete reset error', error);
    return res.status(500).json({ message: 'Nem sikerült visszaállítani a jelszót' });
  } finally {
    client.release();
  }
});

app.get('/api/admin/security/mfa', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT mfa_enabled, recovery_codes FROM admin_users WHERE email = $1', [req.user.email]);
    const row = result.rows[0];
    return res.status(200).json({ enabled: Boolean(row?.mfa_enabled), recoveryCodesRemaining: row?.recovery_codes?.length || 0 });
  } finally {
    client.release();
  }
});

app.post('/api/admin/security/mfa/prepare', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  try {
    const secret = speakeasy.generateSecret({ name: `MIK Admin(${req.user.email})` });
    const recoveryCodes = generateRecoveryCodes();
    await storeMfaEnrollment(client, req.user.email, secret.base32, recoveryCodes);

    return res.status(200).json({ secret: secret.base32, otpauthUrl: secret.otpauth_url, recoveryCodes });
  } catch (error) {
    console.error('MFA prepare error', error);
    return res.status(500).json({ message: 'Nem sikerült előkészíteni a kétlépcsős azonosítást' });
  } finally {
    client.release();
  }
});

app.post('/api/admin/security/mfa/confirm', authenticateRequest, async (req, res) => {
  const { code, recoveryCode } = req.body || {};
  if (!code) {
    return res.status(400).json({ message: 'Hiányzó ellenőrző kód' });
  }

  const normalizedRecovery = typeof recoveryCode === 'string' ? recoveryCode.replace(/\s+/g, '').toUpperCase() : '';
  if (!normalizedRecovery) {
    return res.status(400).json({ message: 'Adj meg egy helyreállító kódot is a mentés megerősítéséhez' });
  }

  const client = await pool.connect();
  try {
    const enrollment = await getMfaEnrollment(client, req.user.email);
    if (!enrollment) {
      return res.status(400).json({ message: 'Nincs aktív MFA beállítás' });
    }

    const isRecoveryFromSet = enrollment.recovery_codes?.some(
      (candidate) => candidate.replace(/\s+/g, '').toUpperCase() === normalizedRecovery,
    );
    if (!isRecoveryFromSet) {
      return res.status(400).json({ message: 'Add meg a megjelenített helyreállító kódok egyikét' });
    }

    const isValid = speakeasy.totp.verify({ secret: enrollment.secret, encoding: 'base32', token: code, window: 1 });
    if (!isValid) {
      return res.status(400).json({ message: 'Érvénytelen kód' });
    }

    const hashedCodes = hashRecoveryCodes(enrollment.recovery_codes);
    await client.query(
      `UPDATE admin_users
       SET mfa_enabled = TRUE, mfa_secret = $1, recovery_codes = $2
       WHERE email = $3`,
      [enrollment.secret, hashedCodes, req.user.email],
    );
    await clearMfaEnrollment(client, req.user.email);

    const sessionTokens = await createFreshSession(client, req.user.email);
    setSessionCookies(res, sessionTokens.accessToken, sessionTokens.refreshToken, sessionTokens.csrfToken);

    return res.status(200).json({ recoveryCodes: enrollment.recovery_codes });
  } catch (error) {
    console.error('MFA confirm error', error);
    return res.status(500).json({ message: 'Nem sikerült bekapcsolni a kétlépcsős azonosítást' });
  } finally {
    client.release();
  }
});

app.post('/api/admin/security/mfa/disable', authenticateRequest, async (req, res) => {
  const { code, recoveryCode } = req.body || {};
  const client = await pool.connect();
  try {
    const userResult = await client.query('SELECT mfa_enabled, mfa_secret, recovery_codes FROM admin_users WHERE email = $1', [req.user.email]);
    const user = userResult.rows[0];

    if (!user?.mfa_enabled) {
      return res.status(200).json({ success: true });
    }

    const isTotpValid = code
      ? speakeasy.totp.verify({ secret: user.mfa_secret, encoding: 'base32', token: code, window: 1 })
      : false;

    let isRecoveryValid = false;
    if (!isTotpValid && recoveryCode && Array.isArray(user.recovery_codes)) {
      const normalized = recoveryCode.replace(/\s+/g, '').toUpperCase();
      const match = user.recovery_codes.find((stored) => stored === hashToken(normalized));
      isRecoveryValid = Boolean(match);
    }

    if (!isTotpValid && !isRecoveryValid) {
      return res.status(400).json({ message: 'Érvénytelen kód a kikapcsoláshoz' });
    }

    await client.query(
      `UPDATE admin_users
       SET mfa_enabled = FALSE, mfa_secret = NULL, recovery_codes = ARRAY[]:: TEXT[]
       WHERE email = $1`,
      [req.user.email],
    );
    await clearMfaEnrollment(client, req.user.email);

    const sessionTokens = await createFreshSession(client, req.user.email);
    setSessionCookies(res, sessionTokens.accessToken, sessionTokens.refreshToken, sessionTokens.csrfToken);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('MFA disable error', error);
    return res.status(500).json({ message: 'Nem sikerült kikapcsolni a kétlépcsős azonosítást' });
  } finally {
    client.release();
  }
});

app.post('/api/admin/security/password', authenticateRequest, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Hiányzó jelszó mezők' });
  }

  const client = await pool.connect();
  try {
    const userResult = await client.query('SELECT password_hash FROM admin_users WHERE email = $1', [req.user.email]);
    const user = userResult.rows[0];
    if (!user || !verifyPassword(currentPassword, user.password_hash)) {
      return res.status(400).json({ message: 'A jelenlegi jelszó hibás' });
    }

    const issues = validatePasswordComplexity(newPassword, req.user.email);
    if (issues.length) {
      return res.status(400).json({ message: issues[0] });
    }

    const reused = await isPasswordReused(client, req.user.email, newPassword);
    if (reused) {
      return res.status(400).json({ message: 'A jelszó nem egyezhet meg a korábbiakkal' });
    }

    const passwordHash = createPasswordHash(newPassword);
    await recordPasswordHistory(client, req.user.email, user.password_hash);
    await revokeSessionsForEmail(client, req.user.email);

    await client.query(
      `UPDATE admin_users
       SET password_hash = $1, last_password_change = NOW(), must_reset_password = FALSE
       WHERE email = $2`,
      [passwordHash, req.user.email],
    );

    const sessionTokens = await createFreshSession(client, req.user.email);
    setSessionCookies(res, sessionTokens.accessToken, sessionTokens.refreshToken, sessionTokens.csrfToken);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Password change error', error);
    return res.status(500).json({ message: 'Nem sikerült frissíteni a jelszót' });
  } finally {
    client.release();
  }
});

app.get('/api/admin/users', authenticateRequest, async (_req, res) => {
  const client = await pool.connect();
  try {
    const usersPromise = client.query(
      `SELECT email, created_at, last_login_at, mfa_enabled, must_reset_password, is_active
       FROM admin_users
       ORDER BY created_at DESC`,
    );

    const invitesPromise = client.query(
      `SELECT email, expires_at, created_at
       FROM admin_user_tokens
       WHERE type = 'invite' AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC`,
    );

    const [users, invites] = await Promise.all([usersPromise, invitesPromise]);

    return res.status(200).json({ users: users.rows, invites: invites.rows });
  } catch (error) {
    console.error('List users error', error);
    return res.status(500).json({ message: 'Nem sikerült lekérni a felhasználókat' });
  } finally {
    client.release();
  }
});

app.post('/api/admin/users/invite', authenticateRequest, async (req, res) => {
  const { email } = req.body || {};
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Érvényes e-mail cím szükséges' });
  }

  if (!BREVO_API_KEY || !BREVO_FROM_EMAIL) {
    return res.status(500).json({ message: 'A meghívók küldéséhez konfiguráld a Brevo API kulcsot' });
  }

  const client = await pool.connect();
  try {
    const randomPassword = crypto.randomBytes(24).toString('hex');
    const passwordHash = createPasswordHash(randomPassword);

    await client.query(
      `INSERT INTO admin_users(email, password_hash, must_reset_password, is_active, created_at)
    VALUES($1, $2, TRUE, TRUE, NOW())
       ON CONFLICT(email) DO UPDATE SET password_hash = EXCLUDED.password_hash, must_reset_password = TRUE, is_active = TRUE`,
      [normalizedEmail, passwordHash],
    );

    await revokeSessionsForEmail(client, normalizedEmail);

    const { token, expiresAt } = await createUserToken(client, normalizedEmail, 'invite');
    const inviteLink = buildInviteLink(token);
    await sendInviteEmail(normalizedEmail, inviteLink);

    return res.status(201).json({ inviteExpiresAt: expiresAt.toISOString(), link: inviteLink });
  } catch (error) {
    console.error('Invite user error', error);
    return res.status(500).json({ message: 'Nem sikerült elküldeni a meghívót' });
  } finally {
    client.release();
  }
});

app.delete('/api/admin/users/invite', authenticateRequest, async (req, res) => {
  const { email } = req.body || {};
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Érvényes e-mail cím szükséges' });
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      "DELETE FROM admin_user_tokens WHERE email = $1 AND type = 'invite' AND used = FALSE RETURNING id",
      [normalizedEmail],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Nincs aktív meghívó ehhez az e-mail címhez' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete invite error', error);
    return res.status(500).json({ message: 'Nem sikerült törölni a meghívót' });
  } finally {
    client.release();
  }
});

app.delete('/api/admin/users/:email', authenticateRequest, async (req, res) => {
  const normalizedEmail = (req.params.email || '').trim().toLowerCase();

  if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Érvényes e-mail cím szükséges' });
  }

  if (normalizedEmail === req.user.email) {
    return res.status(400).json({ message: 'Nem törölheted a saját fiókodat' });
  }

  const client = await pool.connect();
  try {
    const deleted = await client.query('DELETE FROM admin_users WHERE email = $1 RETURNING email', [normalizedEmail]);

    if (!deleted.rowCount) {
      return res.status(404).json({ message: 'A felhasználó nem található' });
    }

    await client.query('DELETE FROM admin_user_tokens WHERE email = $1', [normalizedEmail]);
    await client.query('DELETE FROM admin_mfa_enrollments WHERE email = $1', [normalizedEmail]);
    await client.query('DELETE FROM admin_password_history WHERE email = $1', [normalizedEmail]);
    await revokeSessionsForEmail(client, normalizedEmail);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete user error', error);
    return res.status(500).json({ message: 'Nem sikerült törölni a felhasználót' });
  } finally {
    client.release();
  }
});

app.post('/api/admin/users/reset-password', authenticateRequest, async (req, res) => {
  const { email } = req.body || {};
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Érvényes e-mail cím szükséges' });
  }

  if (!BREVO_API_KEY || !BREVO_FROM_EMAIL) {
    return res.status(500).json({ message: 'A jelszó-visszaállításhoz konfiguráld a Brevo API kulcsot' });
  }

  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT email FROM admin_users WHERE email = $1 LIMIT 1', [normalizedEmail]);
    if (!existing.rowCount) {
      return res.status(404).json({ message: 'Nincs ilyen felhasználó' });
    }

    const { token, expiresAt } = await createUserToken(client, normalizedEmail, 'reset', PASSWORD_RESET_TOKEN_TTL_MS);
    await client.query('UPDATE admin_users SET must_reset_password = TRUE WHERE email = $1', [normalizedEmail]);
    await revokeSessionsForEmail(client, normalizedEmail);

    const resetLink = buildPasswordResetLink(token);
    await sendPasswordResetEmail(normalizedEmail, resetLink);

    return res.status(200).json({ resetExpiresAt: expiresAt.toISOString(), link: resetLink });
  } catch (error) {
    console.error('Reset password request error', error);
    return res.status(500).json({ message: 'Nem sikerült elküldeni a jelszó visszaállító e-mailt' });
  } finally {
    client.release();
  }
});

app.post('/api/admin/bugreports', authenticateRequest, async (req, res) => {
  const { title, description, stepsToReproduce, expectedResult, actualResult, severity } = req.body || {};

  if (!description || !title) {
    return res.status(400).json({ message: 'A cím és a leírás megadása kötelező' });
  }

  try {
    await sendBugReportEmail({
      reporterEmail: req.user.email,
      title: title.trim(),
      description: description.trim(),
      stepsToReproduce: stepsToReproduce?.trim(),
      expectedResult: expectedResult?.trim(),
      actualResult: actualResult?.trim(),
      severity: severity?.trim(),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Bug report send error', error);
    const message =
      error instanceof Error && error.message.includes('Brevo')
        ? 'Hiba a Brevo e-mail küldése közben'
        : 'Nem sikerült elküldeni a hibajelentést';
    return res.status(500).json({ message });
  }
});

app.get('/api/admin/analytics/visitors', authenticateRequest, async (_req, res) => {
  if (!analyticsClient || !analyticsProperty) {
    const { message } = getAnalyticsConfigStatus();
    return res.status(503).json({
      ...analyticsDefaults,
      configured: false,
      message: message || 'A Google Analytics nincs beállítva',
    });
  }

  try {
    const data = await fetchVisitorCounts();
    return res.json(data);
  } catch (error) {
    console.error('Analytics fetch error', error);
    return res.status(500).json({
      ...analyticsDefaults,
      configured: true,
      message: 'Nem sikerült lekérni az analitika adatokat',
    });
  }
});

function ensureFolderPath(path) {
  const normalized = (path || '').toString().trim().replace(/\\+/g, '/').replace(/\/$/, '');
  if (!normalized) {
    return '/';
  }

  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

function normalizeFolderPath(baseFolder, requestedFolder) {
  const base = ensureFolderPath(baseFolder || '/');
  if (!requestedFolder) {
    return base;
  }

  const requested = ensureFolderPath(requestedFolder);
  if (base === '/') {
    return requested;
  }

  if (requested === base || requested.startsWith(`${base}/`)) {
    return requested;
  }

  const appended = ensureFolderPath(`${base}/${requested.replace(/^\//, '')}`);
  if (appended.startsWith(`${base}/`)) {
    return appended;
  }

  return base;
}

async function ensureFolderHierarchy(authHeader, fullPath) {
  const normalized = ensureFolderPath(fullPath);
  if (normalized === '/') {
    return '/';
  }

  const segments = normalized.replace(/^\//, '').split('/').filter(Boolean);
  let parent = '/';

  for (const segment of segments) {
    const response = await fetch('https://api.imagekit.io/v1/folder', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderName: segment,
        parentFolderPath: parent,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 400 && /already exists/i.test(text)) {
        parent = ensureFolderPath(`${parent}/${segment}`);
        continue;
      }

      console.error('ImageKit ensure folder hiba', response.status, text);
      throw new Error('Nem sikerült előkészíteni az ImageKit mappát');
    }

    parent = ensureFolderPath(`${parent}/${segment}`);
  }

  return parent;
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
    await ensureFolderHierarchy(authHeader, parentFolderPath);

    const response = await fetch('https://api.imagekit.io/v1/folder', {
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

app.delete('/api/gallery/imagekit-files/:id', authenticateRequest, async (req, res) => {
  if (!IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
    return res.status(500).json({ message: 'ImageKit konfiguráció hiányzik a szerveren' });
  }

  const fileId = (req.params.id || '').toString().trim();
  const baseFolder = ensureFolderPath(IMAGEKIT_GALLERY_FOLDER || '/');

  if (!fileId) {
    return res.status(400).json({ message: 'Hiányzó fájlazonosító' });
  }

  const authHeader = Buffer.from(`${IMAGEKIT_PRIVATE_KEY}:`).toString('base64');

  try {
    const detailResponse = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}/details`, {
      headers: {
        Authorization: `Basic ${authHeader}`,
        Accept: 'application/json',
      },
    });

    if (!detailResponse.ok) {
      const message = `ImageKit file detail hiba: ${detailResponse.status}`;
      console.error(message, await detailResponse.text());
      return res.status(502).json({ message: 'Nem sikerült lekérni a fájl részleteit' });
    }

    const details = await detailResponse.json();
    const filePath = ensureFolderPath(details.filePath || details.folderPath || '/');

    if (baseFolder !== '/' && !filePath.startsWith(`${baseFolder}/`) && filePath !== baseFolder) {
      return res.status(403).json({ message: 'A fájl nem törölhető ebből a mappából' });
    }

    const deleteResponse = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${authHeader}`,
        Accept: 'application/json',
      },
    });

    if (!deleteResponse.ok) {
      const message = `ImageKit delete hiba: ${deleteResponse.status}`;
      console.error(message, await deleteResponse.text());
      return res.status(502).json({ message: 'Nem sikerült törölni a fájlt az ImageKitből' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('ImageKit delete error', error);
    return res.status(500).json({ message: 'Nem sikerült törölni a fájlt az ImageKitből' });
  }
});

app.get('/api/auth/me', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT mfa_enabled FROM admin_users WHERE email = $1', [req.user.email]);
    return res
      .status(200)
      .json({ user: { email: req.user.email, mfaEnabled: Boolean(result.rows[0]?.mfa_enabled) } });
  } finally {
    client.release();
  }
});

app.post('/api/auth/logout', async (req, res) => {
  const csrfCookie = req.cookies[CSRF_COOKIE_NAME];
  const csrfHeader = req.headers['x-csrf-token'];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ message: 'CSRF token hiányzik vagy érvénytelen' });
  }

  const accessToken = req.cookies[COOKIE_NAME] || req.headers.authorization?.replace('Bearer ', '');
  const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
  const client = await pool.connect();

  try {
    let session = null;

    if (accessToken) {
      const payload = verifyAccessToken(accessToken);
      if (payload?.sid) {
        session = await getSessionById(client, payload.sid);
      }
    }

    if (!session && refreshToken) {
      session = await getSessionByRefreshHash(client, hashToken(refreshToken));
    }

    if (session && session.csrf_token !== csrfCookie) {
      return res.status(403).json({ message: 'CSRF token hiányzik vagy érvénytelen' });
    }

    if (session) {
      await client.query('DELETE FROM admin_sessions WHERE id = $1', [session.id]);
    }
  } catch (error) {
    console.error('Logout error', error);
  } finally {
    client.release();
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
    res.clearCookie(CSRF_COOKIE_NAME, { path: '/' });
  }

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
    let result;
    try {
      // 1. Try selecting everything (ideal state)
      result = await client.query('SELECT section_key, translations, is_visible FROM page_content WHERE published = TRUE');
    } catch (err) {
      if (err.code === '42703') { // Undefined column
        console.warn('Database schema out of date, attempting auto-migration...');
        try {
          await client.query('ALTER TABLE page_content ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE');
          await client.query('ALTER TABLE page_content ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT TRUE');
          // Retry original query
          result = await client.query('SELECT section_key, translations, is_visible FROM page_content WHERE published = TRUE');
        } catch (migrationErr) {
          console.error('Auto-migration failed', migrationErr);
          // Fallback to legacy if migration fails
          result = await client.query('SELECT section_key, translations FROM page_content');
        }
      } else {
        throw err;
      }
    }
    return res.status(200).json({ sections: mapPageContentRows(result.rows) });
  } catch (error) {
    console.error('Public page content error', error);
    return res.status(500).json({ message: 'Nem sikerült betölteni az oldal tartalmait' });
  } finally {
    client.release();
  }
});

app.get('/api/documents', async (_req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM documents ORDER BY event_date DESC NULLS LAST, created_at DESC');
    return res.status(200).json({ documents: result.rows.map(mapDocumentRow) });
  } catch (error) {
    console.error('Fetch documents error', error);
    return res.status(500).json({ message: 'Nem sikerült lekérni a dokumentumokat.' });
  } finally {
    client.release();
  }
});

app.get('/api/page-content', authenticateRequest, async (_req, res) => {
  const client = await pool.connect();
  try {
    let result;
    try {
      result = await client.query('SELECT section_key, translations, is_visible FROM page_content');
    } catch (err) {
      if (err.code === '42703') { // Undefined column
        console.warn('Schema missing in admin, attempting auto-migration...');
        try {
          await client.query('ALTER TABLE page_content ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE');
          await client.query('ALTER TABLE page_content ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT TRUE');
          result = await client.query('SELECT section_key, translations, is_visible FROM page_content');
        } catch (migrationErr) {
          console.error('Auto-migration failed', migrationErr);
          result = await client.query('SELECT section_key, translations FROM page_content');
        }
      } else {
        throw err;
      }
    }
    return res.status(200).json({ sections: mapPageContentRows(result.rows) });
  } catch (error) {
    console.error('Admin page content error', error);
    return res.status(500).json({ message: 'Nem sikerült betölteni az oldal tartalmait' });
  } finally {
    client.release();
  }
});

app.get('/api/admin/documents', authenticateRequest, async (_req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM documents ORDER BY event_date DESC NULLS LAST, created_at DESC');
    return res.status(200).json({ documents: result.rows.map(mapDocumentRow) });
  } catch (error) {
    console.error('Admin fetch documents error', error);
    return res.status(500).json({ message: 'Nem sikerült lekérni a dokumentumokat.' });
  } finally {
    client.release();
  }
});

app.put('/api/admin/documents/:id', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  const documentId = req.params.id;

  try {
    const payload = normalizeDocumentPayload(req.body);

    const existing = await client.query('SELECT id FROM documents WHERE id = $1 LIMIT 1', [documentId]);
    if (!existing.rows.length) {
      return res.status(404).json({ message: 'A dokumentum nem található.' });
    }

    const result = await client.query(
      `UPDATE documents
       SET title = $1,
           title_en = $2,
           location = $3,
           event_date = $4,
           url = $5,
           category = $6,
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [payload.title, payload.titleEn, payload.location, payload.date, payload.url, payload.category, documentId],
    );

    return res.status(200).json({ documents: [mapDocumentRow(result.rows[0])] });
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || 'Nem sikerült frissíteni a dokumentumot.';
    console.error('Update document error', error);
    return res.status(status).json({ message });
  } finally {
    client.release();
  }
});

app.post('/api/admin/documents', authenticateRequest, async (req, res) => {
  const client = await pool.connect();

  try {
    const payload = normalizeDocumentPayload(req.body);

    const result = await client.query(
      `INSERT INTO documents (title, title_en, location, event_date, url, category)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [payload.title, payload.titleEn, payload.location, payload.date, payload.url, payload.category],
    );

    return res.status(201).json({ documents: [mapDocumentRow(result.rows[0])] });
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || 'Nem sikerült létrehozni a dokumentumot.';
    console.error('Create document error', error);
    return res.status(status).json({ message });
  } finally {
    client.release();
  }
});

app.delete('/api/admin/documents/:id', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  const documentId = req.params.id;

  try {
    const existing = await client.query('SELECT url FROM documents WHERE id = $1 LIMIT 1', [documentId]);
    if (!existing.rows.length) {
      return res.status(404).json({ message: 'A dokumentum nem található.' });
    }

    await client.query('DELETE FROM documents WHERE id = $1', [documentId]);

    const storedUrl = existing.rows[0].url || '';
    const cdnHost = (BUNNY_CDN_HOSTNAME || '').replace(/^https?:\/\//i, '').replace(/\/+$/g, '');

    if (storedUrl && cdnHost && storedUrl.includes(cdnHost) && BUNNY_STORAGE_KEY) {
      try {
        const parsed = new URL(storedUrl);
        const storagePath = decodeURIComponent(parsed.pathname || '').replace(/^\/+/, '');
        if (storagePath) {
          await fetch(buildBunnyUrl(storagePath), {
            method: 'DELETE',
            headers: {
              AccessKey: BUNNY_STORAGE_KEY,
            },
          });
        }
      } catch (cleanupError) {
        console.error('Optional Bunny cleanup failed', cleanupError);
      }
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Delete document error', error);
    const status = error.status || 500;
    const message = error.message || 'Nem sikerült törölni a dokumentumot.';
    return res.status(status).json({ message });
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

  const isVisible = req.body?.isVisible;

  try {
    let result;
    try {
      result = await client.query(
        `INSERT INTO page_content (section_key, translations, is_visible)
         VALUES ($1, $2, $3)
         ON CONFLICT (section_key)
         DO UPDATE SET translations = EXCLUDED.translations, is_visible = EXCLUDED.is_visible, updated_at = NOW()
         RETURNING section_key, translations, is_visible`,
        [sectionKey, translations, isVisible ?? true],
      );
    } catch (err) {
      if (err.code === '42703') { // Undefined column is_visible
        console.warn('Schema missing during save, attempting auto-migration...');
        await client.query('ALTER TABLE page_content ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE');
        await client.query('ALTER TABLE page_content ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT TRUE');

        // Retry the original query
        result = await client.query(
          `INSERT INTO page_content (section_key, translations, is_visible)
           VALUES ($1, $2, $3)
           ON CONFLICT (section_key)
           DO UPDATE SET translations = EXCLUDED.translations, is_visible = EXCLUDED.is_visible, updated_at = NOW()
           RETURNING section_key, translations, is_visible`,
          [sectionKey, translations, isVisible ?? true],
        );
      } else {
        throw err;
      }
    }

    const row = result.rows[0];
    return res.status(200).json({ sectionKey: row.section_key, translations: row.translations, isVisible: row.is_visible });
  } catch (error) {
    console.error('Save page content error', error);
    return res.status(500).json({ message: 'Nem sikerült menteni a tartalmat' });
  } finally {
    client.release();
  }
});

app.post('/api/admin/documents/import', authenticateRequest, async (req, res) => {
  const closingStatements = Array.isArray(req.body?.closingStatements) ? req.body.closingStatements : [];
  const otherDocuments = Array.isArray(req.body?.documents) ? req.body.documents : [];
  const combinedPayload = [...closingStatements, ...otherDocuments];

  let normalizedDocuments = [];
  try {
    normalizedDocuments = combinedPayload.map(normalizeDocumentImportPayload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Érvénytelen import adatok';
    return res.status(error.status || 400).json({ message });
  }

  if (!normalizedDocuments.length) {
    return res.status(400).json({ message: 'Nincs importálható dokumentum' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existingTargetPaths = new Set();

    const existingDocuments = await client.query('SELECT url FROM documents');
    existingDocuments.rows.forEach((row) => {
      const storagePath = extractStoragePath(row.url);
      if (storagePath) {
        existingTargetPaths.add(storagePath);
      }
    });

    for (const doc of normalizedDocuments) {
      const uniqueTargetPath = buildUniqueTargetPath(doc.targetPath, existingTargetPaths);
      const uploadedUrl = await uploadDocumentFromSource(doc.sourceUrl, uniqueTargetPath);
      const normalized = normalizeDocumentPayload({ ...doc, url: uploadedUrl });

      const result = await client.query(
        `INSERT INTO documents (title, title_en, location, event_date, url, category, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [normalized.title, normalized.titleEn, normalized.location, normalized.date, normalized.url, normalized.category],
      );
    }

    await client.query('COMMIT');
    const allDocuments = await client.query(
      'SELECT * FROM documents ORDER BY event_date DESC NULLS LAST, created_at DESC',
    );
    return res.status(200).json({ documents: allDocuments.rows.map(mapDocumentRow) });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Import documents error', error);
    const status = error.status || 500;
    const message = error.message || 'Nem sikerült importálni a dokumentumokat.';
    return res.status(status).json({ message });
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

app.post('/api/projects/translate', authenticateRequest, async (req, res) => {
  const { shortDescriptionHu, descriptionHu } = req.body || {};

  try {
    const result = await translateProjectToEnglish({ shortDescriptionHu, descriptionHu });
    return res.status(200).json(result);
  } catch (error) {
    console.error('Project translation error', error);
    const status = error.status || 500;
    const message = error.message || 'Nem sikerült lefordítani a projektet';
    return res.status(status).json({ message });
  }
});

app.post('/api/news/translate', authenticateRequest, async (req, res) => {
  const { excerptHu, contentHu } = req.body || {};

  try {
    const result = await translateNewsToEnglish({ excerptHu, contentHu });
    return res.status(200).json(result);
  } catch (error) {
    console.error('News translation error', error);
    const status = error.status || 500;
    const message = error.message || 'Nem sikerült lefordítani a hírt';
    return res.status(status).json({ message });
  }
});


app.get('/api/projects', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  const search = (req.query.search || '').toString().trim();
  const status = (req.query.status || 'all').toString();

  const filters = [];
  const values = [];
  const categoryId = req.query.categoryId ? req.query.categoryId.toString() : '';

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
        OR LOWER(translations -> 'hu' ->> 'shortDescription') LIKE LOWER($${values.length})
        OR LOWER(translations -> 'en' ->> 'shortDescription') LIKE LOWER($${values.length})
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

app.get('/api/projects/public', async (req, res) => {
  const client = await pool.connect();
  const lang = req.query.lang === 'en' ? 'en' : 'hu';
  const availabilityCondition =
    lang === 'en' ? "language_availability IN ('en', 'both')" : "language_availability IN ('hu', 'both')";
  try {
    const result = await client.query(
      `SELECT *
       FROM projects
       WHERE published = TRUE AND ${availabilityCondition}
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

app.get('/api/projects/public/slug/:slug', async (req, res) => {
  const client = await pool.connect();
  const lang = req.query.lang === 'en' ? 'en' : 'hu';
  const slug = req.params.slug;
  const availabilityCondition =
    lang === 'en' ? "language_availability IN ('en', 'both')" : "language_availability IN ('hu', 'both')";

  try {
    const result = await client.query(
      `SELECT *
       FROM projects
       WHERE published = TRUE
         AND ${availabilityCondition}
         AND (slug_hu = $1 OR slug_en = $1)
       LIMIT 1`,
      [slug],
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'A projekt nem található' });
    }

    return res.status(200).json(mapProjectRow(result.rows[0]));
  } catch (error) {
    console.error('Public project error', error);
    return res.status(500).json({ message: 'Nem sikerült betölteni a projektet' });
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

app.get('/api/gallery/public/:slug', async (req, res) => {
  const client = await pool.connect();
  const { slug } = req.params;

  try {
    const result = await client.query(
      `SELECT * FROM gallery_albums
       WHERE published = true AND slug = $1
       LIMIT 1`,
      [slug],
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'A galéria nem található' });
    }

    return res.json(mapGalleryRow(result.rows[0]));
  } catch (error) {
    console.error('Get public gallery by slug error', error);
    return res.status(500).json({ message: 'Nem sikerült betölteni a galériát' });
  } finally {
    client.release();
  }
});

function validateProjectPayload(payload) {
  const availability = payload?.languageAvailability || 'both';
  const allowedLanguages = ['hu', 'en', 'both'];
  if (!allowedLanguages.includes(availability)) {
    const error = new Error('Érvénytelen nyelvi elérhetőség');
    error.status = 400;
    throw error;
  }

  if ((availability === 'hu' || availability === 'both') && !payload?.slugHu) {
    const error = new Error('Add meg a magyar slugot');
    error.status = 400;
    throw error;
  }

  if ((availability === 'en' || availability === 'both') && !payload?.slugEn) {
    const error = new Error('Add meg az angol slugot');
    error.status = 400;
    throw error;
  }

  const needsHu = availability === 'hu' || availability === 'both';
  const needsEn = availability === 'en' || availability === 'both';

  if (needsHu && !payload?.translations?.hu?.title) {
    const error = new Error('A magyar cím megadása kötelező');
    error.status = 400;
    throw error;
  }

  if (needsEn && !payload?.translations?.en?.title) {
    const error = new Error('Az angol cím megadása kötelező');
    error.status = 400;
    throw error;
  }

  if (needsHu && !payload?.translations?.hu?.shortDescription) {
    const error = new Error('A magyar rövid leírás megadása kötelező');
    error.status = 400;
    throw error;
  }

  if (needsEn && !payload?.translations?.en?.shortDescription) {
    const error = new Error('Az angol rövid leírás megadása kötelező');
    error.status = 400;
    throw error;
  }

  if (needsHu && !payload?.translations?.hu?.description) {
    const error = new Error('A magyar leírás megadása kötelező');
    error.status = 400;
    throw error;
  }

  if (needsEn && !payload?.translations?.en?.description) {
    const error = new Error('Az angol leírás megadása kötelező');
    error.status = 400;
    throw error;
  }
}

function normalizeProjectPayload(payload) {
  const availability = ['hu', 'en', 'both'].includes(payload?.languageAvailability)
    ? payload.languageAvailability
    : 'both';

  const translations = normalizeProjectTranslations(payload?.translations || { hu: {}, en: {} });
  const slugHu = payload?.slugHu || slugifyText(payload?.translations?.hu?.title || '');
  const slugEn = payload?.slugEn || slugifyText(payload?.translations?.en?.title || '');

  return {
    ...payload,
    languageAvailability: availability,
    slugHu,
    slugEn,
    translations,
  };
}

async function translateProjectToEnglish({ shortDescriptionHu, descriptionHu }) {
  if (!OPENAI_API_KEY) {
    const error = new Error('Az OpenAI API kulcs nincs konfigurálva');
    error.status = 500;
    throw error;
  }

  if (!shortDescriptionHu && !descriptionHu) {
    const error = new Error('Nincs fordítandó szöveg');
    error.status = 400;
    throw error;
  }

  const parts = [];
  if (shortDescriptionHu) {
    parts.push(`Short description (Hungarian): ${shortDescriptionHu}`);
  }
  if (descriptionHu) {
    parts.push(`Detailed description (Hungarian): ${descriptionHu}`);
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-5-mini-2025-08-07',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You translate Hungarian project descriptions into natural, clear English and return only a JSON object.',
        },
        {
          role: 'user',
          content: `${parts.join('\n')}\nReturn JSON with keys "shortDescription" and "description" using English values. Use empty strings for missing inputs.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`Fordítási hiba: ${errorText || response.statusText}`);
    error.status = response.status || 500;
    throw error;
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || '{}';

  let parsed = {};
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    parsed = {};
  }

  const shortDescription = typeof parsed.shortDescription === 'string' ? parsed.shortDescription.trim() : '';
  const description = typeof parsed.description === 'string' ? parsed.description.trim() : '';

  return { shortDescription, description };
}

async function translateNewsToEnglish({ excerptHu, contentHu }) {
  if (!OPENAI_API_KEY) {
    const error = new Error('Az OpenAI API kulcs nincs konfigurálva');
    error.status = 500;
    throw error;
  }

  if (!excerptHu && !contentHu) {
    const error = new Error('Nincs fordítandó szöveg');
    error.status = 400;
    throw error;
  }

  const parts = [];
  if (excerptHu) {
    parts.push(`Excerpt (Hungarian): ${excerptHu}`);
  }
  if (contentHu) {
    parts.push(`Content (Hungarian): ${contentHu}`);
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-5-mini-2025-08-07',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You translate Hungarian news copy into natural English without shortening or summarizing any text and return only a JSON object.',
        },
        {
          role: 'user',
          content: `${parts.join('\n')}\nReturn JSON with keys "excerpt" and "content" using English values. Preserve the full meaning and length; use empty strings for missing inputs.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`Fordítási hiba: ${errorText || response.statusText}`);
    error.status = response.status || 500;
    throw error;
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || '{}';

  let parsed = {};
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    parsed = {};
  }

  const excerpt = typeof parsed.excerpt === 'string' ? parsed.excerpt.trim() : '';
  const englishContent = typeof parsed.content === 'string' ? parsed.content.trim() : '';

  return { excerpt, content: englishContent };
}

async function validateProjectSlugs(client, payload, excludeId) {
  const params = [];
  const conditions = [];

  if (payload.slugHu) {
    params.push(payload.slugHu);
    conditions.push(`slug_hu = $${params.length}`);
  }

  if (payload.slugEn) {
    params.push(payload.slugEn);
    conditions.push(`slug_en = $${params.length}`);
  }

  if (!conditions.length) {
    return;
  }

  const slugWhere = conditions.length > 1 ? `(${conditions.join(' OR ')})` : conditions[0];
  let query = `SELECT id, slug_hu, slug_en FROM projects WHERE ${slugWhere}`;

  if (excludeId) {
    params.push(excludeId);
    query += ` AND id <> $${params.length}`;
  }

  const existing = await client.query(query, params);
  if (existing.rows.length) {
    const conflict = existing.rows[0];
    const conflictSlug = conflict.slug_hu === payload.slugHu ? payload.slugHu : payload.slugEn;
    const language = conflict.slug_hu === payload.slugHu ? 'magyar' : 'angol';
    const message = `A(z) ${language} slug (${conflictSlug}) már létezik.`;
    const error = new Error(message);
    error.status = 409;
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
  const payload = normalizeProjectPayload(req.body || {});

  try {
    validateProjectPayload(payload);
    await validateProjectSlugs(client, payload);

    const orderResult = await client.query('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM projects');
    const nextOrder = Number(orderResult.rows[0]?.next_order || 1);

    const result = await client.query(
      `INSERT INTO projects
       (sort_order, hero_image_url, hero_image_alt, location, date_range, link_url, slug_hu, slug_en, language_availability, published, translations)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        payload.sortOrder ?? nextOrder,
        payload.heroImageUrl || null,
        payload.heroImageAlt || null,
        payload.location || null,
        payload.dateRange || null,
        payload.linkUrl || null,
        payload.slugHu || null,
        payload.slugEn || null,
        payload.languageAvailability || 'both',
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
  const payload = normalizeProjectPayload(req.body || {});
  const projectId = req.params.id;

  try {
    validateProjectPayload(payload);
    await validateProjectSlugs(client, payload, projectId);

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
           slug_hu = $7,
           slug_en = $8,
           language_availability = $9,
           published = $10,
           translations = $11,
           updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [
        payload.sortOrder ?? existing.rows[0].sort_order,
        payload.heroImageUrl || null,
        payload.heroImageAlt || null,
        payload.location || null,
        payload.dateRange || null,
        payload.linkUrl || null,
        payload.slugHu || null,
        payload.slugEn || null,
        payload.languageAvailability || existing.rows[0].language_availability || 'both',
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

    const slug = await generateUniqueGallerySlug(client, payload.title);

    const countResult = await client.query('SELECT COUNT(*) AS total FROM gallery_albums');
    const total = Number(countResult.rows[0]?.total || 0);
    const desiredOrderRaw = Number.isFinite(Number(payload.sortOrder)) ? Number(payload.sortOrder) : 1;
    const desiredOrder = Math.min(Math.max(1, desiredOrderRaw || 1), total + 1);

    await client.query('BEGIN');
    await client.query('UPDATE gallery_albums SET sort_order = sort_order + 1 WHERE sort_order >= $1', [desiredOrder]);

    const result = await client.query(
      `INSERT INTO gallery_albums
       (title, subtitle, event_date, slug, cover_image_url, cover_image_alt, images, sort_order, published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        payload.title,
        payload.subtitle || '',
        payload.eventDate || null,
        slug,
        payload.coverImageUrl,
        payload.coverImageAlt || '',
        JSON.stringify(images),
        desiredOrder,
        Boolean(payload.published),
      ],
    );

    await client.query('COMMIT');
    return res.status(201).json(mapGalleryRow(result.rows[0]));
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create gallery error', error);
    const status = error.status || 500;
    return res.status(status).json({ message: error.message || 'Nem sikerült létrehozni a galériát' });
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

app.put('/api/gallery/:id', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  const payload = req.body || {};
  const albumId = req.params.id;
  const images = Array.isArray(payload.images)
    ? payload.images.filter((img) => typeof img === 'string' && img.trim())
    : [];

  try {
    validateGalleryPayload({ ...payload, images });

    await client.query('BEGIN');
    const existing = await client.query('SELECT * FROM gallery_albums WHERE id = $1 LIMIT 1', [albumId]);
    if (!existing.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'A galéria nem található' });
    }

    const currentOrder = Number(existing.rows[0].sort_order || 1);
    const countResult = await client.query('SELECT COUNT(*) AS total FROM gallery_albums');
    const total = Number(countResult.rows[0]?.total || 1);
    const desiredOrderRaw = Number.isFinite(Number(payload.sortOrder)) ? Number(payload.sortOrder) : currentOrder;
    const desiredOrder = Math.min(Math.max(1, desiredOrderRaw || currentOrder), total);

    if (desiredOrder < currentOrder) {
      await client.query(
        'UPDATE gallery_albums SET sort_order = sort_order + 1 WHERE sort_order >= $1 AND sort_order < $2 AND id <> $3',
        [desiredOrder, currentOrder, albumId],
      );
    } else if (desiredOrder > currentOrder) {
      await client.query(
        'UPDATE gallery_albums SET sort_order = sort_order - 1 WHERE sort_order <= $1 AND sort_order > $2 AND id <> $3',
        [desiredOrder, currentOrder, albumId],
      );
    }

    const slug = await generateUniqueGallerySlug(client, payload.title, albumId);

    const result = await client.query(
      `UPDATE gallery_albums
       SET title = $1,
           subtitle = $2,
           event_date = $3,
           slug = $4,
           cover_image_url = $5,
           cover_image_alt = $6,
           images = $7,
           sort_order = $8,
           published = $9,
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        payload.title,
        payload.subtitle || '',
        payload.eventDate || null,
        slug,
        payload.coverImageUrl,
        payload.coverImageAlt || '',
        JSON.stringify(images),
        desiredOrder,
        Boolean(payload.published),
        albumId,
      ],
    );

    await client.query('COMMIT');
    return res.status(200).json(mapGalleryRow(result.rows[0]));
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update gallery error', error);
    const status = error.status || 500;
    return res.status(status).json({ message: error.message || 'Nem sikerült frissíteni a galériát' });
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
  const categoryId = req.query.categoryId ? req.query.categoryId.toString() : '';

  const filters = [];
  const values = [];

  if (status === 'published') {
    filters.push('published = TRUE');
  } else if (status === 'draft') {
    filters.push('published = FALSE');
  }

  if (categoryId) {
    values.push(categoryId);
    filters.push(`category_id = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    filters.push(
      `(LOWER(coalesce(c.name_hu, category)) LIKE LOWER($${values.length})
        OR LOWER(coalesce(c.name_en, category)) LIKE LOWER($${values.length})
        OR LOWER(translations -> 'hu' ->> 'title') LIKE LOWER($${values.length})
        OR LOWER(translations -> 'en' ->> 'title') LIKE LOWER($${values.length})
        OR LOWER(translations -> 'hu' ->> 'excerpt') LIKE LOWER($${values.length})
        OR LOWER(translations -> 'en' ->> 'excerpt') LIKE LOWER($${values.length}))`,
    );
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const baseFrom = 'FROM news_articles a LEFT JOIN news_categories c ON a.category_id = c.id';
  const offset = (page - 1) * pageSize;

  try {
    const countResult = await client.query(`SELECT COUNT(*) ${baseFrom} ${whereClause}`, values);
    const total = Number(countResult.rows[0]?.count || 0);

    const listResult = await client.query(
      `SELECT a.*, c.name_hu AS category_name_hu, c.name_en AS category_name_en
       ${baseFrom}
       ${whereClause}
       ORDER BY sticky DESC, news_date DESC, published_at DESC NULLS LAST, created_at DESC
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
  const categoryId = req.query.categoryId ? req.query.categoryId.toString() : '';
  const lang = req.query.lang === 'en' ? 'en' : 'hu';
  const availabilityCondition = lang === 'en'
    ? "language_availability IN ('en', 'both')"
    : "language_availability IN ('hu', 'both')";

  const filters = ['published = TRUE', availabilityCondition];
  const values = [];

  if (categoryId) {
    values.push(categoryId);
    filters.push(`category_id = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    filters.push(
      `(LOWER(coalesce(c.name_hu, category)) LIKE LOWER($${values.length})
        OR LOWER(coalesce(c.name_en, category)) LIKE LOWER($${values.length})
        OR LOWER(translations -> 'hu' ->> 'title') LIKE LOWER($${values.length})
        OR LOWER(translations -> 'en' ->> 'title') LIKE LOWER($${values.length})
        OR LOWER(translations -> 'hu' ->> 'excerpt') LIKE LOWER($${values.length})
        OR LOWER(translations -> 'en' ->> 'excerpt') LIKE LOWER($${values.length}))`,
    );
  }

  const whereClause = `WHERE ${filters.join(' AND ')}`;
  const baseFrom = 'FROM news_articles a LEFT JOIN news_categories c ON a.category_id = c.id';
  const offset = (page - 1) * pageSize;

  try {
    const countResult = await client.query(`SELECT COUNT(*) ${baseFrom} ${whereClause}`, values);
    const total = Number(countResult.rows[0]?.count || 0);

    const listResult = await client.query(
      `SELECT a.*, c.name_hu AS category_name_hu, c.name_en AS category_name_en
       ${baseFrom}
       ${whereClause}
       ORDER BY sticky DESC, news_date DESC, published_at DESC NULLS LAST, created_at DESC
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
  const lang = req.query.lang === 'en' ? 'en' : 'hu';
  const availabilityCondition = lang === 'en'
    ? "language_availability IN ('en', 'both')"
    : "language_availability IN ('hu', 'both')";
  try {
    const result = await client.query(
      `SELECT a.*, c.name_hu AS category_name_hu, c.name_en AS category_name_en
       FROM news_articles a
       LEFT JOIN news_categories c ON a.category_id = c.id
       WHERE (slug_hu = $1 OR slug_en = $1) AND published = TRUE AND ${availabilityCondition}
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

app.get('/api/news/categories', authenticateRequest, async (_req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM news_categories ORDER BY LOWER(name_hu) ASC');
    return res.status(200).json({ items: result.rows.map(mapNewsCategory) });
  } catch (error) {
    console.error('List news categories error', error);
    return res.status(500).json({ message: 'Nem sikerült betölteni a kategóriákat' });
  } finally {
    client.release();
  }
});

app.get('/api/news/categories/public', async (_req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM news_categories ORDER BY LOWER(name_hu) ASC');
    return res.status(200).json({ items: result.rows.map(mapNewsCategory) });
  } catch (error) {
    console.error('List public news categories error', error);
    return res.status(500).json({ message: 'Nem sikerült betölteni a kategóriákat' });
  } finally {
    client.release();
  }
});

app.post('/api/news/categories', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  const nameHu = (req.body?.nameHu || '').toString().trim();
  const nameEn = (req.body?.nameEn || '').toString().trim() || nameHu;

  if (!nameHu) {
    return res.status(400).json({ message: 'A magyar kategórianév megadása kötelező' });
  }

  try {
    const existing = await client.query(
      'SELECT * FROM news_categories WHERE LOWER(name_hu) = LOWER($1) OR LOWER(name_en) = LOWER($2) LIMIT 1',
      [nameHu, nameEn],
    );

    if (existing.rows.length) {
      return res.status(409).json({ message: 'Ez a kategória már létezik' });
    }

    const result = await client.query(
      'INSERT INTO news_categories (name_hu, name_en) VALUES ($1, $2) RETURNING *',
      [nameHu, nameEn],
    );

    return res.status(201).json(mapNewsCategory(result.rows[0]));
  } catch (error) {
    console.error('Create news category error', error);
    return res.status(500).json({ message: 'Nem sikerült létrehozni a kategóriát' });
  } finally {
    client.release();
  }
});

app.put('/api/news/categories/:id', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  const id = req.params.id;
  const nameHu = (req.body?.nameHu || '').toString().trim();
  const nameEn = (req.body?.nameEn || '').toString().trim() || nameHu;

  if (!nameHu) {
    client.release();
    return res.status(400).json({ message: 'A magyar kategórianév megadása kötelező' });
  }

  try {
    const existing = await client.query('SELECT * FROM news_categories WHERE id = $1 LIMIT 1', [id]);

    if (!existing.rows.length) {
      return res.status(404).json({ message: 'A kategória nem található' });
    }

    const duplicate = await client.query(
      'SELECT * FROM news_categories WHERE (LOWER(name_hu) = LOWER($1) OR LOWER(name_en) = LOWER($2)) AND id <> $3 LIMIT 1',
      [nameHu, nameEn, id],
    );

    if (duplicate.rows.length) {
      return res.status(409).json({ message: 'Ez a kategória már létezik' });
    }

    const result = await client.query(
      'UPDATE news_categories SET name_hu = $1, name_en = $2 WHERE id = $3 RETURNING *',
      [nameHu, nameEn, id],
    );

    await client.query('UPDATE news_articles SET category = $1, updated_at = NOW() WHERE category_id = $2', [nameHu, id]);

    return res.status(200).json(mapNewsCategory(result.rows[0]));
  } catch (error) {
    console.error('Update news category error', error);
    return res.status(500).json({ message: 'Nem sikerült frissíteni a kategóriát' });
  } finally {
    client.release();
  }
});

app.delete('/api/news/categories/:id', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  const id = req.params.id;

  try {
    const existing = await client.query('SELECT * FROM news_categories WHERE id = $1 LIMIT 1', [id]);

    if (!existing.rows.length) {
      return res.status(404).json({ message: 'A kategória nem található' });
    }

    await client.query('UPDATE news_articles SET category_id = NULL, updated_at = NOW() WHERE category_id = $1', [id]);
    await client.query('DELETE FROM news_categories WHERE id = $1', [id]);

    return res.status(204).send();
  } catch (error) {
    console.error('Delete news category error', error);
    return res.status(500).json({ message: 'Nem sikerült törölni a kategóriát' });
  } finally {
    client.release();
  }
});

app.post('/api/news', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  const payload = req.body || {};

  try {
    const availability = ['hu', 'en', 'both'].includes(payload.languageAvailability) ? payload.languageAvailability : 'both';
    const needsHu = availability !== 'en';
    const needsEn = availability !== 'hu';
    const translations = normalizeNewsTranslations(payload.translations, availability);

    const slugHu = translations.hu.slug.trim() || null;
    const slugEn = translations.en.slug.trim() || null;

    if (needsHu && !slugHu) {
      return res.status(400).json({ message: 'A magyar slug megadása kötelező' });
    }

    if (needsEn && !slugEn) {
      return res.status(400).json({ message: 'Az angol slug megadása kötelező' });
    }

    await validateUniqueSlugs(client, { slugHu, slugEn });

    const { categoryId: resolvedCategoryId, categoryNameHu, categoryNameEn } = await resolveNewsCategory(
      client,
      payload,
    );

    const publishedAt = payload.published ? new Date().toISOString() : null;
    const newsDate = payload.date || new Date().toISOString().slice(0, 10);

    const insertResult = await client.query(
      `INSERT INTO news_articles
       (category, category_id, image_url, image_alt, sticky, news_date, published, published_at, slug_hu, slug_en, language_availability, translations)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        categoryNameHu,
        resolvedCategoryId,
        payload.imageUrl || null,
        payload.imageAlt || null,
        Boolean(payload.sticky),
        newsDate,
        Boolean(payload.published),
        publishedAt,
        slugHu,
        slugEn,
        availability,
        translations,
      ],
    );

    const saved = await fetchNewsWithCategory(client, insertResult.rows[0].id);
    const response = mapNewsRow({ ...saved, category_name_en: categoryNameEn, category_name_hu: categoryNameHu });
    return res.status(201).json(response);
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

  try {
    const availability = ['hu', 'en', 'both'].includes(payload.languageAvailability) ? payload.languageAvailability : 'both';
    const needsHu = availability !== 'en';
    const needsEn = availability !== 'hu';
    const translations = normalizeNewsTranslations(payload.translations, availability);

    const slugHu = translations.hu.slug.trim() || null;
    const slugEn = translations.en.slug.trim() || null;

    if (needsHu && !slugHu) {
      return res.status(400).json({ message: 'A magyar slug megadása kötelező' });
    }

    if (needsEn && !slugEn) {
      return res.status(400).json({ message: 'Az angol slug megadása kötelező' });
    }

    await validateUniqueSlugs(client, {
      slugHu,
      slugEn,
      excludeId: newsId,
    });

    const existing = await client.query('SELECT * FROM news_articles WHERE id = $1 LIMIT 1', [newsId]);
    if (!existing.rows.length) {
      return res.status(404).json({ message: 'A hír nem található' });
    }

    const current = existing.rows[0];
    const { categoryId: resolvedCategoryId, categoryNameHu, categoryNameEn } = await resolveNewsCategory(
      client,
      { ...payload, categoryId: payload.categoryId || current.category_id },
    );
    const publishedAt = payload.published
      ? current.published_at || new Date().toISOString()
      : null;
    const newsDate = payload.date || current.news_date || new Date().toISOString().slice(0, 10);

    const result = await client.query(
      `UPDATE news_articles
       SET category = $1,
           category_id = $2,
           image_url = $3,
           image_alt = $4,
           sticky = $5,
           news_date = $6,
           published = $7,
           published_at = $8,
           slug_hu = $9,
           slug_en = $10,
           language_availability = $11,
           translations = $12,
           updated_at = NOW()
       WHERE id = $13
       RETURNING id`,
      [
        categoryNameHu,
        resolvedCategoryId,
        payload.imageUrl || null,
        payload.imageAlt || null,
        Boolean(payload.sticky),
        newsDate,
        Boolean(payload.published),
        publishedAt,
        slugHu,
        slugEn,
        availability,
        translations,
        newsId,
      ],
    );

    const saved = await fetchNewsWithCategory(client, result.rows[0].id);
    const response = mapNewsRow({ ...saved, category_name_en: categoryNameEn, category_name_hu: categoryNameHu });
    return res.status(200).json(response);
  } catch (error) {
    console.error('Update news error', error);
    const status = error.status || 500;
    return res.status(status).json({ message: error.message || 'Nem sikerült frissíteni a hírt' });
  } finally {
    client.release();
  }
});

function encodeBunnyPath(pathname = '/') {
  const cleaned = pathname.replace(/^\/+|\/+$/g, '');
  if (!cleaned) return '';

  return cleaned
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function buildBunnyUrl(pathname = '/', { directory = false } = {}) {
  const trimmedHost = BUNNY_STORAGE_HOST.replace(/^https?:\/\//i, '').replace(/\/+$/g, '');
  const trimmedZone = BUNNY_STORAGE_ZONE.replace(/^\/+|\/+$/g, '');
  const encodedPath = encodeBunnyPath(pathname);
  const base = `https://${trimmedHost}/${encodeURIComponent(trimmedZone)}`;
  const suffix = directory ? '/' : '';

  return `${base}${encodedPath ? `/${encodedPath}` : ''}${suffix}`;
}

function buildBunnyCdnUrl(pathname = '/') {
  if (!BUNNY_CDN_HOSTNAME) return '';

  const cleanedHost = BUNNY_CDN_HOSTNAME.replace(/^https?:\/\//i, '').replace(/\/+$/g, '');
  const encodedPath = encodeBunnyPath(pathname);
  return encodedPath ? `https://${cleanedHost}/${encodedPath}` : `https://${cleanedHost}`;
}

const bunnyStorageRouter = express.Router();

bunnyStorageRouter.use(express.raw({ type: '*/*', limit: '200mb' }));

bunnyStorageRouter.use((req, res, next) => {
  if (!BUNNY_STORAGE_ZONE || !BUNNY_STORAGE_KEY) {
    return res.status(503).json({ message: 'A Bunny storage nincs konfigurálva.' });
  }

  return next();
});

bunnyStorageRouter.get('/', async (req, res) => {
  try {
    const pathname = typeof req.query.path === 'string' && req.query.path.trim() ? req.query.path.trim() : '/';
    const url = buildBunnyUrl(pathname, { directory: true });
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        AccessKey: BUNNY_STORAGE_KEY,
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ message: 'Nem sikerült betölteni a tárolót.' });
    }

    const payload = await response.json();
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Bunny list error', error);
    return res.status(500).json({ message: 'Nem sikerült lekérni a tároló tartalmát.' });
  }
});

bunnyStorageRouter.put('/', async (req, res) => {
  try {
    const pathname = typeof req.query.path === 'string' && req.query.path.trim() ? req.query.path.trim() : '/';
    const isDirectory = req.query.directory === 'true';
    const url = buildBunnyUrl(pathname, { directory: isDirectory });

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        AccessKey: BUNNY_STORAGE_KEY,
        'content-type': req.headers['content-type'] || 'application/octet-stream',
      },
      body: req.body,
    });

    if (!response.ok) {
      return res.status(response.status).json({ message: 'Nem sikerült létrehozni vagy feltölteni az elemet.' });
    }

    const payload = await response.text();
    return res.status(200).send(payload);
  } catch (error) {
    console.error('Bunny upload error', error);
    return res.status(500).json({ message: 'Nem sikerült menteni az elemet.' });
  }
});

bunnyStorageRouter.delete('/', async (req, res) => {
  try {
    const pathname = typeof req.query.path === 'string' && req.query.path.trim() ? req.query.path.trim() : '/';
    const isDirectory = req.query.directory === 'true';
    const url = buildBunnyUrl(pathname, { directory: isDirectory });

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        AccessKey: BUNNY_STORAGE_KEY,
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ message: 'Nem sikerült törölni az elemet.' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Bunny delete error', error);
    return res.status(500).json({ message: 'Nem sikerült törölni az elemet.' });
  }
});

app.use('/api/bunny/storage', bunnyStorageRouter);

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

app.get('/api/public/site-settings', async (_req, res) => {
  const settings = await getSiteSettings();
  return res.status(200).json(settings);
});

app.post('/api/admin/site-settings', authenticateRequest, async (req, res) => {
  const siteFavicon = sanitizeSeoText(req.body?.siteFavicon, '');
  const siteSearchTitle = sanitizeSeoText(req.body?.siteSearchTitle, DEFAULT_SITE_TITLE);
  const siteSearchDescription = sanitizeSeoText(req.body?.siteSearchDescription, DEFAULT_SITE_DESCRIPTION);

  if (siteSearchTitle.length > 120) {
    return res.status(400).json({ message: 'A Google találati cím legfeljebb 120 karakter lehet.' });
  }

  if (siteSearchDescription.length > 320) {
    return res.status(400).json({ message: 'A Google keresési leírás legfeljebb 320 karakter lehet.' });
  }

  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE site_settings
         SET site_favicon = $1,
             site_search_title = $2,
             site_search_description = $3,
             updated_at = NOW()
       WHERE id = 1`,
      [siteFavicon, siteSearchTitle, siteSearchDescription],
    );

    return res.status(200).json({ siteFavicon, siteSearchTitle, siteSearchDescription });
  } catch (error) {
    console.error('Save site settings error', error);
    return res.status(500).json({ message: 'Nem sikerült menteni a webhely beállításait' });
  } finally {
    client.release();
  }
});

app.use(express.static(DIST_PATH));

app.post('/api/newsletter/subscribe', async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Érvényes email cím megadása kötelező' });
    }

    const existing = await client.query('SELECT * FROM newsletter_subscribers WHERE email = $1', [email]);
    if (existing.rows.length) {
      if (existing.rows[0].verified) {
        return res.status(409).json({ message: 'Ezzel az email címmel már feliratkoztál.' });
      } else {
        // Resend verification?
        const token = crypto.randomBytes(32).toString('hex');
        await client.query('UPDATE newsletter_subscribers SET verification_token = $1, name = $2, created_at = NOW() WHERE email = $3', [token, name || existing.rows[0].name, email]);
        await sendNewsletterVerificationEmail(email, name || existing.rows[0].name, token);
        return res.status(200).json({ message: 'Már regisztráltál, de még nem erősítetted meg. Új megerősítő emailt küldtünk.' });
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    await client.query(
      'INSERT INTO newsletter_subscribers (email, name, verification_token) VALUES ($1, $2, $3)',
      [email, name, token]
    );

    await sendNewsletterVerificationEmail(email, name, token);

    return res.status(201).json({ message: 'Sikeres feliratkozás! Kérjük, erősítsd meg email címedet.' });
  } catch (error) {
    console.error('Newsletter subscribe error', error);
    return res.status(500).json({ message: 'Hiba történt a feliratkozás során.' });
  } finally {
    client.release();
  }
});

app.post('/api/newsletter/verify', async (req, res) => {
  const client = await pool.connect();
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Hiányzó token' });

    const result = await client.query(
      'UPDATE newsletter_subscribers SET verified = TRUE, verified_at = NOW(), verification_token = NULL WHERE verification_token = $1 RETURNING *',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Érvénytelen vagy lejárt token' });
    }

    return res.status(200).json({ message: 'Sikeres megerősítés! Köszönjük.' });
  } catch (error) {
    console.error('Newsletter verify error', error);
    return res.status(500).json({ message: 'Hiba történt a megerősítés során.' });
  } finally {
    client.release();
  }
});

app.get('/api/admin/newsletter/subscribers', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC');
    return res.status(200).json({ items: result.rows });
  } catch (error) {
    console.error('List subscribers error', error);
    return res.status(500).json({ message: 'Nem sikerült betölteni a feliratkozókat' });
  } finally {
    client.release();
  }
});

app.post('/api/admin/newsletter/send', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  try {
    const { subject, htmlContent, testEmail } = req.body;

    if (!subject || !htmlContent) {
      return res.status(400).json({ message: 'Tárgy és tartalom megadása kötelező' });
    }

    if (testEmail) {
      // Send test email ONLY
      await sendNewsletterEmailToSubscribers([{ email: testEmail, name: 'Test User', unsubscribe_token: 'test-token' }], `[TESZT] ${subject}`, htmlContent);
      return res.status(200).json({ message: 'Teszt email elküldve', stats: { sent: 1, failed: 0 } });
    }

    // Send to all verified
    const subscribers = await client.query('SELECT email, name, unsubscribe_token FROM newsletter_subscribers WHERE verified = TRUE');
    const stats = await sendNewsletterEmailToSubscribers(subscribers.rows, subject, htmlContent);

    return res.status(200).json({ message: 'Hírlevél kiküldve', stats });
  } catch (error) {
    console.error('Send newsletter error', error);
    return res.status(500).json({ message: 'Nem sikerült kiküldeni a hírlevelet' });
  } finally {
    client.release();
  }
});

// Team Members API
app.get('/api/team-members', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM team_members ORDER BY sort_order ASC');
    return res.status(200).json({ items: result.rows });
  } catch (error) {
    console.error('List team members error', error);
    return res.status(500).json({ message: 'Nem sikerült betölteni a tagokat' });
  } finally {
    client.release();
  }
});

app.post('/api/admin/team-members', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, position, email, section, image_url, sort_order } = req.body;
    const result = await client.query(
      `INSERT INTO team_members(name, position, email, section, image_url, sort_order)
       VALUES($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, position, email, section, image_url, sort_order || 0]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create team member error', error);
    return res.status(500).json({ message: 'Nem sikerült létrehozni a tagot' });
  } finally {
    client.release();
  }
});

app.put('/api/admin/team-members/:id', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { name, position, email, section, image_url, sort_order } = req.body;
    const result = await client.query(
      `UPDATE team_members SET name = $1, position = $2, email = $3, section = $4, image_url = $5, sort_order = $6, updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [name, position, email, section, image_url, sort_order, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Nem található' });
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Update team member error', error);
    return res.status(500).json({ message: 'Nem sikerült frissíteni a tagot' });
  } finally {
    client.release();
  }
});

app.delete('/api/admin/team-members/:id', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('DELETE FROM team_members WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Törölve' });
  } catch (error) {
    console.error('Delete team member error', error);
    return res.status(500).json({ message: 'Nem sikerült törölni a tagot' });
  } finally {
    client.release();
  }
});

app.post('/api/admin/team-members/reorder', authenticateRequest, async (req, res) => {
  const client = await pool.connect();
  try {
    const { items } = req.body; // Array of { id, sort_order }
    await client.query('BEGIN');
    for (const item of items) {
      await client.query('UPDATE team_members SET sort_order = $1 WHERE id = $2', [item.sort_order, item.id]);
    }
    await client.query('COMMIT');
    return res.status(200).json({ message: 'Sorrend frissítve' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reorder team members error', error);
    return res.status(500).json({ message: 'Nem sikerült frissíteni a sorrendet' });
  } finally {
    client.release();
  }
});

app.get('/favicon.ico', async (_req, res, next) => {
  try {
    const settings = await getSiteSettings();
    if (settings.siteFavicon) {
      return res.redirect(settings.siteFavicon);
    }
  } catch (error) {
    console.error('Favicon settings fetch error', error);
  }

  return next();
});

app.get('*', async (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'Nem található erőforrás' });
  }

  try {
    const html = await renderIndexHtmlWithSeo();
    return res.status(200).set('Content-Type', 'text/html').send(html);
  } catch (error) {
    console.error('Render index html error', error);
    return res.sendFile(path.join(DIST_PATH, 'index.html'));
  }
});

Promise.all([
  ensureAdminUser(),
  ensureAdminSecurityTables(),
  ensureAdminSessionsTable(),
  ensureLoginAttemptTable(),
  ensureNewsTables(),
  ensureProjectsTables(),
  ensureGalleryTables(),
  ensurePageContentTable(),
  ensureDocumentsTables(),
  ensureNewsletterTables(),
  ensureTeamMembersTable(),
  ensureSiteSettingsTable(),
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
