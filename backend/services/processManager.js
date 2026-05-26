'use strict';

/**
 * ProcessManager
 * ──────────────
 * Spawns the LSEG User Message Feed Java process for each session.
 * The Java process runs the WebSocketPlugin (see java-plugin/) which writes
 * one JSON object per line to stdout.  This module reads that stream and
 * pushes parsed ChatMessageEvent objects into the session store and out to
 * connected WebSocket clients.
 */

const { spawn }        = require('child_process');
const path             = require('path');
const fs               = require('fs');
const { sessionStore } = require('../store/sessions');

// JAR paths — production vs PPE/beta
// Sessions with env=beta use the PPE JAR; everything else uses the production JAR.
const JAR_PATH_PROD = process.env.MSG_FEED_JAR_PROD
  || process.env.MSG_FEED_JAR  // fallback: legacy single-jar config
  || path.join(__dirname, '../../java-plugin/dist/message-feed-0.0.42.0.jar');

const JAR_PATH_PPE  = process.env.MSG_FEED_JAR_PPE
  || process.env.MSG_FEED_JAR  // fallback: legacy single-jar config
  || path.join(__dirname, '../../java-plugin/dist/message-feed-ppe-0.0.41.0.jar');

// Environments that use the PPE/beta JAR
const PPE_ENVS = new Set(['beta', 'ppe']);

function jarPathForEnv(env) {
  return PPE_ENVS.has((env || '').toLowerCase()) ? JAR_PATH_PPE : JAR_PATH_PROD;
}

// Path to plugins directory (shared by both JARs)
const PLUGIN_DIR  = process.env.PLUGIN_DIR
  || path.join(__dirname, '../../java-plugin/dist/plugins');

// Java executable
const JAVA_BIN    = process.env.JAVA_BIN || 'java';

// Maximum buffered messages per session (oldest are dropped)
const MAX_MESSAGES = parseInt(process.env.MAX_MESSAGES || '500', 10);

const _processes  = new Map(); // sessionId → ChildProcess
const _startLock  = new Set(); // sessionId → in-flight start (mutex)
const _cooldowns  = new Map(); // sessionId → timestamp of last failed start
const _restarts   = new Map(); // sessionId → { count, nextDelayMs, connectedOnce, locked }
const _stopped    = new Set(); // sessions intentionally stopped — no auto-restart
let   _broadcast  = () => {};  // injected by server.js

// If the session connected at least once and then dropped, auto-restart.
// If the session never connected (config/credential error), don't auto-restart.
const START_COOLDOWN_MS   = 90_000;    //  90 s — short cooldown after generic error exit
const LSEG_LOCK_COOLDOWN  = 20 * 60 * 1000; // 20 min — "Session already exists" lockout
const RESTART_INITIAL_MS  = 30_000;   //  30 s first retry
const RESTART_MAX_MS      = 5 * 60_000; //   5 min max backoff
const MAX_AUTO_RESTARTS   = 8;         // give up after 8 consecutive failures

// LSEG error strings that mean we must NOT auto-restart (would reset 15-min server lock)
const LSEG_LOCK_PATTERNS  = [
  'Session already exists',
  '"error":"Session already exists',
  'Response code: 400',
];

// ── Public API ────────────────────────────────────────────────────────────────

function setBroadcast(fn) { _broadcast = fn; }

