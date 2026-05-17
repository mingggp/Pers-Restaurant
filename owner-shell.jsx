// Owner desktop — shell + login + reusable components (sidebar, charts, drawer, etc.)

const { useState: useS, useEffect: useE, useMemo: useM, useRef: useR, useCallback: useCB } = React;

// ---------- Format helpers ----------
function oTHB(n) { return "฿" + (n || 0).toLocaleString("th-TH"); }
function oTime(ms) { return new Date(ms).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }); }
function oDate(ms) { return new Date(ms).toLocaleDateString("th-TH", { day: "numeric", month: "short" }); }
function oDateLong(ms) { return new Date(ms).toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
function oDateTime(ms) {
  const d = new Date(ms);
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" }) + " " + oTime(ms);
}
function oRelative(ms) {
  const sec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (sec < 60) return `${sec} วิ`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m} นาที`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชม.`;
  const d = Math.floor(h / 24);
  return `${d} วัน`;
}
window.oTHB = oTHB; window.oTime = oTime; window.oDate = oDate;

// ---------- Status helper ----------
function StatusPill({ status }) {
  const map = {
    paid:     { label: "ชำระแล้ว", cls: "paid" },
    cooking:  { label: "กำลังทำ",   cls: "cooking" },
    served:   { label: "เสิร์ฟแล้ว", cls: "served" },
    refunded: { label: "คืนเงิน",   cls: "refunded" },
    new:      { label: "ใหม่",      cls: "paid" },
    done:     { label: "เสิร์ฟแล้ว", cls: "served" },
  };
  const m = map[status] || { label: status, cls: "served" };
  return <span className={`o-status ${m.cls}`}><span className="dot" />{m.label}</span>;
}
window.StatusPill = StatusPill;

// ---------- Toggle ----------
function Toggle({ on, onChange, ariaLabel }) {
  return <button className={`o-toggle ${on ? "on" : ""}`} onClick={() => onChange(!on)} aria-label={ariaLabel} aria-pressed={on} />;
}
window.Toggle = Toggle;

// ---------- Sidebar ----------
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard",     icon: "Home",         section: "overview" },
  { id: "orders",    label: "ออเดอร์",        icon: "Receipt",      section: "operations", badge: "live" },
  { id: "menu",      label: "จัดการเมนู",     icon: "Utensils",     section: "operations" },
  { id: "tables",    label: "จัดการโต๊ะ",     icon: "Grid",         section: "operations" },
  { id: "reports",   label: "รายงาน",         icon: "BarChart",     section: "insights" },
  { id: "staff",     label: "พนักงาน",         icon: "Users",        section: "admin" },
  { id: "settings",  label: "การตั้งค่า",      icon: "Settings",     section: "admin" },
  { id: "audit",     label: "Audit Log",      icon: "ListChecks",   section: "admin" },
];
const NAV_SECTIONS = [
  { id: "overview",   label: "ภาพรวม" },
  { id: "operations", label: "การดำเนินงาน" },
  { id: "insights",   label: "วิเคราะห์" },
  { id: "admin",      label: "ผู้ดูแล" },
];

