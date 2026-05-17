/**
 * Orders routes (customer + kitchen + owner)
 *
 * POST /orders                  → place order (customer)
 * GET  /orders/my               → my order history (customer)
 * GET  /orders/:id              → order detail (customer own, or staff)
 * PATCH /orders/:id/status      → update status (kitchen/owner)
 * POST /orders/:id/refund       → refund (owner)
 */

const router = require('express').Router();
const db = require('../db');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

// Fetch a full order with items and options
async function fetchOrderDetail(orderId) {
  const { rows: orderRows } = await db.query(
    `SELECT o.id, o.order_number, o.table_id, o.status,
            o.subtotal, o.service_fee, o.total,
            o.payment_method, o.payment_ref, o.notes,
            o.created_at, o.updated_at,
            u.display_name AS user_name,
            u.line_user_id
     FROM   orders o
     LEFT JOIN users u ON u.id = o.user_id
     WHERE  o.id = $1`,
    [orderId]
  );
  if (!orderRows.length) return null;

  const order = orderRows[0];

  const { rows: items } = await db.query(
    `SELECT oi.id, oi.menu_item_id, oi.quantity, oi.unit_price, oi.note, oi.is_done,
            m.name, m.name_en, m.image_url,
            COALESCE(
              json_agg(
                json_build_object(
                  'groupId',   oio.option_group_id,
                  'choiceId',  oio.option_choice_id::text,
                  'priceDelta', oio.price_delta,
                  'name',      oc.name,
                  'groupTitle', og.title
                )
              ) FILTER (WHERE oio.id IS NOT NULL),
              '[]'
            ) AS options
     FROM   order_items oi
     JOIN   menu_items m ON m.id = oi.menu_item_id
     LEFT JOIN order_item_options oio ON oio.order_item_id = oi.id
     LEFT JOIN option_choices oc      ON oc.id = oio.option_choice_id
     LEFT JOIN option_groups og       ON og.id = oio.option_group_id
     WHERE  oi.order_id = $1
     GROUP BY oi.id, m.name, m.name_en, m.image_url
     ORDER BY oi.created_at`,
    [orderId]
  );

  return { ...order, items };
}

