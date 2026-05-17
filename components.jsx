// Reusable UI components: Button, Card, Badge, BottomSheet, QuantitySelector,
// Skeleton, EmptyState, Toast, SearchBar, DishArt, Header, etc.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ---------- Money ----------
function fmtTHB(n) {
  return "฿" + (n || 0).toLocaleString("th-TH");
}
window.fmtTHB = fmtTHB;

// ---------- Button ----------
function Button({ variant = "primary", size = "md", block, children, leftIcon, rightIcon, className = "", ...rest }) {
  const cls = `btn btn-${variant} ${block ? "btn-block" : ""} ${size === "lg" ? "btn-lg" : ""} ${className}`;
  return (
    <button className={cls} {...rest}>
      {leftIcon && <Icon name={leftIcon} size={18} />}
      <span>{children}</span>
      {rightIcon && <Icon name={rightIcon} size={18} />}
    </button>
  );
}

// ---------- Card ----------
function Card({ children, className = "", soft, ...rest }) {
  return <div className={`${soft ? "card-soft" : "card"} ${className}`} {...rest}>{children}</div>;
}

// ---------- Badge ----------
function Badge({ variant = "neutral", children, leftIcon }) {
  return (
    <span className={`badge badge-${variant}`}>
      {leftIcon && <Icon name={leftIcon} size={12} stroke={2.4} />}
      {children}
    </span>
  );
}

// ---------- Skeleton ----------
function Skeleton({ w, h = 14, r = 8, style = {}, className = "" }) {
  return <div className={`skeleton ${className}`} style={{ width: w || "100%", height: h, borderRadius: r, ...style }} />;
}

