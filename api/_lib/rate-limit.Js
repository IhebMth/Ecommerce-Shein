/* ============================================================
   api/_lib/rate-limit.js — Rate limiter using Upstash Redis
   Falls back to in-memory limiting if Redis is not configured.
   Exports: async function rateLimit(ip, key, max, windowSec)
============================================================ */

/* ── In-memory fallback store (dev / no Redis) ── */
const _memStore = new Map();

/* ══════════════════════════════════════════════════════════
   rateLimit(ip, key, max, windowSec)

   ip        — the requester's IP address
   key       — a label for the endpoint e.g. 'orders_post'
   max       — maximum requests allowed in the window
   windowSec — time window in seconds

   Returns: { allowed: boolean, remaining: number }

   Example:
     const { allowed } = await rateLimit(ip, 'orders_post', 5, 3600)
     if (!allowed) return res.status(429).json({ error: 'Too many requests' })
══════════════════════════════════════════════════════════ */

async function rateLimit(ip, key, max, windowSec) {
  const redisUrl   = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  const redisKey = `rl:${key}:${ip}`;

  /* ── Use Upstash Redis if configured ── */
  if (redisUrl && redisToken) {
    try {
      /* INCR the key */
      const incrRes = await fetch(`${redisUrl}/incr/${redisKey}`, {
        headers: { Authorization: `Bearer ${redisToken}` }
      });
      const incrData = await incrRes.json();
      const count    = incrData.result;

      /* On first request, set the expiry */
      if (count === 1) {
        await fetch(`${redisUrl}/expire/${redisKey}/${windowSec}`, {
          headers: { Authorization: `Bearer ${redisToken}` }
        });
      }

      const remaining = Math.max(0, max - count);
      return { allowed: count <= max, remaining };

    } catch (err) {
      /* If Redis fails, allow the request rather than blocking everyone */
      console.error('[rate-limit] Redis error:', err.message);
      return { allowed: true, remaining: max };
    }
  }

  /* ── In-memory fallback (local dev) ── */
  const now    = Date.now();
  const entry  = _memStore.get(redisKey);

  if (!entry || now > entry.resetAt) {
    _memStore.set(redisKey, { count: 1, resetAt: now + windowSec * 1000 });
    return { allowed: true, remaining: max - 1 };
  }

  entry.count++;
  const remaining = Math.max(0, max - entry.count);
  return { allowed: entry.count <= max, remaining };
}

module.exports = { rateLimit };