// Main App: state-based router, cart state, order flow — connected to real API

const { useState: useStateApp, useEffect: useEffectApp, useMemo: useMemoApp,
        useCallback: useCallbackApp, useRef: useRefApp } = React;

// API menu item (snake_case) → UI shape (camelCase) ที่ทุก screen + DishArt ใช้
// **สำคัญ**: DishArt อ่าน item.imageUrl เท่านั้น — ถ้าใช้ key อื่นรูปจะไม่ขึ้น
function normalizeCustomerMenuItem(m) {
  return {
    id:        m.id,
    name:      m.name,
    nameEn:    m.name_en ?? m.nameEn ?? "",
    cat:       m.category_id ?? m.cat,
    price:     parseFloat(m.price ?? 0),
    imageUrl:  m.image_url ?? m.imageUrl ?? m.image ?? null,
    desc:      m.description ?? m.desc ?? "",
    rec:       m.is_recommended ?? m.rec ?? false,
    available: m.is_available ?? m.available ?? true,
    rating:    parseFloat(m.rating ?? 4.5),
    reviews:   m.review_count ?? m.reviews ?? 0,
  };
}

function normalizeCustomerCategory(c) {
  return {
    id:     c.id,
    name:   c.name,
    nameEn: c.name_en ?? c.nameEn ?? "",
  };
}

