/* ============================================================
   api/_lib/auth.js — JWT verifier for admin routes
   Nova-backend. Node 24.

   Export: function verifyAdmin(req)

   Usage in any admin API route:
     const { verifyAdmin } = require('../_lib/auth');
     try {
       const admin = verifyAdmin(req);
       // admin.email, admin.id available
     } catch (err) {
       return res.status(err.status || 401).json({ error: err.message });
     }
============================================================ */

const jwt = require('jsonwebtoken');

function verifyAdmin(req) {
  /* ── Parse cookies from the Cookie header ── */
  const cookieHeader = req.headers?.cookie || '';

  const cookies = Object.fromEntries(
    cookieHeader
      .split(';')
      .map(c => c.trim())
      .filter(Boolean)
      .map(c => {
        const idx = c.indexOf('=');
        return idx === -1
          ? [c, '']
          : [c.slice(0, idx).trim(), c.slice(idx + 1).trim()];
      })
  );

  const token = cookies['nova_admin_token'];

  if (!token) {
    const err    = new Error('Not authenticated — please log in.');
    err.status   = 401;
    throw err;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err  = new Error('Server misconfiguration — JWT_SECRET not set.');
    err.status = 500;
    throw err;
  }

  try {
    const decoded = jwt.verify(token, secret);
    return decoded; /* { email, id, iat, exp } */
  } catch (e) {
    const isExpired = e.name === 'TokenExpiredError';
    const err       = new Error(
      isExpired ? 'Session expired — please log in again.' : 'Invalid token — please log in.'
    );
    err.status = 401;
    throw err;
  }
}

module.exports = { verifyAdmin };