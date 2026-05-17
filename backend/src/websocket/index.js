/**
 * WebSocket server for real-time updates.
 *
 * Clients connect to ws://localhost:4000/ws
 * After connecting they should send an auth message:
 *   { type: 'AUTH', token: '<jwt>' }
 *
 * Server events pushed to clients:
 *   { type: 'NEW_ORDER',      order: {...} }
 *   { type: 'ORDER_STATUS',   orderId, status }
 *   { type: 'ITEM_DONE',      orderId, itemId, isDone }
 *   { type: 'PING' }          ← keepalive every 30s
 */

const { WebSocketServer, WebSocket } = require('ws');
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Attach a WebSocket server to an existing HTTP server.
 * Returns a `broadcast(payload)` function that app routes can call.
 */
function attachWebSocket(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Map of client → { role, sub, isAlive }
  const clients = new Map();

  // ── Auth helper ──────────────────────────────────────────
  function tryAuth(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch {
      return null;
    }
  }

  // ── Keepalive ping / pong ────────────────────────────────
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const meta = clients.get(ws);
      if (!meta) return;
      if (!meta.isAlive) {
        ws.terminate();
        clients.delete(ws);
        return;
      }
      meta.isAlive = false;
      clients.set(ws, meta);
      ws.ping();
    });
  }, 30_000);

  wss.on('close', () => clearInterval(pingInterval));

  // ── Connection handler ───────────────────────────────────
  wss.on('connection', (ws, req) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`[ws] Client connected from ${ip}`);

    clients.set(ws, { role: null, sub: null, isAlive: true });

    ws.on('pong', () => {
      const meta = clients.get(ws);
      if (meta) { meta.isAlive = true; clients.set(ws, meta); }
    });

    ws.on('message', (data) => {
      let msg;
      try { msg = JSON.parse(data); } catch { return; }

      if (msg.type === 'AUTH' && msg.token) {
        const decoded = tryAuth(msg.token);
        if (decoded) {
          clients.set(ws, { role: decoded.role, sub: decoded.sub, isAlive: true });
          send(ws, { type: 'AUTH_OK', role: decoded.role });
          console.log(`[ws] Authenticated: ${decoded.role} (${decoded.sub})`);
        } else {
          send(ws, { type: 'AUTH_ERROR', message: 'Invalid token' });
        }
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log('[ws] Client disconnected');
    });

    ws.on('error', (err) => {
      console.error('[ws] Error:', err.message);
    });

    // Send a welcome ping so client knows connection is live
    send(ws, { type: 'CONNECTED' });
  });

  // ── Helper: safe send ────────────────────────────────────
  function send(ws, payload) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  /**
   * Broadcast a message to all authenticated clients.
   * Pass `roles` to restrict to specific roles (e.g. kitchen-only).
   *
   * @param {object} payload
   * @param {string[]} [roles]  — if omitted, send to all authenticated
   */
  function broadcast(payload, roles) {
    const data = JSON.stringify(payload);
    wss.clients.forEach((ws) => {
      const meta = clients.get(ws);
      if (!meta || !meta.role) return; // not authenticated
      if (roles && !roles.includes(meta.role)) return;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  console.log('[ws] WebSocket server attached at /ws');
  return broadcast;
}

module.exports = { attachWebSocket };
