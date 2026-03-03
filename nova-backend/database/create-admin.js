#!/usr/bin/env node
/* ============================================================
   database/create-admin.js — One-time admin account creator
   Nova-backend · Node 24 · ES modules

   Usage:
     node database/create-admin.js <email> <password>

   - Loads .env.local then .env via dotenv
   - Validates email format and password length (>= 8)
   - Hashes password with bcrypt (cost 10)
   - Inserts into admin_users table via Supabase
   - Handles duplicate email (Postgres code 23505) gracefully
============================================================ */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path              from 'path';

/* dotenv — load .env.local first, then .env as fallback */
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

/* Resolve paths relative to the project root (one level up from /database) */
const root = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(root, '.env.local') });
dotenv.config({ path: path.join(root, '.env') });      // fallback / non-secret defaults

import bcrypt            from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

/* ── Validate CLI args ──────────────────────────────────────── */

const [,, email, password] = process.argv;

if (!email || !password) {
  console.error('\n  Usage:  node database/create-admin.js <email> <password>\n');
  process.exit(1);
}

/* Email format */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!EMAIL_RE.test(email)) {
  console.error(`\n  ✗  Invalid email format: "${email}"\n`);
  process.exit(1);
}

/* Password length */
if (password.length < 8) {
  console.error('\n  ✗  Password must be at least 8 characters long.\n');
  process.exit(1);
}

/* ── Validate env vars ──────────────────────────────────────── */

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    '\n  ✗  Missing env vars: SUPABASE_URL and/or SUPABASE_SERVICE_KEY\n' +
    '     Make sure .env.local exists in the project root.\n'
  );
  process.exit(1);
}

/* ── Main ───────────────────────────────────────────────────── */

async function main() {
  console.log(`\n  NOVA — Admin Account Creator`);
  console.log(`  ────────────────────────────`);
  console.log(`  Email   : ${email}`);
  console.log(`  Hashing password …\n`);

  /* Hash */
  let passwordHash;

  try {
    passwordHash = await bcrypt.hash(password, 10);
  } catch (err) {
    console.error('  ✗  bcrypt error:', err.message);
    process.exit(1);
  }

  /* Connect */
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  /* Insert */
  const { error } = await db
    .from('admin_users')
    .insert({ email: email.trim().toLowerCase(), password_hash: passwordHash });

  if (error) {
    /* Duplicate email — Postgres unique violation */
    if (error.code === '23505') {
      console.error(`  ✗  An admin account for "${email}" already exists.\n`);
      process.exit(1);
    }

    console.error('  ✗  Supabase error:', error.message);
    process.exit(1);
  }

  console.log(`  ✓  Admin account created successfully for: ${email}\n`);
  console.log(`  You can now log in at /admin/login\n`);
}

main().catch((err) => {
  console.error('  ✗  Unexpected error:', err.message);
  process.exit(1);
});