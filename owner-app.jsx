// Owner Console — main app

const { useState: useSO, useEffect: useEO, useMemo: useMO, useCallback: useCBO } = React;

// Normalise API menu item → owner shape
function normalizeMenuItem(m) {
  return {
    id:        m.id,
    name:      m.name,
    nameEn:    m.name_en || m.nameEn || "",
    cat:       m.category_id || m.cat,
    price:     parseFloat(m.price || 0),
    available: m.is_available ?? m.available ?? true,
    rec:       m.is_recommended ?? m.rec ?? false,
    image:     m.image_url || m.image || null,
    desc:      m.description || m.desc || "",
    rating:    parseFloat(m.rating || 4.5),
    reviews:   m.reviews || 0,
  };
}

// Normalise API order → owner shape
function normalizeOrder(o) {
  return {
    id:          o.id,
    number:      o.order_number,
    table:       o.table_number || o.table_id,
    status:      o.status,
    total:       parseFloat(o.total_amount || o.total || 0),
    placedAt:    new Date(o.created_at).getTime(),
    customer:    o.user_display_name || o.customer || "Walk-in",
    payment:     o.payment_method || "QR",
    items: (o.items || []).map(it => ({
      id:        it.id,
      name:      it.menu_item_name || it.name,
      qty:       it.quantity || it.qty,
      note:      it.note,
      unitPrice: parseFloat(it.unit_price || 0),
    })),
  };
}

// Normalise API staff → owner shape
function normalizeStaff(s) {
  return {
    id:        s.id,
    name:      s.display_name || s.username,
    username:  s.username,
    role:      s.role,
    active:    s.is_active ?? s.active ?? true,
    email:     s.email || "",
    lastLogin: s.last_login ? new Date(s.last_login).getTime() : Date.now() - 86400000,
  };
}

// Normalise API table → owner shape
function normalizeTable(t) {
  return {
    id:       t.id,
    number:   t.table_number,
    seats:    t.capacity || t.seats || 4,
    zone:     t.zone || "ทั่วไป",
    active:   t.status !== "closed" && (t.is_active ?? t.active ?? true),
    status:   t.status || "free",
    label:    t.label || `โต๊ะ ${t.table_number}`,
    qrUrl:    t.qr_url || null,
  };
}

