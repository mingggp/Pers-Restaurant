/**
 * Run schema.sql against the database.
 * Usage: node src/db/migrate.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./index');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  console.log('[migrate] Running schema.sql …');
  await pool.query(sql);
  console.log('[migrate] ✓ Schema applied');
  await pool.end();
}

migrate().catch((err) => {
  console.error('[migrate] ✗ Failed:', err.message);
  process.exit(1);
});
