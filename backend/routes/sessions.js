'use strict';

const router  = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { sessionStore } = require('../store/sessions');
const ProcessManager   = require('../services/processManager');

// GET /api/sessions  – list sessions for logged-in user
router.get('/', (req, res) => {
  const sessions = sessionStore.byUser(req.user.username).map(sanitize);
  res.json(sessions);
});

// POST /api/sessions  – create a new session
router.post('/', (req, res) => {
  const { serviceAccount, password, trackEmail, trackUUID, env, pluginDir } = req.body || {};

  if (!serviceAccount || !password)
    return res.status(400).json({ error: 'serviceAccount and password are required' });
  if (!trackEmail && !trackUUID)
    return res.status(400).json({ error: 'trackEmail or trackUUID is required' });

  const id = uuidv4();
  const session = {
    id,
    ownerUsername: req.user.username,
    serviceAccount,
    password,            // stored in memory only – never returned to client
    trackEmail: trackEmail || '',
    trackUUID:  trackUUID  || '',
    env: env || 'prod',
    pluginDir: pluginDir || '',
    status: 'stopped',
    messages: [],
    createdAt: new Date().toISOString(),
    startedAt: null,
    pid: null,
    errorLog: [],
  };

  sessionStore.set(id, session);
  res.status(201).json(sanitize(session));
});

// GET /api/sessions/:id
router.get('/:id', (req, res) => {
  const s = getOwned(req);
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.json(sanitize(s));
});

// DELETE /api/sessions/:id
router.delete('/:id', async (req, res) => {
  const s = getOwned(req);
  if (!s) return res.status(404).json({ error: 'Not found' });
  await ProcessManager.stop(req.params.id);
  sessionStore.delete(req.params.id);
  res.json({ deleted: req.params.id });
});

// POST /api/sessions/:id/start
router.post('/:id/start', async (req, res) => {
  const s = getOwned(req);
  if (!s) return res.status(404).json({ error: 'Not found' });
  if (s.status === 'running') return res.json({ status: 'already running' });

  try {
    await ProcessManager.start(req.params.id);
    res.json(sanitize(sessionStore.get(req.params.id)));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/sessions/:id/stop
router.post('/:id/stop', async (req, res) => {
  const s = getOwned(req);
  if (!s) return res.status(404).json({ error: 'Not found' });
  await ProcessManager.stop(req.params.id);
  res.json(sanitize(sessionStore.get(req.params.id)));
});

// GET /api/sessions/:id/messages
router.get('/:id/messages', (req, res) => {
  const s = getOwned(req);
  if (!s) return res.status(404).json({ error: 'Not found' });
  const since = parseInt(req.query.since || '0', 10);
  res.json(s.messages.slice(since));
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function getOwned(req) {
  const s = sessionStore.get(req.params.id);
  if (!s) return null;
  if (s.ownerUsername !== req.user.username && req.user.role !== 'admin') return null;
  return s;
}

function sanitize(s) {
  const { password, ...safe } = s;  // never expose password to client
  return safe;
}

module.exports = router;
