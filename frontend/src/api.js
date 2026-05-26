const BASE = import.meta.env.VITE_API_URL || '';

function getToken() { return localStorage.getItem('token'); }

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  login:          (u, p)    => request('POST', '/api/auth/login',   { username: u, password: p }),
  me:             ()        => request('GET',  '/api/auth/me'),
  register:       (body)    => request('POST', '/api/auth/register', body),
  listUsers:      ()        => request('GET',  '/api/auth/users'),
  deleteUser:     (u)       => request('DELETE', `/api/auth/users/${u}`),

  listSessions:   ()        => request('GET',  '/api/sessions'),
  createSession:  (body)    => request('POST', '/api/sessions', body),
  getSession:     (id)      => request('GET',  `/api/sessions/${id}`),
  deleteSession:  (id)      => request('DELETE', `/api/sessions/${id}`),
  startSession:   (id)      => request('POST', `/api/sessions/${id}/start`),
  stopSession:    (id)      => request('POST', `/api/sessions/${id}/stop`),
  getMessages:    (id, since) => request('GET', `/api/sessions/${id}/messages?since=${since || 0}`),
};

// ── WebSocket factory ──────────────────────────────────────────────────────────
export function openFeedSocket(sessionId, { onMessage, onStatus, onLog, onError }) {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host  = import.meta.env.VITE_WS_HOST || window.location.host;
  const ws    = new WebSocket(`${proto}://${host}/ws`);

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'auth', token: getToken(), sessionId }));
  };

  ws.onmessage = (e) => {
    let msg;
    try { msg = JSON.parse(e.data); } catch { return; }
    if (msg.type === 'message') onMessage?.(msg.data);
    if (msg.type === 'status')  onStatus?.(msg);
    if (msg.type === 'log')     onLog?.(msg.text);
    if (msg.type === 'connected') onStatus?.({ status: 'running' });
  };

  ws.onerror = (e) => onError?.(e);
  ws.onclose = ()  => onStatus?.({ status: 'disconnected' });

  return ws;
}
