/* ============================================================
   api/_lib/db.js — Database connector
   SQLite for local development, Supabase for production
   Exports: async function query(sql, params)
============================================================ */

let _db   = null;   // SQLite instance (dev only)
let _supa = null;   // Supabase client (prod only)

const isProd = process.env.NODE_ENV === 'production';

/* ── Init Supabase (production) ── */
function getSupabase() {
  if (_supa) return _supa;
  const { createClient } = require('@supabase/supabase-js');
  _supa = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  return _supa;
}

/* ── Init SQLite (local dev) ── */
function getSQLite() {
  if (_db) return _db;
  const Database = require('better-sqlite3');
  const path     = require('path');
  const dbPath   = path.join(process.cwd(), 'database', 'nova.db');
  _db = new Database(dbPath);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  return _db;
}

/* ══════════════════════════════════════════════════════════
   MAIN EXPORT — query(sql, params)
   Works identically whether running locally or in production.

   Usage:
     const rows = await query('SELECT * FROM orders WHERE id = $1', [id])
     const rows = await query('INSERT INTO orders (...) VALUES ($1,$2) RETURNING *', [a, b])
══════════════════════════════════════════════════════════ */

async function query(sql, params = []) {

  /* ── PRODUCTION: Supabase (PostgreSQL) ── */
  if (isProd) {
    const supabase = getSupabase();

    /* Use Supabase's rpc for raw SQL */
    const { data, error } = await supabase.rpc('run_query', {
      query_text:   sql,
      query_params: params
    });

    if (error) throw new Error(error.message);
    return data || [];
  }

  /* ── DEVELOPMENT: SQLite ── */
  const db          = getSQLite();
  const isWrite     = /^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i.test(sql);
  /* Convert $1,$2 placeholders → ? for SQLite */
  const sqliteSql   = sql.replace(/\$\d+/g, '?');

  if (isWrite) {
    const stmt   = db.prepare(sqliteSql);
    const result = stmt.run(...params);
    /* Mimic RETURNING * — re-select the inserted/updated row */
    if (/RETURNING/i.test(sql)) {
      const table   = sql.match(/INTO\s+(\w+)/i)?.[1] ||
                      sql.match(/UPDATE\s+(\w+)/i)?.[1];
      const idRow   = db.prepare(`SELECT * FROM ${table} WHERE rowid = ?`)
                        .get(result.lastInsertRowid);
      return idRow ? [idRow] : [];
    }
    return [];
  } else {
    return db.prepare(sqliteSql).all(...params);
  }
}

module.exports = { query };