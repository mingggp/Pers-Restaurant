/**
 * Load seed.sql into the database.
 * Usage: node src/db/seed.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./index');

async function seed() {
  const sql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
  console.log('[seed] Inserting seed data …');
  await pool.query(sql);
  console.log('[seed] ✓ Seed data loaded');
  await pool.end();
}

seed().catch((err) => {
  console.error('[seed] ✗ Failed:', err.message);
  process.exit(1);
});
