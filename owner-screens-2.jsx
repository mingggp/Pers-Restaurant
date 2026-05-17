// Owner Console — Screens 2: Menu Mgmt, Tables, Reports, Staff, Settings, Audit Log

const { useState: useSB, useEffect: useEB, useMemo: useMB } = React;

// =====================================================
// MENU MANAGEMENT
// =====================================================
function OMenu({ ctx }) {
  const [activeCat, setActiveCat] = useSB("rec");
  const [search, setSearch] = useSB("");
  const [editing, setEditing] = useSB(null); // item or "new"
  const [deleting, setDeleting] = useSB(null);

  const items = useMB(() => {
    let list = ctx.menu;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(it => (it.name || "").toLowerCase().includes(q) || (it.nameEn || "").toLowerCase().includes(q));
    } else if (activeCat === "rec") {
      list = list.filter(it => it.rec);
    } else {
      list = list.filter(it => it.cat === activeCat);
    }
    return list;
  }, [ctx.menu, activeCat, search]);

  return (
    <div className="o-fade-in">
      <div className="o-page-head">
        <div>
          <div className="o-page-title">จัดการเมนู</div>
          <div className="o-page-sub">{ctx.menu.length} เมนูทั้งหมด · {ctx.menu.filter(m => m.available !== false).length} ที่เปิดขาย</div>
        </div>
        <div className="o-flex-row" style={{ gap: 8 }}>
          <button className="o-btn primary" onClick={() => setEditing("new")}>
            <Icon name="Plus" size={14} /> เพิ่มเมนูใหม่
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="o-tabs">
        {(ctx.categories || window.O_CATEGORIES || []).map(cat => (
          <button
            key={cat.id}
            className={`o-tab ${activeCat === cat.id && !search ? "active" : ""}`}
            onClick={() => { setActiveCat(cat.id); setSearch(""); }}
          >
            {cat.name}
            <span style={{ marginLeft: 8, fontSize: 11, color: "rgb(var(--text-faint))", fontWeight: 500 }}>
              ({cat.id === "rec" ? ctx.menu.filter(m => m.rec).length : ctx.menu.filter(m => m.cat === cat.id).length})
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="o-filterbar">
        <div className="o-input-wrap" style={{ flex: 1, maxWidth: 320 }}>
          <Icon name="Search" size={16} />
          <input className="o-input with-icon" placeholder="ค้นหาเมนู..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "100%" }} />
        </div>
        <div style={{ marginLeft: "auto", fontSize: 13, color: "rgb(var(--text-muted))" }}>
          แสดง {items.length} เมนู
        </div>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="o-card o-empty">
          <div className="ring"><Icon name="Utensils" size={28} /></div>
          <h4>ไม่พบเมนู</h4>
          <p>ลองค้นหาด้วยคำอื่น หรือเปลี่ยนหมวดหมู่</p>
        </div>
      ) : (
        <div className="o-menu-grid">
          {items.map(m => (
            <div key={m.id} className="o-menu-card">
              <div className="img"><DishArt item={m} /></div>
              <div className="body">
                <div className="name">{m.name}</div>
                <div style={{ fontSize: 11.5, color: "rgb(var(--text-muted))" }}>{m.nameEn}</div>
                <div className="price">{oTHB(m.price)}</div>
              </div>
              <div className="actions">
                <div className="avail">
                  <Toggle on={m.available !== false} onChange={(v) => ctx.toggleMenu(m.id, v)} ariaLabel={`เปิด/ปิดขาย ${m.name}`} />
                  <span className="label">{m.available !== false ? "เปิดขาย" : "ปิดขาย"}</span>
                </div>
                <div className="icon-row">
                  <button onClick={() => setEditing(m)} aria-label="แก้ไข"><Icon name="Edit" size={15} /></button>
                  <button onClick={() => setDeleting(m)} className="del" aria-label="ลบ"><Icon name="Trash" size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <OMenuEdit
        open={!!editing}
        item={editing === "new" ? null : editing}
        onClose={() => setEditing(null)}
        onSave={(data) => { ctx.saveMenu(data); setEditing(null); }}
        onError={(msg) => ctx.showToast(msg, "AlertCircle")}
      />

      <OModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`ลบเมนู "${deleting?.name}"?`}
        subtitle="การลบจะนำเมนูนี้ออกจากรายการขายทันที"
        footer={
          <>
            <button className="o-btn ghost" onClick={() => setDeleting(null)}>ยกเลิก</button>
            <button className="o-btn danger" onClick={() => { ctx.deleteMenu(deleting.id); setDeleting(null); }}>
              <Icon name="Trash" size={14} /> ลบเมนู
            </button>
          </>
        }
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "rgb(var(--bg-subtle))", borderRadius: 10 }}>
          {deleting && (
            <>
              <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}><DishArt item={deleting} size="sm" /></div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{deleting.name}</div>
                <div style={{ fontSize: 12, color: "rgb(var(--text-muted))", marginTop: 2 }}>{oTHB(deleting.price)} · {deleting.nameEn}</div>
              </div>
            </>
          )}
        </div>
      </OModal>
    </div>
  );
}

function OMenuEdit({ open, item, onClose, onSave, onError }) {
  const isNew = !item;
  const blank = {
    name: "", nameEn: "", price: 0, cat: "rice",
    desc: "", available: true, imageUrl: null,
  };
  const [form, setForm] = useSB(blank);
  useEB(() => {
    if (open) {
      setForm(item ? { ...blank, ...item, available: item.available !== false, imageUrl: item.imageUrl || null } : blank);
    }
  }, [open, item]);

  if (!open) return null;
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.name.trim() && form.price > 0;

  return (
    <OModal
      open={open}
      onClose={onClose}
      size="lg"
      title={isNew ? "เพิ่มเมนูใหม่" : `แก้ไข: ${item.name}`}
      subtitle={isNew ? "เพิ่มเมนูเข้าระบบ" : "อัปเดตข้อมูลเมนูนี้"}
      footer={
        <>
          <button className="o-btn ghost" onClick={onClose}>ยกเลิก</button>
          <button className="o-btn primary" disabled={!valid} onClick={() => onSave({ id: item?.id, ...form })}>
            <Icon name="Check" size={14} /> {isNew ? "เพิ่มเมนู" : "บันทึก"}
          </button>
        </>
      }
    >
      <div className="o-menu-edit-grid">
        {/* LEFT — image */}
        <div>
          <label className="o-field-label">รูปเมนู</label>
          <ImageUpload
            value={form.imageUrl}
            onChange={(url) => update("imageUrl", url)}
            onRemove={() => update("imageUrl", null)}
            onError={onError}
          />
          <div className="o-imgup-hint">
            <Icon name="ImageIcon" size={13} />
            <span>รูปที่อัปโหลดจะถูกปรับขนาดเป็น ≤ 800px และบันทึกแบบ JPEG</span>
          </div>
        </div>

        {/* RIGHT — fields */}
        <div>
          <div className="o-form-row">
            <label>ชื่อเมนู (ไทย) *</label>
            <input className="o-input" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="เช่น ผัดไทยกุ้งสด" />
          </div>
          <div className="o-form-row">
            <label>ชื่อเมนู (English)</label>
            <input className="o-input" value={form.nameEn} onChange={(e) => update("nameEn", e.target.value)} placeholder="e.g. Pad Thai Goong" />
          </div>
          <div className="o-form-grid">
            <div className="o-form-row">
              <label>ราคา (บาท) *</label>
              <input className="o-input" type="number" min={0} value={form.price} onChange={(e) => update("price", parseInt(e.target.value) || 0)} />
            </div>
            <div className="o-form-row">
              <label>หมวดหมู่</label>
              <select className="o-select" value={form.cat} onChange={(e) => update("cat", e.target.value)} style={{ height: 40 }}>
                {window.O_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="o-form-row">
            <label>คำอธิบาย</label>
            <textarea className="o-input" rows={3} value={form.desc} onChange={(e) => update("desc", e.target.value)} placeholder="บอกเล่าวัตถุดิบ รสชาติ เพื่อช่วยลูกค้าตัดสินใจ" />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, background: "rgb(var(--bg-subtle))", borderRadius: 10, marginTop: 8, cursor: "pointer" }}>
            <Toggle on={form.available} onChange={(v) => update("available", v)} ariaLabel="เปิด/ปิดขาย" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{form.available ? "เปิดขาย" : "ปิดขาย"}</div>
              <div style={{ fontSize: 12, color: "rgb(var(--text-muted))" }}>{form.available ? "ลูกค้าสามารถสั่งเมนูนี้ได้" : "เมนูจะถูกซ่อนจากลูกค้า"}</div>
            </div>
          </label>
        </div>
      </div>
    </OModal>
  );
}

