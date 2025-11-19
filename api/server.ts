import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const {
  DATABASE_URL,
  JWT_SECRET,
  CLIENT_URL = "http://localhost:5173",
  SESSION_COOKIE_NAME = "admin_session",
} = process.env;

if (!DATABASE_URL) {
  console.warn("DATABASE_URL is not set. Admin authentication endpoints will fail until it is configured.");
}

if (!JWT_SECRET) {
  console.warn("JWT_SECRET is not set. Tokens will not be issued without it.");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
});

const app = express();
const isProduction = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

interface AdminUser {
  id: string;
  email: string;
  role?: string;
}

function signToken(user: AdminUser) {
  if (!JWT_SECRET) {
    throw new Error("JWT secret is not configured");
  }

  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: "1h",
  });
}

function setSessionCookie(res: express.Response, token: string) {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 1000 * 60 * 60, // 1 hour
    path: "/",
  });
}

function clearSessionCookie(res: express.Response) {
  res.cookie(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    expires: new Date(0),
    path: "/",
  });
}

async function findAdminByEmail(email: string): Promise<AdminUser & { password_hash?: string } | null> {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query<AdminUser & { password_hash?: string }>(
      "SELECT id, email, password_hash, role FROM admin_users WHERE email = $1 LIMIT 1",
      [email]
    );
    return rows[0] ?? null;
  } finally {
    client.release();
  }
}

async function getUserFromToken(token?: string): Promise<AdminUser | null> {
  if (!token || !JWT_SECRET) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AdminUser;
    return { id: payload.id, email: payload.email, role: payload.role };
  } catch (error) {
    console.error("Invalid token", error);
    return null;
  }
}

app.post("/api/admin/auth/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ message: "Hiányzó bejelentkezési adatok" });
  }

  try {
    const user = await findAdminByEmail(email);

    if (!user?.password_hash) {
      return res.status(401).json({ message: "Hibás e-mail vagy jelszó" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Hibás e-mail vagy jelszó" });
    }

    if (user.role && user.role !== "admin") {
      return res.status(403).json({ message: "Nincs admin jogosultság" });
    }

    const token = signToken(user);
    setSessionCookie(res, token);

    return res.json({ user: { id: user.id, email: user.email, role: user.role }, token });
  } catch (error) {
    console.error("Login error", error);
    return res.status(500).json({ message: "Váratlan hiba történt" });
  }
});

app.get("/api/admin/auth/session", async (req, res) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    const user = await getUserFromToken(token);

    if (!user) {
      clearSessionCookie(res);
      return res.status(401).json({ message: "A munkamenet lejárt" });
    }

    if (token) {
      setSessionCookie(res, token);
    }

    return res.json({ user });
  } catch (error) {
    console.error("Session check error", error);
    return res.status(500).json({ message: "Nem sikerült ellenőrizni a munkamenetet" });
  }
});

app.post("/api/admin/auth/logout", async (_req, res) => {
  clearSessionCookie(res);
  return res.json({ message: "Kijelentkezve" });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 8788;
app.listen(PORT, () => {
  console.log(`Admin auth server listening on port ${PORT}`);
});
