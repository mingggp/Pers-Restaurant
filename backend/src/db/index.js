const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

/**
 * Run a parameterised query.
 * @param {string} text
 * @param {any[]} [params]
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'production' && duration > 200) {
    console.warn(`[DB] Slow query (${duration}ms):`, text.slice(0, 80));
  }
  return result;
}

/**
 * Get a client for manual transaction control.
 * Remember to call client.release() in finally.
 */
async function getClient() {
  return pool.connect();
}

module.exports = { query, getClient, pool };
