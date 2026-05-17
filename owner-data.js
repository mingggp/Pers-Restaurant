// Owner desktop — mock data: orders (50+), staff, audit log, daily stats, hourly stats, tables

const NOW_O = Date.now();
const DAY = 24 * 3600 * 1000;
const HOUR = 3600 * 1000;
const MIN = 60 * 1000;

// ---------- Helpers ----------
function rand(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) {
  const c = arr.slice();
  const out = [];
  for (let i = 0; i < n && c.length; i++) {
    const idx = Math.floor(Math.random() * c.length);
    out.push(c.splice(idx, 1)[0]);
  }
  return out;
}

// ---------- 30-day revenue series ----------
window.O_DAILY = (() => {
  const out = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(NOW_O - i * DAY);
    const dow = d.getDay();
    // weekend boost, monday dip
    let base = 9500 + Math.sin((29 - i) / 4) * 1200 + (dow === 0 || dow === 6 ? 3500 : 0) - (dow === 1 ? 1500 : 0);
    base += rand(-700, 900);
    const orders = Math.round(base / rand(135, 165));
    out.push({
      date: d,
      revenue: Math.round(base),
      orders,
      avg: Math.round(base / Math.max(1, orders)),
      newCustomers: Math.max(0, Math.round(orders * rand(0.06, 0.18))),
    });
  }
  return out;
})();

// ---------- 24-hour distribution (today) ----------
window.O_HOURLY = (() => {
  // shape: lunch peak 11-13, dinner peak 18-20
  const profile = [0,0,0,0,0,0,0, 1,2,3,4, 8,12,9, 5,4,5, 7,11,13,9, 6,3,1];
  return profile.map((v, h) => ({ hour: h, orders: Math.max(0, Math.round(v + rand(-1, 1.5))) }));
})();

// ---------- Tables (12) ----------
window.O_TABLES = Array.from({ length: 12 }, (_, i) => ({
  id: `T${String(i + 1).padStart(2, "0")}`,
  number: i + 1,
  seats: [2, 2, 4, 4, 4, 4, 4, 6, 6, 8, 8, 10][i],
  zone: i < 6 ? "ในร้าน" : i < 10 ? "ระเบียง" : "ห้อง VIP",
  active: i !== 11, // last one inactive for variety
}));

// ---------- Generate orders (60) ----------
const _statusOptions = ["paid", "cooking", "served", "served", "served", "refunded"];
const _payOptions = ["promptpay", "promptpay", "promptpay", "card", "cash"];

function _makeOrder(idx) {
  const placedAt = NOW_O - rand(0, 30) * DAY - rand(0, 16) * HOUR;
  const itemCount = Math.floor(rand(1, 5));
  const items = pickN(window.MENU, itemCount).map(m => {
    const qty = Math.random() < 0.7 ? 1 : Math.floor(rand(2, 4));
    return { itemId: m.id, name: m.name, qty, price: m.price, unitPrice: m.price };
  });
  const subtotal = items.reduce((s, it) => s + it.unitPrice * it.qty, 0);
  const status = pick(_statusOptions);
  const isToday = placedAt > NOW_O - DAY;
  // make today's orders mostly fresh-status
  const finalStatus = isToday && Math.random() < 0.4
    ? pick(["paid", "cooking", "served"])
    : status;
  const tableNum = Math.floor(rand(1, 13));
  const id = String(1100 + idx);
  return {
    id, table: tableNum, placedAt,
    items, total: subtotal,
    status: finalStatus,
    payment: pick(_payOptions),
    customer: pick(["คุณ ภราดร", "คุณ สุดา", "คุณ เอก", "คุณ มินตรา", "คุณ ศุภชัย", "คุณ พิมพ์", "คุณ ชนน์", "Walk-in", "Walk-in", "Walk-in"]),
  };
}

window.O_ORDERS = Array.from({ length: 60 }, (_, i) => _makeOrder(i))
  .sort((a, b) => b.placedAt - a.placedAt);

