// =====================================================
// Image upload + crop  (Owner Console — Menu Management)
// =====================================================
// Provides:
//   <ImageUpload value onChange onRemove />
//   utils.validateImage(file)
//   utils.processImage(src, pixelCrop, maxSize=800, quality=0.85) → Base64
//   utils.makeCenterCrop(imgW, imgH, aspect) → { x, y, width, height } (pct)
//
// Flow: ผู้ใช้เลือกรูป → crop/resize ใน browser → Base64 dataURL → ส่งไป POST /api/upload
//       → backend เก็บไฟล์ที่ /uploads/xxx.jpg → คืน absolute URL กลับมา
//       → frontend เก็บแค่ URL (ไม่เก็บ Base64) — backend ดีกว่าเก็บ binary ใน DB

const { useState: useSI, useEffect: useEI, useRef: useRI, useCallback: useCBI, useMemo: useMI } = React;

const MAX_SIZE_MB_DEFAULT = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// ---------- validate ----------
function validateImage(file, maxSizeMB = MAX_SIZE_MB_DEFAULT) {
  if (!file) return { valid: false, error: "ไม่พบไฟล์" };
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { valid: false, error: "ไฟล์ต้องเป็นรูปภาพ (JPG, PNG, WebP)" };
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `รูปต้องไม่เกิน ${maxSizeMB}MB` };
  }
  return { valid: true };
}

// ---------- centered crop ----------
function makeCenterCrop(imgW, imgH, aspect) {
  const imgAspect = imgW / imgH;
  let w, h;
  if (imgAspect > aspect) {
    h = imgH;
    w = h * aspect;
  } else {
    w = imgW;
    h = w / aspect;
  }
  return {
    x: (imgW - w) / 2,
    y: (imgH - h) / 2,
    width: w,
    height: h,
  };
}

// ---------- crop + resize + compress ----------
function processImage(imgEl, pixelCrop, maxSize = 800, quality = 0.85) {
  return new Promise((resolve, reject) => {
    try {
      const { width: cw, height: ch } = pixelCrop;
      // proportional resize so max(cw, ch) <= maxSize
      const scale = Math.min(1, maxSize / Math.max(cw, ch));
      const outW = Math.round(cw * scale);
      const outH = Math.round(ch * scale);
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        imgEl,
        pixelCrop.x, pixelCrop.y, cw, ch,
        0, 0, outW, outH
      );
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl);
    } catch (err) {
      reject(err);
    }
  });
}

