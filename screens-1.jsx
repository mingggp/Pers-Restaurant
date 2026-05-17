// Screens 1-3: Welcome, Menu, Item Detail
const { useState: useState13, useEffect: useEffect13, useMemo: useMemo13, useRef: useRef13 } = React;

// ============================================================
// 1. WELCOME
// ============================================================
function WelcomeScreen({ ctx }) {
  const [loading, setLoading] = useState13(true);
  useEffect13(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="page" style={{ background: "rgb(var(--bg-base))" }}>
      {/* hero */}
      <div style={{
        flex: 1,
        display: "flex", flexDirection: "column",
        padding: "60px 24px 24px",
        position: "relative", overflow: "hidden",
        background: "linear-gradient(180deg, #fff7ed 0%, #ffffff 70%)",
      }}>
        {/* decorative dots */}
        <div aria-hidden="true" style={{ position: "absolute", top: 80, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgb(var(--brand-primary) / 0.12), transparent 70%)" }} />
        <div aria-hidden="true" style={{ position: "absolute", bottom: 100, left: -60, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgb(var(--color-warning) / 0.1), transparent 70%)" }} />

        {/* user pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgb(var(--bg-base))", border: "1px solid rgb(var(--border-default))", borderRadius: 9999, alignSelf: "flex-start", boxShadow: "var(--shadow-sm)" }}>
          {loading ? (
            <>
              <Skeleton w={28} h={28} r={9999} />
              <Skeleton w={90} h={12} />
            </>
          ) : (
            <>
              <LineAvatar user={ctx.user} size={28} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>สวัสดีคุณ {ctx.user.displayName}</span>
            </>
          )}
        </div>

        {/* logo / brand */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", marginTop: 24, position: "relative", zIndex: 2 }}>
          <div style={{
            width: 96, height: 96, borderRadius: 28,
            background: "linear-gradient(135deg, rgb(var(--brand-primary)) 0%, #ea580c 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 12px 28px rgb(var(--brand-primary) / 0.32)",
            marginBottom: 24,
            color: "white",
          }}>
            <Icon name="ChefHat" size={52} stroke={1.6} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "rgb(var(--brand-primary))", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{ctx.restaurant.tagline}</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: -0.5, color: "rgb(var(--text-primary))" }}>{ctx.restaurant.nameTh}</h1>
          <div style={{ fontSize: 14, color: "rgb(var(--text-muted))", marginTop: 4 }}>{ctx.restaurant.name}</div>

          {/* table number */}
          <div style={{ marginTop: 36, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: "rgb(var(--text-muted))", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="MapPin" size={14} />
              <span>คุณอยู่ที่</span>
            </div>
            <div style={{
              padding: "16px 36px",
              border: "2px dashed rgb(var(--brand-primary) / 0.4)",
              borderRadius: 20,
              background: "rgb(var(--brand-tint))",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
            }}>
              <div style={{ fontSize: 13, color: "rgb(var(--brand-primary))", fontWeight: 600 }}>โต๊ะ</div>
              <div style={{ fontSize: 56, fontWeight: 800, color: "rgb(var(--brand-primary))", lineHeight: 1, marginTop: 2 }}>{loading ? <span style={{opacity:0.4}}>—</span> : ctx.restaurant.table}</div>
            </div>
          </div>
        </div>
      </div>

      {/* sticky bottom CTA */}
      <div style={{ padding: "16px 20px 28px", background: "rgb(var(--bg-base))", borderTop: "1px solid rgb(var(--border-default))", display: "flex", flexDirection: "column", gap: 10 }}>
        {ctx.isLoggedIn ? (
          <Button variant="primary" size="lg" block rightIcon="ArrowRight"
            onClick={() => ctx.nav("menu")} disabled={loading || ctx.authLoading}>
            เริ่มสั่งอาหาร
          </Button>
        ) : (
          <>
            <Button variant="primary" size="lg" block
              onClick={ctx.loginWithLINE} disabled={loading || ctx.authLoading}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                {/* LINE logo mark */}
                <span style={{ width: 22, height: 22, borderRadius: 5, background: "#06C755", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "white", flexShrink: 0 }}>L</span>
                เข้าสู่ระบบด้วย LINE
              </span>
            </Button>
            <button onClick={() => ctx.nav("menu")}
              style={{ background: "none", border: "none", fontSize: 12, color: "rgb(var(--text-faint))", cursor: "pointer", textDecoration: "underline" }}>
              ข้ามการเข้าสู่ระบบ (ทดสอบ)
            </button>
          </>
        )}
        <div style={{ fontSize: 11, color: "rgb(var(--text-faint))", textAlign: "center" }}>
          ปลอดภัยและเป็นส่วนตัว • ข้อมูลไม่ถูกส่งให้บุคคลที่สาม
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 2. MENU
// ============================================================
function MenuScreen({ ctx }) {
  const cats = ctx.categories.length ? ctx.categories : (window.CATEGORIES || []);
  const [activeCat, setActiveCat] = useState13(cats[0]?.id || "rec");
  const [search, setSearch] = useState13("");

  // Use API menu items; fall back to window.MENU if empty
  const allItems = ctx.menuItems.length ? ctx.menuItems : (window.MENU || []);
  const loading  = ctx.menuLoading;

  const items = useMemo13(() => {
    let list = allItems;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(it =>
        it.name.toLowerCase().includes(q) ||
        (it.name_en || it.nameEn || "").toLowerCase().includes(q)
      );
    } else if (activeCat === "rec") {
      list = list.filter(it => it.is_recommended || it.rec);
    } else {
      list = list.filter(it => (it.category_id || it.cat) === activeCat);
    }
    return list;
  }, [allItems, activeCat, search]);

  const cartCount = ctx.cart.reduce((s, l) => s + l.qty, 0);
  const cartTotal = ctx.cartTotal;

  return (
    <div className="page" style={{ background: "rgb(var(--bg-subtle))" }}>
      {/* sticky chrome */}
      <div className="chrome" style={{ position: "sticky", top: 0, zIndex: 30, padding: "12px 16px 0", flexShrink: 0 }}>
        {/* row 1: brand + table + cart */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, rgb(var(--brand-primary)) 0%, #ea580c 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
            <Icon name="ChefHat" size={20} stroke={1.8} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{ctx.restaurant.nameTh}</div>
            <div style={{ fontSize: 11, color: "rgb(var(--text-muted))", display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
              <Icon name="MapPin" size={11} />
              <span>โต๊ะ {ctx.restaurant.table}</span>
              <span>•</span>
              <Icon name="History" size={11} />
              <button onClick={() => ctx.nav("history")} style={{ background: "none", border: "none", padding: 0, color: "inherit", cursor: "pointer", textDecoration: "underline" }}>ประวัติ</button>
            </div>
          </div>
          <button
            onClick={() => ctx.nav("cart")}
            aria-label="ดูตะกร้า"
            style={{ width: 40, height: 40, borderRadius: 12, background: "rgb(var(--bg-subtle))", border: "1px solid rgb(var(--border-default))", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", color: "rgb(var(--text-primary))" }}
          >
            <Icon name="ShoppingBag" size={20} />
            {cartCount > 0 && (
              <span style={{
                position: "absolute", top: -5, right: -5,
                background: "rgb(var(--brand-primary))", color: "white",
                borderRadius: 9999, minWidth: 18, height: 18, padding: "0 5px",
                fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid rgb(var(--bg-base))",
              }}>{cartCount}</span>
            )}
          </button>
        </div>

        {/* row 2: search */}
        <div style={{ marginBottom: 10 }}>
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {/* row 3: category tabs */}
        <div className="scroll-x" style={{ display: "flex", gap: 8, padding: "4px 0 12px", marginRight: -16 }}>
          {cats.map(cat => (
            <button
              key={cat.id}
              className={`tab-pill ${(!search && activeCat === cat.id) ? "active" : ""}`}
              onClick={() => { setActiveCat(cat.id); setSearch(""); }}
              aria-pressed={!search && activeCat === cat.id}
            >{cat.name}</button>
          ))}
          <div style={{ minWidth: 16, flexShrink: 0 }} />
        </div>
      </div>

      {/* grid */}
      <div className="scroll-y" style={{ padding: "12px 16px 120px" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[1,2,3,4].map(i => (
              <div key={i}>
                <Skeleton h={150} r={12} />
                <Skeleton w="80%" h={14} style={{ marginTop: 10 }} />
                <Skeleton w="50%" h={12} style={{ marginTop: 6 }} />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon="Search"
            title="ไม่พบเมนูที่ค้นหา"
            body={search ? `ไม่พบเมนู "${search}" ลองค้นหาด้วยคำอื่น` : "ยังไม่มีเมนูในหมวดนี้"}
            ctaLabel="ดูเมนูทั้งหมด"
            onCta={() => { setActiveCat("rec"); setSearch(""); }}
          />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {items.map(item => <MenuCard key={item.id} item={item} ctx={ctx} />)}
          </div>
        )}
      </div>

      {/* floating cart bar */}
      {cartCount > 0 && (
        <div className="fab-cart" onClick={() => ctx.nav("cart")} role="button" tabIndex={0}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9999, background: "rgb(var(--brand-primary))", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <Icon name="ShoppingBag" size={16} />
              <span style={{ position: "absolute", top: -4, right: -4, background: "white", color: "rgb(var(--text-primary))", fontSize: 10, fontWeight: 800, borderRadius: 9999, minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{cartCount}</span>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.7, lineHeight: 1 }}>{cartCount} รายการในตะกร้า</div>
              <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>ดูตะกร้า</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 17, fontWeight: 800 }}>{fmtTHB(cartTotal)}</span>
            <Icon name="ChevronRight" size={18} />
          </div>
        </div>
      )}
    </div>
  );
}

function MenuCard({ item, ctx }) {
  const [pulse, setPulse] = useState13(false);
  const onQuickAdd = (e) => {
    e.stopPropagation();
    ctx.quickAdd(item);
    setPulse(true);
    setTimeout(() => setPulse(false), 350);
  };
  return (
    <div
      onClick={() => ctx.openItem(item.id)}
      style={{ cursor: "pointer", display: "flex", flexDirection: "column" }}
      role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") ctx.openItem(item.id); }}
    >
      <div style={{ position: "relative" }}>
        <DishArt item={item} />
        <button
          onClick={onQuickAdd}
          aria-label={`เพิ่ม ${item.name} ลงตะกร้า`}
          style={{
            position: "absolute", bottom: 8, right: 8,
            width: 34, height: 34, borderRadius: 9999,
            background: "rgb(var(--brand-primary))", color: "white",
            border: "2px solid white",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
            transform: pulse ? "scale(1.18)" : "scale(1)",
            transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        ><Icon name="Plus" size={18} stroke={2.6} /></button>
      </div>
      <div style={{ marginTop: 8, padding: "0 2px" }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3, color: "rgb(var(--text-primary))", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 36 }}>
          {item.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "rgb(var(--text-primary))" }}>{fmtTHB(item.price)}</div>
          <div style={{ fontSize: 11, color: "rgb(var(--text-muted))", display: "flex", alignItems: "center", gap: 2 }}>
            <Icon name="Star" size={11} stroke={2.4} style={{ color: "rgb(var(--color-warning))", fill: "rgb(var(--color-warning))" }} />
            <span>{item.rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 3. ITEM DETAIL (BottomSheet)
// ============================================================
function ItemDetailSheet({ open, itemId, onClose, ctx }) {
  // ค้นหาจาก API items ก่อน ถ้าไม่เจอค่อย fallback ไป window.MENU
  const item = useMemo13(() => {
    const fromApi = (ctx.menuItems || []).find(m => m.id === itemId);
    if (fromApi) return fromApi;
    return (window.MENU || []).find(m => m.id === itemId);
  }, [itemId, ctx.menuItems]);

  const optionGroupIds = item ? ((window.OPTIONS_BY_CAT && window.OPTIONS_BY_CAT[item.cat]) || []) : [];

  const initialOptions = useMemo13(() => {
    const obj = {};
    optionGroupIds.forEach(gid => {
      const grp = window.OPTION_GROUPS && window.OPTION_GROUPS[gid];
      if (!grp) return;
      if (grp.type === "radio") {
        const def = grp.choices.find(c => c.default) || grp.choices[0];
        obj[gid] = def.id;
      } else {
        obj[gid] = [];
      }
    });
    return obj;
  }, [item]);

  const [options, setOptions] = useState13(initialOptions);
  const [qty, setQty] = useState13(1);
  const [note, setNote] = useState13("");

  useEffect13(() => {
    if (open) {
      setOptions(initialOptions);
      setQty(1);
      setNote("");
    }
  }, [open, itemId]);

  if (!item) return null;

  const optionsDelta = optionGroupIds.reduce((sum, gid) => {
    const grp = window.OPTION_GROUPS[gid];
    if (grp.type === "radio") {
      const c = grp.choices.find(c => c.id === options[gid]);
      return sum + (c ? c.priceDelta : 0);
    } else {
      const ids = options[gid] || [];
      return sum + ids.reduce((s, id) => {
        const c = grp.choices.find(c => c.id === id);
        return s + (c ? c.priceDelta : 0);
      }, 0);
    }
  }, 0);

  const unitPrice = item.price + optionsDelta;
  const totalPrice = unitPrice * qty;

  const onAdd = () => {
    ctx.addToCart({
      itemId: item.id,
      name: item.name,
      qty,
      options: { ...options },
      note,
      unitPrice,
    });
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel={`รายละเอียด ${item.name}`}>
      {/* close button overlay */}
      <button
        onClick={onClose}
        aria-label="ปิด"
        style={{ position: "absolute", top: 16, right: 16, zIndex: 10, width: 36, height: 36, borderRadius: 9999, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      ><Icon name="X" size={18} stroke={2.4} /></button>

      <div className="scroll-y" style={{ flex: 1 }}>
        {/* hero image */}
        <div style={{ width: "100%", aspectRatio: "16/11", position: "relative" }}>
          <DishArt item={item} size="lg" />
        </div>

        <div style={{ padding: "20px 20px 12px" }}>
          {/* title row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, lineHeight: 1.25 }}>{item.name}</h2>
              <div style={{ fontSize: 13, color: "rgb(var(--text-muted))", marginTop: 2 }}>{item.nameEn}</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "rgb(var(--brand-primary))", whiteSpace: "nowrap" }}>{fmtTHB(item.price)}</div>
          </div>

          {/* rating */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <Icon name="Star" size={16} stroke={2.4} style={{ color: "rgb(var(--color-warning))", fill: "rgb(var(--color-warning))" }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>{item.rating}</span>
            <span style={{ fontSize: 13, color: "rgb(var(--text-muted))" }}>({item.reviews} รีวิว)</span>
          </div>

          {/* description */}
          <p style={{ fontSize: 14, color: "rgb(var(--text-muted))", lineHeight: 1.6, marginTop: 14, marginBottom: 0, textWrap: "pretty" }}>
            {item.desc}
          </p>
        </div>

        {/* option groups */}
        {optionGroupIds.map(gid => {
          const grp = window.OPTION_GROUPS[gid];
          return (
            <div key={gid} style={{ padding: "12px 20px", borderTop: "8px solid rgb(var(--bg-subtle))" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{grp.title}</div>
                {grp.required && <Badge variant="neutral">จำเป็น</Badge>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {grp.choices.map(c => {
                  const checked = grp.type === "radio"
                    ? options[gid] === c.id
                    : (options[gid] || []).includes(c.id);
                  return (
                    <label key={c.id} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "12px 14px",
                      border: `1.5px solid ${checked ? "rgb(var(--brand-primary))" : "rgb(var(--border-default))"}`,
                      borderRadius: 12, cursor: "pointer",
                      background: checked ? "rgb(var(--brand-tint))" : "rgb(var(--bg-base))",
                      transition: "all 0.18s ease",
                    }}>
                      <input
                        type={grp.type === "radio" ? "radio" : "checkbox"}
                        name={gid}
                        checked={checked}
                        onChange={() => {
                          if (grp.type === "radio") {
                            setOptions(o => ({ ...o, [gid]: c.id }));
                          } else {
                            setOptions(o => {
                              const cur = o[gid] || [];
                              const next = cur.includes(c.id) ? cur.filter(x => x !== c.id) : [...cur, c.id];
                              return { ...o, [gid]: next };
                            });
                          }
                        }}
                        style={{ accentColor: "rgb(var(--brand-primary))", width: 18, height: 18, flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{c.name}</div>
                      {c.priceDelta > 0 && (
                        <div style={{ fontSize: 13, color: "rgb(var(--text-muted))", fontWeight: 600 }}>+{fmtTHB(c.priceDelta)}</div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* note */}
        <div style={{ padding: "12px 20px 20px", borderTop: "8px solid rgb(var(--bg-subtle))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Icon name="StickyNote" size={16} />
            <div style={{ fontSize: 15, fontWeight: 700 }}>ข้อความถึงครัว</div>
          </div>
          <textarea
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="เช่น ไม่ใส่ผัก, ไม่ใส่ผงชูรส, ทำเผ็ดน้อยพิเศษ"
            rows={2}
            style={{ resize: "none", fontFamily: "inherit", fontSize: 14, lineHeight: 1.5 }}
            maxLength={120}
          />
          <div style={{ fontSize: 11, color: "rgb(var(--text-faint))", textAlign: "right", marginTop: 4 }}>{note.length}/120</div>
        </div>

        {/* qty */}
        <div style={{ padding: "12px 20px 100px", borderTop: "8px solid rgb(var(--bg-subtle))", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>จำนวน</div>
          <QuantitySelector value={qty} onChange={setQty} min={1} max={20} />
        </div>
      </div>

      {/* sticky bottom CTA */}
      <div style={{ padding: "12px 16px 20px", borderTop: "1px solid rgb(var(--border-default))", background: "rgb(var(--bg-base))" }}>
        <Button variant="primary" size="lg" block onClick={onAdd} leftIcon="Plus">
          เพิ่มลงตะกร้า · {fmtTHB(totalPrice)}
        </Button>
      </div>
    </BottomSheet>
  );
}

Object.assign(window, { WelcomeScreen, MenuScreen, MenuCard, ItemDetailSheet });
