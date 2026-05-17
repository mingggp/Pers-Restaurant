/**
 * Kitchen routes (kitchen + owner)
 *
 * GET /kitchen/orders          → active orders for Kanban board
 * GET /kitchen/history         → served/cancelled orders (today)
 * GET /kitchen/stats           → today's stats
 */

const router = require('express').Router();
const db = require('../db');
const { requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// ──────────────────────────────────────────────────────────
// GET /kitchen/orders — Kanban board (new + cooking + ready)
// ──────────────────────────────────────────────────────────
router.get(
  '/orders',
  requireRole('owner', 'kitchen', 'waiter'),
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT o.id, o.order_number, o.table_id, o.status, o.notes, o.created_at,
              json_agg(
                json_build_object(
                  'id',        oi.id,
                  'name',      m.name,
                  'nameEn',    m.name_en,
                  'quantity',  oi.quantity,
                  'note',      oi.note,
                  'isDone',    oi.is_done,
                  'options',   COALESCE(
                    (SELECT json_agg(json_build_object('name', oc2.name, 'groupTitle', og2.title))
                     FROM order_item_options oio2
                     JOIN option_choices oc2 ON oc2.id = oio2.option_choice_id
                     JOIN option_groups  og2 ON og2.id = oio2.option_group_id
                     WHERE oio2.order_item_id = oi.id),
                    '[]'
                  )
                ) ORDER BY oi.created_at
              ) AS items
       FROM   orders o
       JOIN   order_items oi ON oi.order_id = o.id
       JOIN   menu_items  m  ON m.id = oi.menu_item_id
       WHERE  o.status IN ('paid', 'cooking', 'ready')
       GROUP BY o.id
       ORDER BY o.created_at ASC`
    );

    // Group into columns
    const board = {
      new:     rows.filter((o) => o.status === 'paid'),
      cooking: rows.filter((o) => o.status === 'cooking'),
      ready:   rows.filter((o) => o.status === 'ready'),
    };

    res.json(board);
  })
);

// ──────────────────────────────────────────────────────────
// GET /kitchen/history — today's completed orders
// ──────────────────────────────────────────────────────────
router.get(
  '/history',
  requireRole('owner', 'kitchen'),
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT o.id, o.order_number, o.table_id, o.status, o.total, o.created_at, o.updated_at,
              json_agg(
                json_build_object('name', m.name, 'quantity', oi.quantity)
                ORDER BY oi.created_at
              ) AS items
       FROM   orders o
       JOIN   order_items oi ON oi.order_id = o.id
       JOIN   menu_items  m  ON m.id = oi.menu_item_id
       WHERE  o.status IN ('served', 'cancelled', 'refunded')
         AND  o.created_at >= NOW() - INTERVAL '24 hours'
       GROUP BY o.id
       ORDER BY o.updated_at DESC
       LIMIT 100`
    );

    res.json(rows);
  })
);

// ──────────────────────────────────────────────────────────
// GET /kitchen/stats — KPIs for the header counters
// ──────────────────────────────────────────────────────────
router.get(
  '/stats',
  requireRole('owner', 'kitchen'),
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'paid')    AS new_count,
         COUNT(*) FILTER (WHERE status = 'cooking') AS cooking_count,
         COUNT(*) FILTER (WHERE status = 'ready')   AS ready_count,
         COUNT(*) FILTER (WHERE status = 'served'
           AND updated_at >= NOW() - INTERVAL '24 hours') AS served_today,
         COALESCE(SUM(total) FILTER (WHERE status = 'served'
           AND updated_at >= DATE_TRUNC('day', NOW())), 0) AS revenue_today
       FROM orders
       WHERE status NOT IN ('cancelled', 'refunded')
         AND created_at >= NOW() - INTERVAL '24 hours'`
    );

    res.json(rows[0]);
  })
);

module.exports = router;