function App() {
  const [page, setPage]           = useStateApp("welcome");
  const [pageDir, setPageDir]     = useStateApp("forward");
  const [cart, setCart]           = useStateApp([]);
  const [openItemId, setOpenItemId] = useStateApp(null);
  const [activeOrder, setActiveOrder] = useStateApp(null);
  const [toast, setToast]         = useStateApp(null);
  const [online, setOnline]       = useStateApp(true);

  // Auth state
  const [user, setUser]           = useStateApp(null);
  const [authLoading, setAuthLoading] = useStateApp(true);

  // Menu (loaded from API, falls back to window.MENU)
  const [menuItems, setMenuItems]     = useStateApp([]);
  const [categories, setCategories]   = useStateApp([]);
  const [menuLoading, setMenuLoading] = useStateApp(true);

  // Table number
  const [tableId, setTableId] = useStateApp(window.RESTAURANT.table);

  const lineCounter = useRefApp(0);

  // ── Online detector ──────────────────────────────────────
  useEffectApp(() => {
    const u = () => setOnline(navigator.onLine);
    window.addEventListener("online",  u);
    window.addEventListener("offline", u);
    return () => {
      window.removeEventListener("online",  u);
      window.removeEventListener("offline", u);
    };
  }, []);

  // ── Auth: restore session or consume ?token= from LINE redirect ──
  useEffectApp(() => {
    async function init() {
      try {
        const { table } = API.auth.consumeUrlToken();
        if (table) setTableId(table);

        if (API.auth.isLoggedIn()) {
          const me = await API.auth.me();
          if (me?.user) {
            setUser({
              id:          me.user.id,
              displayName: me.user.display_name,
              pictureUrl:  me.user.picture_url,
              initials:    (me.user.display_name || "?")[0],
            });
          }
        }
      } catch {
        API.auth.logout();
      } finally {
        setAuthLoading(false);
      }
    }
    init();
  }, []);

  // ── Load menu from API ───────────────────────────────────
  useEffectApp(() => {
    async function loadMenu() {
      try {
        const [items, cats] = await Promise.all([
          API.menu.list(),
          API.menu.categories(),
        ]);
        // Normalize เพื่อให้รูป/คำอธิบาย/หมวด ขึ้นทั้งหมด
        setMenuItems((items || []).map(normalizeCustomerMenuItem));

        const apiCats = (cats || []).map(normalizeCustomerCategory);
        // ใช้ API categories ตรงๆ ถ้าไม่มี "rec" ใน list (เช่นถูกลบ) จึง prepend ให้
        const hasRec = apiCats.some(c => c.id === "rec");
        setCategories(hasRec
          ? apiCats
          : [{ id: "rec", name: "แนะนำ", nameEn: "Recommended" }, ...apiCats]);
      } catch {
        // Fallback to mock data when API is unavailable
        setMenuItems(window.MENU || []);
        setCategories(window.CATEGORIES || []);
      } finally {
        setMenuLoading(false);
      }
    }
    loadMenu();
  }, []);

  // ── Cart total ───────────────────────────────────────────
  const cartTotal = useMemoApp(
    () => cart.reduce((s, l) => s + l.unitPrice * l.qty, 0),
    [cart]
  );

  const nav = useCallbackApp((next, opts = {}) => {
    setPageDir(opts.back ? "back" : "forward");
    setPage(next);
  }, []);

  const showToast = useCallbackApp((msg, opts = {}) => {
    setToast({ msg, icon: opts.icon, duration: opts.duration });
  }, []);

  const openItem  = useCallbackApp((id) => setOpenItemId(id), []);
  const closeItem = useCallbackApp(() => setOpenItemId(null), []);

  const loginWithLINE = useCallbackApp(() => {
    API.auth.lineRedirect(tableId);
  }, [tableId]);

  // ── Quick add (default options, qty 1) ───────────────────
  const quickAdd = useCallbackApp((item) => {
    // Build default options from mock data if available; API items may have no options
    const groups = (window.OPTIONS_BY_CAT && window.OPTIONS_BY_CAT[item.cat]) || [];
    const opts = {};
    groups.forEach((gid) => {
      const grp = window.OPTION_GROUPS && window.OPTION_GROUPS[gid];
      if (!grp) return;
      if (grp.type === "radio") {
        const def = grp.choices.find((c) => c.default) || grp.choices[0];
        opts[gid] = def.id;
      } else {
        opts[gid] = [];
      }
    });
    setCart((c) => [...c, {
      _id: `l${++lineCounter.current}`,
      itemId: item.id, name: item.name, qty: 1, options: opts, note: "", unitPrice: item.price,
    }]);
    showToast(`เพิ่ม ${item.name} แล้ว`, { icon: "Check" });
  }, [showToast]);

  const addToCart = useCallbackApp((line) => {
    setCart((c) => [...c, { ...line, _id: `l${++lineCounter.current}` }]);
    showToast(`เพิ่มลงตะกร้าแล้ว · ${line.qty} รายการ`, { icon: "Check" });
  }, [showToast]);

  const updateQty = useCallbackApp((lineId, qty) => {
    setCart((c) => c.map((l) => (l._id === lineId ? { ...l, qty } : l)));
  }, []);

  const removeFromCart = useCallbackApp((lineId) => {
    setCart((c) => c.filter((l) => l._id !== lineId));
    showToast("ลบรายการแล้ว", { icon: "Trash" });
  }, [showToast]);

  // ── Place order → real API ───────────────────────────────
  const placeOrder = useCallbackApp(async (total) => {
    try {
      const payload = {
        tableId,
        items: cart.map((line) => ({
          menuItemId: line.itemId,
          quantity:   line.qty,
          note:       line.note || undefined,
          // Convert options { groupId: choiceId } to [{ choiceId }]
          options: Object.values(line.options || {}).flat().map((id) => ({ choiceId: id })).filter(Boolean),
        })),
      };

      const res = await API.orders.place(payload);
      setActiveOrder({
        id:     res.orderId,
        number: res.orderNumber,
        items:  cart,
        total:  res.total,
        status: "pending",
      });
      nav("payment");
    } catch (err) {
      showToast(err.message || "สั่งอาหารไม่สำเร็จ กรุณาลองใหม่", { icon: "AlertCircle" });
    }
  }, [cart, tableId, nav, showToast]);

  const completePayment = useCallbackApp(async () => {
    if (!activeOrder) return;
    try {
      await API.orders.setStatus(activeOrder.id, "paid");
    } catch { /* non-critical */ }
    setActiveOrder((o) => o ? { ...o, status: "cooking" } : o);
    setCart([]);
    nav("tracking");
    setTimeout(() => showToast("ครัวเริ่มทำอาหารแล้ว", { icon: "ChefHat" }), 600);
  }, [activeOrder, nav, showToast]);

  // ── Context ──────────────────────────────────────────────
  const ctx = {
    user: user || window.LINE_USER,
    isLoggedIn: !!user,
    authLoading,
    loginWithLINE,
    restaurant: { ...window.RESTAURANT, table: tableId },
    menuItems,
    categories,
    menuLoading,
    cart, cartTotal, activeOrder,
    nav, openItem,
    addToCart, quickAdd, updateQty, removeFromCart,
    placeOrder, completePayment,
    showToast,
  };

  let screen = null;
  if (page === "welcome")  screen = <WelcomeScreen ctx={ctx} />;
  if (page === "menu")     screen = <MenuScreen ctx={ctx} />;
  if (page === "cart")     screen = <CartScreen ctx={ctx} />;
  if (page === "payment")  screen = <PaymentScreen ctx={ctx} />;
  if (page === "tracking") screen = <TrackingScreen ctx={ctx} />;
  if (page === "history")  screen = <HistoryScreen ctx={ctx} />;

  return (
    <div className="app-shell">
      <div key={page} className={pageDir === "back" ? "page-back" : "page-enter"}
        style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
        {screen}
      </div>

      <ItemDetailSheet open={!!openItemId} itemId={openItemId} onClose={closeItem} ctx={ctx} />
      <Toast toast={toast} onDone={() => setToast(null)} />

      {!online && (
        <div style={{
          position: "absolute", top: 50, left: 12, right: 12, zIndex: 200,
          background: "rgb(var(--color-error))", color: "white",
          padding: "8px 12px", borderRadius: 12,
          fontSize: 13, fontWeight: 500,
          display: "flex", alignItems: "center", gap: 8,
          boxShadow: "var(--shadow-md)",
        }}>
          <Icon name="WifiOff" size={16} />
          <span>ไม่มีการเชื่อมต่ออินเทอร์เน็ต</span>
        </div>
      )}
    </div>
  );
}

function Stage() {
  const [scale, setScale] = useStateApp(1);
  const W = 402, H = 874;

  useEffectApp(() => {
    const fit = () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const margin = 24;
      setScale(Math.min(1, (vw - margin * 2) / W, (vh - margin * 2) / H));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div className="stage">
      <div style={{ transform: `scale(${scale})`, transformOrigin: "center center", width: W, height: H }}>
        <IOSDevice width={W} height={H}>
          <div className="device-screen"><App /></div>
        </IOSDevice>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Stage />);