async function start(sessionId) {
  // Hard mutex: only one in-flight start per session at a time
  if (_startLock.has(sessionId)) {
    console.warn(`[pm] start() called while already starting ${sessionId} — ignoring`);
    return;
  }

  // Already running
  if (_processes.has(sessionId)) return;

  // Cooldown: prevent hammering LSEG after a failed attempt
  const lastFailed = _cooldowns.get(sessionId);
  if (lastFailed) {
    const elapsed = Date.now() - lastFailed;
    if (elapsed < START_COOLDOWN_MS) {
      const wait = Math.ceil((START_COOLDOWN_MS - elapsed) / 1000);
      console.warn(`[pm] Session ${sessionId} in cooldown — ${wait}s remaining`);
      _broadcast(sessionId, {
        type: 'status', status: 'error',
        error: `Session cooldown active — wait ${wait}s before retrying (LSEG session-lock protection)`,
      });
      return;
    }
    _cooldowns.delete(sessionId);
  }

  _startLock.add(sessionId);
  _stopped.delete(sessionId); // user explicitly started — clear intentional-stop flag

  const session = sessionStore.get(sessionId);
  if (!session) { _startLock.delete(sessionId); throw new Error('Session not found'); }

  // Build the java command
  const trackArg = session.trackEmail
    ? `-DtrackEmail=${session.trackEmail}`
    : `-DtrackUUID=${session.trackUUID}`;

  const pluginDir = session.pluginDir || PLUGIN_DIR;

  // Select JAR based on session environment
  const JAR_PATH   = jarPathForEnv(session.env);
  console.log(`[pm] Using JAR for env="${session.env}": ${path.basename(JAR_PATH)}`);

  const trustStore = process.env.TRUST_STORE
    || path.join(path.dirname(JAR_PATH), 'lseg-truststore.jks');
  const trustStorePass = process.env.TRUST_STORE_PASS || 'changeit';

  // Only pass custom truststore args if the file actually exists.
  // On cloud deployments (Render, etc.) without a local .jks the standard
  // Java cacerts bundle is used instead — works fine without AV SSL inspection.
  const trustStoreExists = fs.existsSync(trustStore);
  if (trustStoreExists) {
    console.log(`[pm] Using custom truststore: ${trustStore}`);
  } else {
    console.log(`[pm] No truststore at ${trustStore} — using Java default cacerts`);
  }

  const args = [
    `-Djava.system.class.loader=com.refinitiv.collab.platform.msgfeed.keep.DecryptClassLoader`,
    ...(trustStoreExists ? [
      `-Djavax.net.ssl.trustStore=${trustStore}`,
      `-Djavax.net.ssl.trustStorePassword=${trustStorePass}`,
    ] : []),
    `-jar`, JAR_PATH,
    `-Dserviceaccount=${session.serviceAccount}`,
    `-Dpwd=${session.password}`,
    trackArg,
    `-Denv=${session.env || 'prod'}`,
    `-Dplugin.dir=${pluginDir}`,
    `-Dloglevel=INFO`,
  ];

  console.log(`[pm] Starting session ${sessionId}`, `java ${args.slice(0,3).join(' ')} ...`);

  // Update status
  session.status   = 'connecting';
  session.startedAt = new Date().toISOString();
  session.errorLog  = [];
  sessionStore.set(sessionId, session);
  _broadcast(sessionId, { type: 'status', status: 'connecting' });

  let proc;
  try {
    proc = spawn(JAVA_BIN, args, {
      env: { ...process.env },
      cwd: path.dirname(JAR_PATH),   // run from the JAR's directory — truststore & plugins/ are relative to it
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    session.status = 'error';
    sessionStore.set(sessionId, session);
    _broadcast(sessionId, { type: 'status', status: 'error', error: e.message });
    _cooldowns.set(sessionId, Date.now());
    _startLock.delete(sessionId);
    throw e;
  }

  _startLock.delete(sessionId); // spawn succeeded — release mutex
  _processes.set(sessionId, proc);

  // Per-process restart tracking (inherit count if this is an auto-restart)
  if (!_restarts.has(sessionId)) {
    _restarts.set(sessionId, { count: 0, nextDelayMs: RESTART_INITIAL_MS, connectedOnce: false, locked: false });
  }
  const rs = _restarts.get(sessionId);
  rs.locked = false; // will be set true if we see a lock error in the logs

  // ── stdout: one JSON message per line ─────────────────────────────────────
  let lineBuffer = '';

  proc.stdout.on('data', (chunk) => {
    lineBuffer += chunk.toString();
    const lines = lineBuffer.split('\n');
    lineBuffer  = lines.pop(); // keep incomplete line

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check for LSEG session-lock error patterns
      if (LSEG_LOCK_PATTERNS.some(p => trimmed.includes(p))) {
        rs.locked = true;
        console.warn(`[pm][${sessionId}] LSEG session lock detected in stdout`);
      }

      // Detect "connected" signal from plugin
      if (trimmed === '__CONNECTED__') {
        rs.connectedOnce = true;
        rs.count = 0;                           // reset restart counter on successful connect
        rs.nextDelayMs = RESTART_INITIAL_MS;
        session.status = 'running';
        sessionStore.set(sessionId, session);
        _broadcast(sessionId, { type: 'status', status: 'running' });
        console.log(`[pm] Session ${sessionId} connected`);
        continue;
      }

      // Try to parse as a ChatMessageEvent JSON
      let msg;
      try { msg = JSON.parse(trimmed); } catch {
        // Forward non-JSON lines (LSEG app logs/errors) to the frontend log panel
        console.log(`[pm][${sessionId}] stdout:`, trimmed);
        session.errorLog.push({ ts: new Date().toISOString(), text: trimmed });
        if (session.errorLog.length > 100) session.errorLog.shift();
        sessionStore.set(sessionId, session);
        _broadcast(sessionId, { type: 'log', text: trimmed });
        continue;
      }

      // Attach metadata
      msg._receivedAt = new Date().toISOString();
      msg._sessionId  = sessionId;

      // Buffer in session
      session.messages.push(msg);
      if (session.messages.length > MAX_MESSAGES)
        session.messages.shift();
      sessionStore.set(sessionId, session);

      // Fan-out to WebSocket clients
      _broadcast(sessionId, { type: 'message', data: msg });
    }
  });

  // ── stderr: log errors ────────────────────────────────────────────────────
  proc.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    console.error(`[pm][${sessionId}] stderr:`, text.slice(0, 200));

    // Check for LSEG session-lock error patterns in stderr too
    if (LSEG_LOCK_PATTERNS.some(p => text.includes(p))) {
      rs.locked = true;
      console.warn(`[pm][${sessionId}] LSEG session lock detected in stderr`);
    }

    session.errorLog.push({ ts: new Date().toISOString(), text });
    if (session.errorLog.length > 100) session.errorLog.shift();
    sessionStore.set(sessionId, session);
    _broadcast(sessionId, { type: 'log', text });
  });

  // ── exit ──────────────────────────────────────────────────────────────────
  proc.on('exit', (code, signal) => {
    console.log(`[pm] Session ${sessionId} exited code=${code} signal=${signal}`);
    _processes.delete(sessionId);
    _startLock.delete(sessionId); // safety net

    session.pid = null;

    // ── Case 1: intentional stop (user clicked Stop / shutdown) ─────────────
    if (_stopped.has(sessionId) || signal === 'SIGKILL') {
      session.status = 'stopped';
      _restarts.delete(sessionId);
      sessionStore.set(sessionId, session);
      _broadcast(sessionId, { type: 'status', status: 'stopped' });
      return;
    }

    // ── Case 2: LSEG "Session already exists" lock ──────────────────────────
    if (rs.locked) {
      const lockMins = Math.ceil(LSEG_LOCK_COOLDOWN / 60000);
      const errMsg   = `LSEG session lock — another session is still registered on LSEG's server. Wait ${lockMins} minutes before retrying. Do NOT click Start during this time or the timer resets.`;
      console.warn(`[pm] ${errMsg}`);
      session.status = 'error';
      _cooldowns.set(sessionId, Date.now() - (START_COOLDOWN_MS - LSEG_LOCK_COOLDOWN)); // 20-min cooldown
      sessionStore.set(sessionId, session);
      _broadcast(sessionId, { type: 'status', status: 'error', error: errMsg });
      _restarts.delete(sessionId);
      return;
    }

    // ── Case 3: Session connected at least once → transient disconnect ───────
    // Auto-restart with exponential backoff (LSEG closed their side, network blip, etc.)
    if (rs.connectedOnce && rs.count < MAX_AUTO_RESTARTS) {
      const delayMs = rs.nextDelayMs;
      rs.count       += 1;
      rs.nextDelayMs  = Math.min(rs.nextDelayMs * 2, RESTART_MAX_MS);
      const delaySecs = Math.round(delayMs / 1000);
      const msg = `Session disconnected (exit ${code}). Auto-restarting in ${delaySecs}s… (attempt ${rs.count}/${MAX_AUTO_RESTARTS})`;
      console.log(`[pm] ${msg}`);
      session.status = 'connecting';
      sessionStore.set(sessionId, session);
      _broadcast(sessionId, { type: 'status', status: 'connecting', error: msg });
      setTimeout(() => {
        if (!_stopped.has(sessionId)) start(sessionId);
      }, delayMs);
      return;
    }

    // ── Case 4: Never connected, or exhausted restarts ───────────────────────
    const exhausted = rs.count >= MAX_AUTO_RESTARTS;
    const errMsg = exhausted
      ? `Feed stopped after ${MAX_AUTO_RESTARTS} failed reconnect attempts. Check credentials and logs, then click Start manually.`
      : `Feed exited (code ${code}) before connecting — check credentials, JAR path, and plugin directory.`;
    console.warn(`[pm] ${errMsg}`);
    session.status = 'error';
    _cooldowns.set(sessionId, Date.now());
    _restarts.delete(sessionId);
    sessionStore.set(sessionId, session);
    _broadcast(sessionId, { type: 'status', status: 'error', error: errMsg });
  });

  proc.on('error', (err) => {
    console.error(`[pm] Spawn error for ${sessionId}:`, err.message);
    session.status = 'error';
    session.errorLog.push({ ts: new Date().toISOString(), text: err.message });
    sessionStore.set(sessionId, session);
    _broadcast(sessionId, { type: 'status', status: 'error', error: err.message });
  });

  session.pid    = proc.pid;
  session.status = 'connecting';
  sessionStore.set(sessionId, session);
}