// ---------- Empty State ----------
function EmptyState({ icon = "Receipt", title, body, ctaLabel, onCta }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", textAlign: "center", flex: 1 }}>
      <div style={{ width: 80, height: 80, borderRadius: 9999, background: "rgb(var(--brand-tint))", color: "rgb(var(--brand-primary))", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Icon name={icon} size={36} stroke={1.8} />
      </div>
      <div style={{ fontSize: 17, fontWeight: 600, color: "rgb(var(--text-primary))", marginBottom: 6 }}>{title}</div>
      {body && <div style={{ fontSize: 14, color: "rgb(var(--text-muted))", lineHeight: 1.5, maxWidth: 280, marginBottom: 20 }}>{body}</div>}
      {ctaLabel && <Button variant="primary" onClick={onCta}>{ctaLabel}</Button>}
    </div>
  );
}

// ---------- Quantity Selector ----------
function QuantitySelector({ value, onChange, min = 1, max = 99, size = "md" }) {
  const dim = size === "sm" ? 30 : 36;
  return (
    <div className="qty" style={{ height: dim + 4 }}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="ลดจำนวน"
        style={{ width: dim, height: dim }}
      ><Icon name="Minus" size={14} stroke={2.4} /></button>
      <span className="val">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="เพิ่มจำนวน"
        style={{ width: dim, height: dim }}
      ><Icon name="Plus" size={14} stroke={2.4} /></button>
    </div>
  );
}

// ---------- Search Bar ----------
function SearchBar({ value, onChange, placeholder = "ค้นหาเมนู..." }) {
  return (
    <div className="search-bar">
      <Icon name="Search" size={18} className="icon-l" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgb(var(--text-muted))" }} />
      <input
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type="search"
        aria-label="ค้นหาเมนู"
      />
    </div>
  );
}

// ---------- BottomSheet ----------
function BottomSheet({ open, onClose, children, ariaLabel = "หน้าต่าง" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={ariaLabel}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grabber" />
        {children}
      </div>
    </div>
  );
}

// ---------- Confirm Modal (centered) ----------
function ConfirmModal({ open, title, body, confirmLabel = "ยืนยัน", cancelLabel = "ยกเลิก", onConfirm, onCancel, danger }) {
  if (!open) return null;
  return (
    <div className="sheet-backdrop" style={{ alignItems: "center" }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "calc(100% - 48px)", maxWidth: 320, background: "rgb(var(--bg-base))", borderRadius: 20, padding: 24, animation: "scaleIn 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, textAlign: "center" }}>{title}</div>
        {body && <div style={{ fontSize: 14, color: "rgb(var(--text-muted))", textAlign: "center", lineHeight: 1.5, marginBottom: 20 }}>{body}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" block onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={danger ? "danger" : "primary"} block onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

// ---------- Toast ----------
function Toast({ toast, onDone }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => onDone?.(), toast.duration || 2200);
    return () => clearTimeout(t);
  }, [toast, onDone]);
  if (!toast) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      {toast.icon && <Icon name={toast.icon} size={18} stroke={2.4} />}
      <span>{toast.msg}</span>
    </div>
  );
}

// ---------- MenuImage / DishArt ----------
// Renders the photo for a menu item. If `item.imageUrl` is set, shows the
// photo (object-cover). Otherwise renders a neutral icon-based fallback —
// NEVER the first letter of the item name.
function MenuImage({ item, size = "md", showPrice = false, alt, className = "" }) {
  const [failed, setFailed] = useState(false);
  const src = item && !failed ? item.imageUrl : null;
  const iconSize = size === "lg" ? 64 : size === "sm" ? 22 : 36;

  return (
    <div className={`dish-art ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt || item?.name || ""}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div className="dish-art-fallback" aria-label={alt || item?.name || "เมนู"}>
          <Icon name="UtensilsCrossed" size={iconSize} stroke={1.6} />
        </div>
      )}
      {showPrice && <div className="price-pill">{fmtTHB(item.price)}</div>}
    </div>
  );
}

// Backwards-compatible alias. Same behavior as MenuImage.
const DishArt = MenuImage;

// ---------- Header (chrome) ----------
function ScreenHeader({ title, onBack, right, subtitle }) {
  return (
    <div className="chrome" style={{ padding: "12px 12px 12px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, position: "sticky", top: 0, zIndex: 20 }}>
      {onBack ? (
        <button onClick={onBack} aria-label="ย้อนกลับ" style={{ width: 38, height: 38, borderRadius: 9999, background: "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgb(var(--text-primary))" }}>
          <Icon name="ChevronLeft" size={22} />
        </button>
      ) : <div style={{ width: 38 }} />}
      <div style={{ flex: 1, textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: "rgb(var(--text-muted))", marginTop: 1 }}>{subtitle}</div>}
      </div>
      <div style={{ minWidth: 38, display: "flex", justifyContent: "flex-end" }}>{right}</div>
    </div>
  );
}

// ---------- LINE Avatar ----------
function LineAvatar({ user, size = 32 }) {
  const fontSize = Math.round(size * 0.42);
  return (
    <div style={{
      width: size, height: size, borderRadius: 9999,
      background: "linear-gradient(135deg, #06C755 0%, #04a847 100%)",
      color: "white", fontWeight: 700, fontSize,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }} aria-label={`ผู้ใช้: ${user.displayName}`}>
      {user.initials}
    </div>
  );
}

// ---------- QR Code (faux deterministic pattern) ----------
function QRCode({ data = "promptpay-mock", size = 220 }) {
  // Deterministic pseudo-random pattern from string hash for visual realism.
  const grid = 25;
  const cell = size / grid;
  const cells = useMemo(() => {
    let h = 1779033703;
    for (let i = 0; i < data.length; i++) {
      h = Math.imul(h ^ data.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    const out = [];
    for (let y = 0; y < grid; y++) {
      const row = [];
      for (let x = 0; x < grid; x++) {
        h = Math.imul(h ^ (x * 374761393 + y * 668265263), 1274126177);
        h = (h << 13) | (h >>> 19);
        row.push((h & 7) > 3);
      }
      out.push(row);
    }
    // clear finder squares
    const clear = (cx, cy) => {
      for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) out[cy + y][cx + x] = false;
    };
    clear(0, 0); clear(grid - 7, 0); clear(0, grid - 7);
    return out;
  }, [data]);

  const finder = (cx, cy) => (
    <g key={`f-${cx}-${cy}`}>
      <rect x={cx * cell} y={cy * cell} width={cell * 7} height={cell * 7} rx={cell * 1.2} fill="#111827" />
      <rect x={(cx + 1) * cell} y={(cy + 1) * cell} width={cell * 5} height={cell * 5} rx={cell} fill="#fff" />
      <rect x={(cx + 2) * cell} y={(cy + 2) * cell} width={cell * 3} height={cell * 3} rx={cell * 0.6} fill="#111827" />
    </g>
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="คิวอาร์โค้ด PromptPay">
      <rect width={size} height={size} fill="#fff" />
      {cells.map((row, y) =>
        row.map((on, x) => on
          ? <rect key={`${x}-${y}`} x={x * cell + cell * 0.1} y={y * cell + cell * 0.1} width={cell * 0.8} height={cell * 0.8} rx={cell * 0.2} fill="#111827" />
          : null
        )
      )}
      {finder(0, 0)}
      {finder(grid - 7, 0)}
      {finder(0, grid - 7)}
      {/* center logo */}
      <rect x={size/2 - 22} y={size/2 - 22} width={44} height={44} rx={10} fill="#fff" />
      <rect x={size/2 - 18} y={size/2 - 18} width={36} height={36} rx={8} fill="rgb(var(--brand-primary))" />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff" fontFamily="-apple-system, system-ui">PR</text>
    </svg>
  );
}

// PromptPay logo mark
function PromptPayMark() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#003D7A 0%,#0050A0 100%)", color: "white", display:"flex", alignItems:"center", justifyContent:"center", fontSize: 13, fontWeight: 800, letterSpacing: -0.5 }}>P</div>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#003D7A" }}>PromptPay</span>
        <span style={{ fontSize: 10, color: "rgb(var(--text-muted))" }}>Thailand QR Payment</span>
      </div>
    </div>
  );
}

Object.assign(window, {
  Button, Card, Badge, Skeleton, EmptyState, QuantitySelector, SearchBar,
  BottomSheet, ConfirmModal, Toast, DishArt, MenuImage, ScreenHeader, LineAvatar,
  QRCode, PromptPayMark,
});
