/**
 * Owner console routes (owner only)
 *
 * GET  /owner/dashboard          → KPIs + recent orders
 * GET  /owner/orders             → paginated order list with filters
 * GET  /owner/reports            → revenue reports (daily/weekly/monthly)
 * GET  /owner/tables             → table status
 * PATCH /owner/tables/:id        → update table status
 * GET  /owner/staff              → staff list
 * POST /owner/staff              → add staff
 * PUT  /owner/staff/:id          → edit staff
 * DELETE /owner/staff/:id        → deactivate staff
 * GET  /owner/audit              → audit log
 */

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// All owner routes require owner role
router.use(requireRole('owner'));

// ──────────────────────────────────────────────────────────
// GET /owner/dashboard
// ──────────────────────────────────────────────────────────
router.get('/dashboard', asyncHandler(async (req, res) => {
  const [kpiRes, topItemsRes, hourlyRes, pendingRes] = await Promise.all([
    // KPIs for today
    db.query(`
      SELECT
        COALESCE(SUM(total) FILTER (WHERE status = 'served'), 0)       AS revenue_today,
        COUNT(*)         FILTER (WHERE status != 'cancelled')           AS orders_today,
        COALESCE(AVG(total) FILTER (WHERE status = 'served'), 0)       AS avg_order,
        COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)     AS unique_customers
      FROM orders
      WHERE created_at >= DATE_TRUNC('day', NOW())
    `),
    // Top 10 menu items by quantity (all time)
    db.query(`
      SELECT m.name, m.image_url, SUM(oi.quantity) AS total_qty, SUM(oi.unit_price * oi.quantity) AS revenue
      FROM   order_items oi
      JOIN   menu_items m ON m.id = oi.menu_item_id
      JOIN   orders o     ON o.id = oi.order_id
      WHERE  o.status = 'served'
      GROUP BY m.id, m.name, m.image_url
      ORDER BY total_qty DESC
      LIMIT 10
    `),
    // Hourly breakdown for today
    db.query(`
      SELECT EXTRACT(HOUR FROM created_at) AS hour,
             COUNT(*)                       AS orders,
             COALESCE(SUM(total), 0)        AS revenue
      FROM   orders
      WHERE  created_at >= DATE_TRUNC('day', NOW())
        AND  status != 'cancelled'
      GROUP BY hour
      ORDER BY hour
    `),
    // Pending / active orders
    db.query(`
      SELECT o.id, o.order_number, o.table_id, o.status, o.total, o.created_at
      FROM   orders o
      WHERE  o.status IN ('pending','paid','cooking','ready')
      ORDER BY o.created_at ASC
      LIMIT 20
    `),
  ]);

  res.json({
    kpi:        kpiRes.rows[0],
    topItems:   topItemsRes.rows,
    hourly:     hourlyRes.rows,
    pending:    pendingRes.rows,
  });
}));

// ──────────────────────────────────────────────────────────
// GET /owner/orders — paginated order list
// ──────────────────────────────────────────────────────────
router.get('/orders', asyncHandler(async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit  = Math.min(100, parseInt(req.query.limit || '20', 10));
  const offset = (page - 1) * limit;
  const { status, search, from, to } = req.query;

  let where = 'WHERE 1=1';
  const params = [];

  if (status) {
    params.push(status);
    where += ` AND o.status = $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    where += ` AND (o.order_number::text ILIKE $${params.length} OR u.display_name ILIKE $${params.length})`;
  }
  if (from) {
    params.push(from);
    where += ` AND o.created_at >= $${params.length}`;
  }
  if (to) {
    params.push(to);
    where += ` AND o.created_at <= $${params.length}`;
  }

  params.push(limit, offset);

  const { rows } = await db.query(
    `SELECT o.id, o.order_number, o.table_id, o.status, o.total, o.created_at,
            u.display_name AS user_name,
            COUNT(oi.id) AS item_count
     FROM   orders o
     LEFT JOIN users u       ON u.id = o.user_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     ${where}
     GROUP BY o.id, u.display_name
     ORDER BY o.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  // Total count for pagination
  const countParams = params.slice(0, -2);
  const { rows: countRows } = await db.query(
    `SELECT COUNT(DISTINCT o.id) AS total
     FROM   orders o
     LEFT JOIN users u ON u.id = o.user_id
     ${where}`,
    countParams
  );

  res.json({
    data:  rows,
    total: parseInt(countRows[0].total, 10),
    page,
    limit,
    pages: Math.ceil(countRows[0].total / limit),
  });
}));

