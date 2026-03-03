/* ============================================================
   api/_lib/rate-limit.js — Upstash Redis rate limiter
   Nova-backend. Node 24.

   Export: async function rateLimit(ip, key, max, windowSec)

   Usage:
     const { rateLimit } = require('../_lib/rate-limit');
     const { allowed, remaining } = await rateLimit(ip, 'orders_post', 5, 3600);
     if (!allowed) return res.status(429).json({ error: 'Too many requests' });

   If Redis is not configured or fails — fails OPEN (allows request).
   This prevents Redis outages from blocking your entire store.
============================================================ */

/* ── In-memory fallback for local dev without Redis ── */
const _memStore = new Map();

async function rateLimit(ip, key, max, windowSec) {
  const redisUrl   = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  const redisKey = `rl:${key}:${ip}`;

  /* ── Use Upstash Redis if configured ── */
  if (redisUrl && redisToken) {
    try {
      const headers = {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json'
      };

      /* INCR the counter */
      const incrRes  = await fetch(`${redisUrl}/incr/${redisKey}`, { headers });
      const incrData = await incrRes.json();
      const count    = incrData.result;

      /* Set expiry only on the first request */
      if (count === 1) {
        await fetch(`${redisUrl}/expire/${redisKey}/${windowSec}`, { headers });
      }

      const remaining = Math.max(0, max - count);
      return { allowed: count <= max, remaining };

    } catch (err) {
      /* Redis failed — fail open so your store keeps working */
      console.error('[rate-limit] Redis error — failing open:', err.message);
      return { allowed: true, remaining: max };
    }
  }

  /* ── In-memory fallback (local dev / no Redis configured) ── */
  const now   = Date.now();
  const entry = _memStore.get(redisKey);

  if (!entry || now > entry.resetAt) {
    _memStore.set(redisKey, { count: 1, resetAt: now + windowSec * 1000 });
    return { allowed: true, remaining: max - 1 };
  }

  entry.count++;
  const remaining = Math.max(0, max - entry.count);
  return { allowed: entry.count <= max, remaining };
}

module.exports = { rateLimit };