function OwnerApp() {
  const [user, setUser]         = useSO(null);
  const [page, setPage]         = useSO("dashboard");
  const [orders, setOrders]     = useSO(window.O_ORDERS || []);
  const [menu, setMenu]         = useSO(window.MENU ? window.MENU.map(m => ({ ...m, available: true })) : []);
  const [categories, setCategories] = useSO(window.O_CATEGORIES || []);
  const [staff, setStaff]       = useSO(window.O_STAFF || []);
  const [tables, setTables]     = useSO(window.O_TABLES || []);
  const [openOrderId, setOpenOrderId] = useSO(null);
  const [toast, setToast]       = useSO(null);

  const showToast = useCBO((msg, icon) => {
    setToast({ msg, icon });
  }, []);

  // ── Load all data once user is logged in ────────────────────
  useEO(() => {
    if (!user) return;
    async function loadAll() {
      try {
        const [ordersRes, menuRes, catsRes, staffRes, tablesRes] = await Promise.allSettled([
          API.owner.orders(),
          API.menu.list(),
          API.menu.categories(),
          API.owner.staff.list(),
          API.owner.tables(),
        ]);
        if (ordersRes.status === "fulfilled") {
          const list = Array.isArray(ordersRes.value) ? ordersRes.value : (ordersRes.value?.orders || []);
          setOrders(list.map(normalizeOrder));
        }
        if (menuRes.status === "fulfilled") {
          const list = Array.isArray(menuRes.value) ? menuRes.value : [];
          setMenu(list.map(normalizeMenuItem));
        }
        if (catsRes.status === "fulfilled") {
          const list = Array.isArray(catsRes.value) ? catsRes.value : [];
          // Prepend "rec" tab, then API categories
          const apiCats = list.map(c => ({ id: c.id, name: c.name, nameEn: c.name_en || c.nameEn || "", active: true }));
          setCategories([{ id: "rec", name: "แนะนำ", nameEn: "Recommended", active: true }, ...apiCats]);
        }
        if (staffRes.status === "fulfilled") {
          const list = Array.isArray(staffRes.value) ? staffRes.value : [];
          setStaff(list.map(normalizeStaff));
        }
        if (tablesRes.status === "fulfilled") {
          const list = Array.isArray(tablesRes.value) ? tablesRes.value : [];
          setTables(list.map(normalizeTable));
        }
      } catch { /* API down — state keeps mock data */ }
    }
    loadAll();
  }, [user]);

  const activeOrders = useMO(() => orders.filter(o => o.status === "paid" || o.status === "cooking"), [orders]);

  const refundOrder = useCBO(async (id, reason) => {
    // Optimistic update
    setOrders((list) => list.map(o => o.id === id ? { ...o, status: "refunded", refundReason: reason } : o));
    setOpenOrderId(null);
    try { await API.orders.refund(id, reason); } catch {}
  }, []);

  const toggleMenu = useCBO(async (id, value) => {
    setMenu((list) => list.map(m => m.id === id ? { ...m, available: value } : m));
    showToast(value ? "เปิดขายเมนูแล้ว" : "ปิดขายเมนูแล้ว", "Check");
    try { await API.menu.toggleAvail(id, value); } catch {}
  }, [showToast]);

  const saveMenu = useCBO(async (data) => {
    try {
      if (data.id) {
        const updated = await API.menu.update(data.id, data);
        setMenu((list) => list.map(m => m.id === data.id ? normalizeMenuItem(updated) : m));
      } else {
        const created = await API.menu.create(data);
        setMenu((list) => [...list, normalizeMenuItem(created)]);
      }
      showToast(data.id ? "อัปเดตเมนูแล้ว" : "เพิ่มเมนูใหม่แล้ว", "Check");
    } catch (err) {
      // Optimistic fallback
      setMenu((list) => {
        if (data.id) return list.map(m => m.id === data.id ? { ...m, ...data } : m);
        return [...list, { ...data, id: `m${Date.now()}`, rating: 4.5, reviews: 0 }];
      });
      showToast(data.id ? "อัปเดตเมนูแล้ว (offline)" : "เพิ่มเมนูใหม่แล้ว (offline)", "Check");
    }
  }, [showToast]);

  const deleteMenu = useCBO(async (id) => {
    setMenu((list) => list.filter(m => m.id !== id));
    showToast("ลบเมนูแล้ว", "Trash");
    try { await API.menu.remove(id); } catch {}
  }, [showToast]);

  const toggleStaff = useCBO(async (id) => {
    setStaff((list) => list.map(s => {
      if (s.id !== id) return s;
      const next = { ...s, active: !s.active };
      API.owner.staff.update(id, { is_active: next.active }).catch(() => {});
      return next;
    }));
    showToast("อัปเดตสถานะพนักงานแล้ว", "Check");
  }, [showToast]);

  const handleLogout = useCBO(() => {
    API.auth.logout();
    setUser(null);
    setOrders(window.O_ORDERS || []);
    setMenu(window.MENU ? window.MENU.map(m => ({ ...m, available: true })) : []);
    setCategories(window.O_CATEGORIES || []);
    setStaff(window.O_STAFF || []);
    setTables(window.O_TABLES || []);
  }, []);

  const ctx = {
    user, orders, menu, categories, staff, tables,
    activeOrders,
    nav: setPage,
    openOrder: setOpenOrderId,
    refundOrder, toggleMenu, saveMenu, deleteMenu, toggleStaff,
    showToast,
  };

  if (!user) return <OLogin onLogin={setUser} />;

  return (
    <div className="o-app">
      <Sidebar
        page={page}
        onNav={setPage}
        user={user}
        onLogout={handleLogout}
        activeOrderCount={activeOrders.length}
      />

      <main className="o-main">
        {page === "dashboard" && <ODashboard ctx={ctx} />}
        {page === "orders"    && <OOrders ctx={ctx} />}
        {page === "menu"      && <OMenu ctx={ctx} />}
        {page === "tables"    && <OTables ctx={ctx} />}
        {page === "reports"   && <OReports ctx={ctx} />}
        {page === "staff"     && <OStaff ctx={ctx} />}
        {page === "settings"  && <OSettings ctx={ctx} />}
        {page === "audit"     && <OAudit ctx={ctx} />}
      </main>

      {openOrderId && (
        <OOrderDetail orderId={openOrderId} onClose={() => setOpenOrderId(null)} ctx={ctx} />
      )}

      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}

const oRoot = ReactDOM.createRoot(document.getElementById("root"));
oRoot.render(<OwnerApp />);
