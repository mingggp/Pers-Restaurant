/**
 * Menu routes (public reads, owner writes)
 *
 * GET  /menu                  → all available items (customer-facing)
 * GET  /menu/categories       → category list
 * GET  /menu/:id              → single item detail with option groups
 * POST /menu                  → create item (owner)
 * PUT  /menu/:id              → update item (owner)
 * PATCH /menu/:id/availability → toggle available (owner)
 * DELETE /menu/:id            → delete item (owner)
 */

const router = require('express').Router();
const db = require('../db');
const { requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// ──────────────────────────────────────────────────────────
// GET /menu/categories
// ──────────────────────────────────────────────────────────
router.get('/categories', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, name, name_en FROM categories ORDER BY sort_order'
  );
  res.json(rows);
}));

// ──────────────────────────────────────────────────────────
// GET /menu  (customer-facing: only available items)
// ──────────────────────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const { category, recommended } = req.query;

  let sql = `
    SELECT m.id, m.category_id, m.name, m.name_en, m.description,
           m.price, m.image_url, m.is_recommended, m.is_available,
           m.rating, m.review_count, m.sort_order,
           c.name AS category_name
    FROM   menu_items m
    JOIN   categories c ON c.id = m.category_id
    WHERE  m.is_available = TRUE
  `;
  const params = [];

  if (category) {
    params.push(category);
    sql += ` AND m.category_id = $${params.length}`;
  }
  if (recommended === 'true') {
    sql += ' AND m.is_recommended = TRUE';
  }

  sql += ' ORDER BY m.category_id, m.sort_order, m.name';

  const { rows } = await db.query(sql, params);
  res.json(rows);
}));

// ──────────────────────────────────────────────────────────
// GET /menu/:id — item detail + option groups
// ──────────────────────────────────────────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
  const { rows: items } = await db.query(
    `SELECT m.*, c.name AS category_name
     FROM   menu_items m
     JOIN   categories c ON c.id = m.category_id
     WHERE  m.id = $1`,
    [req.params.id]
  );
  if (!items.length) return res.status(404).json({ error: 'Item not found' });

  const item = items[0];

  // Option groups for this category
  const { rows: groups } = await db.query(
    `SELECT og.id, og.title, og.type, og.is_required,
            json_agg(
              json_build_object(
                'id',         oc.id,
                'name',       oc.name,
                'priceDelta', oc.price_delta,
                'isDefault',  oc.is_default
              ) ORDER BY oc.sort_order
            ) AS choices
     FROM   category_option_groups cog
     JOIN   option_groups og  ON og.id = cog.option_group_id
     JOIN   option_choices oc ON oc.option_group_id = og.id
     WHERE  cog.category_id = $1
     GROUP BY og.id, og.title, og.type, og.is_required`,
    [item.category_id]
  );

  res.json({ ...item, optionGroups: groups });
}));

// ──────────────────────────────────────────────────────────
// POST /menu — create item (owner only)
// ──────────────────────────────────────────────────────────
router.post('/', requireRole('owner'), asyncHandler(async (req, res) => {
  const {
    categoryId, name, nameEn, description,
    price, imageUrl, isRecommended, sortOrder,
  } = req.body;

  if (!categoryId || !name || price == null) {
    return res.status(400).json({ error: 'categoryId, name, price are required' });
  }

  const { rows } = await db.query(
    `INSERT INTO menu_items
       (category_id, name, name_en, description, price, image_url, is_recommended, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [categoryId, name, nameEn || null, description || null,
     price, imageUrl || null, isRecommended || false, sortOrder || 0]
  );

  res.status(201).json(rows[0]);
}));

// ──────────────────────────────────────────────────────────
// PUT /menu/:id — update item (owner only)
// ──────────────────────────────────────────────────────────
router.put('/:id', requireRole('owner'), asyncHandler(async (req, res) => {
  const {
    categoryId, name, nameEn, description,
    price, imageUrl, isRecommended, isAvailable, sortOrder,
  } = req.body;

  const { rows } = await db.query(
    `UPDATE menu_items SET
       category_id    = COALESCE($1, category_id),
       name           = COALESCE($2, name),
       name_en        = COALESCE($3, name_en),
       description    = COALESCE($4, description),
       price          = COALESCE($5, price),
       image_url      = COALESCE($6, image_url),
       is_recommended = COALESCE($7, is_recommended),
       is_available   = COALESCE($8, is_available),
       sort_order     = COALESCE($9, sort_order),
       updated_at     = NOW()
     WHERE id = $10
     RETURNING *`,
    [categoryId, name, nameEn, description, price,
     imageUrl, isRecommended, isAvailable, sortOrder, req.params.id]
  );

  if (!rows.length) return res.status(404).json({ error: 'Item not found' });
  res.json(rows[0]);
}));

// ──────────────────────────────────────────────────────────
// PATCH /menu/:id/availability — quick toggle
// ──────────────────────────────────────────────────────────
router.patch('/:id/availability', requireRole('owner'), asyncHandler(async (req, res) => {
  const { isAvailable } = req.body;
  if (typeof isAvailable !== 'boolean') {
    return res.status(400).json({ error: 'isAvailable (boolean) required' });
  }
  const { rows } = await db.query(
    `UPDATE menu_items SET is_available = $1, updated_at = NOW()
     WHERE id = $2 RETURNING id, name, is_available`,
    [isAvailable, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Item not found' });
  res.json(rows[0]);
}));

// ──────────────────────────────────────────────────────────
// DELETE /menu/:id (owner only)
// ถ้าเมนูเคยถูกสั่งแล้ว → soft delete (ปิดขาย) เพื่อไม่ให้ FK พัง
// ──────────────────────────────────────────────────────────
router.delete('/:id', requireRole('owner'), asyncHandler(async (req, res) => {
  const id = req.params.id;

  // ตรวจก่อนว่ามี order_items ที่อ้างถึงเมนูนี้หรือไม่
  const { rows: refs } = await db.query(
    'SELECT 1 FROM order_items WHERE menu_item_id = $1 LIMIT 1',
    [id]
  );

  if (refs.length > 0) {
    // มีออเดอร์เก่าอ้างอยู่ — ใช้ soft delete แทน
    const { rowCount } = await db.query(
      `UPDATE menu_items SET is_available = FALSE, updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Item not found' });
    return res.json({ softDeleted: true, message: 'มีออเดอร์เก่าอ้างถึงเมนูนี้ ระบบจะปิดขายแทนการลบ' });
  }

  const { rowCount } = await db.query(
    'DELETE FROM menu_items WHERE id = $1',
    [id]
  );
  if (!rowCount) return res.status(404).json({ error: 'Item not found' });
  res.status(204).end();
}));

module.exports = router;
