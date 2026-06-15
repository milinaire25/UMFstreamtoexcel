'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express      = require('express');
const http         = require('http');
const WebSocket    = require('ws');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const path         = require('path');
const fs           = require('fs');

const authRouter    = require('./routes/auth');
const sessionRouter = require('./routes/sessions');
const { sessionStore } = require('./store/sessions');
const { userStore }    = require('./store/users');
const { verifyToken }  = require('./middleware/auth');
const ProcessManager   = require('./services/processManager');

// ── App setup ────────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const wss    = new WebSocket.Server({ server, path: '/ws' });

app.use(helmet({ contentSecurityPolicy: false }));
const configuredOrigins = [
  process.env.FRONTEND_ORIGIN,
  process.env.RENDER_EXTERNAL_URL,
  'https://umfstreamtoexcel.onrender.com',
]
  .filter(Boolean)
  .flatMap(value => value.split(','))
  .map(origin => origin.trim())
  .filter(Boolean)
  .flatMap(origin => {
    if (/^https?:\/\//i.test(origin)) return [origin];
    return [`https://${origin}`, `http://${origin}`];
  });
const allowedOrigins = new Set([
  ...configuredOrigins,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
]);

const configuredOriginInputs = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' && configuredOriginInputs.length === 0) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
}));
app.use(express.json());

// Rate limiting
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 30 }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 200 }));

// ── REST routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',     authRouter);
app.use('/api/sessions', verifyToken, sessionRouter);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

// Serve hosted Excel add-in task pane and manifest before the React catch-all.
const excelAddinDistPath = path.join(__dirname, '../excel-addin/dist');
if (fs.existsSync(excelAddinDistPath)) {
  app.use('/excel-addin', express.static(excelAddinDistPath));
}

// Serve React frontend in production
const distPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

// ── WebSocket auth + fan-out ──────────────────────────────────────────────────
const wsClients = new Map(); // sessionId → Set<ws>

wss.on('connection', (ws, req) => {
  // Expect first message: { type:'auth', token, sessionId }
  ws.once('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { ws.close(4000, 'bad json'); return; }

    if (msg.type !== 'auth') { ws.close(4001, 'auth required'); return; }

    const user = verifyToken.sync(msg.token);
    if (!user) { ws.close(4003, 'forbidden'); return; }

    const session = sessionStore.get(msg.sessionId);
    if (!session || session.ownerUsername !== user.username) {
      ws.close(4004, 'session not found'); return;
    }

    // Register client
    if (!wsClients.has(msg.sessionId)) wsClients.set(msg.sessionId, new Set());
    wsClients.get(msg.sessionId).add(ws);

    ws.send(JSON.stringify({ type: 'connected', sessionId: msg.sessionId }));

    // Send buffered messages
    session.messages.forEach(m => ws.send(JSON.stringify({ type: 'message', data: m })));

    ws.on('close', () => {
      wsClients.get(msg.sessionId)?.delete(ws);
    });
  });
});

// ── Broadcast helper (called by ProcessManager) ───────────────────────────────
function broadcastToSession(sessionId, payload) {
  const clients = wsClients.get(sessionId);
  if (!clients) return;
  const data = JSON.stringify(payload);
  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  });
}

// Attach broadcast to ProcessManager so it can push messages
ProcessManager.setBroadcast(broadcastToSession);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[server] Listening on http://0.0.0.0:${PORT}`);
});

// Graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`[server] ${signal} received — stopping all Java sessions gracefully…`);
  await ProcessManager.stopAll();   // waits up to 10 s per session for JVM shutdown hooks
  server.close(() => {
    console.log('[server] HTTP server closed. Exiting.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