function Sidebar({ page, onNav, user, onLogout, activeOrderCount }) {
  return (
    <aside className="o-side">
      <div className="o-brand">
        <div className="o-brand-mark">P</div>
        <div className="o-brand-text">
          <div className="name">{window.RESTAURANT.nameTh}</div>
          <div className="sub">Owner Console</div>
        </div>
      </div>

      {NAV_SECTIONS.map(sec => (
        <div key={sec.id}>
          <div className="o-nav-label">{sec.label}</div>
          {NAV_ITEMS.filter(n => n.section === sec.id).map(n => (
            <button
              key={n.id}
              className={`o-nav-item ${page === n.id ? "active" : ""}`}
              onClick={() => onNav(n.id)}
            >
              <Icon name={n.icon} size={18} stroke={1.8} />
              <span>{n.label}</span>
              {n.badge === "live" && activeOrderCount > 0 && (
                <span className="badge-mini">{activeOrderCount}</span>
              )}
            </button>
          ))}
        </div>
      ))}

      <div className="o-side-foot">
        <div className="o-user">
          <div className="o-user-avatar">{user.initials || "P"}</div>
          <div className="o-user-info">
            <div className="name">{user.name}</div>
            <div className="role">{user.role || "เจ้าของร้าน"}</div>
          </div>
          <button className="o-logout" onClick={onLogout} aria-label="ออกจากระบบ" title="ออกจากระบบ">
            <Icon name="ArrowLeft" size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
window.Sidebar = Sidebar;

// ---------- Date Range ----------
function DateRange({ value, onChange }) {
  const opts = [
    { id: "today", label: "วันนี้" },
    { id: "7d",    label: "7 วัน" },
    { id: "30d",   label: "30 วัน" },
    { id: "custom",label: "Custom" },
  ];
  return (
    <div className="o-range">
      {opts.map(o => (
        <button key={o.id} className={value === o.id ? "active" : ""} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
window.DateRange = DateRange;

// ---------- KPI Card ----------
function KPICard({ tone = "brand", icon, label, value, deltaPct, deltaAbs, deltaSuffix }) {
  const direction = deltaPct != null ? (deltaPct > 0 ? "up" : deltaPct < 0 ? "down" : "flat") : (deltaAbs != null ? (deltaAbs > 0 ? "up" : deltaAbs < 0 ? "down" : "flat") : "flat");
  const arrow = direction === "up" ? "TrendingUp" : direction === "down" ? "TrendingDown" : "Minus";
  return (
    <div className={`o-card o-kpi ${tone}`}>
      <div className="top">
        <div className="label">{label}</div>
        <div className="icon-wrap"><Icon name={icon} size={18} stroke={2} /></div>
      </div>
      <div className="value">{value}</div>
      <div className="delta-row">
        {(deltaPct != null || deltaAbs != null) && (
          <span className={`delta ${direction}`}>
            <Icon name={arrow} size={12} stroke={2.4} />
            {deltaPct != null ? `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%` : `${deltaAbs >= 0 ? "+" : ""}${deltaAbs}${deltaSuffix || ""}`}
          </span>
        )}
        <span>เทียบกับเมื่อวาน</span>
      </div>
    </div>
  );
}
window.KPICard = KPICard;

// ---------- Line Chart (SVG) ----------
function LineChart({ data, height = 220, accent = "rgb(249, 115, 22)" }) {
  const W = 640;
  const H = height;
  const padL = 44, padR = 16, padT = 16, padB = 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const max = Math.max(...data.map(d => d.value)) * 1.15;
  const min = 0;
  const x = (i) => padL + (data.length === 1 ? innerW / 2 : (i * innerW) / (data.length - 1));
  const y = (v) => padT + innerH - ((v - min) / (max - min)) * innerH;

  const pts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const area = `M${x(0)},${padT + innerH} L ${pts.split(" ").join(" L ")} L ${x(data.length - 1)},${padT + innerH} Z`;
  const line = `M ${pts.split(" ").join(" L ")}`;

  // 4 horizontal grid lines
  const gridVals = [0, 0.25, 0.5, 0.75, 1].map(t => max - t * max);
  const tickEvery = Math.max(1, Math.floor(data.length / 7));

  const [hover, setHover] = useS(null);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", display: "block" }}
         onMouseMove={(e) => {
           const rect = e.currentTarget.getBoundingClientRect();
           const px = ((e.clientX - rect.left) / rect.width) * W;
           const idx = Math.round(((px - padL) / innerW) * (data.length - 1));
           if (idx >= 0 && idx < data.length) setHover(idx);
         }}
         onMouseLeave={() => setHover(null)}>
      <defs>
        <linearGradient id="lineFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridVals.map((v, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="rgb(229,231,235)" strokeWidth="1" strokeDasharray={i === gridVals.length - 1 ? "0" : "3 3"} />
          <text x={padL - 8} y={y(v) + 3} textAnchor="end" fontSize="10" fill="rgb(156,163,175)" fontFamily="ui-monospace, monospace">
            {v >= 1000 ? Math.round(v / 1000) + "k" : Math.round(v)}
          </text>
        </g>
      ))}

      <path d={area} fill="url(#lineFill)" />
      <path d={line} fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

      {data.map((d, i) => (
        i % tickEvery === 0 ? (
          <text key={i} x={x(i)} y={H - padB / 2 + 6} textAnchor="middle" fontSize="10" fill="rgb(156,163,175)">{d.label}</text>
        ) : null
      ))}

      {hover != null && (
        <g>
          <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + innerH} stroke={accent} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          <circle cx={x(hover)} cy={y(data[hover].value)} r="5" fill={accent} stroke="white" strokeWidth="2" />
          <g transform={`translate(${Math.min(W - 110, Math.max(padL, x(hover) - 50))}, ${Math.max(padT, y(data[hover].value) - 44)})`}>
            <rect width="100" height="36" rx="6" fill="rgb(17,24,39)" />
            <text x="50" y="14" textAnchor="middle" fontSize="10" fill="rgb(156,163,175)">{data[hover].label}</text>
            <text x="50" y="28" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">{data[hover].tip || data[hover].value}</text>
          </g>
        </g>
      )}
    </svg>
  );
}
window.LineChart = LineChart;

// ---------- Bar Chart (SVG) ----------
function BarChart({ data, height = 220, accent = "rgb(59, 130, 246)" }) {
  const W = 640;
  const H = height;
  const padL = 30, padR = 12, padT = 12, padB = 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const max = Math.max(1, ...data.map(d => d.value));
  const bw = innerW / data.length * 0.7;
  const bgap = innerW / data.length * 0.3;
  const [hover, setHover] = useS(null);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", display: "block" }}>
      {[0, 0.5, 1].map((t, i) => {
        const v = max - t * max;
        const yy = padT + innerH * t;
        return <line key={i} x1={padL} x2={W - padR} y1={yy} y2={yy} stroke="rgb(229,231,235)" strokeWidth="1" strokeDasharray={t === 1 ? "0" : "3 3"} />;
      })}

      {data.map((d, i) => {
        const xx = padL + i * (bw + bgap) + bgap / 2;
        const h = (d.value / max) * innerH;
        const yy = padT + innerH - h;
        const isHover = hover === i;
        return (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <rect x={xx} y={padT} width={bw} height={innerH} fill="transparent" />
            <rect x={xx} y={yy} width={bw} height={Math.max(2, h)} rx={Math.min(3, bw / 4)} fill={isHover ? accent : `${accent}`} opacity={isHover ? 1 : 0.85} style={{ transition: "opacity 0.15s" }} />
            {(i % 3 === 0 || isHover) && (
              <text x={xx + bw / 2} y={H - padB / 2 + 8} textAnchor="middle" fontSize="10" fill={isHover ? "rgb(17,24,39)" : "rgb(156,163,175)"} fontWeight={isHover ? 600 : 400}>{d.label}</text>
            )}
            {isHover && (
              <g>
                <rect x={xx + bw / 2 - 22} y={Math.max(2, yy - 22)} width="44" height="18" rx="4" fill="rgb(17,24,39)" />
                <text x={xx + bw / 2} y={Math.max(2, yy - 22) + 12} textAnchor="middle" fontSize="11" fontWeight="700" fill="white">{d.value}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
window.BarChart = BarChart;

// ---------- Pagination ----------
function Pagination({ page, total, perPage, onPage }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const visible = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  for (let i = start; i <= end; i++) visible.push(i);
  return (
    <div className="o-pagination">
      <div>แสดง {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} จาก {total} รายการ</div>
      <div className="o-pagination-controls">
        <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1} aria-label="ก่อนหน้า"><Icon name="ChevronLeft" size={14} /></button>
        {visible.map(p => (
          <button key={p} className={p === page ? "active" : ""} onClick={() => onPage(p)}>{p}</button>
        ))}
        <button onClick={() => onPage(Math.min(pages, page + 1))} disabled={page === pages} aria-label="ถัดไป"><Icon name="ChevronRight" size={14} /></button>
      </div>
    </div>
  );
}
window.Pagination = Pagination;

// ---------- Drawer ----------
function Drawer({ open, onClose, title, subtitle, children, footer, width }) {
  useE(() => {
    if (!open) return;
    const k = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="o-drawer-bg" onClick={onClose} />
      <aside className="o-drawer" style={width ? { width } : null} role="dialog" aria-label={title}>
        <div className="o-drawer-head">
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 13, color: "rgb(var(--text-muted))", marginTop: 3 }}>{subtitle}</div>}
          </div>
          <button className="o-btn ghost" style={{ width: 36, padding: 0 }} onClick={onClose} aria-label="ปิด">
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="o-drawer-body">{children}</div>
        {footer && <div className="o-drawer-foot">{footer}</div>}
      </aside>
    </>
  );
}
window.Drawer = Drawer;

// ---------- Modal ----------
function OModal({ open, onClose, title, subtitle, children, footer, size }) {
  useE(() => {
    if (!open) return;
    const k = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="o-modal-bg" onClick={onClose}>
      <div className={`o-modal ${size === "lg" ? "lg" : ""}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="o-modal-head">
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 13, color: "rgb(var(--text-muted))", marginTop: 3 }}>{subtitle}</div>}
          </div>
          <button className="o-btn ghost" style={{ width: 36, padding: 0 }} onClick={onClose} aria-label="ปิด">
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="o-modal-body">{children}</div>
        {footer && <div className="o-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
window.OModal = OModal;

// ---------- JSON viewer ----------
function JSONView({ data }) {
  const fmt = (v, depth = 0) => {
    const pad = "  ".repeat(depth);
    if (v === null) return <span className="null">null</span>;
    if (typeof v === "string") return <span className="str">"{v}"</span>;
    if (typeof v === "number") return <span className="num">{v}</span>;
    if (typeof v === "boolean") return <span className="num">{String(v)}</span>;
    if (Array.isArray(v)) {
      return <>{"["}{v.map((x, i) => (<div key={i}>{pad}  {fmt(x, depth + 1)}{i < v.length - 1 ? "," : ""}</div>))}{pad}{"]"}</>;
    }
    if (typeof v === "object") {
      const keys = Object.keys(v);
      return <>{"{"}{keys.map((k, i) => (<div key={k}>{pad}  <span className="key">"{k}"</span>: {fmt(v[k], depth + 1)}{i < keys.length - 1 ? "," : ""}</div>))}{pad}{"}"}</>;
    }
    return String(v);
  };
  return <div className="o-json">{fmt(data)}</div>;
}
window.JSONView = JSONView;

// ---------- Login ----------
function OLogin({ onLogin }) {
  const [u, setU] = useS("");
  const [p, setP] = useS("");
  const [remember, setRemember] = useS(true);
  const [err, setErr] = useS("");
  const [loading, setLoading] = useS(false);

  const submit = async (e) => {
    e?.preventDefault();
    setErr("");
    if (!u.trim() || !p.trim()) {
      setErr("กรุณากรอก Username และ Password");
      return;
    }
    setLoading(true);
    try {
      const res = await API.auth.staffLogin(u.trim(), p);
      // token is stored by API.auth.staffLogin internally
      const me = res.user || res;
      onLogin({
        id:       me.id,
        name:     me.display_name || me.username || u,
        initials: (me.display_name || me.username || u)[0].toUpperCase(),
        role:     me.role || "staff",
        username: me.username || u,
      });
    } catch (err) {
      setErr(err.message || "Username หรือ Password ไม่ถูกต้อง");
      setLoading(false);
    }
  };

  return (
    <div className="o-login">
      <form className="o-login-card" onSubmit={submit}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div className="o-brand-mark" style={{ width: 48, height: 48, fontSize: 20 }}>P</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>{window.RESTAURANT.nameTh}</div>
            <div style={{ fontSize: 12, color: "rgb(var(--text-muted))" }}>Owner Console</div>
          </div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.4, marginBottom: 6 }}>เข้าสู่ระบบ</div>
        <div style={{ fontSize: 13, color: "rgb(var(--text-muted))", marginBottom: 24 }}>เข้าสู่หน้าจัดการร้านของคุณ</div>

        <div className="o-form-row">
          <label>Username</label>
          <input className="o-input" autoFocus value={u} onChange={(e) => setU(e.target.value)} placeholder="owner" autoComplete="username" />
        </div>
        <div className="o-form-row">
          <label>Password</label>
          <input className="o-input" type="password" value={p} onChange={(e) => setP(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 0 18px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgb(var(--text-muted))", cursor: "pointer" }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ accentColor: "rgb(var(--brand-primary))" }} />
            จำการเข้าสู่ระบบ
          </label>
          <a href="#" style={{ fontSize: 13, color: "rgb(var(--brand-primary))", textDecoration: "none", fontWeight: 500 }} onClick={(e) => e.preventDefault()}>ลืมรหัสผ่าน?</a>
        </div>

        {err && (
          <div style={{ marginBottom: 14, padding: "10px 12px", background: "rgb(var(--color-error) / 0.08)", border: "1px solid rgb(var(--color-error) / 0.3)", color: "rgb(var(--color-error))", borderRadius: 10, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="AlertCircle" size={16} />
            <span>{err}</span>
          </div>
        )}

        <button type="submit" disabled={loading} className="o-btn primary lg" style={{ width: "100%", justifyContent: "center" }}>
          {loading ? <Icon name="Loader" size={16} className="spin" /> : null}
          <span>{loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}</span>
        </button>

        <div style={{ marginTop: 18, fontSize: 11, color: "rgb(var(--text-faint))", textAlign: "center" }}>
          เข้าสู่ระบบด้วย Username/Password ของพนักงาน
        </div>
      </form>
    </div>
  );
}
window.OLogin = OLogin;
