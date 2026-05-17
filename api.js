// ============================================================
// Per's Restaurant — API Client
// ============================================================
// ใช้ window.API เพื่อเรียกใช้จากทุก app
//
// Config: ตั้ง BASE_URL ให้ตรงกับ backend server
// ============================================================

// ── ตั้งค่า URL ────────────────────────────────────────────
// Production: แก้ BACKEND_URL ให้ตรงกับ Railway URL ของคุณ
// หรือจะ inject ผ่าน window.BACKEND_URL ก็ได้ (ดู index.html)
const BASE_URL = window.BACKEND_URL || "http://localhost:4000";
const WS_URL   = BASE_URL.replace(/^http/, "ws") + "/ws";

// ── Token storage ──────────────────────────────────────────
const TOKEN_KEY = "pers_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else   localStorage.removeItem(TOKEN_KEY);
}
function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Fetch helper ───────────────────────────────────────────
async function req(method, path, body, extraHeaders = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };

  const res = await fetch(BASE_URL + path, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data   = data;
    throw err;
  }
  return data;
}

const get  = (path)        => req("GET",    path);
const post = (path, body)  => req("POST",   path, body);
const put  = (path, body)  => req("PUT",    path, body);
const patch= (path, body)  => req("PATCH",  path, body);
const del  = (path)        => req("DELETE", path);

// ── Auth ───────────────────────────────────────────────────
const auth = {
  // Staff login (kitchen / owner)
  async staffLogin(username, password) {
    const data = await post("/auth/staff/login", { username, password });
    setToken(data.token);
    return data;
  },

  // Customer: verify LINE ID token (LIFF)
  async lineVerify(idToken) {
    const data = await post("/auth/line/verify", { id_token: idToken });
    setToken(data.token);
    return data;
  },

  // Redirect browser to LINE OAuth (non-LIFF)
  lineRedirect(tableId) {
    const url = `${BASE_URL}/auth/line${tableId ? `?table=${tableId}` : ""}`;
    window.location.href = url;
  },

  // Read ?token= from URL after LINE redirect
  consumeUrlToken() {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get("token");
    const table  = params.get("table");
    if (token) {
      setToken(token);
      // Clean URL
      params.delete("token");
      const qs = params.toString();
      window.history.replaceState({}, "", qs ? `?${qs}` : window.location.pathname);
    }
    return { token, table: table ? parseInt(table, 10) : null };
  },

  async me() {
    return get("/auth/me");
  },

  logout() {
    clearToken();
  },

  isLoggedIn() {
    return !!getToken();
  },
};

// ── Menu ───────────────────────────────────────────────────
const menu = {
  list(category)    { return get(`/api/menu${category ? `?category=${category}` : ""}`); },
  recommended()     { return get("/api/menu?recommended=true"); },
  categories()      { return get("/api/menu/categories"); },
  get(id)           { return get(`/api/menu/${id}`); },
  create(body)      { return post("/api/menu", body); },
  update(id, body)  { return put(`/api/menu/${id}`, body); },
  toggleAvail(id, isAvailable) {
    return patch(`/api/menu/${id}/availability`, { isAvailable });
  },
  remove(id)        { return del(`/api/menu/${id}`); },
};

// ── Orders ─────────────────────────────────────────────────
const orders = {
  place(body)       { return post("/api/orders", body); },
  my()              { return get("/api/orders/my"); },
  get(id)           { return get(`/api/orders/${id}`); },
  setStatus(id, status) {
    return patch(`/api/orders/${id}/status`, { status });
  },
  setItemDone(orderId, itemId, isDone) {
    return patch(`/api/orders/${orderId}/items/${itemId}/done`, { isDone });
  },
  refund(id, reason) {
    return post(`/api/orders/${id}/refund`, { reason });
  },
};

// ── Kitchen ────────────────────────────────────────────────
const kitchen = {
  board()    { return get("/api/kitchen/orders"); },
  history()  { return get("/api/kitchen/history"); },
  stats()    { return get("/api/kitchen/stats"); },
};

// ── Owner ──────────────────────────────────────────────────
const owner = {
  dashboard()              { return get("/api/owner/dashboard"); },
  orders(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return get(`/api/owner/orders${qs ? `?${qs}` : ""}`);
  },
  reports(period = "30d")  { return get(`/api/owner/reports?period=${period}`); },
  tables()                 { return get("/api/owner/tables"); },
  setTableStatus(id, status) {
    return patch(`/api/owner/tables/${id}`, { status });
  },
  staff: {
    list()           { return get("/api/owner/staff"); },
    create(body)     { return post("/api/owner/staff", body); },
    update(id, body) { return put(`/api/owner/staff/${id}`, body); },
    remove(id)       { return del(`/api/owner/staff/${id}`); },
  },
  audit(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return get(`/api/owner/audit${qs ? `?${qs}` : ""}`);
  },
};

// ── WebSocket ──────────────────────────────────────────────
/**
 * Connect to the backend WebSocket and auto-auth.
 * Returns a cleanup function.
 *
 * @param {(msg: object) => void} onMessage
 * @param {{ onOpen?, onClose?, onError? }} [hooks]
 */
function connectWS(onMessage, hooks = {}) {
  let ws;
  let reconnectTimer;
  let destroyed = false;

  function connect() {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      const token = getToken();
      if (token) ws.send(JSON.stringify({ type: "AUTH", token }));
      hooks.onOpen?.();
    };

    ws.onmessage = (e) => {
      try { onMessage(JSON.parse(e.data)); } catch { /* ignore parse errors */ }
    };

    ws.onclose = () => {
      hooks.onClose?.();
      if (!destroyed) {
        reconnectTimer = setTimeout(connect, 3000); // auto-reconnect
      }
    };

    ws.onerror = (e) => {
      hooks.onError?.(e);
    };
  }

  connect();

  return function cleanup() {
    destroyed = true;
    clearTimeout(reconnectTimer);
    ws?.close();
  };
}

// ── Export ─────────────────────────────────────────────────
window.API = { auth, menu, orders, kitchen, owner, connectWS, getToken, setToken, BASE_URL, WS_URL };
