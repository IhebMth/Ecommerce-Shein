/* ============================================================
   api/_lib/db.js — Supabase client wrapper
   Nova-backend. Node 24. Supabase everywhere — no SQLite.

   Export: getDB() — returns singleton Supabase client

   Usage in any API route:
     const { getDB } = require('../_lib/db');
     const db = getDB();
     const { data, error } = await db.from('orders').select('*');
============================================================ */

import { createClient } from '@supabase/supabase-js';

let _client = null;

function getDB() {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_KEY. ' +
      'Make sure your .env.local file exists and vercel dev has loaded it.'
    );
  }

  _client = createClient(url, key, {
    auth: { persistSession: false }
  });

  return _client;
}

export default { getDB };