/* ============================================================
   api/_lib/auth.js — JWT verifier for admin routes
   Exports: function verifyAdmin(req)
   Throws an error if the request is not authenticated.
============================================================ */

const jwt = require('jsonwebtoken');

/* ══════════════════════════════════════════════════════════
   verifyAdmin(req)
   — Reads the HttpOnly cookie "nova_admin_token" from the request
   — Verifies it with JWT_SECRET
   — Returns the decoded payload { email, iat, exp }
   — Throws if missing, invalid, or expired
══════════════════════════════════════════════════════════ */

function verifyAdmin(req) {
  /* Parse cookies from the Cookie header */
  const cookieHeader = req.headers?.cookie || '';
  const cookies      = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );

  const token = cookies['nova_admin_token'];

  if (!token) {
    const err  = new Error('Not authenticated — no token');
    err.status = 401;
    throw err;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (e) {
    const err  = new Error('Not authenticated — invalid or expired token');
    err.status = 401;
    throw err;
  }
}

module.exports = { verifyAdmin };