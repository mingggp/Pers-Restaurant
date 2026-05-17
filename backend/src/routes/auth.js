/**
 * Auth routes
 *
 * Customer (LINE Login):
 *   GET  /auth/line                → redirect to LINE OAuth
 *   GET  /auth/line/callback       → exchange code → JWT
 *   POST /auth/line/verify         → verify LINE ID token (for LIFF flow)
 *
 * Staff (username + password):
 *   POST /auth/staff/login         → returns JWT
 *   GET  /auth/me                  → returns current user/staff info
 */

const router = require('express').Router();
const axios  = require('axios');
const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const db     = require('../db');
const config = require('../config');
const { requireAuth }   = require('../middleware/auth');
const { asyncHandler }  = require('../middleware/errorHandler');

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

function signToken(payload, expiresIn) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
}

// ──────────────────────────────────────────────────────────
// LINE Login — Web flow
// ──────────────────────────────────────────────────────────

/**
 * Redirect the browser to LINE's OAuth consent page.
 * The frontend should navigate to this URL.
 *
 * Query params (optional):
 *   table  — table number to embed in the state so we can redirect back
 */
router.get('/line', (req, res) => {
  if (!config.line.channelId) {
    return res.status(503).json({ error: 'LINE Login is not configured. Set LINE_CHANNEL_ID in .env' });
  }

  const state = Buffer.from(
    JSON.stringify({ table: req.query.table || null, nonce: uuidv4() })
  ).toString('base64url');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     config.line.channelId,
    redirect_uri:  config.line.redirectUri,
    state,
    scope:         'profile openid',
  });

  res.redirect(`https://access.line.me/oauth2/v2.1/authorize?${params}`);
});

/**
 * LINE OAuth callback — exchange code for tokens, upsert user, return JWT.
 */
router.get('/line/callback', asyncHandler(async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.redirect(`/?auth_error=${encodeURIComponent(error_description || error)}`);
  }
  if (!code) {
    return res.status(400).json({ error: 'Missing code parameter' });
  }

  // 1. Exchange code for access + ID token
  const tokenRes = await axios.post(
    'https://api.line.me/oauth2/v2.1/token',
    new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  config.line.redirectUri,
      client_id:     config.line.channelId,
      client_secret: config.line.channelSecret,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { access_token, id_token } = tokenRes.data;

  // 2. Verify ID token with LINE
  const verifyRes = await axios.post(
    'https://api.line.me/oauth2/v2.1/verify',
    new URLSearchParams({
      id_token,
      client_id: config.line.channelId,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { sub: lineUserId, name, picture } = verifyRes.data;

  // 3. Upsert user in DB
  const { rows } = await db.query(
    `INSERT INTO users (line_user_id, display_name, picture_url)
     VALUES ($1, $2, $3)
     ON CONFLICT (line_user_id) DO UPDATE
       SET display_name = EXCLUDED.display_name,
           picture_url  = EXCLUDED.picture_url,
           updated_at   = NOW()
     RETURNING id, display_name, picture_url`,
    [lineUserId, name, picture || null]
  );

  const user = rows[0];

  // 4. Decode state to extract table number
  let tableId = null;
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
    tableId = decoded.table;
  } catch { /* ignore */ }

  // 5. Issue JWT
  const token = signToken(
    { sub: user.id, lineUserId, displayName: user.display_name, role: 'customer' },
    config.jwt.expiresIn
  );

  // 6. Redirect back to frontend with token (LIFF or plain HTML)
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontendUrl}/?token=${token}${tableId ? `&table=${tableId}` : ''}`);
}));

/**
 * LIFF flow — frontend already has the LINE ID token, just verify it and return a JWT.
 * Body: { id_token: string }
 */
router.post('/line/verify', asyncHandler(async (req, res) => {
  const { id_token } = req.body;
  if (!id_token) return res.status(400).json({ error: 'id_token required' });

  const verifyRes = await axios.post(
    'https://api.line.me/oauth2/v2.1/verify',
    new URLSearchParams({ id_token, client_id: config.line.channelId }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { sub: lineUserId, name, picture } = verifyRes.data;

  const { rows } = await db.query(
    `INSERT INTO users (line_user_id, display_name, picture_url)
     VALUES ($1, $2, $3)
     ON CONFLICT (line_user_id) DO UPDATE
       SET display_name = EXCLUDED.display_name,
           picture_url  = EXCLUDED.picture_url,
           updated_at   = NOW()
     RETURNING id, display_name, picture_url`,
    [lineUserId, name, picture || null]
  );

  const user = rows[0];
  const token = signToken(
    { sub: user.id, lineUserId, displayName: user.display_name, role: 'customer' },
    config.jwt.expiresIn
  );

  res.json({ token, user: { id: user.id, displayName: user.display_name, pictureUrl: user.picture_url } });
}));

// ──────────────────────────────────────────────────────────
// Staff login (username + password)
// ──────────────────────────────────────────────────────────

router.post('/staff/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }

  const { rows } = await db.query(
    `SELECT id, username, password_hash, display_name, role, active
     FROM staff WHERE username = $1`,
    [username]
  );

  const staff = rows[0];
  if (!staff || !staff.active) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, staff.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken(
    { sub: staff.id, username: staff.username, displayName: staff.display_name, role: staff.role },
    config.jwt.staffExpiresIn
  );

  res.json({
    token,
    staff: {
      id:          staff.id,
      username:    staff.username,
      displayName: staff.display_name,
      role:        staff.role,
    },
  });
}));

// ──────────────────────────────────────────────────────────
// GET /auth/me — return current identity
// ──────────────────────────────────────────────────────────

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const { sub, role } = req.user;

  if (role === 'customer') {
    const { rows } = await db.query(
      'SELECT id, display_name, picture_url, created_at FROM users WHERE id = $1',
      [sub]
    );
    return res.json({ role, user: rows[0] || null });
  }

  // staff
  const { rows } = await db.query(
    'SELECT id, username, display_name, role FROM staff WHERE id = $1',
    [sub]
  );
  res.json({ role, staff: rows[0] || null });
}));

module.exports = router;
