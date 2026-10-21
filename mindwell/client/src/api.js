const BASE = import.meta.env.VITE_API_URL || '/api';

let token = null;
try {
  token = localStorage.getItem('mw_token');
} catch {
  /* storage unavailable */
}

export function setToken(t) {
  token = t;
  try {
    if (t) localStorage.setItem('mw_token', t);
    else localStorage.removeItem('mw_token');
  } catch {
    /* storage unavailable */
  }
}

export const hasToken = () => Boolean(token);

async function request(path, { method = 'GET', body, raw = false } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (raw && res.ok) return res;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.status = res.status;
    err.code = data.code;
    throw err;
  }
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body: body ?? {} }),
  put: (p, body) => request(p, { method: 'PUT', body }),
  del: (p, body) => request(p, { method: 'DELETE', body }),
  async download(path, filename) {
    const res = await request(path, { raw: true });
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