// =====================================================
// TABLE MANAGEMENT
// =====================================================
function OTables({ ctx }) {
  const [editing, setEditing] = useSB(null);

  return (
    <div className="o-fade-in">
      <div className="o-page-head">
        <div>
          <div className="o-page-title">จัดการโต๊ะ</div>
          <div className="o-page-sub">{ctx.tables.filter(t => t.active).length}/{ctx.tables.length} โต๊ะที่ใช้งาน · สแกน QR เพื่อนำลูกค้าไปยังเมนู</div>
        </div>
        <button className="o-btn primary" onClick={() => setEditing("new")}>
          <Icon name="Plus" size={14} /> เพิ่มโต๊ะใหม่
        </button>
      </div>

      <div className="o-tables-grid">
        {ctx.tables.map(t => (
          <div key={t.id} className={`o-table-card ${!t.active ? "disabled" : ""}`}>
            <div className="num">{t.number}</div>
            <div className="meta">
              <strong>{t.seats}</strong> ที่นั่ง · {t.zone}
            </div>
            <Badge variant={t.active ? "success" : "neutral"}>{t.active ? "เปิดใช้งาน" : "ปิดใช้งาน"}</Badge>
            <div className="acts">
              <button className="o-btn" onClick={() => ctx.showToast(`ดาวน์โหลด QR โต๊ะ ${t.number}`, "Download")}>
                <Icon name="QrCode" size={14} /> QR
              </button>
              <button className="o-btn" onClick={() => setEditing(t)}>
                <Icon name="Edit" size={14} /> แก้ไข
              </button>
            </div>
          </div>
        ))}

        {/* "add" tile */}
        <button
          className="o-table-card"
          onClick={() => setEditing("new")}
          style={{
            border: "2px dashed rgb(var(--border-strong))",
            background: "transparent", cursor: "pointer",
            color: "rgb(var(--text-muted))", justifyContent: "center",
          }}
        >
          <div style={{ width: 64, height: 64, borderRadius: 9999, background: "rgb(var(--bg-subtle))", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="Plus" size={28} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>เพิ่มโต๊ะใหม่</div>
        </button>
      </div>

      <OModal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "เพิ่มโต๊ะใหม่" : `แก้ไขโต๊ะ ${editing?.number}`}
        subtitle="ตั้งค่ารายละเอียดของโต๊ะ"
        footer={
          <>
            <button className="o-btn ghost" onClick={() => setEditing(null)}>ยกเลิก</button>
            <button className="o-btn primary" onClick={() => { setEditing(null); ctx.showToast("บันทึกแล้ว", "Check"); }}>บันทึก</button>
          </>
        }
      >
        <div className="o-form-row">
          <label>หมายเลขโต๊ะ *</label>
          <input className="o-input" type="number" defaultValue={editing?.number || ""} placeholder="13" />
        </div>
        <div className="o-form-grid">
          <div className="o-form-row">
            <label>จำนวนที่นั่ง</label>
            <input className="o-input" type="number" defaultValue={editing?.seats || 4} />
          </div>
          <div className="o-form-row">
            <label>โซน</label>
            <select className="o-select" defaultValue={editing?.zone || "ในร้าน"} style={{ height: 40 }}>
              <option>ในร้าน</option>
              <option>ระเบียง</option>
              <option>ห้อง VIP</option>
              <option>กลางแจ้ง</option>
            </select>
          </div>
        </div>
      </OModal>
    </div>
  );
}

// =====================================================
// REPORTS
// =====================================================
function OReports({ ctx }) {
  const [range, setRange] = useSB("30d");

  const lineData = useMB(() => {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 14;
    return window.O_DAILY.slice(-days).map(d => ({
      label: `${d.date.getDate()}/${d.date.getMonth()+1}`,
      value: d.revenue,
      tip: oTHB(d.revenue),
    }));
  }, [range]);

  const ordersLineData = useMB(() => {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 14;
    return window.O_DAILY.slice(-days).map(d => ({
      label: `${d.date.getDate()}/${d.date.getMonth()+1}`,
      value: d.orders,
    }));
  }, [range]);

  // Category breakdown (mock pie via bars)
  const catBreakdown = useMB(() => {
    const map = {};
    window.O_ORDERS.forEach(o => o.items.forEach(it => {
      const m = window.MENU.find(x => x.id === it.itemId);
      if (!m) return;
      const c = window.O_CATEGORIES.find(c => c.id === m.cat);
      const name = c?.name || m.cat;
      map[name] = (map[name] || 0) + it.unitPrice * it.qty;
    }));
    return Object.entries(map).map(([label, value]) => ({ label, value }));
  }, []);

  const totalRevenue = window.O_DAILY.slice(-30).reduce((s, d) => s + d.revenue, 0);
  const totalOrders = window.O_DAILY.slice(-30).reduce((s, d) => s + d.orders, 0);

  return (
    <div className="o-fade-in">
      <div className="o-page-head">
        <div>
          <div className="o-page-title">รายงานยอดขาย</div>
          <div className="o-page-sub">วิเคราะห์ยอดขายและประสิทธิภาพร้าน</div>
        </div>
        <div className="o-flex-row" style={{ gap: 8 }}>
          <DateRange value={range} onChange={setRange} />
          <button className="o-btn" onClick={() => ctx.showToast("Export PDF (เดโม)", "Download")}>
            <Icon name="Download" size={14} /> Export PDF
          </button>
        </div>
      </div>

      <div className="o-grid-4" style={{ marginBottom: 20 }}>
        <KPICard tone="brand" icon="DollarSign" label="รายได้รวม (30 วัน)" value={oTHB(totalRevenue)} />
        <KPICard tone="info" icon="Receipt" label="ออเดอร์ทั้งหมด" value={totalOrders.toLocaleString("th-TH")} />
        <KPICard tone="success" icon="TrendingUp" label="ยอดเฉลี่ย/ออเดอร์" value={oTHB(Math.round(totalRevenue / totalOrders))} />
        <KPICard tone="warning" icon="Calendar" label="วันขายดีที่สุด" value="ส.21" />
      </div>

      <div className="o-grid-2" style={{ marginBottom: 20 }}>
        <div className="o-card padless">
          <div className="o-card-head">
            <div className="o-card-title">รายได้ตามวัน</div>
            <div className="o-card-sub">฿</div>
          </div>
          <div style={{ padding: 12, height: 280 }}><LineChart data={lineData} height={260} /></div>
        </div>
        <div className="o-card padless">
          <div className="o-card-head">
            <div className="o-card-title">จำนวนออเดอร์ตามวัน</div>
            <div className="o-card-sub">ออเดอร์</div>
          </div>
          <div style={{ padding: 12, height: 280 }}><LineChart data={ordersLineData} height={260} accent="rgb(59, 130, 246)" /></div>
        </div>
      </div>

      <div className="o-grid-2">
        <div className="o-card padless">
          <div className="o-card-head">
            <div className="o-card-title">เมนูขายดี</div>
            <div className="o-card-sub">เรียงตามยอดขาย</div>
          </div>
          <div style={{ padding: "12px 20px 20px" }}>
            {window.O_TOP_ITEMS.slice(0, 10).map((m, i) => (
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

        <div className="o-card padless">
          <div className="o-card-head">
            <div className="o-card-title">สัดส่วนยอดขายตามหมวด</div>
            <div className="o-card-sub">30 วันล่าสุด</div>
          </div>
          <div style={{ padding: "16px 20px 20px" }}>
            <CategoryBars data={catBreakdown} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryBars({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const palette = ["rgb(249, 115, 22)", "rgb(59, 130, 246)", "rgb(16, 185, 129)", "rgb(245, 158, 11)", "rgb(139, 92, 246)"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {data.map((d, i) => {
        const pct = (d.value / total) * 100;
        return (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
              <span style={{ fontWeight: 500 }}>{d.label}</span>
              <span style={{ color: "rgb(var(--text-muted))" }}>
                <span style={{ fontWeight: 700, color: "rgb(var(--text-primary))" }}>{pct.toFixed(1)}%</span> · {oTHB(d.value)}
              </span>
            </div>
            <div style={{ height: 10, borderRadius: 6, background: "rgb(var(--bg-subtle))", overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: palette[i % palette.length], borderRadius: 6, transition: "width 0.6s ease-out" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =====================================================
// STAFF
// =====================================================
function OStaff({ ctx }) {
  const [editing, setEditing] = useSB(null);

  return (
    <div className="o-fade-in">
      <div className="o-page-head">
        <div>
          <div className="o-page-title">จัดการพนักงาน</div>
          <div className="o-page-sub">{ctx.staff.filter(s => s.active).length} ผู้ใช้ที่ใช้งาน · {ctx.staff.length} ทั้งหมด</div>
        </div>
        <button className="o-btn primary" onClick={() => setEditing("new")}>
          <Icon name="UserPlus" size={14} /> เพิ่มพนักงาน
        </button>
      </div>

      <div className="o-card padless">
        <table className="o-table">
          <thead>
            <tr>
              <th>ชื่อ-นามสกุล</th>
              <th>Username</th>
              <th>บทบาท</th>
              <th>สถานะ</th>
              <th>เข้าใช้ล่าสุด</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ctx.staff.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="o-user-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{s.name.charAt(0)}</div>
                    <strong>{s.name}</strong>
                  </div>
                </td>
                <td className="mono">{s.username}</td>
                <td>
                  <Badge variant={s.role === "owner" ? "brand" : s.role === "manager" ? "info" : s.role === "kitchen" ? "warning" : "neutral"}>
                    {s.role === "owner" ? "เจ้าของร้าน" : s.role === "manager" ? "ผู้จัดการ" : s.role === "kitchen" ? "ครัว" : "แคชเชียร์"}
                  </Badge>
                </td>
                <td>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 9999, background: s.active ? "rgb(var(--color-success))" : "rgb(var(--text-faint))" }} />
                    {s.active ? "ใช้งาน" : "ระงับ"}
                  </span>
                </td>
                <td style={{ color: "rgb(var(--text-muted))" }}>{oRelative(s.lastLogin)}ที่แล้ว</td>
                <td style={{ textAlign: "right" }}>
                  <div className="o-flex-row" style={{ gap: 4, justifyContent: "flex-end" }}>
                    <button className="o-btn ghost" onClick={() => setEditing(s)} style={{ padding: "0 10px" }}>
                      <Icon name="Edit" size={14} />
                    </button>
                    <button className="o-btn ghost" onClick={() => ctx.toggleStaff(s.id)} style={{ padding: "0 10px" }} aria-label={s.active ? "ระงับ" : "เปิดใช้งาน"}>
                      <Icon name={s.active ? "Lock" : "Check"} size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <OModal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "เพิ่มพนักงานใหม่" : `แก้ไข: ${editing?.name}`}
        footer={
          <>
            <button className="o-btn ghost" onClick={() => setEditing(null)}>ยกเลิก</button>
            <button className="o-btn primary" onClick={() => { setEditing(null); ctx.showToast("บันทึกแล้ว", "Check"); }}>บันทึก</button>
          </>
        }
      >
        <div className="o-form-grid">
          <div className="o-form-row">
            <label>ชื่อ *</label>
            <input className="o-input" defaultValue={editing?.name?.split(" ")[0] || ""} placeholder="ชื่อจริง" />
          </div>
          <div className="o-form-row">
            <label>นามสกุล</label>
            <input className="o-input" defaultValue={editing?.name?.split(" ")[1] || ""} placeholder="นามสกุล" />
          </div>
        </div>
        <div className="o-form-grid">
          <div className="o-form-row">
            <label>Username *</label>
            <input className="o-input" defaultValue={editing?.username || ""} placeholder="kitchen-staff" />
          </div>
          <div className="o-form-row">
            <label>บทบาท *</label>
            <select className="o-select" defaultValue={editing?.role || "kitchen"} style={{ height: 40 }}>
              <option value="owner">เจ้าของร้าน</option>
              <option value="manager">ผู้จัดการ</option>
              <option value="kitchen">ครัว</option>
              <option value="cashier">แคชเชียร์</option>
            </select>
          </div>
        </div>
        {editing === "new" && (
          <div className="o-form-row">
            <label>รหัสผ่านเริ่มต้น *</label>
            <input className="o-input" type="password" placeholder="••••••••" />
            <div className="hint">พนักงานต้องเปลี่ยนรหัสผ่านในการเข้าใช้ครั้งแรก</div>
          </div>
        )}
      </OModal>
    </div>
  );
}

// =====================================================
// SETTINGS
// =====================================================
function OSettings({ ctx }) {
  const [tab, setTab] = useSB("restaurant");
  const [settings, setSettings] = useSB(window.O_SETTINGS);
  const [dirty, setDirty] = useSB(false);

  const update = (path, value) => {
    const next = JSON.parse(JSON.stringify(settings));
    const keys = path.split(".");
    let cur = next;
    for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
    cur[keys[keys.length - 1]] = value;
    setSettings(next);
    setDirty(true);
  };

  const save = () => {
    setDirty(false);
    ctx.showToast("บันทึกการตั้งค่าแล้ว", "Check");
  };

  return (
    <div className="o-fade-in">
      <div className="o-page-head">
        <div>
          <div className="o-page-title">การตั้งค่าระบบ</div>
          <div className="o-page-sub">กำหนดค่าระบบและ integrations</div>
        </div>
        {dirty && (
          <div className="o-flex-row" style={{ gap: 8 }}>
            <button className="o-btn ghost" onClick={() => { setSettings(window.O_SETTINGS); setDirty(false); }}>ยกเลิก</button>
            <button className="o-btn primary" onClick={save}><Icon name="Check" size={14} /> บันทึก</button>
          </div>
        )}
      </div>

      <div className="o-tabs">
        {[
          { id: "restaurant", label: "ข้อมูลร้าน" },
          { id: "payment",    label: "การชำระเงิน" },
          { id: "line",       label: "LINE Integration" },
          { id: "security",   label: "ความปลอดภัย" },
        ].map(t => (
          <button key={t.id} className={`o-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div className="o-card" style={{ padding: 28, maxWidth: 720 }}>
        {tab === "restaurant" && (
          <>
            <div className="o-form-grid">
              <div className="o-form-row">
                <label>ชื่อร้าน (ไทย)</label>
                <input className="o-input" value={settings.restaurant.nameTh} onChange={(e) => update("restaurant.nameTh", e.target.value)} />
              </div>
              <div className="o-form-row">
                <label>ชื่อร้าน (English)</label>
                <input className="o-input" value={settings.restaurant.nameEn} onChange={(e) => update("restaurant.nameEn", e.target.value)} />
              </div>
            </div>
            <div className="o-form-row">
              <label>ที่อยู่</label>
              <textarea className="o-input" rows={2} value={settings.restaurant.address} onChange={(e) => update("restaurant.address", e.target.value)} />
            </div>
            <div className="o-form-grid">
              <div className="o-form-row">
                <label>เบอร์โทรศัพท์</label>
                <input className="o-input" value={settings.restaurant.phone} onChange={(e) => update("restaurant.phone", e.target.value)} />
              </div>
              <div className="o-form-row">
                <label>เวลาทำการ</label>
                <div className="o-flex-row" style={{ gap: 8 }}>
                  <input className="o-input" type="time" value={settings.restaurant.open} onChange={(e) => update("restaurant.open", e.target.value)} style={{ flex: 1 }} />
                  <span style={{ color: "rgb(var(--text-muted))" }}>–</span>
                  <input className="o-input" type="time" value={settings.restaurant.close} onChange={(e) => update("restaurant.close", e.target.value)} style={{ flex: 1 }} />
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "payment" && (
          <>
            <SecretField label="PromptPay ID" value={settings.promptpay.id} onChange={(v) => update("promptpay.id", v)} />
            <div className="o-form-row">
              <label>ชื่อบัญชี</label>
              <input className="o-input" value={settings.promptpay.name} onChange={(e) => update("promptpay.name", e.target.value)} />
            </div>
            <div className="o-divider" />
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Omise (บัตรเครดิต)</div>
            <SecretField label="Public Key" value={settings.omise.publicKey} onChange={(v) => update("omise.publicKey", v)} />
            <SecretField label="Secret Key" value={settings.omise.secretKey} onChange={(v) => update("omise.secretKey", v)} sensitive />
          </>
        )}

        {tab === "line" && (
          <>
            <div style={{ padding: 14, background: "rgb(var(--color-info) / 0.06)", border: "1px solid rgb(var(--color-info) / 0.2)", borderRadius: 10, marginBottom: 20, display: "flex", gap: 10 }}>
              <Icon name="AlertCircle" size={18} style={{ color: "rgb(var(--color-info))", flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                ใช้ LINE LIFF เพื่อให้ลูกค้าเข้าระบบสั่งอาหารผ่าน LINE ได้ทันทีโดยไม่ต้องสมัครสมาชิก
              </div>
            </div>
            <SecretField label="Channel ID" value={settings.line.channelId} onChange={(v) => update("line.channelId", v)} />
            <SecretField label="Channel Secret" value={settings.line.channelSecret} onChange={(v) => update("line.channelSecret", v)} sensitive />
            <SecretField label="LIFF ID" value={settings.line.liffId} onChange={(v) => update("line.liffId", v)} />
          </>
        )}

        {tab === "security" && (
          <>
            <label style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, background: "rgb(var(--bg-subtle))", borderRadius: 10, marginBottom: 14, cursor: "pointer" }}>
              <Toggle on={settings.twoFA} onChange={(v) => update("twoFA", v)} ariaLabel="2FA" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>การยืนยันตัวตน 2 ขั้นตอน (2FA)</div>
                <div style={{ fontSize: 12, color: "rgb(var(--text-muted))", marginTop: 2 }}>เพิ่มความปลอดภัยด้วยรหัส OTP ทุกครั้งที่เข้าสู่ระบบ</div>
              </div>
            </label>
            <div className="o-divider" />
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>เปลี่ยนรหัสผ่าน</div>
            <div className="o-form-row">
              <label>รหัสผ่านปัจจุบัน</label>
              <input className="o-input" type="password" placeholder="••••••••" />
            </div>
            <div className="o-form-grid">
              <div className="o-form-row">
                <label>รหัสผ่านใหม่</label>
                <input className="o-input" type="password" placeholder="••••••••" />
              </div>
              <div className="o-form-row">
                <label>ยืนยันรหัสผ่านใหม่</label>
                <input className="o-input" type="password" placeholder="••••••••" />
              </div>
            </div>
            <button className="o-btn primary" style={{ marginTop: 8 }}>
              <Icon name="Lock" size={14} /> เปลี่ยนรหัสผ่าน
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SecretField({ label, value, onChange, sensitive }) {
  const [reveal, setReveal] = useSB(!sensitive);
  const [copied, setCopied] = useSB(false);

  const onCopy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="o-form-row">
      <label>{label}</label>
      <div className="o-secret">
        <input
          type={reveal ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
        />
        <button onClick={onCopy} aria-label="คัดลอก" title={copied ? "คัดลอกแล้ว!" : "คัดลอก"}>
          <Icon name={copied ? "Check" : "Copy"} size={15} />
        </button>
        <button onClick={() => setReveal(r => !r)} aria-label={reveal ? "ซ่อน" : "แสดง"}>
          <Icon name={reveal ? "EyeOff" : "Eye"} size={15} />
        </button>
      </div>
    </div>
  );
}

// =====================================================
// AUDIT LOG
// =====================================================
function OAudit({ ctx }) {
  const [search, setSearch] = useSB("");
  const [typeFilter, setTypeFilter] = useSB("all");
  const [selected, setSelected] = useSB(null);

  const filtered = useMB(() => {
    let list = window.O_AUDIT;
    if (typeFilter !== "all") list = list.filter(a => a.type === typeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(a => a.user.toLowerCase().includes(q) || a.target.toLowerCase().includes(q) || a.label.toLowerCase().includes(q));
    }
    return list;
  }, [search, typeFilter]);

  const types = [...new Set(window.O_AUDIT.map(a => a.type))];

  return (
    <div className="o-fade-in">
      <div className="o-page-head">
        <div>
          <div className="o-page-title">Audit Log</div>
          <div className="o-page-sub">บันทึกการเปลี่ยนแปลงทั้งหมดในระบบ · ป้องกันการแก้ไขโดยไม่ได้รับอนุญาต</div>
        </div>
        <button className="o-btn" onClick={() => ctx.showToast("Export log (เดโม)", "Download")}>
          <Icon name="Download" size={14} /> Export
        </button>
      </div>

      <div className="o-filterbar">
        <div className="o-input-wrap">
          <Icon name="Search" size={16} />
          <input className="o-input with-icon" placeholder="ค้นหาผู้ใช้, รายการ..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 280 }} />
        </div>
        <select className="o-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">ทุกประเภท</option>
          {types.map(t => {
            const m = window.O_AUDIT.find(a => a.type === t);
            return <option key={t} value={t}>{m.label}</option>;
          })}
        </select>
      </div>

      <div className="o-card padless">
        <table className="o-table">
          <thead>
            <tr>
              <th>เวลา</th>
              <th>ผู้ใช้</th>
              <th>การกระทำ</th>
              <th>เป้าหมาย</th>
              <th>IP</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} onClick={() => setSelected(a)}>
                <td style={{ fontSize: 12.5 }}>
                  <div>{oDateTime(a.at)}</div>
                  <div style={{ color: "rgb(var(--text-muted))", fontSize: 11 }}>{oRelative(a.at)}ที่แล้ว</div>
                </td>
                <td>
                  <strong>{a.user}</strong>
                  <div style={{ fontSize: 11, color: "rgb(var(--text-muted))" }}>{a.userRole}</div>
                </td>
                <td>
                  <Badge variant={
                    a.type === "refund" ? "error" :
                    a.type.startsWith("staff") ? "info" :
                    a.type.startsWith("menu") ? "brand" :
                    a.type === "settings_edit" ? "warning" : "neutral"
                  }>{a.label}</Badge>
                </td>
                <td>{a.target}</td>
                <td className="mono" style={{ fontSize: 12 }}>{a.ip}</td>
                <td style={{ textAlign: "right" }}>
                  <Icon name="ChevronRight" size={14} style={{ color: "rgb(var(--text-faint))" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.label}
        subtitle={selected ? `${oDateTime(selected.at)} · ${selected.user}` : ""}
      >
        {selected && (
          <>
            <div className="o-grid-2" style={{ gap: 12, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 11, color: "rgb(var(--text-muted))", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>ผู้ใช้</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{selected.user}</div>
                <div style={{ fontSize: 12, color: "rgb(var(--text-muted))" }}>{selected.userRole}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "rgb(var(--text-muted))", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>เป้าหมาย</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{selected.target}</div>
                <div style={{ fontSize: 12, color: "rgb(var(--text-muted))" }}>{selected.entity}</div>
              </div>
            </div>

            <div style={{ fontSize: 11, color: "rgb(var(--text-muted))", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>IP Address</div>
            <div className="mono" style={{ fontSize: 13, marginBottom: 20 }}>{selected.ip}</div>

            {selected.before && (
              <>
                <div style={{ fontSize: 11, color: "rgb(var(--text-muted))", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Before</div>
                <JSONView data={selected.before} />
              </>
            )}

            {selected.after && (
              <>
                <div style={{ fontSize: 11, color: "rgb(var(--text-muted))", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, marginTop: 16 }}>After</div>
                <JSONView data={selected.after} />
              </>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}

window.OMenu = OMenu;
window.OTables = OTables;
window.OReports = OReports;
window.OStaff = OStaff;
window.OSettings = OSettings;
window.OAudit = OAudit;