// ──────────────────────────────────────────────────────────
// GET /owner/reports
// ──────────────────────────────────────────────────────────
router.get('/reports', asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  const intervals = { '7d': '7 days', '30d': '30 days', '90d': '90 days' };
  const interval  = intervals[period] || '30 days';

  const [dailyRes, categoryRes, kpiRes] = await Promise.all([
    db.query(`
      SELECT DATE_TRUNC('day', created_at) AS day,
             COUNT(*) AS orders,
             COALESCE(SUM(total), 0) AS revenue
      FROM   orders
      WHERE  status = 'served'
        AND  created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY day ORDER BY day
    `),
    db.query(`
      SELECT c.name AS category, SUM(oi.unit_price * oi.quantity) AS revenue
      FROM   order_items oi
      JOIN   menu_items  m ON m.id = oi.menu_item_id
      JOIN   categories  c ON c.id = m.category_id
      JOIN   orders      o ON o.id = oi.order_id
      WHERE  o.status = 'served'
        AND  o.created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY c.name
      ORDER BY revenue DESC
    `),
    db.query(`
      SELECT
        COALESCE(SUM(total), 0)          AS total_revenue,
        COUNT(*)                          AS total_orders,
        COALESCE(AVG(total), 0)           AS avg_order,
        COUNT(DISTINCT user_id)           AS unique_customers
      FROM orders
      WHERE status = 'served'
        AND created_at >= NOW() - INTERVAL '${interval}'
    `),
  ]);

  res.json({
    kpi:      kpiRes.rows[0],
    daily:    dailyRes.rows,
    category: categoryRes.rows,
    period,
  });
}));

// ──────────────────────────────────────────────────────────
// GET /owner/tables
// ──────────────────────────────────────────────────────────
router.get('/tables', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT t.id, t.label, t.status, t.qr_code, t.updated_at,
            json_agg(
              json_build_object('id', o.id, 'order_number', o.order_number, 'status', o.status)
            ) FILTER (WHERE o.id IS NOT NULL) AS active_orders
     FROM   restaurant_tables t
     LEFT JOIN orders o ON o.table_id = t.id AND o.status NOT IN ('served','cancelled','refunded')
     GROUP BY t.id
     ORDER BY t.id`
  );
  res.json(rows);
}));

router.patch('/tables/:id', asyncHandler(async (req, res) => {
  const { status } = req.body;
  const valid = ['empty', 'occupied', 'reserved'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` });
  }
  const { rows } = await db.query(
    `UPDATE restaurant_tables SET status = $1, updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [status, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Table not found' });
  res.json(rows[0]);
}));

// ──────────────────────────────────────────────────────────
// Staff management
// ──────────────────────────────────────────────────────────

router.get('/staff', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, username, display_name, role, active, created_at
     FROM staff ORDER BY created_at`
  );
  res.json(rows);
}));

router.post('/staff', asyncHandler(async (req, res) => {
  const { username, password, displayName, role } = req.body;
  const validRoles = ['owner', 'kitchen', 'waiter'];

  if (!username || !password || !displayName || !validRoles.includes(role)) {
    return res.status(400).json({ error: 'username, password, displayName, role required' });
  }

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await db.query(
    `INSERT INTO staff (username, password_hash, display_name, role)
     VALUES ($1, $2, $3, $4) RETURNING id, username, display_name, role, active`,
    [username, hash, displayName, role]
  );

  await db.query(
    `INSERT INTO audit_log (staff_id, action, entity_type, entity_id, after_data)
     VALUES ($1, 'staff.create', 'staff', $2, $3)`,
    [req.user.sub, rows[0].id, JSON.stringify({ username, role })]
  );

  res.status(201).json(rows[0]);
}));

router.put('/staff/:id', asyncHandler(async (req, res) => {
  const { displayName, role, active, password } = req.body;

  let hash = undefined;
  if (password) {
    hash = await bcrypt.hash(password, 10);
  }

  const { rows } = await db.query(
    `UPDATE staff SET
       display_name  = COALESCE($1, display_name),
       role          = COALESCE($2, role),
       active        = COALESCE($3, active),
       password_hash = COALESCE($4, password_hash),
       updated_at    = NOW()
     WHERE id = $5
     RETURNING id, username, display_name, role, active`,
    [displayName, role, active, hash, req.params.id]
  );

  if (!rows.length) return res.status(404).json({ error: 'Staff not found' });
  res.json(rows[0]);
}));

router.delete('/staff/:id', asyncHandler(async (req, res) => {
  // Soft delete — set active = false
  const { rows } = await db.query(
    `UPDATE staff SET active = FALSE, updated_at = NOW()
     WHERE id = $1 RETURNING id, username`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Staff not found' });
  res.json({ message: 'Staff deactivated', staff: rows[0] });
}));

// ──────────────────────────────────────────────────────────
// GET /owner/audit — audit log
// ──────────────────────────────────────────────────────────
router.get('/audit', asyncHandler(async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit  = Math.min(200, parseInt(req.query.limit || '50', 10));
  const offset = (page - 1) * limit;

  const { rows } = await db.query(
    `SELECT a.id, a.action, a.entity_type, a.entity_id,
            a.before_data, a.after_data, a.ip_address, a.created_at,
            s.username AS staff_username, s.display_name AS staff_name
     FROM   audit_log a
     LEFT JOIN staff s ON s.id = a.staff_id
     ORDER BY a.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const { rows: countRows } = await db.query('SELECT COUNT(*) AS total FROM audit_log');

  res.json({
    data:  rows,
    total: parseInt(countRows[0].total, 10),
    page,
    limit,
  });
}));

module.exports = router;
