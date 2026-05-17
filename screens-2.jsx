// Screens 4-7: Cart, Payment, Tracking, History
const { useState: useState47, useEffect: useEffect47, useMemo: useMemo47, useRef: useRef47 } = React;

// Helper: build option summary string (graceful — returns "" for API items with no mock options)
function optionSummary(line) {
  if (!window.OPTIONS_BY_CAT || !window.OPTION_GROUPS) return "";
  const item = (window.MENU || []).find(m => m.id === line.itemId);
  if (!item) return "";
  const groups = window.OPTIONS_BY_CAT[item.cat] || [];
  const parts = [];
  groups.forEach(gid => {
    const grp = window.OPTION_GROUPS[gid];
    if (!grp) return;
    if (grp.type === "radio") {
      const c = grp.choices.find(c => c.id === (line.options || {})[gid]);
      if (c) parts.push(c.name);
    } else {
      ((line.options || {})[gid] || []).forEach(id => {
        const c = grp.choices.find(c => c.id === id);
        if (c) parts.push("+ " + c.name);
      });
    }
  });
  return parts.join(" · ");
}
window.optionSummary = optionSummary;

// ============================================================
// 4. CART
// ============================================================
function CartScreen({ ctx }) {
  const cart = ctx.cart;
  const subtotal = ctx.cartTotal;
  const serviceFee = subtotal > 0 ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + serviceFee;
  const totalCount = cart.reduce((s, l) => s + l.qty, 0);

  return (
    <div className="page">
      <ScreenHeader title="ตะกร้าของฉัน" subtitle={cart.length ? `${totalCount} รายการ` : null} onBack={() => ctx.nav("menu", { back: true })} />

      <div className="scroll-y" style={{ padding: "12px 16px", paddingBottom: cart.length ? 24 : 0 }}>
        {cart.length === 0 ? (
          <EmptyState
            icon="ShoppingBag"
            title="ตะกร้าของคุณว่างอยู่"
            body="เลือกเมนูที่คุณชื่นชอบเพื่อเริ่มสั่งอาหาร"
            ctaLabel="กลับไปดูเมนู"
            onCta={() => ctx.nav("menu", { back: true })}
          />
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {cart.map((line, idx) => (
                <CartLine key={line._id} line={line} ctx={ctx} idx={idx} />
              ))}
            </div>

            {/* summary */}
            <div className="card" style={{ marginTop: 16, padding: 16, background: "rgb(var(--bg-base))" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "rgb(var(--text-muted))", marginBottom: 8 }}>
                <span>รวม {totalCount} รายการ</span>
                <span>{fmtTHB(subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "rgb(var(--text-muted))", marginBottom: 8 }}>
                <span>ค่าบริการ (10%)</span>
                <span>{fmtTHB(serviceFee)}</span>
              </div>
              <hr className="dotted-divider" style={{ margin: "12px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>ยอดสุทธิ</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: "rgb(var(--text-primary))" }}>{fmtTHB(total)}</span>
              </div>
            </div>

            {/* trust note */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 14, padding: "12px 14px", background: "rgb(var(--brand-tint))", borderRadius: 12 }}>
              <Icon name="Sparkles" size={16} style={{ color: "rgb(var(--brand-primary))", flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12, color: "rgb(var(--text-primary))", lineHeight: 1.5 }}>
                ครัวจะเริ่มทำอาหารเมื่อชำระเงินสำเร็จ • โปรดตรวจสอบรายการก่อนสั่ง
              </div>
            </div>
          </>
        )}
      </div>

      {/* sticky CTA */}
      {cart.length > 0 && (
        <div className="sticky-bottom">
          <Button
            variant="primary" size="lg" block
            onClick={() => ctx.placeOrder(total)}
            rightIcon="ArrowRight"
          >สั่งและจ่ายเงิน · {fmtTHB(total)}</Button>
        </div>
      )}
    </div>
  );
}

function CartLine({ line, ctx, idx }) {
  // ใช้ name ที่เก็บใน line ก่อน ถ้าไม่มีค่อย lookup จาก menuItems หรือ window.MENU
  const item = (ctx.menuItems || []).find(m => m.id === line.itemId)
            || (window.MENU || []).find(m => m.id === line.itemId)
            || { name: line.name || "รายการอาหาร", price: line.unitPrice };
  const summary = optionSummary(line);
  const lineTotal = line.unitPrice * line.qty;

  return (
    <div className="row-card" style={{ animation: `slideUp 0.3s ${idx * 0.04}s both cubic-bezier(0.32, 0.72, 0, 1)` }}>
      <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 10, overflow: "hidden", position: "relative" }}>
        <DishArt item={item} size="sm" />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, color: "rgb(var(--text-primary))" }}>{item.name}</div>
          <button
            onClick={() => ctx.removeFromCart(line._id)}
            aria-label="ลบรายการ"
            style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: "rgb(var(--text-faint))", flexShrink: 0, marginTop: -2, marginRight: -4 }}
          ><Icon name="Trash" size={16} /></button>
        </div>
        {summary && (
          <div style={{ fontSize: 11.5, color: "rgb(var(--text-muted))", marginTop: 2, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {summary}
          </div>
        )}
        {line.note && (
          <div style={{ fontSize: 11.5, color: "rgb(var(--brand-primary))", marginTop: 2, fontStyle: "italic", display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="StickyNote" size={11} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{line.note}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <QuantitySelector
            value={line.qty}
            onChange={(v) => ctx.updateQty(line._id, v)}
            min={1} max={20} size="sm"
          />
          <div style={{ fontSize: 15, fontWeight: 700 }}>{fmtTHB(lineTotal)}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 5. PAYMENT
// ============================================================
function PaymentScreen({ ctx }) {
  const order = ctx.activeOrder;
  const [secondsLeft, setSecondsLeft] = useState47(10 * 60);
  const [confirmBack, setConfirmBack] = useState47(false);
  const [paid, setPaid] = useState47(false);

  useEffect47(() => {
    if (paid) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [paid]);

  const onSimulatePay = () => {
    setPaid(true);
    setTimeout(() => {
      ctx.completePayment();
    }, 1700);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const danger = secondsLeft < 60;

  if (!order) {
    return (
      <div className="page">
        <ScreenHeader title="ชำระเงิน" onBack={() => ctx.nav("menu", { back: true })} />
        <EmptyState icon="AlertCircle" title="ไม่พบออเดอร์" body="ออเดอร์อาจหมดอายุแล้ว" ctaLabel="กลับไปสั่งใหม่" onCta={() => ctx.nav("menu", { back: true })} />
      </div>
    );
  }

  return (
    <div className="page">
      <ScreenHeader
        title="ชำระเงิน"
        onBack={() => paid ? null : setConfirmBack(true)}
      />

      <div className="scroll-y" style={{ padding: "16px 20px 24px" }}>
        {paid ? (
          <PaymentSuccess />
        ) : (
          <>
            {/* PromptPay card */}
            <div className="card-soft" style={{ padding: "20px 20px 24px", textAlign: "center", background: "rgb(var(--bg-base))" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                <PromptPayMark />
              </div>

              {/* QR */}
              <div className="qr-frame" style={{ display: "inline-block", margin: "0 auto" }}>
                <QRCode data={`pp-${order.id}-${order.total}`} size={200} />
              </div>

              {/* amount */}
              <div style={{ marginTop: 18 }}>
                <div style={{ fontSize: 12, color: "rgb(var(--text-muted))" }}>ยอดที่ต้องชำระ</div>
                <div style={{ fontSize: 38, fontWeight: 800, color: "rgb(var(--brand-primary))", lineHeight: 1.1, marginTop: 2 }}>
                  {fmtTHB(order.total)}
                </div>
                <div style={{ fontSize: 11, color: "rgb(var(--text-faint))", marginTop: 6, fontFamily: "ui-monospace, SF Mono, monospace" }}>
                  Order #{order.id}
                </div>
              </div>
            </div>

            {/* timer */}
            <div style={{
              marginTop: 14, padding: "12px 14px",
              background: danger ? "rgb(var(--color-error) / 0.08)" : "rgb(var(--bg-base))",
              border: `1px solid ${danger ? "rgb(var(--color-error) / 0.3)" : "rgb(var(--border-default))"}`,
              borderRadius: 12,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <Icon name="Clock" size={18} style={{ color: danger ? "rgb(var(--color-error))" : "rgb(var(--text-muted))" }} />
              <div style={{ flex: 1, fontSize: 13, color: danger ? "rgb(var(--color-error))" : "rgb(var(--text-primary))", fontWeight: 500 }}>
                ชำระภายใน{" "}
                <span style={{ fontFamily: "ui-monospace, SF Mono, monospace", fontWeight: 700, fontSize: 14 }}>{mm}:{ss}</span>{" "}
                นาที
              </div>
              {danger && <span className="badge badge-error">เร่งด่วน</span>}
            </div>

            {/* status */}
            <div style={{ marginTop: 14, padding: "14px 16px", background: "rgb(var(--bg-base))", border: "1px solid rgb(var(--border-default))", borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <Icon name="Loader" size={18} className="spin" style={{ color: "rgb(var(--brand-primary))", flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>
                กำลังรอชำระเงิน<span className="dots" style={{ marginLeft: 4 }}><span/><span/><span/></span>
              </div>
            </div>

            {/* instructions */}
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgb(var(--text-primary))", marginBottom: 10 }}>วิธีชำระเงิน</div>
              <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "เปิดแอปธนาคารหรือ e-Wallet ของคุณ",
                  "เลือก \"สแกน QR\" และสแกนรหัสด้านบน",
                  "ตรวจสอบยอดเงินให้ตรงและกด \"จ่าย\"",
                ].map((step, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "rgb(var(--text-muted))" }}>
                    <span style={{
                      flexShrink: 0,
                      width: 22, height: 22, borderRadius: 9999,
                      background: "rgb(var(--brand-tint))", color: "rgb(var(--brand-primary))",
                      fontSize: 12, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>{i + 1}</span>
                    <span style={{ lineHeight: 1.5, paddingTop: 1 }}>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* simulate-pay button (demo helper) */}
            <button
              onClick={onSimulatePay}
              style={{
                marginTop: 18, width: "100%",
                padding: "10px 12px", border: "1px dashed rgb(var(--border-strong))",
                borderRadius: 10, background: "rgb(var(--bg-subtle))",
                color: "rgb(var(--text-muted))", fontSize: 12, fontWeight: 500,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
              aria-label="จำลองการชำระเงินสำเร็จสำหรับเดโม"
            >
              <Icon name="Sparkles" size={13} />
              <span>จำลองชำระเงินสำเร็จ (Demo)</span>
            </button>
          </>
        )}
      </div>

      <ConfirmModal
        open={confirmBack}
        title="ยกเลิกการชำระเงิน?"
        body="ออเดอร์ของคุณจะถูกพักไว้ คุณกลับมาชำระภายหลังได้ที่ประวัติการสั่ง"
        confirmLabel="ยกเลิก"
        cancelLabel="ทำต่อ"
        danger
        onCancel={() => setConfirmBack(false)}
        onConfirm={() => { setConfirmBack(false); ctx.nav("cart", { back: true }); }}
      />
    </div>
  );
}

function PaymentSuccess() {
  return (
    <div style={{ padding: "60px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div className="scale-in" style={{ width: 96, height: 96, borderRadius: 9999, background: "rgb(var(--color-success))", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "0 12px 28px rgb(var(--color-success) / 0.36)" }}>
        <Icon name="Check" size={56} stroke={3} />
      </div>
      <div style={{ marginTop: 24, fontSize: 22, fontWeight: 800 }}>ชำระเงินสำเร็จ</div>
      <div style={{ marginTop: 6, fontSize: 14, color: "rgb(var(--text-muted))" }}>กำลังพาไปดูสถานะออเดอร์...</div>
      <div style={{ marginTop: 18 }}>
        <div className="dots" style={{ color: "rgb(var(--brand-primary))" }}><span/><span/><span/></div>
      </div>
    </div>
  );
}

// ============================================================
// 6. ORDER TRACKING
// ============================================================
function TrackingScreen({ ctx }) {
  const order = ctx.activeOrder;
  const [statusIdx, setStatusIdx] = useState47(2); // start at "preparing"
  const [pulse, setPulse] = useState47(false);
  const [expand, setExpand] = useState47(true);

  useEffect47(() => {
    // auto-progress to "ready" after 8s for demo
    const t = setTimeout(() => {
      setPulse(true);
      setStatusIdx(3);
      setTimeout(() => setPulse(false), 800);
    }, 8000);
    return () => clearTimeout(t);
  }, []);

  if (!order) {
    return (
      <div className="page">
        <ScreenHeader title="ติดตามออเดอร์" onBack={() => ctx.nav("menu", { back: true })} />
        <EmptyState icon="Receipt" title="ไม่พบออเดอร์" ctaLabel="กลับไปสั่งใหม่" onCta={() => ctx.nav("menu", { back: true })} />
      </div>
    );
  }

  const now = new Date();
  const fmtTime = (offMin) => {
    const d = new Date(now.getTime() - offMin * 60 * 1000);
    return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  };

  const steps = [
    { label: "ชำระเงินสำเร็จ",      time: fmtTime(4),   icon: "Check" },
    { label: "ครัวรับออเดอร์แล้ว",   time: fmtTime(3),   icon: "Check" },
    { label: "กำลังเตรียมอาหาร",    time: fmtTime(0),   icon: "ChefHat", animated: true },
    { label: "พร้อมเสิร์ฟ",         time: null,         icon: null },
  ];

  return (
    <div className="page">
      <ScreenHeader title={`ออเดอร์ #${order.id}`} onBack={() => ctx.nav("menu", { back: true })} />

      <div className="scroll-y" style={{ padding: "16px 16px 24px" }}>
        {/* status banner */}
        <div className="card-soft" style={{ padding: 18, background: "rgb(var(--bg-base))", textAlign: "center", overflow: "hidden", position: "relative" }}>
          {pulse && <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "rgb(var(--color-success) / 0.12)", animation: "fadeIn 0.4s ease" }} />}
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 12, color: "rgb(var(--text-muted))", textTransform: "uppercase", letterSpacing: 1.2 }}>สถานะปัจจุบัน</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: "rgb(var(--text-primary))" }}>
              {statusIdx >= 3 ? "พร้อมเสิร์ฟ! 🍽" : "กำลังเตรียมอาหาร"}
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: "rgb(var(--text-muted))", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icon name="Clock" size={14} />
              <span>{statusIdx >= 3 ? "อาหารพร้อมรับประทานแล้ว" : "ประมาณ 10–15 นาที"}</span>
            </div>
          </div>
        </div>

        {/* timeline */}
        <div className="card" style={{ marginTop: 14, padding: "20px 18px 16px", background: "rgb(var(--bg-base))" }}>
          <div className="timeline">
            {steps.map((step, i) => {
              const state = i < statusIdx ? "done" : i === statusIdx ? "active" : "pending";
              return (
                <div key={i} className={`timeline-step ${state}`}>
                  <div className="dot">
                    {state === "done" && <Icon name="Check" size={12} stroke={3} />}
                    {state === "active" && step.animated && (
                      <Icon name="ChefHat" size={12} stroke={2.4} />
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: state === "pending" ? 500 : 600, color: state === "pending" ? "rgb(var(--text-faint))" : "rgb(var(--text-primary))" }}>
                      {step.label}
                      {state === "active" && <span className="dots" style={{ marginLeft: 6, color: "rgb(var(--color-warning))" }}><span/><span/><span/></span>}
                    </div>
                    {step.time && (
                      <div style={{ fontSize: 12, color: "rgb(var(--text-muted))", fontVariantNumeric: "tabular-nums" }}>{step.time}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* order items */}
        <div className="card" style={{ marginTop: 14, background: "rgb(var(--bg-base))" }}>
          <button
            onClick={() => setExpand(e => !e)}
            style={{ width: "100%", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="Receipt" size={16} />
              <span style={{ fontSize: 14, fontWeight: 700 }}>รายการที่สั่ง ({order.items.length})</span>
            </div>
            <Icon name={expand ? "ChevronUp" : "ChevronDown"} size={18} style={{ color: "rgb(var(--text-muted))" }} />
          </button>
          {expand && (
            <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="divider" />
              {order.items.map((line, idx) => {
                const item = (ctx.menuItems || []).find(m => m.id === line.itemId)
                          || (window.MENU || []).find(m => m.id === line.itemId)
                          || { name: line.name || "รายการอาหาร" };
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 8, overflow: "hidden" }}><DishArt item={item} size="sm" /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{item?.name}</div>
                      {optionSummary(line) && <div style={{ fontSize: 11, color: "rgb(var(--text-muted))", marginTop: 1 }}>{optionSummary(line)}</div>}
                    </div>
                    <div style={{ fontSize: 12, color: "rgb(var(--text-muted))", whiteSpace: "nowrap" }}>×{line.qty}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{fmtTHB(line.unitPrice * line.qty)}</div>
                  </div>
                );
              })}
              <div className="divider" />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 13, color: "rgb(var(--text-muted))" }}>ยอดสุทธิ</span>
                <span style={{ fontSize: 18, fontWeight: 800 }}>{fmtTHB(order.total)}</span>
              </div>
            </div>
          )}
        </div>

        {/* actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <Button variant="secondary" block leftIcon="Plus" onClick={() => ctx.nav("menu", { back: true })}>สั่งเพิ่ม</Button>
          <Button variant="secondary" block leftIcon="History" onClick={() => ctx.nav("history")}>ดูประวัติ</Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 7. ORDER HISTORY
// ============================================================
function HistoryScreen({ ctx }) {
  const [tab, setTab] = useState47("today");
  const [apiHistory, setApiHistory] = useState47([]);
  const [histLoading, setHistLoading] = useState47(false);

  // Load history from API when logged in
  useEffect47(() => {
    if (!ctx.isLoggedIn) return;
    setHistLoading(true);
    API.orders.my()
      .then((data) => setApiHistory(data || []))
      .catch(() => setApiHistory([]))
      .finally(() => setHistLoading(false));
  }, [ctx.isLoggedIn]);

  // Active order in today list
  const todayOrders = useMemo47(() => {
    const list = [];
    if (ctx.activeOrder) {
      const allItems = ctx.menuItems.length ? ctx.menuItems : (window.MENU || []);
      list.push({
        id: ctx.activeOrder.id,
        time: "วันนี้ " + new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        today: true,
        total: ctx.activeOrder.total,
        status: ctx.activeOrder.status || "cooking",
        items: ctx.activeOrder.items.map(line => {
          const m = allItems.find(m => m.id === line.itemId);
          return { name: m ? m.name : "", qty: line.qty };
        }),
      });
    }
    return list;
  }, [ctx.activeOrder, ctx.menuItems]);

  // Merge API history (normalise field names) with mock fallback
  const normalised = useMemo47(() => {
    if (apiHistory.length) {
      return apiHistory.map(o => ({
        id:     o.order_number?.toString() || o.id,
        time:   new Date(o.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short" }) +
                " " + new Date(o.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        today:  false,
        total:  o.total,
        status: o.status,
        items:  (o.items || []).map(i => ({ name: i.name, qty: i.quantity })),
      }));
    }
    return window.MOCK_HISTORY || [];
  }, [apiHistory]);

  const allOrders = [...todayOrders, ...normalised];
  const visible   = tab === "today" ? todayOrders : allOrders;

  return (
    <div className="page">
      <ScreenHeader title="ประวัติการสั่ง" onBack={() => ctx.nav("menu", { back: true })} />

      {/* tabs */}
      <div style={{ padding: "8px 16px 12px", background: "rgb(var(--bg-base))", borderBottom: "1px solid rgb(var(--border-default))" }}>
        <div style={{ display: "flex", gap: 6, padding: 4, background: "rgb(var(--bg-subtle))", borderRadius: 12 }}>
          {[
            { id: "today", label: "วันนี้", count: todayOrders.length },
            { id: "all",   label: "ทั้งหมด", count: allOrders.length },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: "8px 12px",
                background: tab === t.id ? "rgb(var(--bg-base))" : "transparent",
                color: tab === t.id ? "rgb(var(--text-primary))" : "rgb(var(--text-muted))",
                fontSize: 13, fontWeight: 600,
                border: "none", borderRadius: 8, cursor: "pointer",
                boxShadow: tab === t.id ? "var(--shadow-sm)" : "none",
                transition: "all 0.15s ease",
              }}
              aria-pressed={tab === t.id}
            >
              {t.label}
              <span style={{ marginLeft: 6, fontSize: 11, color: tab === t.id ? "rgb(var(--brand-primary))" : "rgb(var(--text-faint))", fontWeight: 700 }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="scroll-y" style={{ padding: "12px 16px 24px" }}>
        {visible.length === 0 ? (
          <EmptyState
            icon="Receipt"
            title={tab === "today" ? "วันนี้ยังไม่มีออเดอร์" : "ยังไม่มีประวัติการสั่ง"}
            body="เริ่มสั่งอาหารเพื่อสะสมประวัติของคุณ"
            ctaLabel="ไปดูเมนู"
            onCta={() => ctx.nav("menu", { back: true })}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {visible.map((o, idx) => (
              <HistoryCard key={o.id} order={o} ctx={ctx} idx={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryCard({ order, ctx, idx }) {
  const status = window.STATUS_LABELS[order.status] || window.STATUS_LABELS.served;
  const onClick = () => {
    if (order.today && ctx.activeOrder && ctx.activeOrder.id === order.id) {
      ctx.nav("tracking");
    }
  };
  const itemsText = order.items.map(it => `${it.name}${it.qty > 1 ? ` ×${it.qty}` : ""}`).join(" · ");
  return (
    <div
      className="card"
      onClick={onClick}
      role={order.today ? "button" : undefined}
      tabIndex={order.today ? 0 : undefined}
      style={{
        padding: 14, background: "rgb(var(--bg-base))",
        cursor: order.today ? "pointer" : "default",
        animation: `slideUp 0.3s ${idx * 0.04}s both cubic-bezier(0.32,0.72,0,1)`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>#{order.id}</span>
          <Badge variant={status.cls.replace("badge-", "")}>{status.label}</Badge>
        </div>
        <span style={{ fontSize: 11, color: "rgb(var(--text-muted))" }}>{order.time}</span>
      </div>
      <div style={{ fontSize: 12, color: "rgb(var(--text-muted))", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 10 }}>
        {itemsText}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "rgb(var(--text-faint))" }}>{order.items.length} รายการ</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{fmtTHB(order.total)}</span>
          {order.today && <Icon name="ChevronRight" size={16} style={{ color: "rgb(var(--text-faint))" }} />}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CartScreen, PaymentScreen, TrackingScreen, HistoryScreen });