async function stop(sessionId) {
  const proc = _processes.get(sessionId);
  _stopped.add(sessionId);       // mark as intentional — suppresses auto-restart
  _cooldowns.delete(sessionId);  // manual stop clears any retry cooldown
  _restarts.delete(sessionId);   // reset restart counter for next manual start
  if (proc) {
    _processes.delete(sessionId);

    // Give Java up to 10 seconds to run its shutdown hooks (which close the LSEG session cleanly).
    // On Windows we use taskkill /T to send a Ctrl+Break event which triggers JVM shutdown hooks,
    // then fall back to SIGTERM if the process hasn't exited within the grace period.
    const graceful = new Promise(resolve => proc.once('exit', resolve));

    try {
      // Ctrl+Break (Windows) triggers JVM shutdown hooks cleanly
      require('child_process').exec(`taskkill /PID ${proc.pid} /T`, () => {});
    } catch (_) {
      proc.kill('SIGTERM');
    }

    // Wait up to 10 s for graceful exit, then force-kill
    const timeout = new Promise(resolve => setTimeout(resolve, 10000));
    await Promise.race([graceful, timeout]);

    // If still alive after grace period, force kill
    try { proc.kill('SIGKILL'); } catch (_) {}

    console.log(`[pm] Session ${sessionId} stopped gracefully`);
  }

  const session = sessionStore.get(sessionId);
  if (session) {
    session.status = 'stopped';
    session.pid    = null;
    sessionStore.set(sessionId, session);
    _broadcast(sessionId, { type: 'status', status: 'stopped' });
  }
}

async function stopAll() {
  await Promise.all([..._processes.keys()].map(id => stop(id)));
}

module.exports = { start, stop, stopAll, setBroadcast };
