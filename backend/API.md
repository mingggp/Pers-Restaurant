# Per's Restaurant — API Reference

Base URL: `http://localhost:4000`

---

## Authentication

### Customer (LINE Login)

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/auth/line` | Redirect browser to LINE OAuth consent page |
| `GET`  | `/auth/line/callback` | OAuth callback — issues JWT, redirects to frontend |
| `POST` | `/auth/line/verify` | LIFF flow: verify LINE ID token → JWT |
| `GET`  | `/auth/me` | Return current user/staff info |

**POST /auth/line/verify** body:
```json
{ "id_token": "LINE_ID_TOKEN" }
```

### Staff (username + password)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/staff/login` | Login → JWT |

**POST /auth/staff/login** body:
```json
{ "username": "admin", "password": "password123" }
```

Default accounts (created by seed):
| Username | Password | Role |
|----------|----------|------|
| `admin` | `password123` | owner |
| `kitchen` | `kitchen123` | kitchen |
| `waiter` | `waiter123` | waiter |

All protected routes require:
```
Authorization: Bearer <token>
```

---

## Menu

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/api/menu` | — | All available menu items |
| `GET`  | `/api/menu/categories` | — | Category list |
| `GET`  | `/api/menu/:id` | — | Item detail + option groups |
| `POST` | `/api/menu` | owner | Create menu item |
| `PUT`  | `/api/menu/:id` | owner | Update menu item |
| `PATCH`| `/api/menu/:id/availability` | owner | Toggle available |
| `DELETE`| `/api/menu/:id` | owner | Delete item |

**GET /api/menu** query params:
- `category` — filter by category ID (`rec`, `rice`, `main`, `drink`, `dessert`)
- `recommended=true` — show only recommended items

---

## Orders

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/orders` | optional | Place a new order |
| `GET`  | `/api/orders/my` | customer | Customer's order history |
| `GET`  | `/api/orders/:id` | optional | Order detail |
| `PATCH`| `/api/orders/:id/status` | kitchen/owner | Update order status |
| `PATCH`| `/api/orders/:id/items/:itemId/done` | kitchen/owner | Check off a line item |
| `POST` | `/api/orders/:id/refund` | owner | Refund an order |

**POST /api/orders** body:
```json
{
  "tableId": 5,
  "items": [
    {
      "menuItemId": "uuid-of-menu-item",
      "quantity": 2,
      "note": "ไม่ใส่ผัก",
      "options": [
        { "choiceId": "uuid-of-choice" }
      ]
    }
  ]
}
```

**Status flow:** `pending` → `paid` → `cooking` → `ready` → `served`

---

## Kitchen

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/kitchen/orders` | kitchen/owner | Kanban board (paid/cooking/ready) |
| `GET` | `/api/kitchen/history` | kitchen/owner | Today's served orders |
| `GET` | `/api/kitchen/stats` | kitchen/owner | Counter stats |

---

## Owner Console

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/owner/dashboard` | owner | KPIs + top items + hourly + pending |
| `GET` | `/api/owner/orders` | owner | Paginated orders with filters |
| `GET` | `/api/owner/reports` | owner | Revenue reports |
| `GET` | `/api/owner/tables` | owner | Table list (with capacity, zone, is_active) |
| `POST` | `/api/owner/tables` | owner | Add table (body: `id`, `capacity`, `zone`, `label`, `isActive`) |
| `PUT` | `/api/owner/tables/:id` | owner | Edit table |
| `PATCH`| `/api/owner/tables/:id` | owner | Update table status (`empty`/`occupied`/`reserved`) |
| `DELETE`| `/api/owner/tables/:id` | owner | Delete (soft-delete ถ้ามี orders อ้าง) |
| `GET` | `/api/owner/staff` | owner | Staff list |
| `POST` | `/api/owner/staff` | owner | Add staff |
| `PUT` | `/api/owner/staff/:id` | owner | Edit staff |
| `DELETE`| `/api/owner/staff/:id` | owner | Deactivate staff |
| `GET` | `/api/owner/audit` | owner | Audit log |

---

## Upload

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/upload` | owner | อัปโหลดรูป (multipart, field `image`) — คืน `{ url, publicId, provider, ... }` |
| `GET`  | `/uploads/*` | — | ดาวน์โหลดไฟล์ที่อัปโหลด (เฉพาะ local mode) |

**ข้อจำกัด:** JPG/PNG/WebP เท่านั้น, สูงสุด 5MB/ไฟล์

**Provider switching** (อัตโนมัติตาม env vars):
- ถ้ามี `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET` → ใช้ **Cloudinary** (production)
  - รูปถูก resize อัตโนมัติเป็น ≤ 1200×1200 px และ optimize ด้วย `quality: auto:good`
  - Cloudinary จะแปลง WebP/AVIF อัตโนมัติเวลา serve ตาม browser
  - เก็บใน folder `pers-restaurant/menu/`
- ถ้าไม่มี → fallback ไปเก็บ **local disk** (`backend/uploads/`) สำหรับ dev/local

**Response shape:**
```json
{
  "url": "https://res.cloudinary.com/.../image/upload/.../xxx.jpg",
  "publicId": "pers-restaurant/menu/abc123",
  "provider": "cloudinary"
}
```

---

## WebSocket

Connect to `ws://localhost:4000/ws`

After connecting, send:
```json
{ "type": "AUTH", "token": "<jwt>" }
```

Server responds with `{ "type": "AUTH_OK" }` then pushes events:

| Event type | Payload | Who receives |
|------------|---------|-------------|
| `NEW_ORDER` | `{ order: {...} }` | all authenticated |
| `ORDER_STATUS` | `{ orderId, status }` | all authenticated |
| `ITEM_DONE` | `{ orderId, itemId, isDone }` | kitchen/owner |
| `CONNECTED` | — | on connect |

---

## Setup

```bash
# 1. Copy env file
cp .env.example .env
# Edit .env — fill DATABASE_URL, JWT_SECRET, LINE_* variables

# 2. Install dependencies
npm install

# 3. Create the database
createdb pers_restaurant   # or create via pgAdmin

# 4. Run migrations + seed
npm run db:reset

# 5. Start the server
npm run dev    # development (auto-reload)
npm start      # production
```
