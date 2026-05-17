// Kitchen mock data + simulated incoming order generator

// Pull menu/options/restaurant from data.js (already loaded)
window.K_RESTAURANT = window.RESTAURANT;

// Generate sample orders
const NOW = Date.now();

const optsFor = (catId) => {
  const groups = (window.OPTIONS_BY_CAT[catId] || []);
  const opts = {};
  groups.forEach(gid => {
    const grp = window.OPTION_GROUPS[gid];
    if (grp.type === "radio") {
      const ch = grp.choices[Math.floor(Math.random() * grp.choices.length)];
      opts[gid] = ch.id;
    } else {
      const picks = grp.choices.filter(() => Math.random() < 0.3).map(c => c.id);
      opts[gid] = picks;
    }
  });
  return opts;
};
const lineFor = (m, qty = 1, note = "") => ({
  itemId: m.id, name: m.name, price: m.price, qty,
  options: optsFor(m.cat),
  unitPrice: m.price,
  note,
  done: false,
});
const M = (id) => window.MENU.find(x => x.id === id);

window.K_ORDERS_INITIAL = [
  // ===== NEW (just came in)
  {
    id: 1241, table: 8, status: "new",
    placedAt: NOW - 30 * 1000,
    total: 280,
    items: [
      lineFor(M("m1"), 1, "ไม่ใส่ถั่ว ลูกค้าแพ้"),
      lineFor(M("m12"), 2),
    ],
  },
  {
    id: 1242, table: 12, status: "new",
    placedAt: NOW - 90 * 1000,
    total: 195,
    items: [
      lineFor(M("m5"), 1, "เผ็ดน้อยมาก เด็กกิน"),
      lineFor(M("m6"), 1),
      lineFor(M("m13"), 1),
    ],
  },
  // ===== COOKING (in progress)
  {
    id: 1239, table: 3, status: "cooking",
    placedAt: NOW - 6 * 60 * 1000,
    total: 410,
    items: [
      lineFor(M("m2"), 1),
      lineFor(M("m9"), 1),
      lineFor(M("m12"), 2),
    ],
  },
  {
    id: 1238, table: 5, status: "cooking",
    placedAt: NOW - 4 * 60 * 1000,
    total: 175,
    items: [
      lineFor(M("m4"), 1, "ใส่พริกแยก"),
      lineFor(M("m13"), 1),
    ],
  },
  {
    id: 1237, table: 1, status: "cooking",
    placedAt: NOW - 8 * 60 * 1000,  // late!
    total: 320,
    items: [
      lineFor(M("m8"), 1),
      lineFor(M("m11"), 1),
      lineFor(M("m17"), 1),
    ],
  },
  {
    id: 1236, table: 7, status: "cooking",
    placedAt: NOW - 2 * 60 * 1000,
    total: 90,
    items: [
      lineFor(M("m16"), 1),
    ],
  },
  // ===== DONE (recently served)
  {
    id: 1235, table: 2, status: "done",
    placedAt: NOW - 18 * 60 * 1000,
    servedAt: NOW - 4 * 60 * 1000,
    total: 145,
    items: [lineFor(M("m3"),1), lineFor(M("m12"),1)],
  },
  {
    id: 1234, table: 4, status: "done",
    placedAt: NOW - 22 * 60 * 1000,
    servedAt: NOW - 7 * 60 * 1000,
    total: 270,
    items: [lineFor(M("m1"),1), lineFor(M("m13"),2), lineFor(M("m18"),1)],
  },
  {
    id: 1233, table: 9, status: "done",
    placedAt: NOW - 30 * 60 * 1000,
    servedAt: NOW - 14 * 60 * 1000,
    total: 380,
    items: [lineFor(M("m9"),1), lineFor(M("m6"),1), lineFor(M("m12"),2)],
  },
];

// Simulate incoming order
window.K_makeIncomingOrder = (id) => {
  const tables = [2, 4, 6, 7, 9, 10, 11, 14];
  const table = tables[Math.floor(Math.random() * tables.length)];
  const candidates = window.MENU;
  const pickN = 1 + Math.floor(Math.random() * 3);
  const items = [];
  for (let i = 0; i < pickN; i++) {
    const m = candidates[Math.floor(Math.random() * candidates.length)];
    items.push(lineFor(m, 1 + Math.floor(Math.random() * 2)));
  }
  const total = items.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  return {
    id, table, status: "new",
    placedAt: Date.now(),
    total,
    items,
  };
};

// History stats
window.K_TODAY_STATS = {
  totalOrders: 42,
  totalItems: 118,
  avgPrepMin: 12,
  revenue: 8420,
};

// History rows (for /history)
window.K_HISTORY_ROWS = (() => {
  const rows = [];
  const startId = 1232;
  for (let i = 0; i < 22; i++) {
    const id = startId - i;
    const offsetMin = 25 + i * 8 + Math.floor(Math.random() * 5);
    const placedAt = NOW - offsetMin * 60 * 1000;
    const servedAt = placedAt + (8 + Math.floor(Math.random() * 12)) * 60 * 1000;
    const tables = [2,3,4,5,7,8,9,10,11,12,14];
    const table = tables[Math.floor(Math.random() * tables.length)];
    const itemCount = 1 + Math.floor(Math.random() * 4);
    const sample = [];
    for (let k = 0; k < itemCount; k++) {
      const m = window.MENU[Math.floor(Math.random() * window.MENU.length)];
      sample.push({ name: m.name, qty: 1 + Math.floor(Math.random() * 2) });
    }
    const total = 80 + Math.floor(Math.random() * 400);
    rows.push({ id, table, placedAt, servedAt, items: sample, total });
  }
  return rows;
})();