// ──────────────────────────────────────────────────────────
// POST /orders — place order
// ──────────────────────────────────────────────────────────
router.post('/', optionalAuth, asyncHandler(async (req, res) => {
  const { tableId, items, notes } = req.body;

  if (!tableId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'tableId and items[] are required' });
  }

  const userId = req.user?.sub || null;
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Verify menu items and prices
    let subtotal = 0;
    const enrichedItems = [];

    for (const line of items) {
      const { rows } = await client.query(
        'SELECT id, name, price, is_available FROM menu_items WHERE id = $1',
        [line.menuItemId]
      );
      if (!rows.length || !rows[0].is_available) {
        throw Object.assign(new Error(`เมนู ${line.menuItemId} ไม่พร้อมให้บริการ`), { status: 422 });
      }

      // Calculate option deltas
      let optionDelta = 0;
      const validatedOptions = [];

      if (Array.isArray(line.options)) {
        for (const opt of line.options) {
          const { rows: choiceRows } = await client.query(
            'SELECT id, price_delta, option_group_id FROM option_choices WHERE id = $1',
            [opt.choiceId]
          );
          if (choiceRows.length) {
            optionDelta += choiceRows[0].price_delta;
            validatedOptions.push({
              groupId:     choiceRows[0].option_group_id,
              choiceId:    choiceRows[0].id,
              priceDelta:  choiceRows[0].price_delta,
            });
          }
        }
      }

      const unitPrice = rows[0].price + optionDelta;
      subtotal += unitPrice * (line.quantity || 1);
      enrichedItems.push({ ...line, unitPrice, validatedOptions });
    }

    const serviceFee = Math.round(subtotal * 0.1);
    const total = subtotal + serviceFee;

    // Create order
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (user_id, table_id, status, subtotal, service_fee, total, notes)
       VALUES ($1, $2, 'pending', $3, $4, $5, $6)
       RETURNING id, order_number`,
      [userId, tableId, subtotal, serviceFee, total, notes || null]
    );

    const orderId     = orderRows[0].id;
    const orderNumber = orderRows[0].order_number;

    // Insert order items + options
    for (const line of enrichedItems) {
      const { rows: itemRows } = await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, note)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [orderId, line.menuItemId, line.quantity || 1, line.unitPrice, line.note || null]
      );
      const orderItemId = itemRows[0].id;

      for (const opt of line.validatedOptions) {
        await client.query(
          `INSERT INTO order_item_options (order_item_id, option_group_id, option_choice_id, price_delta)
           VALUES ($1, $2, $3, $4)`,
          [orderItemId, opt.groupId, opt.choiceId, opt.priceDelta]
        );
      }
    }

    // Mark table as occupied
    await client.query(
      `UPDATE restaurant_tables SET status = 'occupied', updated_at = NOW() WHERE id = $1`,
      [tableId]
    );

    await client.query('COMMIT');

    const order = await fetchOrderDetail(orderId);

    // Broadcast new order to kitchen via WebSocket
    if (req.app.locals.broadcast) {
      req.app.locals.broadcast({ type: 'NEW_ORDER', order });
    }

    res.status(201).json({ orderId, orderNumber, total, order });

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

// ──────────────────────────────────────────────────────────
// GET /orders/my — customer order history
// ──────────────────────────────────────────────────────────
router.get('/my', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ error: 'This endpoint is for customers only' });
  }

  const { rows } = await db.query(
    `SELECT o.id, o.order_number, o.table_id, o.status, o.total, o.created_at,
            json_agg(
              json_build_object('name', m.name, 'quantity', oi.quantity)
              ORDER BY oi.created_at
            ) AS items
     FROM   orders o
     JOIN   order_items oi ON oi.order_id = o.id
     JOIN   menu_items  m  ON m.id = oi.menu_item_id
     WHERE  o.user_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC
     LIMIT 50`,
    [req.user.sub]
  );

  res.json(rows);
}));

// ──────────────────────────────────────────────────────────
// GET /orders/:id — order detail
// ──────────────────────────────────────────────────────────
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const order = await fetchOrderDetail(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  // Customers can only see their own orders
  const user = req.user;
  if (user?.role === 'customer' && order.user_id && order.user_id !== user.sub) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json(order);
}));

// ──────────────────────────────────────────────────────────
// PATCH /orders/:id/status — kitchen / owner
// ──────────────────────────────────────────────────────────
const STATUS_TRANSITIONS = {
  pending:   ['paid', 'cancelled'],
  paid:      ['cooking', 'cancelled'],
  cooking:   ['ready', 'cancelled'],
  ready:     ['served'],
  served:    [],
  cancelled: [],
  refunded:  [],
};

router.patch(
  '/:id/status',
  requireRole('owner', 'kitchen', 'waiter'),
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status required' });

    const { rows } = await db.query(
      'SELECT id, status, table_id FROM orders WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });

    const current = rows[0].status;
    const allowed = STATUS_TRANSITIONS[current] || [];

    if (!allowed.includes(status)) {
      return res.status(422).json({
        error: `Cannot transition from "${current}" to "${status}"`,
        allowed,
      });
    }

    const { rows: updated } = await db.query(
      `UPDATE orders SET status = $1, updated_at = NOW()
       WHERE id = $2 RETURNING id, order_number, status`,
      [status, req.params.id]
    );

    // If served → free the table (only if no other active orders)
    if (status === 'served' && rows[0].table_id) {
      const { rows: activeOrders } = await db.query(
        `SELECT id FROM orders
         WHERE table_id = $1 AND status NOT IN ('served','cancelled','refunded') AND id != $2`,
        [rows[0].table_id, req.params.id]
      );
      if (!activeOrders.length) {
        await db.query(
          `UPDATE restaurant_tables SET status = 'empty', updated_at = NOW() WHERE id = $1`,
          [rows[0].table_id]
        );
      }
    }

    // Audit log
    await db.query(
      `INSERT INTO audit_log (staff_id, action, entity_type, entity_id, before_data, after_data)
       VALUES ($1, $2, 'order', $3, $4, $5)`,
      [req.user.sub, `order.status.${status}`, req.params.id,
       JSON.stringify({ status: current }), JSON.stringify({ status })]
    );

    // Broadcast update
    if (req.app.locals.broadcast) {
      req.app.locals.broadcast({ type: 'ORDER_STATUS', orderId: req.params.id, status });
    }

    res.json(updated[0]);
  })
);

// ──────────────────────────────────────────────────────────
// PATCH /orders/:id/items/:itemId/done — kitchen item check-off
// ──────────────────────────────────────────────────────────
router.patch(
  '/:id/items/:itemId/done',
  requireRole('owner', 'kitchen'),
  asyncHandler(async (req, res) => {
    const { isDone } = req.body;
    const { rows } = await db.query(
      `UPDATE order_items SET is_done = $1
       WHERE id = $2 AND order_id = $3
       RETURNING id, is_done`,
      [!!isDone, req.params.itemId, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Item not found' });

    if (req.app.locals.broadcast) {
      req.app.locals.broadcast({
        type: 'ITEM_DONE',
        orderId: req.params.id,
        itemId:  req.params.itemId,
        isDone:  rows[0].is_done,
      });
    }

    res.json(rows[0]);
  })
);

// ──────────────────────────────────────────────────────────
// POST /orders/:id/refund (owner only)
// ──────────────────────────────────────────────────────────
router.post(
  '/:id/refund',
  requireRole('owner'),
  asyncHandler(async (req, res) => {
    const { reason } = req.body;

    const { rows } = await db.query(
      `UPDATE orders SET status = 'refunded', updated_at = NOW()
       WHERE id = $1 AND status IN ('paid','cooking','ready','served')
       RETURNING id, order_number, status, total`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(422).json({ error: 'Order cannot be refunded in its current state' });
    }

    await db.query(
      `INSERT INTO audit_log (staff_id, action, entity_type, entity_id, after_data)
       VALUES ($1, 'order.refund', 'order', $2, $3)`,
      [req.user.sub, req.params.id, JSON.stringify({ reason, total: rows[0].total })]
    );

    if (req.app.locals.broadcast) {
      req.app.locals.broadcast({ type: 'ORDER_STATUS', orderId: req.params.id, status: 'refunded' });
    }

    res.json(rows[0]);
  })
);

module.exports = router;
