/* ============================================================
   api/auth/login.js — POST /api/auth/login
   Checks admin credentials, issues JWT cookie on success.
   Rate limited: 3 failed attempts = 15 minute lockout.
============================================================ */

import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { query } from '../_lib/db';
import { rateLimit } from '../_lib/rate-limit';

export default async function handler(req, res) {

  /* ── CORS preflight ── */
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  /* ── Get requester IP ── */
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim()
          || req.socket?.remoteAddress
          || 'unknown';

  /* ── Rate limit: 3 attempts per 15 minutes per IP ── */
  const { allowed, remaining } = await rateLimit(ip, 'admin_login', 3, 900);

  if (!allowed) {
    const retryAfter = 15; /* minutes */
    return res.status(429).json({
      error:      'Too many failed attempts. Please try again later.',
      retryAfter: retryAfter
    });
  }

  /* ── Parse body ── */
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    /* ── Look up admin user ── */
    const rows = await query(
      'SELECT * FROM admin_users WHERE email = $1 LIMIT 1',
      [email.toLowerCase().trim()]
    );

    const admin = rows[0];

    /* ── Check password (use same generic message for wrong email OR password) ── */
    const validPassword = admin
      ? await compare(password, admin.password_hash)
      : false;

    if (!admin || !validPassword) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    /* ── Sign JWT ── */
    const token = sign(
      { email: admin.email, id: admin.id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    /* ── Set HttpOnly cookie ── */
    res.setHeader('Set-Cookie', [
      `nova_admin_token=${token}; HttpOnly; Path=/; Max-Age=${8 * 3600}; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    ]);

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('[login] Error:', err.message);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
};