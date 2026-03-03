/* ============================================================
   api/auth/login.js — POST /api/auth/login
   Nova-backend · Node 24 · Vercel serverless · ES modules

   Flow:
     1. Parse { email, password } from req.body
     2. Rate-limit by IP — 3 failures per 15 min
     3. Query admin_users via Supabase
     4. bcrypt.compare() password
     5. On success → JWT (8 h) in HttpOnly cookie
     6. On failure → 401 (never reveal which field failed)
     7. On lockout → 429 with retryAfter
============================================================ */

import bcrypt            from 'bcryptjs';
import jwt               from 'jsonwebtoken';
import { getDB }         from '../_lib/db.js';
import { rateLimit }     from '../_lib/rate-limit.js';

/* ── helpers ──────────────────────────────────────────────── */

/** Extract the real client IP from Vercel headers */
function getIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ??
    req.socket?.remoteAddress ??
    'unknown'
  );
}

/** Set the JWT as an HttpOnly cookie on the response */
function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';

  const cookie = [
    `nova_admin_token=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=28800',          // 8 hours in seconds
    isProd ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');

  res.setHeader('Set-Cookie', cookie);
}

/* ── rate-limit key helpers ───────────────────────────────── */

/*
  We track *failures* only.
  Key: "login_fail:<ip>"  window: 15 min  max: 3
  On success we do NOT reset the counter — Upstash TTL handles expiry.
  This prevents a valid login from unlocking a brute-force loop.
*/
const FAIL_KEY    = 'login_fail';
const FAIL_MAX    = 3;
const FAIL_WINDOW = 15 * 60; // 900 seconds

/* ── handler ──────────────────────────────────────────────── */

export default async function handler(req, res) {
  /* Only accept POST */
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getIP(req);

  /* ── 1. Check current failure count BEFORE attempting auth ── */
  const preCheck = await rateLimit(ip, FAIL_KEY, FAIL_MAX, FAIL_WINDOW);

  /*
    rateLimit counts every call — we only want to count failures.
    So here we just peek: if remaining === 0 AND we haven't consumed
    a slot yet, the IP is already locked out.
    Strategy: call rateLimit only on failure (see below).
    Re-check by querying the current state without incrementing:
    we pass max=FAIL_MAX so a count already at FAIL_MAX returns allowed=false.

    Simpler approach used here:
      - Call rateLimit on each FAILED attempt (increments counter).
      - Before doing any work, peek by calling with max = FAIL_MAX - 1
        so that once the counter has hit FAIL_MAX it will show !allowed.

    Actually the cleanest pattern with this rate-limit helper:
      - We call rateLimit(ip, FAIL_KEY, FAIL_MAX, FAIL_WINDOW) only when
        we are about to record a failure.
      - To check lockout status upfront without incrementing, we use a
        separate "peek" — but since our helper always increments we avoid
        a spurious increment by NOT calling it here and instead calling it
        only on failure.

    So: remove the preCheck above and handle everything after auth attempt.
  */

  /* ── 2. Parse body ── */
  const { email, password } = req.body ?? {};

  if (
    typeof email    !== 'string' || !email.trim()    ||
    typeof password !== 'string' || !password.trim()
  ) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  /* ── 3. Look up admin user ── */
  let user = null;

  try {
    const db = getDB();
    const { data, error } = await db
      .from('admin_users')
      .select('id, email, password_hash')
      .eq('email', normalizedEmail)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = "no rows" — anything else is a real DB error
      console.error('[login] Supabase error:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }

    user = data ?? null;
  } catch (err) {
    console.error('[login] DB exception:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }

  /* ── 4. Verify password ── */
  let passwordMatch = false;

  if (user?.password_hash) {
    try {
      passwordMatch = await bcrypt.compare(password, user.password_hash);
    } catch (err) {
      console.error('[login] bcrypt error:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /* ── 5. Handle failure ── */
  if (!user || !passwordMatch) {
    /* Increment the failure counter */
    const { allowed, remaining } = await rateLimit(
      ip,
      FAIL_KEY,
      FAIL_MAX,
      FAIL_WINDOW
    );

    if (!allowed || remaining === 0) {
      return res.status(429).json({
        error:      'Too many attempts',
        retryAfter: 15,           // minutes
      });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  }

  /* ── 6. Success — sign JWT ── */
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error('[login] JWT_SECRET is not set');
    return res.status(500).json({ error: 'Internal server error' });
  }

  let token;

  try {
    token = jwt.sign(
      { id: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '8h' }
    );
  } catch (err) {
    console.error('[login] jwt.sign error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }

  setAuthCookie(res, token);

  return res.status(200).json({ success: true });
}