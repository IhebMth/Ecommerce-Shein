/* ============================================================
   database/create-admin.js — One-time admin account creator
   
   Usage:
     node database/create-admin.js your@email.com YourPassword

   Run this ONCE after setting up your database.
   Creates a hashed admin account in the admin_users table.
============================================================ */

const bcrypt = require('bcrypt');
const path   = require('path');

/* ── Load .env for local dev ── */
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function createAdmin() {
  const email    = process.argv[2];
  const password = process.argv[3];

  /* ── Validate arguments ── */
  if (!email || !password) {
    console.error('Usage: node database/create-admin.js your@email.com YourPassword');
    process.exit(1);
  }

  if (!email.includes('@')) {
    console.error('Error: Please provide a valid email address.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters.');
    process.exit(1);
  }

  try {
    /* ── Hash password ── */
    console.log('Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);

    const isProd = process.env.NODE_ENV === 'production' ||
                   (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);

    if (isProd) {
      /* ── Production: insert into Supabase ── */
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );

      const { error } = await supabase
        .from('admin_users')
        .insert({ email: email.toLowerCase().trim(), password_hash: passwordHash });

      if (error) {
        if (error.code === '23505') {
          console.error(`Error: Admin account already exists for ${email}`);
        } else {
          console.error('Supabase error:', error.message);
        }
        process.exit(1);
      }

    } else {
      /* ── Local dev: insert into SQLite ── */
      const Database = require('better-sqlite3');
      const dbPath   = path.join(__dirname, 'nova.db');
      const db       = new Database(dbPath);

      db.pragma('foreign_keys = ON');

      /* Create table if it doesn't exist yet */
      db.exec(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id            INTEGER PRIMARY KEY AUTOINCREMENT,
          email         TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at    TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);

      try {
        db.prepare(
          'INSERT INTO admin_users (email, password_hash) VALUES (?, ?)'
        ).run(email.toLowerCase().trim(), passwordHash);
      } catch (e) {
        if (e.message.includes('UNIQUE')) {
          console.error(`Error: Admin account already exists for ${email}`);
          process.exit(1);
        }
        throw e;
      }

      db.close();
    }

    console.log(`\n✅ Admin account created successfully!`);
    console.log(`   Email:    ${email.toLowerCase().trim()}`);
    console.log(`   Password: (hashed and stored securely)`);
    console.log(`\n   You can now log in at /admin/\n`);

  } catch (err) {
    console.error('Unexpected error:', err.message);
    process.exit(1);
  }
}

createAdmin();