// ---------- Top selling items (last 30 days) ----------
window.O_TOP_ITEMS = (() => {
  const counts = {};
  window.O_ORDERS.forEach(o => o.items.forEach(it => {
    counts[it.itemId] = (counts[it.itemId] || 0) + it.qty;
  }));
  return Object.entries(counts)
    .map(([id, qty]) => {
      const m = window.MENU.find(x => x.id === id);
      return m ? { ...m, sold: qty, revenue: qty * m.price } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 10);
})();

// ---------- Staff ----------
window.O_STAFF = [
  { id: "u1", name: "พรชัย เจริญสุข", username: "owner",   role: "owner",   active: true,  lastLogin: NOW_O - 12 * MIN },
  { id: "u2", name: "สุภาพร แสงทอง",  username: "manager", role: "manager", active: true,  lastLogin: NOW_O - 4 * HOUR },
  { id: "u3", name: "วิชัย ใจดี",      username: "kitchen1",role: "kitchen", active: true,  lastLogin: NOW_O - 30 * MIN },
  { id: "u4", name: "นิภา สมบูรณ์",    username: "kitchen2",role: "kitchen", active: true,  lastLogin: NOW_O - 1 * HOUR },
  { id: "u5", name: "ธวัชชัย โชติชัย", username: "kitchen3",role: "kitchen", active: false, lastLogin: NOW_O - 7 * DAY },
  { id: "u6", name: "อรุณี ทวีสิน",    username: "cashier", role: "cashier", active: true,  lastLogin: NOW_O - 2 * DAY },
];

// ---------- Audit Log ----------
const _auditTypes = [
  { type: "login",    label: "เข้าสู่ระบบ",    entity: "session" },
  { type: "menu_edit",label: "แก้ไขเมนู",     entity: "menu_item" },
  { type: "menu_add", label: "เพิ่มเมนูใหม่",  entity: "menu_item" },
  { type: "menu_disable", label: "ปิดการขายเมนู", entity: "menu_item" },
  { type: "refund",   label: "คืนเงินออเดอร์", entity: "order" },
  { type: "staff_add",label: "เพิ่มพนักงาน",  entity: "user" },
  { type: "staff_disable",label: "ระงับพนักงาน",entity: "user" },
  { type: "settings_edit", label: "แก้ไขการตั้งค่า", entity: "settings" },
  { type: "table_add",label: "เพิ่มโต๊ะ",     entity: "table" },
  { type: "table_delete",label: "ลบโต๊ะ",     entity: "table" },
];

window.O_AUDIT = Array.from({ length: 24 }, (_, i) => {
  const t = pick(_auditTypes);
  const user = pick(window.O_STAFF.filter(s => s.role !== "kitchen"));
  const at = NOW_O - rand(0, 14) * DAY - rand(0, 24) * HOUR;
  let before = null, after = null, target = "—";
  if (t.type === "menu_edit") {
    const m = pick(window.MENU);
    target = m.name;
    before = { price: m.price };
    after  = { price: m.price + (Math.random() < 0.5 ? 5 : 10) };
  } else if (t.type === "menu_disable") {
    const m = pick(window.MENU);
    target = m.name;
    before = { available: true };
    after  = { available: false };
  } else if (t.type === "refund") {
    const o = pick(window.O_ORDERS);
    target = `#${o.id}`;
    before = { status: "served" };
    after  = { status: "refunded", reason: pick(["ลูกค้าไม่พอใจรสชาติ", "ทำผิดออเดอร์", "อาหารช้าเกินไป"]) };
  } else if (t.type === "staff_add") {
    target = pick(["พนักงานใหม่ A", "พนักงานใหม่ B"]);
    after  = { name: target, role: "kitchen" };
  } else if (t.type === "settings_edit") {
    target = "การชำระเงิน";
    before = { promptpay_id: "098-***-6543" };
    after  = { promptpay_id: "081-***-1234" };
  } else if (t.type === "table_add") {
    target = `โต๊ะ ${Math.floor(rand(13, 20))}`;
    after  = { seats: 4 };
  } else if (t.type === "login") {
    target = "—";
  }
  return {
    id: `log-${1000 + i}`,
    at,
    user: user.name,
    userRole: user.role,
    type: t.type,
    label: t.label,
    entity: t.entity,
    target,
    before, after,
    ip: pick(["49.231.45.12", "1.179.82.55", "182.232.110.4", "203.150.22.91"]),
  };
}).sort((a, b) => b.at - a.at);

// ---------- Today / yesterday KPIs ----------
window.O_KPIS_TODAY = (() => {
  const today = window.O_DAILY[window.O_DAILY.length - 1];
  const yest  = window.O_DAILY[window.O_DAILY.length - 2];
  return {
    revenue: today.revenue,
    revenueDelta: ((today.revenue - yest.revenue) / yest.revenue) * 100,
    orders: today.orders,
    ordersDelta: ((today.orders - yest.orders) / yest.orders) * 100,
    avg: today.avg,
    avgDelta: ((today.avg - yest.avg) / yest.avg) * 100,
    newCustomers: today.newCustomers,
    newCustomersDelta: today.newCustomers - yest.newCustomers,
  };
})();

// ---------- Active orders (in flight, today) ----------
window.O_ACTIVE_ORDERS = window.O_ORDERS
  .filter(o => o.status === "paid" || o.status === "cooking")
  .filter(o => o.placedAt > NOW_O - 4 * HOUR)
  .slice(0, 5);

// ---------- Restaurant settings ----------
window.O_SETTINGS = {
  restaurant: {
    nameTh: window.RESTAURANT.nameTh,
    nameEn: "Per's Restaurant",
    address: "123/4 ถ.สุขุมวิท แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ 10110",
    phone: "02-123-4567",
    open: "10:30",
    close: "22:00",
  },
  promptpay: {
    id: "098-765-4321",
    name: "บริษัท เพอร์ส เรสเตอรองท์ จำกัด",
  },
  omise: {
    publicKey: "pkey_test_5f3xY9aB2cD8eFgHiJkLmNoPqRsT",
    secretKey: "skey_test_uVwXyZ1234567890ABCDefghijKL",
  },
  line: {
    channelId: "1234567890",
    channelSecret: "abcdef0123456789abcdef0123456789",
    liffId: "1234567890-abcdEFGH",
  },
  twoFA: false,
};

// for menu mgmt
window.O_CATEGORIES = window.CATEGORIES.map(c => ({ ...c, active: true }));
