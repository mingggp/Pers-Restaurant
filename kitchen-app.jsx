// Kitchen tablet app — Login, Order Queue (Kanban), Detail Modal, History

const { useState: useStateK, useEffect: useEffectK, useMemo: useMemoK, useRef: useRefK, useCallback: useCallbackK } = React;

// ---------- Utility: relative time ----------
function relMin(ms) {
  const m = Math.max(0, Math.floor((Date.now() - ms) / 60000));
  return m;
}
function relTimeStr(ms) {
  const sec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (sec < 60) return "เพิ่งมาถึง";
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  return `${h} ชม. ${m % 60} นาที`;
}
function fmtClock(d) {
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function fmtDateTH(d) {
  return d.toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(ms) {
  return new Date(ms).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

// ---------- Beep using Web Audio ----------
function playDing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const notes = [
      { f: 880, t: 0,    d: 0.10 },
      { f: 1320, t: 0.08, d: 0.14 },
    ];
    notes.forEach(n => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = n.f;
      g.gain.setValueAtTime(0, now + n.t);
      g.gain.linearRampToValueAtTime(0.18, now + n.t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
      o.connect(g); g.connect(ctx.destination);
      o.start(now + n.t);
      o.stop(now + n.t + n.d + 0.05);
    });
    setTimeout(() => ctx.close(), 600);
  } catch (e) { /* noop */ }
}

// ---------- Option summary helper ----------
function ksum(line) {
  const item = window.MENU.find(m => m.id === line.itemId);
  if (!item) return "";
  const groups = window.OPTIONS_BY_CAT[item.cat] || [];
  const parts = [];
  groups.forEach(gid => {
    const grp = window.OPTION_GROUPS[gid];
    if (grp.type === "radio") {
      const c = grp.choices.find(c => c.id === line.options[gid]);
      if (c && c.id !== "med" && c.id !== "100" && c.id !== "norm") parts.push(c.name);
    } else {
      (line.options[gid] || []).forEach(id => {
        const c = grp.choices.find(c => c.id === id);
        if (c) parts.push("+" + c.name);
      });
    }
  });
  return parts.join(" · ");
}

// =====================================================
// 1. LOGIN
// =====================================================
function KLogin({ onLogin }) {
  const [u, setU] = useStateK("");
  const [p, setP] = useStateK("");
  const [err, setErr] = useStateK("");
  const [loading, setLoading] = useStateK(false);

  const submit = async (e) => {
    e?.preventDefault();
    setErr("");
    if (!u.trim() || !p.trim()) {
      setErr("กรุณากรอก username และ password");
      return;
    }
    setLoading(true);
    try {
      const data = await API.auth.staffLogin(u.trim(), p);
      onLogin({ name: data.staff.displayName, role: data.staff.role });
    } catch (err) {
      setErr(err.message || "Username หรือ Password ไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="k-login">
      <form className="k-login-card" onSubmit={submit}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg, rgb(var(--brand-primary)) 0%, #ea580c 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", marginBottom: 14 }}>
            <Icon name="ChefHat" size={36} stroke={1.6} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>เข้าสู่ระบบครัว</div>
          <div style={{ fontSize: 13, color: "rgb(var(--text-muted))", marginTop: 4 }}>{window.RESTAURANT.nameTh} · KDS</div>
        </div>

        <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>Username</label>
        <input className="input" autoFocus value={u} onChange={(e) => setU(e.target.value)} placeholder="kitchen-staff" autoComplete="username" />

        <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block", marginTop: 14 }}>Password</label>
        <input className="input" type="password" value={p} onChange={(e) => setP(e.target.value)} placeholder="••••••••" autoComplete="current-password" />

        {err && (
          <div style={{ marginTop: 14, padding: "10px 12px", background: "rgb(var(--color-error) / 0.08)", border: "1px solid rgb(var(--color-error) / 0.3)", color: "rgb(var(--color-error))", borderRadius: 10, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="AlertCircle" size={16} />
            <span>{err}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 20, width: "100%",
            padding: "14px", borderRadius: 12,
            background: "rgb(var(--brand-primary))",
            color: "white", border: "none",
            fontSize: 16, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? <Icon name="Loader" size={18} className="spin" /> : <Icon name="ArrowRight" size={18} />}
          <span>{loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}</span>
        </button>

        <div style={{ marginTop: 16, fontSize: 11, color: "rgb(var(--text-faint))", textAlign: "center" }}>
          เดโม: ใช้ username/password อะไรก็ได้ (ลอง "wrong" เพื่อดู error)
        </div>
      </form>
    </div>
  );
}

// =====================================================
// 2. ORDER QUEUE (Kanban) — MAIN
// =====================================================
function KQueue({ ctx }) {
  const [confirmServe, setConfirmServe] = useStateK(null);

  // group orders by status
  const byStatus = useMemoK(() => {
    return {
      new:    ctx.orders.filter(o => o.status === "new").sort((a,b) => a.placedAt - b.placedAt),
      cooking:ctx.orders.filter(o => o.status === "cooking").sort((a,b) => a.placedAt - b.placedAt),
      done:   ctx.orders.filter(o => o.status === "done").sort((a,b) => (b.servedAt||0) - (a.servedAt||0)).slice(0, 5),
    };
  }, [ctx.orders]);

  return (
    <div className="k-board">
      <KColumn title="ออเดอร์ใหม่" subtitle="กำลังรอรับ" type="new" icon="Bell" orders={byStatus.new}
        emptyText="ยังไม่มีออเดอร์ใหม่"
        renderCard={(order) => (
          <KOrderCard
            key={order.id} order={order}
            cta={<button className="k-cta accept" onClick={(e) => { e.stopPropagation(); ctx.accept(order.id); }}>
              <Icon name="ChefHat" size={20} stroke={2.2} />
              <span>รับออเดอร์</span>
            </button>}
            onClick={() => ctx.openDetail(order.id)}
          />
        )}
      />
      <KColumn title="กำลังทำ" subtitle="อยู่ในครัว" type="cook" icon="ChefHat" orders={byStatus.cooking}
        emptyText="ครัวว่างอยู่"
        renderCard={(order) => (
          <KOrderCard
            key={order.id} order={order}
            cta={<button className="k-cta serve" onClick={(e) => { e.stopPropagation(); setConfirmServe(order); }}>
              <Icon name="Check" size={20} stroke={2.6} />
              <span>เสิร์ฟแล้ว</span>
            </button>}
            onClick={() => ctx.openDetail(order.id)}
          />
        )}
      />
      <KColumn title="เสิร์ฟแล้ว" subtitle="วันนี้ · 5 ล่าสุด" type="done" icon="CheckCircle" orders={byStatus.done}
        countOverride={ctx.todayDoneCount}
        emptyText="ยังไม่มีออเดอร์ที่เสร็จ"
        renderCard={(order) => (
          <KOrderCard
            key={order.id} order={order} compact
            onClick={() => ctx.openDetail(order.id)}
          />
        )}
      />

      <ConfirmModal
        open={!!confirmServe}
        title={confirmServe ? `เสิร์ฟออเดอร์ #${confirmServe.id}?` : ""}
        body={confirmServe ? `โต๊ะ ${confirmServe.table} · ${confirmServe.items.length} รายการ — ตรวจสอบให้ครบก่อนเสิร์ฟ` : ""}
        confirmLabel="เสิร์ฟแล้ว"
        cancelLabel="ยังไม่เสร็จ"
        onCancel={() => setConfirmServe(null)}
        onConfirm={() => { ctx.serve(confirmServe.id); setConfirmServe(null); }}
      />
    </div>
  );
}

function KColumn({ title, subtitle, type, icon, orders, renderCard, emptyText, countOverride }) {
  return (
    <div className={`k-col col-${type}`}>
      <div className="k-col-header">
        <Icon name={icon} size={20} stroke={2.2} />
        <div>
          <div>{title}</div>
          <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.85, marginTop: 1 }}>{subtitle}</div>
        </div>
        <span className="count">{countOverride != null ? countOverride : orders.length}</span>
      </div>
      <div className="k-col-body">
        {orders.length === 0 ? (
          <div className="k-empty">
            <div className="ring"><Icon name={icon} size={28} stroke={1.5} style={{ opacity: 0.5 }} /></div>
            <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>{emptyText}</div>
          </div>
        ) : orders.map(renderCard)}
      </div>
    </div>
  );
}

function KOrderCard({ order, cta, onClick, compact }) {
  const [, force] = useStateK(0);
  // re-render every 30s so relative times update
  useEffectK(() => {
    const t = setInterval(() => force(x => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const mins = relMin(order.placedAt);
  const isLate = order.status === "cooking" && mins > 5;
  const isFresh = order.status === "new" && (Date.now() - order.placedAt) < 5000;

  return (
    <div className={`k-card ${isFresh ? "is-new" : ""} ${isLate ? "is-late" : ""}`} onClick={onClick}>
      <div className="k-card-head">
        <div>
          <div className="k-card-table">โต๊ะ {order.table}</div>
          <div className="k-card-id">#{order.id}</div>
        </div>
        <div className="k-card-time">
          <div className={`ago ${isLate ? "late" : ""}`}>{relTimeStr(order.placedAt)}</div>
          <div className="at">{order.status === "done" && order.servedAt ? `เสิร์ฟ ${fmtTime(order.servedAt)}` : `สั่ง ${fmtTime(order.placedAt)}`}</div>
        </div>
      </div>

      {!compact && (
        <div className="k-items">
          {order.items.slice(0, 4).map((line, i) => {
            const opts = ksum(line);
            return (
              <div key={i}>
                <div className="k-item-line">
                  <span className="qty">{line.qty}×</span>
                  <span className="name">{line.name}</span>
                </div>
                {opts && <div className="k-item-line opts" style={{ paddingLeft: 32 }}>{opts}</div>}
              </div>
            );
          })}
          {order.items.length > 4 && (
            <div style={{ fontSize: 12, color: "rgb(var(--text-muted))", fontStyle: "italic" }}>
              + อีก {order.items.length - 4} รายการ
            </div>
          )}
        </div>
      )}

      {compact && (
        <div style={{ fontSize: 13, color: "rgb(var(--text-muted))", lineHeight: 1.4 }}>
          {order.items.length} รายการ · ฿{order.total.toLocaleString("th-TH")}
        </div>
      )}

      {/* notes */}
      {!compact && order.items.filter(l => l.note).map((line, i) => (
        <div key={`n${i}`} className="k-note">
          <Icon name="StickyNote" size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span><strong>{line.name}:</strong> {line.note}</span>
        </div>
      ))}

      {cta}
    </div>
  );
}

// =====================================================
// 3. ORDER DETAIL MODAL
// =====================================================
function KDetailModal({ order, onClose, onMarkLine, onServeAll }) {
  const [confirmServe, setConfirmServe] = useStateK(false);
  if (!order) return null;
  const total = order.items.length;
  const done = order.items.filter(l => l.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && done === total;
  const showActions = order.status !== "done";

  return (
    <div className="k-modal-bg" onClick={onClose}>
      <div className="k-modal" onClick={(e) => e.stopPropagation()}>
        <div className="k-modal-head">
          <div style={{ width: 56, height: 56, borderRadius: 12, background: "rgb(var(--brand-tint))", color: "rgb(var(--brand-primary))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800 }}>
            {order.table}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>โต๊ะ {order.table} · ออเดอร์ #{order.id}</div>
            <div style={{ fontSize: 13, color: "rgb(var(--text-muted))", marginTop: 2, display: "flex", alignItems: "center", gap: 10 }}>
              <span>สั่ง {fmtTime(order.placedAt)}</span>
              <span>·</span>
              <span>{relTimeStr(order.placedAt)}</span>
              <span>·</span>
              <Badge variant={order.status === "new" ? "warning" : order.status === "cooking" ? "info" : "success"}>
                {order.status === "new" ? "ออเดอร์ใหม่" : order.status === "cooking" ? "กำลังทำ" : "เสิร์ฟแล้ว"}
              </Badge>
            </div>
          </div>
          <button className="k-iconbtn" onClick={onClose} aria-label="ปิด"><Icon name="X" size={20} stroke={2.2} /></button>
        </div>

        <div className="k-modal-body">
          {showActions && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <div className="k-progress"><div style={{ width: `${pct}%` }} /></div>
              <div style={{ fontSize: 13, color: "rgb(var(--text-muted))", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                เสร็จแล้ว <strong style={{ color: "rgb(var(--text-primary))" }}>{done}/{total}</strong> ({pct}%)
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {order.items.map((line, i) => {
              const item = window.MENU.find(m => m.id === line.itemId);
              const opts = ksum(line);
              return (
                <div key={i} className={`k-row ${line.done ? "done" : ""}`}>
                  {showActions ? (
                    <button
                      className={`k-check ${line.done ? "on" : ""}`}
                      onClick={() => onMarkLine(order.id, line.id, !line.done)}
                      aria-label={line.done ? "ยกเลิกทำเสร็จ" : "ทำเสร็จแล้ว"}
                    >
                      {line.done && <Icon name="Check" size={16} stroke={3} />}
                    </button>
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: 9999, background: "rgb(var(--color-success))", color: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name="Check" size={16} stroke={3} />
                    </div>
                  )}
                  <div style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                    <DishArt item={item} size="sm" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 17, fontWeight: 700, color: "rgb(var(--brand-primary))", fontVariantNumeric: "tabular-nums" }}>{line.qty}×</span>
                      <span className="name" style={{ fontSize: 16, fontWeight: 600 }}>{item ? item.name : line.name}</span>
                    </div>
                    {opts && <div style={{ fontSize: 13, color: "rgb(var(--text-muted))", marginTop: 2 }}>{opts}</div>}
                    {line.note && (
                      <div className="k-note" style={{ marginTop: 8 }}>
                        <Icon name="StickyNote" size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span><strong>หมายเหตุ:</strong> {line.note}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap" }}>฿{(line.unitPrice * line.qty).toLocaleString("th-TH")}</div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 18, padding: "12px 14px", background: "rgb(var(--bg-subtle))", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>ยอดรวมออเดอร์</span>
            <span style={{ fontSize: 22, fontWeight: 800 }}>฿{order.total.toLocaleString("th-TH")}</span>
          </div>
        </div>

        <div className="k-modal-foot">
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>ปิด</button>
          {showActions && (
            <button
              className="k-cta serve"
              style={{ flex: 2 }}
              onClick={() => setConfirmServe(true)}
            >
              <Icon name="Check" size={20} stroke={2.6} />
              <span>{allDone ? "ยืนยันเสิร์ฟทั้งหมด" : "เสิร์ฟทั้งหมด"}</span>
            </button>
          )}
        </div>

        <ConfirmModal
          open={confirmServe}
          title={`เสิร์ฟออเดอร์ #${order.id}?`}
          body={`โต๊ะ ${order.table} · ${total} รายการ ${!allDone ? `— ยังเหลือ ${total - done} รายการที่ยังไม่ติ๊ก` : ""}`}
          confirmLabel="เสิร์ฟแล้ว"
          cancelLabel="ยังไม่เสร็จ"
          onCancel={() => setConfirmServe(false)}
          onConfirm={() => { setConfirmServe(false); onServeAll(order.id); }}
        />
      </div>
    </div>
  );
}

// =====================================================
// 4. HISTORY
// =====================================================
function KHistory() {
  const [filter, setFilter] = useStateK("today");
  const [apiRows, setApiRows] = useStateK(null);
  const [apiStats, setApiStats] = useStateK(null);

  useEffectK(() => {
    async function load() {
      try {
        const [hist, stats] = await Promise.all([
          API.kitchen.history(),
          API.kitchen.stats(),
        ]);
        const normalized = (hist || []).map(r => ({
          id: r.id,
          table: r.table_number || r.table_id,
          placedAt: new Date(r.created_at).getTime(),
          servedAt: new Date(r.updated_at).getTime(),
          total: parseFloat(r.total_amount || r.total || 0),
          items: (r.items || []).map(it => ({
            name: it.menu_item_name || it.name,
            qty: it.quantity || it.qty,
          })),
        }));
        setApiRows(normalized);
        setApiStats(stats);
      } catch {
        // fall back to mock data silently
      }
    }
    load();
  }, []);

  const rows = useMemoK(() => {
    const source = apiRows ?? window.K_HISTORY_ROWS;
    const now = Date.now();
    let cutoff;
    if (filter === "today") cutoff = now - 24 * 3600 * 1000;
    else if (filter === "7d") cutoff = now - 7 * 24 * 3600 * 1000;
    else cutoff = 0;
    return source.filter(r => r.placedAt >= cutoff);
  }, [filter, apiRows]);

  const stats = apiStats ?? window.K_TODAY_STATS;

  return (
    <div className="k-history">
      {/* filter */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>ประวัติการสั่ง</div>
          <div style={{ fontSize: 13, color: "rgb(var(--text-muted))", marginTop: 2 }}>ดูออเดอร์ที่เสิร์ฟแล้ว · {rows.length} รายการ</div>
        </div>
        <div className="k-tabs">
          {[
            { id: "today", label: "วันนี้" },
            { id: "7d",    label: "7 วัน" },
            { id: "all",   label: "ทั้งหมด" },
          ].map(t => (
            <button
              key={t.id}
              className={`k-tab ${filter === t.id ? "active" : ""}`}
              onClick={() => setFilter(t.id)}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
        <div className="k-stat">
          <div className="label">ออเดอร์วันนี้</div>
          <div className="num">{stats.totalOrders}</div>
          <div className="delta">+12 จากเมื่อวาน</div>
        </div>
        <div className="k-stat">
          <div className="label">รายการอาหาร</div>
          <div className="num">{stats.totalItems}</div>
          <div className="delta">+34 จากเมื่อวาน</div>
        </div>
        <div className="k-stat">
          <div className="label">เวลาเฉลี่ยที่ทำ</div>
          <div className="num">{stats.avgPrepMin} <span style={{ fontSize: 16, color: "rgb(var(--text-muted))", fontWeight: 500 }}>นาที</span></div>
          <div className="delta">เร็วขึ้น 2 นาที</div>
        </div>
        <div className="k-stat">
          <div className="label">รายได้วันนี้</div>
          <div className="num">฿{stats.revenue.toLocaleString("th-TH")}</div>
          <div className="delta">+18% จากเมื่อวาน</div>
        </div>
      </div>

      {/* table */}
      <table className="k-table">
        <thead>
          <tr>
            <th style={{ width: 80 }}>โต๊ะ</th>
            <th style={{ width: 110 }}>เลขออเดอร์</th>
            <th style={{ width: 120 }}>เวลาที่สั่ง</th>
            <th style={{ width: 130 }}>เวลาที่ทำ</th>
            <th>รายการ</th>
            <th style={{ width: 110, textAlign: "right" }}>ยอด</th>
            <th style={{ width: 130 }}>สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const prepMin = Math.round((r.servedAt - r.placedAt) / 60000);
            return (
              <tr key={r.id}>
                <td><strong style={{ fontSize: 16 }}>{r.table}</strong></td>
                <td style={{ fontFamily: "ui-monospace, SF Mono, monospace", color: "rgb(var(--text-muted))" }}>#{r.id}</td>
                <td style={{ fontVariantNumeric: "tabular-nums" }}>{fmtTime(r.placedAt)}</td>
                <td style={{ fontVariantNumeric: "tabular-nums" }}>
                  <span style={{ color: prepMin > 18 ? "rgb(var(--color-error))" : "rgb(var(--text-muted))" }}>
                    {prepMin} นาที
                  </span>
                </td>
                <td style={{ color: "rgb(var(--text-muted))" }}>
                  {r.items.map(it => `${it.name}${it.qty > 1 ? `×${it.qty}` : ""}`).join(", ")}
                </td>
                <td style={{ textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>฿{r.total.toLocaleString("th-TH")}</td>
                <td><Badge variant="success" leftIcon="Check">เสิร์ฟแล้ว</Badge></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// =====================================================
// Helper: normalise API order → kitchen shape
// =====================================================
function normalizeKOrder(row) {
  const statusMap = { paid: "new", cooking: "cooking", ready: "done", served: "done" };
  return {
    id: row.id,
    number: row.order_number,
    table: row.table_number || row.table_id,
    status: statusMap[row.status] || "new",
    placedAt: new Date(row.created_at).getTime(),
    acceptedAt: row.status === "cooking" ? new Date(row.updated_at).getTime() : null,
    servedAt: (row.status === "ready" || row.status === "served") ? new Date(row.updated_at).getTime() : null,
    total: parseFloat(row.total_amount || row.total || 0),
    items: (row.items || []).map(it => ({
      id: it.id,
      name: it.menu_item_name || it.name,
      qty: it.quantity || it.qty,
      note: it.note,
      done: it.is_done || false,
      unitPrice: parseFloat(it.unit_price || 0),
    })),
  };
}

// =====================================================
// SHELL: top bar + nav + screens
// =====================================================
function KitchenShell({ user, onLogout }) {
  const [page, setPage] = useStateK("queue");
  const [orders, setOrders] = useStateK([]);
  const [openOrderId, setOpenOrderId] = useStateK(null);
  const [soundOn, setSoundOn] = useStateK(true);
  const [now, setNow] = useStateK(new Date());
  const [online, setOnline] = useStateK(true);
  const [todayDoneCount, setTodayDoneCount] = useStateK(0);

  // clock tick
  useEffectK(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // online/offline
  useEffectK(() => {
    const u = () => setOnline(navigator.onLine);
    window.addEventListener("online", u);
    window.addEventListener("offline", u);
    return () => {
      window.removeEventListener("online", u);
      window.removeEventListener("offline", u);
    };
  }, []);

  // Load initial board + stats from API
  useEffectK(() => {
    async function loadBoard() {
      try {
        const [board, stats] = await Promise.all([
          API.kitchen.board(),
          API.kitchen.stats(),
        ]);
        // board may be { new: [], cooking: [], ready: [] } or flat array
        const allRows = Array.isArray(board)
          ? board
          : [...(board.new || []), ...(board.cooking || []), ...(board.ready || [])];
        setOrders(allRows.map(normalizeKOrder));
        if (stats?.totalOrders != null) setTodayDoneCount(stats.totalOrders);
      } catch {
        // API down — start with empty board; WS will push new orders
      }
    }
    loadBoard();
  }, []);

  // WebSocket: real-time order events
  useEffectK(() => {
    const cleanup = API.connectWS((msg) => {
      if (msg.type === "NEW_ORDER") {
        const order = normalizeKOrder(msg.data || msg.order || msg);
        setOrders((list) => [order, ...list]);
        if (soundOn) playDing();
      } else if (msg.type === "ORDER_STATUS") {
        const { orderId, status } = msg.data || msg;
        const statusMap = { paid: "new", cooking: "cooking", ready: "done", served: "done" };
        const kStatus = statusMap[status] || status;
        setOrders((list) => list.map(o =>
          o.id === orderId ? { ...o, status: kStatus } : o
        ));
      }
    });
    return cleanup;
  }, [soundOn]);

  // counts
  const counts = useMemoK(() => ({
    new: orders.filter(o => o.status === "new").length,
    cooking: orders.filter(o => o.status === "cooking").length,
    done: todayDoneCount,
  }), [orders, todayDoneCount]);

  const accept = useCallbackK(async (id) => {
    setOrders((list) => list.map(o => o.id === id ? { ...o, status: "cooking", acceptedAt: Date.now() } : o));
    try { await API.orders.setStatus(id, "cooking"); } catch { /* revert on error is optional */ }
  }, []);

  const serve = useCallbackK(async (id) => {
    setOrders((list) => list.map(o =>
      o.id === id
        ? { ...o, status: "done", servedAt: Date.now(), items: o.items.map(l => ({ ...l, done: true })) }
        : o
    ));
    setTodayDoneCount((n) => n + 1);
    setOpenOrderId(null);
    try { await API.orders.setStatus(id, "ready"); } catch {}
  }, []);

  const markLine = useCallbackK(async (orderId, itemId, value) => {
    setOrders((list) => list.map(o => {
      if (o.id !== orderId) return o;
      const items = o.items.map(l => l.id === itemId ? { ...l, done: value } : l);
      return { ...o, items };
    }));
    try { await API.orders.setItemDone(orderId, itemId, value); } catch {}
  }, []);

  const openOrder = openOrderId ? orders.find(o => o.id === openOrderId) : null;

  return (
    <div className="k-screen">
      {/* connection lost banner */}
      {!online && (
        <div className="k-banner">
          <Icon name="WifiOff" size={16} />
          <span>ขาดการเชื่อมต่ออินเทอร์เน็ต — ออเดอร์ใหม่อาจมาช้า</span>
        </div>
      )}

      {/* top bar */}
      <div className="k-topbar" style={{ marginTop: !online ? 32 : 0 }}>
        <div className="brand">
          <div className="brand-mark"><Icon name="ChefHat" size={22} stroke={1.8} /></div>
          <div>
            <h1>ครัว · {window.RESTAURANT.nameTh}</h1>
            <div className="sub">{user.name} · เริ่มเวลา {fmtTime(Date.now() - 4 * 3600 * 1000)}</div>
          </div>
        </div>

        <div className="clock">
          <div className="time">{fmtClock(now)}</div>
          <div className="date">{fmtDateTH(now)}</div>
        </div>

        <div className="k-counters">
          <div className="k-counter new">
            <div className="num">{counts.new}</div>
            <div><div className="label">ออเดอร์ใหม่</div><div style={{ fontSize: 11, color: "rgb(var(--text-muted))", marginTop: 1 }}>กำลังรอรับ</div></div>
          </div>
          <div className="k-counter cook">
            <div className="num">{counts.cooking}</div>
            <div><div className="label">กำลังทำ</div><div style={{ fontSize: 11, color: "rgb(var(--text-muted))", marginTop: 1 }}>อยู่ในครัว</div></div>
          </div>
          <div className="k-counter done">
            <div className="num">{counts.done}</div>
            <div><div className="label">เสิร์ฟแล้ว</div><div style={{ fontSize: 11, color: "rgb(var(--text-muted))", marginTop: 1 }}>วันนี้</div></div>
          </div>
        </div>

        <div className="k-nav">
          <button className={page === "queue" ? "active" : ""} onClick={() => setPage("queue")}>คิวออเดอร์</button>
          <button className={page === "history" ? "active" : ""} onClick={() => setPage("history")}>ประวัติ</button>
        </div>

        <button
          className={`k-iconbtn ${soundOn ? "active" : ""}`}
          onClick={() => setSoundOn(s => !s)}
          aria-label={soundOn ? "ปิดเสียงแจ้งเตือน" : "เปิดเสียงแจ้งเตือน"}
          title={soundOn ? "ปิดเสียง" : "เปิดเสียง"}
        >
          <Icon name="Bell" size={20} style={{ opacity: soundOn ? 1 : 0.4 }} />
        </button>
        <button className="k-iconbtn danger" onClick={onLogout} aria-label="ออกจากระบบ" title="ออกจากระบบ">
          <Icon name="ArrowLeft" size={20} stroke={2.2} />
        </button>
      </div>

      {/* page */}
      {page === "queue" ? (
        <KQueue ctx={{ orders, accept, serve, openDetail: setOpenOrderId, todayDoneCount }} />
      ) : (
        <KHistory />
      )}

      <KDetailModal
        order={openOrder}
        onClose={() => setOpenOrderId(null)}
        onMarkLine={markLine}
        onServeAll={serve}
      />
    </div>
  );
}

// =====================================================
// Top-level: login → shell
// =====================================================
function KitchenApp() {
  const [user, setUser] = useStateK(null);
  return (
    <div className="k-screen">
      {!user ? <KLogin onLogin={setUser} /> : <KitchenShell user={user} onLogout={() => setUser(null)} />}
    </div>
  );
}

// =====================================================
// Stage: tablet bezel, scaled to fit
// =====================================================
function KStage() {
  const [scale, setScale] = useStateK(1);
  const W = 1280, H = 800;

  useEffectK(() => {
    const fit = () => {
      const margin = 24;
      const sx = (window.innerWidth - margin * 2 - 32) / W;
      const sy = (window.innerHeight - margin * 2 - 32) / H;
      setScale(Math.min(1, sx, sy));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div className="k-stage">
      <div style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
        <div className="k-frame">
          <KitchenApp />
        </div>
      </div>
    </div>
  );
}

const kRoot = ReactDOM.createRoot(document.getElementById("root"));
kRoot.render(<KStage />);
