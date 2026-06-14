import './styles.css';
import {
  HEADERS,
  SHEET_NAME,
  TABLE_NAME,
  messageToRow,
  normalizeBackendUrl,
  normalizeWebSocketUrl,
  socketUrlFromBackend,
} from './message.js';

const state = {
  token: '',
  socket: null,
  count: 0,
  officeReady: false,
};

const els = {
  form: document.querySelector('#connect-form'),
  backendUrl: document.querySelector('#backend-url'),
  wsUrl: document.querySelector('#ws-url'),
  username: document.querySelector('#username'),
  password: document.querySelector('#password'),
  loginButton: document.querySelector('#login-button'),
  sessionSelect: document.querySelector('#session-select'),
  connectButton: document.querySelector('#connect-button'),
  disconnectButton: document.querySelector('#disconnect-button'),
  clearButton: document.querySelector('#clear-button'),
  statusDot: document.querySelector('#status-dot'),
  statusText: document.querySelector('#status-text'),
  messageCount: document.querySelector('#message-count'),
  lastReceived: document.querySelector('#last-received'),
  log: document.querySelector('#log'),
};

Office.onReady(() => {
  state.officeReady = typeof Excel !== 'undefined';
  if (!state.officeReady) {
    log('Office.js loaded outside Excel. UI preview is available, but sheet writes are disabled.');
  }
});

els.backendUrl.addEventListener('change', () => {
  try {
    els.backendUrl.value = normalizeBackendUrl(els.backendUrl.value);
    els.wsUrl.value = socketUrlFromBackend(els.backendUrl.value);
  } catch {
    // Leave the explicit websocket URL untouched while the user edits.
  }
});

els.loginButton.addEventListener('click', loginAndLoadSessions);
els.form.addEventListener('submit', (event) => {
  event.preventDefault();
  connectFeed();
});
els.disconnectButton.addEventListener('click', disconnectFeed);
els.clearButton.addEventListener('click', clearSheet);

async function loginAndLoadSessions() {
  setStatus('connecting', 'Logging in...');
  try {
    const login = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: {
        username: els.username.value.trim(),
        password: els.password.value,
      },
    });
    state.token = login.token;

    const sessions = await apiRequest('/api/sessions', { method: 'GET' });
    els.sessionSelect.innerHTML = '';

    if (!sessions.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No sessions found in the dashboard';
      els.sessionSelect.append(option);
      els.sessionSelect.disabled = true;
      els.connectButton.disabled = true;
      setStatus('idle', 'Logged in, no sessions found');
      return;
    }

    sessions.forEach((session) => {
      const option = document.createElement('option');
      option.value = session.id;
      option.textContent = `${session.serviceAccount} - ${session.trackEmail || session.trackUUID} (${session.status})`;
      els.sessionSelect.append(option);
    });

    els.sessionSelect.disabled = false;
    els.connectButton.disabled = false;
    setStatus('idle', `Loaded ${sessions.length} session${sessions.length === 1 ? '' : 's'}`);
  } catch (error) {
    setStatus('error', error.message);
    log(error.stack || error.message);
  }
}

function connectFeed() {
  if (!state.token) {
    setStatus('error', 'Login before connecting.');
    return;
  }

  const sessionId = els.sessionSelect.value;
  if (!sessionId) {
    setStatus('error', 'Choose a session before connecting.');
    return;
  }

  disconnectFeed();
  els.wsUrl.value = normalizeWebSocketUrl(els.wsUrl.value);
  state.socket = new WebSocket(els.wsUrl.value);
  setStatus('connecting', 'Opening WebSocket...');

  state.socket.addEventListener('open', () => {
    state.socket.send(JSON.stringify({ type: 'auth', token: state.token, sessionId }));
    setStatus('connecting', 'Authenticating feed...');
  });

  state.socket.addEventListener('message', async (event) => {
    let payload;
    try {
      payload = JSON.parse(event.data);
    } catch {
      log(`Ignored non-JSON WebSocket payload: ${event.data}`);
      return;
    }

    if (payload.type === 'connected') {
      setStatus('connected', `Connected to session ${payload.sessionId}`);
      els.disconnectButton.disabled = false;
      return;
    }

    if (payload.type === 'status') {
      setStatus(payload.status === 'error' ? 'error' : 'connected', payload.error || payload.status);
      return;
    }

    if (payload.type === 'log') {
      log(payload.text);
      return;
    }

    if (payload.type === 'message') {
      await writeMessage(payload.data);
    }
  });

  state.socket.addEventListener('error', () => {
    setStatus('error', 'WebSocket error. Check the URL and backend status.');
  });

  state.socket.addEventListener('close', (event) => {
    els.disconnectButton.disabled = true;
    if (event.code && event.code !== 1000) {
      setStatus('error', `WebSocket closed (${event.code}) ${event.reason || ''}`.trim());
    } else {
      setStatus('idle', 'Disconnected');
    }
  });
}

function disconnectFeed() {
  if (state.socket) {
    state.socket.close(1000, 'user disconnected');
    state.socket = null;
  }
  els.disconnectButton.disabled = true;
}

async function writeMessage(message) {
  const receivedAt = new Date().toISOString();
  const row = messageToRow(message, receivedAt);

  if (!state.officeReady) {
    log(`Preview only: ${row[4] || row[6]}`);
    return;
  }

  await Excel.run(async (context) => {
    const table = await getOrCreateFeedTable(context);
    table.rows.add(0, [row]);
    table.getRange().format.autofitColumns();
    await context.sync();
  });

  state.count += 1;
  els.messageCount.textContent = String(state.count);
  els.lastReceived.textContent = new Date(receivedAt).toLocaleTimeString();
  setStatus('connected', 'Connected - latest message written to row 2');
}

async function clearSheet() {
  if (!state.officeReady) {
    state.count = 0;
    els.messageCount.textContent = '0';
    log('Preview cleared.');
    return;
  }

  await Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getItemOrNullObject(SHEET_NAME);
    await context.sync();
    if (!sheet.isNullObject) {
      sheet.delete();
    }
    await context.sync();
  });

  state.count = 0;
  els.messageCount.textContent = '0';
  els.lastReceived.textContent = '--';
  setStatus(state.socket ? 'connected' : 'idle', state.socket ? 'Connected - sheet cleared' : 'Sheet cleared');
}

async function getOrCreateFeedTable(context) {
  let sheet = context.workbook.worksheets.getItemOrNullObject(SHEET_NAME);
  await context.sync();

  if (sheet.isNullObject) {
    sheet = context.workbook.worksheets.add(SHEET_NAME);
  }

  sheet.activate();
  let table = context.workbook.tables.getItemOrNullObject(TABLE_NAME);
  await context.sync();

  if (table.isNullObject) {
    sheet.getRange('A1:G1').values = [HEADERS];
    table = sheet.tables.add('A1:G1', true);
    table.name = TABLE_NAME;
    table.getHeaderRowRange().format.font.bold = true;
    table.getRange().format.autofitColumns();
  }

  return table;
}

async function apiRequest(path, options) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  els.backendUrl.value = normalizeBackendUrl(els.backendUrl.value);
  const url = `${els.backendUrl.value}${path}`;
  log(`${options.method} ${url}`);
  const response = await fetch(url, {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  return data;
}

function setStatus(kind, text) {
  els.statusDot.className = `dot ${kind}`;
  els.statusText.textContent = text;
  log(text);
}

function log(message) {
  const line = `[${new Date().toLocaleTimeString()}] ${message}`;
  els.log.textContent = `${line}\n${els.log.textContent}`.slice(0, 5000);
}