// ---------- ImageUpload ----------
function ImageUpload({ value, onChange, onRemove, maxSizeMB = MAX_SIZE_MB_DEFAULT, onError }) {
  const [dragOver, setDragOver] = useSI(false);
  const [cropSrc, setCropSrc] = useSI(null); // when set → open crop modal
  const [confirmRemove, setConfirmRemove] = useSI(false);
  const inputRef = useRI(null);

  const emitError = useCBI((msg) => {
    if (onError) onError(msg);
    else console.warn("[ImageUpload]", msg);
  }, [onError]);

  const handleFile = useCBI((file) => {
    const v = validateImage(file, maxSizeMB);
    if (!v.valid) { emitError(v.error); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target.result);
    reader.onerror = () => emitError("ไม่สามารถอ่านรูปได้");
    reader.readAsDataURL(file);
  }, [emitError, maxSizeMB]);

  const openPicker = useCBI(() => { inputRef.current?.click(); }, []);

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = ""; // allow re-picking the same file
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  // Ctrl/Cmd+V to paste
  useEI(() => {
    const onPaste = (e) => {
      if (cropSrc) return; // already cropping
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of items) {
        if (it.kind === "file" && it.type.startsWith("image/")) {
          const f = it.getAsFile();
          if (f) { handleFile(f); break; }
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFile, cropSrc]);

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  };

  return (
    <div className="o-imgup">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        style={{ display: "none" }}
        onChange={onPick}
      />

      {value ? (
        <div className="o-imgup-frame ready">
          <img src={value} alt="รูปเมนู" />
          <div className="o-imgup-overlay">
            <button type="button" className="o-imgup-act" onClick={openPicker}>
              <Icon name="RefreshCw" size={14} /> เปลี่ยนรูป
            </button>
            <button type="button" className="o-imgup-act danger" onClick={() => setConfirmRemove(true)}>
              <Icon name="Trash" size={14} /> ลบ
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          className={`o-imgup-frame empty ${dragOver ? "drag" : ""}`}
          onClick={openPicker}
          onKeyDown={onKeyDown}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          aria-label="อัปโหลดรูปเมนู"
        >
          <div className="o-imgup-empty">
            <div className="ring"><Icon name="ImagePlus" size={28} stroke={1.8} /></div>
            <div className="t1">ลากรูปมาวาง หรือคลิกเพื่อเลือก</div>
            <div className="t2">JPG, PNG, WebP (สูงสุด {maxSizeMB}MB)</div>
            <div className="t3"><kbd>Ctrl</kbd>+<kbd>V</kbd> วางจากคลิปบอร์ดได้</div>
          </div>
        </div>
      )}

      <CropModal
        src={cropSrc}
        onClose={() => setCropSrc(null)}
        onSave={async (imgEl, pixelCrop) => {
          try {
            const dataUrl = await processImage(imgEl, pixelCrop);

            // อัปโหลดไปยัง backend (POST /api/upload) เพื่อให้ได้ URL จริง
            // ถ้า backend ไม่พร้อม (เช่นพัฒนา local ที่ไม่มี server) ใช้ dataUrl ไปก่อน
            let finalUrl = dataUrl;
            try {
              if (window.API && window.API.uploads) {
                const r = await window.API.uploads.image(dataUrl);
                if (r?.url) finalUrl = r.url;
              }
            } catch (upErr) {
              // backend ตอบ error → ใช้ Base64 ไปก่อนแบบ offline
              emitError("อัปโหลดไปเซิร์ฟเวอร์ไม่สำเร็จ — ใช้รูปแบบ offline ชั่วคราว");
            }

            onChange?.(finalUrl);
            setCropSrc(null);
          } catch (err) {
            emitError("ประมวลผลรูปไม่สำเร็จ");
          }
        }}
      />

      <OModal
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title="ลบรูปเมนูนี้?"
        subtitle="คุณสามารถอัปโหลดรูปใหม่ได้ภายหลัง"
        footer={
          <>
            <button className="o-btn ghost" onClick={() => setConfirmRemove(false)}>ยกเลิก</button>
            <button className="o-btn danger" onClick={() => { onRemove?.(); setConfirmRemove(false); }}>
              <Icon name="Trash" size={14} /> ลบรูป
            </button>
          </>
        }
      >
        <div style={{ fontSize: 13, color: "rgb(var(--text-muted))" }}>
          รูปจะถูกลบออกจากเมนูทันที — เมนูจะแสดง icon แทนจนกว่าจะอัปโหลดรูปใหม่
        </div>
      </OModal>
    </div>
  );
}

// ---------- Crop modal ----------
const ASPECTS = [
  { id: "1:1",  ratio: 1,        title: "1 : 1",  sub: "สี่เหลี่ยมจัตุรัส · เหมาะกับ thumbnail" },
  { id: "4:3",  ratio: 4 / 3,    title: "4 : 3",  sub: "แนวนอน · เหมาะกับ card" },
  { id: "16:9", ratio: 16 / 9,   title: "16 : 9", sub: "widescreen · เหมาะกับ hero" },
];

function CropModal({ src, onClose, onSave }) {
  const imgRef = useRI(null);
  const stageRef = useRI(null);
  const [aspectId, setAspectId] = useSI("1:1");
  const aspect = ASPECTS.find(a => a.id === aspectId).ratio;
  const [imgSize, setImgSize] = useSI({ w: 0, h: 0 }); // natural size
  const [crop, setCrop] = useSI(null); // {x,y,w,h} in IMAGE PIXEL coords
  const [drag, setDrag] = useSI(null);  // { mode, startX, startY, orig }
  const [saving, setSaving] = useSI(false);
  const [dirty, setDirty] = useSI(false);
  const [closeConfirm, setCloseConfirm] = useSI(false);

  // reset every time a new image is loaded
  useEI(() => {
    setAspectId("1:1");
    setCrop(null);
    setImgSize({ w: 0, h: 0 });
    setDirty(false);
    setSaving(false);
    setCloseConfirm(false);
  }, [src]);

  // when image loads, set initial centered crop
  const onImgLoad = (e) => {
    const w = e.target.naturalWidth;
    const h = e.target.naturalHeight;
    setImgSize({ w, h });
    const c = makeCenterCrop(w, h, aspect);
    setCrop({ x: c.x, y: c.y, w: c.width, h: c.height });
  };

  // when aspect changes, re-center
  useEI(() => {
    if (!imgSize.w) return;
    const c = makeCenterCrop(imgSize.w, imgSize.h, aspect);
    setCrop({ x: c.x, y: c.y, w: c.width, h: c.height });
    setDirty(true);
  }, [aspectId]); // eslint-disable-line

  // ESC closes
  useEI(() => {
    if (!src) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (dirty) setCloseConfirm(true);
        else onClose?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [src, dirty, onClose]);

  // map image → display scale
  const displayScale = useMI(() => {
    if (!stageRef.current || !imgSize.w) return 1;
    const rect = stageRef.current.getBoundingClientRect();
    return Math.min(rect.width / imgSize.w, rect.height / imgSize.h);
  }, [imgSize, stageRef.current]);

  // crop in display px
  const cropDisp = useMI(() => {
    if (!crop) return null;
    return {
      x: crop.x * displayScale,
      y: crop.y * displayScale,
      w: crop.w * displayScale,
      h: crop.h * displayScale,
    };
  }, [crop, displayScale]);

  // drag handlers (operate in image pixel coords)
  const onMouseDownArea = (e, mode) => {
    e.preventDefault(); e.stopPropagation();
    setDrag({
      mode,
      startX: e.clientX, startY: e.clientY,
      orig: { ...crop },
    });
    setDirty(true);
  };

  useEI(() => {
    if (!drag) return;
    const onMove = (e) => {
      const dxDisp = e.clientX - drag.startX;
      const dyDisp = e.clientY - drag.startY;
      const dx = dxDisp / displayScale;
      const dy = dyDisp / displayScale;
      let { x, y, w, h } = drag.orig;
      const imgW = imgSize.w, imgH = imgSize.h;

      if (drag.mode === "move") {
        x = Math.max(0, Math.min(imgW - w, drag.orig.x + dx));
        y = Math.max(0, Math.min(imgH - h, drag.orig.y + dy));
      } else {
        // resize from a corner; maintain aspect ratio
        const minSide = 50; // ~min in image pixels
        let nx = drag.orig.x, ny = drag.orig.y;
        let nw = drag.orig.w, nh = drag.orig.h;
        const ax = drag.mode.includes("e") ? 1 : -1;
        const ay = drag.mode.includes("s") ? 1 : -1;
        // primary axis = larger of dx*ax / dy*ay scaled by aspect
        const pdx = dx * ax;
        const pdy = dy * ay;
        // choose driver based on which produced bigger area
        let deltaW, deltaH;
        if (pdx / aspect > pdy) {
          deltaW = pdx;
          deltaH = pdx / aspect;
        } else {
          deltaH = pdy;
          deltaW = pdy * aspect;
        }
        nw = Math.max(minSide, drag.orig.w + deltaW);
        nh = nw / aspect;
        // anchor opposite corner
        const anchorX = drag.orig.x + (ax === 1 ? 0 : drag.orig.w);
        const anchorY = drag.orig.y + (ay === 1 ? 0 : drag.orig.h);
        nx = ax === 1 ? anchorX : anchorX - nw;
        ny = ay === 1 ? anchorY : anchorY - nh;
        // clamp to image bounds, shrinking if needed
        if (nx < 0) { nw += nx; nh = nw / aspect; nx = 0; if (ay === -1) ny = anchorY - nh; }
        if (ny < 0) { nh += ny; nw = nh * aspect; ny = 0; if (ax === -1) nx = anchorX - nw; }
        if (nx + nw > imgW) { nw = imgW - nx; nh = nw / aspect; if (ay === -1) ny = anchorY - nh; }
        if (ny + nh > imgH) { nh = imgH - ny; nw = nh * aspect; if (ax === -1) nx = anchorX - nw; }
        x = nx; y = ny; w = nw; h = nh;
      }
      setCrop({ x, y, w, h });
    };
    const onUp = () => setDrag(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [drag, displayScale, imgSize, aspect]);

  if (!src) return null;
  const cropPx = crop ? {
    w: Math.round(crop.w),
    h: Math.round(crop.h),
  } : { w: 0, h: 0 };
  const tooSmall = cropPx.w < 100 || cropPx.h < 100;

  const tryClose = () => {
    if (dirty) setCloseConfirm(true);
    else onClose?.();
  };

  const handleSave = async () => {
    if (!crop || tooSmall || saving) return;
    setSaving(true);
    try {
      await onSave(imgRef.current, { x: crop.x, y: crop.y, width: crop.w, height: crop.h });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="o-modal-bg" onClick={tryClose}>
        <div
          className="o-modal o-crop-modal"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="ปรับขนาดรูป"
        >
          <div className="o-modal-head">
            <div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>ปรับขนาดรูป</div>
              <div style={{ fontSize: 13, color: "rgb(var(--text-muted))", marginTop: 2 }}>
                ลากกรอบเพื่อเลือกพื้นที่ที่ต้องการ
              </div>
            </div>
            <button className="o-icon-btn" onClick={tryClose} aria-label="ปิด"><Icon name="X" size={18} /></button>
          </div>

          <div className="o-crop-body">
            {/* Stage */}
            <div className="o-crop-stage" ref={stageRef}>
              <div className="o-crop-canvas" style={imgSize.w ? {
                width: imgSize.w * displayScale,
                height: imgSize.h * displayScale,
              } : null}>
                <img
                  ref={imgRef}
                  src={src}
                  alt="ต้นฉบับ"
                  onLoad={onImgLoad}
                  draggable={false}
                  style={imgSize.w ? {
                    width: imgSize.w * displayScale,
                    height: imgSize.h * displayScale,
                  } : { maxWidth: "100%", maxHeight: "100%", display: "block" }}
                />
                {/* dim layers */}
                {cropDisp && (
                  <>
                    <div className="o-crop-shade" style={{ top: 0, left: 0, right: 0, height: cropDisp.y }} />
                    <div className="o-crop-shade" style={{ top: cropDisp.y, left: 0, width: cropDisp.x, height: cropDisp.h }} />
                    <div className="o-crop-shade" style={{ top: cropDisp.y, left: cropDisp.x + cropDisp.w, right: 0, height: cropDisp.h }} />
                    <div className="o-crop-shade" style={{ top: cropDisp.y + cropDisp.h, left: 0, right: 0, bottom: 0 }} />

                    {/* crop rect */}
                    <div
                      className="o-crop-rect"
                      style={{ left: cropDisp.x, top: cropDisp.y, width: cropDisp.w, height: cropDisp.h }}
                      onMouseDown={(e) => onMouseDownArea(e, "move")}
                    >
                      {/* grid */}
                      <div className="o-crop-grid">
                        <span /><span /><span /><span />
                      </div>
                      {/* dimensions label */}
                      <div className="o-crop-dim">{cropPx.w} × {cropPx.h} px</div>
                      {/* handles */}
                      {["nw","ne","sw","se"].map(h => (
                        <div
                          key={h}
                          className={`o-crop-handle h-${h}`}
                          onMouseDown={(e) => onMouseDownArea(e, h)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Controls */}
            <aside className="o-crop-side">
              <div className="o-crop-side-title">อัตราส่วน</div>
              <div className="o-crop-ratios">
                {ASPECTS.map(a => {
                  const active = a.id === aspectId;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      className={`o-crop-ratio ${active ? "active" : ""}`}
                      onClick={() => setAspectId(a.id)}
                    >
                      <RatioGlyph ratio={a.ratio} />
                      <div className="meta">
                        <div className="title">{a.title}</div>
                        <div className="sub">{a.sub}</div>
                      </div>
                      {active && <Icon name="Check" size={16} />}
                    </button>
                  );
                })}
              </div>

              <div className="o-divider" />

              <div className="o-crop-side-title">ตัวอย่าง</div>
              <div className="o-crop-preview">
                <div
                  className="o-crop-preview-frame"
                  style={{ aspectRatio: aspect }}
                >
                  {crop && imgSize.w && (
                    <div
                      style={{
                        position: "absolute", inset: 0,
                        backgroundImage: `url(${src})`,
                        backgroundRepeat: "no-repeat",
                        backgroundSize: `${(imgSize.w / crop.w) * 100}% ${(imgSize.h / crop.h) * 100}%`,
                        backgroundPosition: `${-(crop.x / (imgSize.w - crop.w || 1)) * 100}% ${-(crop.y / (imgSize.h - crop.h || 1)) * 100}%`,
                      }}
                    />
                  )}
                </div>
                <div className="o-crop-preview-meta">
                  <div>ขนาดที่จะบันทึก</div>
                  <div className="num">≤ 800 × 800 px · JPEG 85%</div>
                </div>
              </div>

              {tooSmall && (
                <div className="o-crop-warn">
                  <Icon name="AlertCircle" size={14} />
                  <span>กรอบเล็กเกินไป — ขยายให้ใหญ่อย่างน้อย 100×100 px</span>
                </div>
              )}
            </aside>
          </div>

          <div className="o-modal-foot">
            <button className="o-btn ghost" onClick={tryClose} disabled={saving}>ยกเลิก</button>
            <button
              className="o-btn primary"
              onClick={handleSave}
              disabled={!crop || tooSmall || saving}
              title={tooSmall ? "กรอบต้องอย่างน้อย 100×100 px" : ""}
            >
              {saving ? (
                <><Icon name="Loader" size={14} className="o-spin" /> กำลังประมวลผล...</>
              ) : (
                <><Icon name="Check" size={14} /> บันทึก</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirm-close if dirty */}
      <OModal
        open={closeConfirm}
        onClose={() => setCloseConfirm(false)}
        title="ยกเลิกการปรับขนาด?"
        subtitle="การเปลี่ยนแปลงจะหายไป"
        footer={
          <>
            <button className="o-btn ghost" onClick={() => setCloseConfirm(false)}>กลับไปแก้ไข</button>
            <button className="o-btn danger" onClick={() => { setCloseConfirm(false); onClose?.(); }}>
              ยกเลิกการแก้ไข
            </button>
          </>
        }
      >
        <div style={{ fontSize: 13, color: "rgb(var(--text-muted))" }}>
          หากปิดตอนนี้ การปรับขนาดรูปจะถูกยกเลิกและรูปจะไม่ถูกบันทึก
        </div>
      </OModal>
    </>
  );
}

function RatioGlyph({ ratio }) {
  const W = 28;
  const H = 20;
  let w, h;
  if (ratio >= W / H) { w = W; h = W / ratio; }
  else { h = H; w = H * ratio; }
  return (
    <div style={{ width: W, height: H, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <div style={{
        width: w, height: h,
        border: "1.6px solid currentColor",
        borderRadius: 3,
      }} />
    </div>
  );
}

Object.assign(window, { ImageUpload, validateImage, processImage, makeCenterCrop });
