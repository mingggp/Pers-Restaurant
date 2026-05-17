// Owner Console — Screens 1: Dashboard, Orders, Order Detail, Refund Modal

const { useState: useSA, useEffect: useEA, useMemo: useMA, useRef: useRA, useCallback: useCBA } = React;

// =====================================================
// DASHBOARD
// =====================================================
function ODashboard({ ctx }) {
  const [range, setRange] = useSA("30d");
  const kpi = window.O_KPIS_TODAY;

  // build chart data per range
  const lineData = useMA(() => {
    const days = range === "today" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : 30;
    const arr = window.O_DAILY.slice(-days);
    return arr.map(d => ({
      label: arr.length > 14 ? (d.date.getDate() % 5 === 0 ? `${d.date.getDate()}/${d.date.getMonth()+1}` : "") : `${d.date.getDate()}/${d.date.getMonth()+1}`,
      value: d.revenue,
      tip: "฿" + d.revenue.toLocaleString("th-TH"),
    }));
  }, [range]);

  const hourBarData = window.O_HOURLY.filter(h => h.hour >= 9 && h.hour <= 22).map(h => ({
    label: `${h.hour}:00`,
    value: h.orders,
  }));

  return (
    <div className="o-fade-in">
      <div className="o-page-head">
        <div>
          <div className="o-page-title">ภาพรวมร้านค้า</div>
          <div className="o-page-sub">{new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · ยินดีต้อนรับ {ctx.user.name}</div>
        </div>
        <DateRange value={range} onChange={setRange} />
      </div>

      {/* KPI cards */}
      <div className="o-grid-4" style={{ marginBottom: 20 }}>
        <KPICard tone="brand" icon="DollarSign" label="รายได้วันนี้" value={oTHB(kpi.revenue)} deltaPct={kpi.revenueDelta} />
        <KPICard tone="info"  icon="Receipt"    label="ออเดอร์วันนี้" value={kpi.orders} deltaPct={kpi.ordersDelta} />
        <KPICard tone="success" icon="TrendingUp" label="ยอดเฉลี่ย/ออเดอร์" value={oTHB(kpi.avg)} deltaPct={kpi.avgDelta} />
        <KPICard tone="warning" icon="UserPlus"   label="ลูกค้าใหม่" value={kpi.newCustomers} deltaAbs={kpi.newCustomersDelta} deltaSuffix=" คน" />
      </div>

      {/* Revenue chart */}
      <div className="o-grid-2" style={{ gridTemplateColumns: "2fr 1fr", marginBottom: 20 }}>
        <div className="o-card padless">
          <div className="o-card-head">
            <div>
              <div className="o-card-title">รายได้</div>
              <div className="o-card-sub">{range === "today" ? "วันนี้" : range === "7d" ? "7 วันล่าสุด" : "30 วันล่าสุด"}</div>
            </div>
            <div className="o-flex-row" style={{ gap: 16, fontSize: 12, color: "rgb(var(--text-muted))" }}>
              <div className="o-flex-row" style={{ gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 9999, background: "rgb(var(--brand-primary))" }} />
                <span>รายได้รวม</span>
              </div>
            </div>
          </div>
          <div style={{ padding: 12, height: 280 }}>
            <LineChart data={lineData} height={260} />
          </div>
        </div>

        {/* Top items */}
        <div className="o-card padless">
          <div className="o-card-head">
            <div>
              <div className="o-card-title">เมนูขายดี</div>
              <div className="o-card-sub">10 อันดับแรก · เดือนนี้</div>
            </div>
            <button className="o-btn ghost" onClick={() => ctx.nav("reports")}>
              ดูทั้งหมด <Icon name="ChevronRight" size={14} />
            </button>
          </div>
          <div style={{ padding: "8px 20px 20px" }}>
            {window.O_TOP_ITEMS.slice(0, 6).map((m, i) => (
              <div key={m.id} className={`o-top-row top${i + 1 <= 3 ? i + 1 : ""}`}>
                <div className="rank">{i + 1}</div>
                <div className="thumb"><DishArt item={m} size="sm" /></div>
                <div className="name">{m.name}</div>
                <div style={{ textAlign: "right" }}>
                  <div className="num">{m.sold} จาน</div>
                  <div className="sub">{oTHB(m.revenue)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hourly chart + Recent orders */}
      <div className="o-grid-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="o-card padless">
          <div className="o-card-head">
            <div>
              <div className="o-card-title">ออเดอร์รายชั่วโมง</div>
              <div className="o-card-sub">วันนี้ · 9:00–22:00</div>
            </div>
          </div>
          <div style={{ padding: 12, height: 260 }}>
            <BarChart data={hourBarData} height={240} accent="rgb(59, 130, 246)" />
          </div>
        </div>

        <div className="o-card padless">
          <div className="o-card-head">
            <div>
              <div className="o-card-title">ออเดอร์ที่ยังไม่เสร็จ</div>
              <div className="o-card-sub">รอเสิร์ฟ · {ctx.activeOrders.length} ออเดอร์</div>
            </div>
            <button className="o-btn ghost" onClick={() => ctx.nav("orders")}>
              ดูทั้งหมด <Icon name="ChevronRight" size={14} />
            </button>
          </div>
          <div>
            {ctx.activeOrders.length === 0 ? (
              <div className="o-empty" style={{ padding: "40px 20px" }}>
                <div className="ring"><Icon name="CheckCircle" size={26} /></div>
                <h4>ไม่มีออเดอร์ค้างอยู่</h4>
                <p>ออเดอร์ทั้งหมดได้รับการเสิร์ฟแล้ว</p>
              </div>
            ) : (
              <table className="o-table">
                <tbody>
                  {ctx.activeOrders.slice(0, 5).map(o => (
                    <tr key={o.id} onClick={() => ctx.openOrder(o.id)}>
                      <td className="mono">#{o.id}</td>
                      <td>โต๊ะ {o.table}</td>
                      <td><StatusPill status={o.status} /></td>
                      <td style={{ color: "rgb(var(--text-muted))" }}>{oRelative(o.placedAt)}</td>
                      <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{oTHB(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// ORDERS LIST
// =====================================================
function OOrders({ ctx }) {
  const [search, setSearch] = useSA("");
  const [statusFilter, setStatusFilter] = useSA("all");
  const [tableFilter, setTableFilter] = useSA("all");
  const [page, setPage] = useSA(1);
  const PER_PAGE = 12;

  const filtered = useMA(() => {
    let list = ctx.orders;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(o =>
        o.id.toLowerCase().includes(q) ||
        String(o.table).includes(q) ||
        o.customer.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter(o => o.status === statusFilter);
    if (tableFilter !== "all") list = list.filter(o => String(o.table) === String(tableFilter));
    return list;
  }, [ctx.orders, search, statusFilter, tableFilter]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEA(() => { setPage(1); }, [search, statusFilter, tableFilter]);

  return (
    <div className="o-fade-in">
      <div className="o-page-head">
        <div>
          <div className="o-page-title">ออเดอร์ทั้งหมด</div>
          <div className="o-page-sub">{filtered.length.toLocaleString("th-TH")} ออเดอร์ · กรองตามสถานะ, โต๊ะ, หรือเลขออเดอร์</div>
        </div>
        <div className="o-flex-row" style={{ gap: 8 }}>
          <button className="o-btn" onClick={() => ctx.showToast("Export CSV (เดโม)", "Download")}>
            <Icon name="Download" size={14} /> Export
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="o-filterbar">
        <div className="o-input-wrap">
          <Icon name="Search" size={16} />
          <input className="o-input with-icon" placeholder="ค้นหาเลขออเดอร์, โต๊ะ, ลูกค้า..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 280 }} />
        </div>
        <select className="o-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">ทุกสถานะ</option>
          <option value="paid">ชำระแล้ว</option>
          <option value="cooking">กำลังทำ</option>
          <option value="served">เสิร์ฟแล้ว</option>
          <option value="refunded">คืนเงิน</option>
        </select>
        <select className="o-select" value={tableFilter} onChange={(e) => setTableFilter(e.target.value)}>
          <option value="all">ทุกโต๊ะ</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i + 1}>โต๊ะ {i + 1}</option>
          ))}
        </select>
        {(search || statusFilter !== "all" || tableFilter !== "all") && (
          <button className="o-btn ghost" onClick={() => { setSearch(""); setStatusFilter("all"); setTableFilter("all"); }}>
            <Icon name="X" size={14} /> ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* Table */}
      <div className="o-card padless">
        {filtered.length === 0 ? (
          <div className="o-empty">
            <div className="ring"><Icon name="Receipt" size={28} /></div>
            <h4>ไม่พบออเดอร์</h4>
            <p>ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง</p>
          </div>
        ) : (
          <>
            <table className="o-table">
              <thead>
                <tr>
                  <th>เลขออเดอร์</th>
                  <th>วันที่/เวลา</th>
                  <th>โต๊ะ</th>
                  <th>ลูกค้า</th>
                  <th>รายการ</th>
                  <th>การชำระ</th>
                  <th>สถานะ</th>
                  <th style={{ textAlign: "right" }}>ยอดรวม</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(o => (
                  <tr key={o.id} onClick={() => ctx.openOrder(o.id)}>
                    <td><span className="mono">#{o.id}</span></td>
                    <td>{oDateTime(o.placedAt)}</td>
                    <td><strong>โต๊ะ {o.table}</strong></td>
                    <td style={{ color: "rgb(var(--text-muted))" }}>{o.customer}</td>
                    <td style={{ color: "rgb(var(--text-muted))" }}>{o.items.length} รายการ</td>
                    <td style={{ color: "rgb(var(--text-muted))", fontSize: 12, textTransform: "capitalize" }}>{o.payment === "promptpay" ? "PromptPay" : o.payment === "card" ? "บัตรเครดิต" : "เงินสด"}</td>
                    <td><StatusPill status={o.status} /></td>
                    <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{oTHB(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

// =====================================================
// ORDER DETAIL DRAWER
// =====================================================
function OOrderDetail({ orderId, onClose, ctx }) {
  const order = useMA(() => ctx.orders.find(o => o.id === orderId), [orderId, ctx.orders]);
  const [refundOpen, setRefundOpen] = useSA(false);

  if (!order) return null;

  const subtotal = order.items.reduce((s, it) => s + it.unitPrice * it.qty, 0);
  const service = Math.round(subtotal * 0.1);

  return (
    <Drawer
      open={true}
      onClose={onClose}
      title={`ออเดอร์ #${order.id}`}
      subtitle={`${oDateTime(order.placedAt)} · ${oRelative(order.placedAt)}ที่แล้ว`}
      footer={
        order.status !== "refunded" ? (
          <>
            <button className="o-btn ghost" onClick={onClose}>ปิด</button>
            <button className="o-btn danger" onClick={() => setRefundOpen(true)}>
              <Icon name="RotateCcw" size={14} /> คืนเงิน
            </button>
            <button className="o-btn primary" onClick={() => ctx.showToast("พิมพ์ใบเสร็จ (เดโม)", "Receipt")}>
              <Icon name="Receipt" size={14} /> พิมพ์ใบเสร็จ
            </button>
          </>
        ) : (
          <button className="o-btn ghost" style={{ marginLeft: "auto" }} onClick={onClose}>ปิด</button>
        )
      }
    >
      {/* status banner */}
      <div className="o-card" style={{ padding: 14, marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12, color: "rgb(var(--text-muted))" }}>สถานะ</div>
          <div style={{ marginTop: 6 }}><StatusPill status={order.status} /></div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "rgb(var(--text-muted))" }}>โต๊ะ</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "rgb(var(--brand-primary))", lineHeight: 1.1 }}>{order.table}</div>
        </div>
      </div>

      {/* customer / payment info */}
      <div className="o-grid-2" style={{ gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: "rgb(var(--text-muted))", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>ลูกค้า</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{order.customer}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "rgb(var(--text-muted))", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>วิธีชำระเงิน</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{order.payment === "promptpay" ? "PromptPay" : order.payment === "card" ? "บัตรเครดิต" : "เงินสด"}</div>
        </div>
      </div>

      {/* items */}
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "rgb(var(--text-muted))", textTransform: "uppercase", letterSpacing: 0.5 }}>
        รายการ ({order.items.length})
      </div>
      <div>
        {order.items.map((line, idx) => {
          const item = window.MENU.find(m => m.id === line.itemId);
          return (
            <div key={idx} className="o-line">
              <div className="thumb">{item && <DishArt item={item} size="sm" />}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="name">{line.name}</div>
                <div className="meta">{oTHB(line.unitPrice)} × {line.qty}</div>
              </div>
              <div className="price">{oTHB(line.unitPrice * line.qty)}</div>
            </div>
          );
        })}
      </div>

      {/* totals */}
      <div className="o-card" style={{ marginTop: 20, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgb(var(--text-muted))", marginBottom: 8 }}>
          <span>ยอดรวมรายการ</span>
          <span className="num">{oTHB(subtotal)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgb(var(--text-muted))", marginBottom: 12 }}>
          <span>ค่าบริการ (10%)</span>
          <span className="num">{oTHB(service)}</span>
        </div>
        <hr style={{ border: 0, borderTop: "1px dashed rgb(var(--border-default))", margin: "10px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>ยอดสุทธิ</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: "rgb(var(--text-primary))" }} className="num">{oTHB(order.total)}</span>
        </div>
      </div>

      <RefundModal
        open={refundOpen}
        order={order}
        onClose={() => setRefundOpen(false)}
        onConfirm={(reason) => {
          ctx.refundOrder(order.id, reason);
          setRefundOpen(false);
          ctx.showToast("คืนเงินสำเร็จ", "Check");
        }}
      />
    </Drawer>
  );
}

function RefundModal({ open, order, onClose, onConfirm }) {
  const [reason, setReason] = useSA("");
  const [confirmCheck, setConfirmCheck] = useSA(false);
  useEA(() => { if (open) { setReason(""); setConfirmCheck(false); } }, [open]);

  if (!order) return null;
  return (
    <OModal
      open={open}
      onClose={onClose}
      title={`คืนเงินออเดอร์ #${order.id}`}
      subtitle={`โต๊ะ ${order.table} · ${oTHB(order.total)}`}
      footer={
        <>
          <button className="o-btn ghost" onClick={onClose}>ยกเลิก</button>
          <button
            className="o-btn danger"
            onClick={() => onConfirm(reason || "ไม่ระบุเหตุผล")}
            disabled={!confirmCheck}
          >
            <Icon name="RotateCcw" size={14} /> ยืนยันคืนเงิน {oTHB(order.total)}
          </button>
        </>
      }
    >
      <div style={{ padding: "14px 16px", background: "rgb(var(--color-error) / 0.08)", border: "1px solid rgb(var(--color-error) / 0.3)", borderRadius: 10, marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Icon name="AlertCircle" size={18} style={{ color: "rgb(var(--color-error))", marginTop: 1, flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: "rgb(var(--text-primary))", lineHeight: 1.5 }}>
            การคืนเงินจะส่งคำขอไปยังผู้ให้บริการชำระเงิน (PromptPay) <strong>ภายใน 3-5 วันทำการ</strong> และไม่สามารถยกเลิกได้
          </div>
        </div>
      </div>

      <div className="o-form-row">
        <label>เหตุผลในการคืนเงิน *</label>
        <select className="o-input" value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="">เลือกเหตุผล...</option>
          <option value="ลูกค้าไม่พอใจรสชาติ">ลูกค้าไม่พอใจรสชาติ</option>
          <option value="ทำผิดออเดอร์">ทำผิดออเดอร์</option>
          <option value="อาหารช้าเกินไป">อาหารช้าเกินไป</option>
          <option value="วัตถุดิบไม่สด">วัตถุดิบไม่สด</option>
          <option value="อื่นๆ">อื่นๆ</option>
        </select>
      </div>
      <div className="o-form-row">
        <label>หมายเหตุเพิ่มเติม</label>
        <textarea className="o-input" rows={3} placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)" />
      </div>

      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, marginTop: 8, cursor: "pointer", lineHeight: 1.5 }}>
        <input type="checkbox" checked={confirmCheck} onChange={(e) => setConfirmCheck(e.target.checked)} style={{ accentColor: "rgb(var(--color-error))", marginTop: 2 }} />
        <span>ฉันยืนยันว่าต้องการคืนเงินจำนวน <strong>{oTHB(order.total)}</strong> ให้ลูกค้า ฉันเข้าใจว่าการกระทำนี้ไม่สามารถย้อนกลับได้</span>
      </label>
    </OModal>
  );
}

window.ODashboard = ODashboard;
window.OOrders = OOrders;
window.OOrderDetail = OOrderDetail;
