import React, { useState, useRef, useEffect } from 'react';

const TABS = ['feed', 'json', 'logs', 'command'];

const STATUS_STYLE = {
  running:    { color: 'var(--green)',  bg: 'var(--green-bg)',  label: 'Running' },
  connecting: { color: 'var(--amber)',  bg: 'var(--amber-bg)',  label: 'Connecting…' },
  stopped:    { color: 'var(--text-3)', bg: 'var(--surface-2)',       label: 'Stopped' },
  error:      { color: 'var(--red)',    bg: 'var(--red-bg)',    label: 'Error' },
};

export default function MessageFeed({ session, messages, logs, errorMsg, onStart, onStop }) {
  const [tab,        setTab]        = useState('feed');
  const [filter,     setFilter]     = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const feedRef = useRef(null);

  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages, logs, autoScroll]);

  const filteredMsgs = filter
    ? messages.filter(m => JSON.stringify(m).toLowerCase().includes(filter.toLowerCase()))
    : messages;

  const lastMsg  = messages[messages.length - 1];
  const st       = STATUS_STYLE[session.status] || STATUS_STYLE.stopped;
  const isCooldown = !!(errorMsg && errorMsg.toLowerCase().includes('cooldown'));
  const isRunning  = session.status === 'running' || session.status === 'connecting';

  // Build a display command that reflects the current session config
  const isPPE    = ['beta', 'ppe'].includes((session.env || '').toLowerCase());
  const jarLabel = isPPE ? 'message-feed-ppe.jar' : 'message-feed-prod.jar';
  const trackArg = session.trackEmail
    ? `-DtrackEmail=${session.trackEmail}`
    : `-DtrackUUID=${session.trackUUID}`;

  const javaCmd =
`java \\
  -Djava.system.class.loader=com.refinitiv.collab.platform.msgfeed.keep.DecryptClassLoader \\
  -jar /app/java-plugin/dist/${jarLabel} \\
  -Dserviceaccount=${session.serviceAccount} \\
  -Dpwd=<password> \\
  ${trackArg} \\
  -Denv=${session.env || 'prod'} \\
  -Dplugin.dir=/app/java-plugin/dist/plugins \\
  -Dloglevel=INFO

# Note: -Djavax.net.ssl.trustStore is only added when a custom
# lseg-truststore.jks is present (not needed on cloud deployments).`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, animation: 'fadeIn 0.2s ease' }}>

      {/* ── Session header ─────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Status dot */}
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: st.color,
              animation: session.status === 'running' ? 'pulse-green 2s infinite'
                : session.status === 'connecting' ? 'pulse-amber 2s infinite' : 'none',
            }} />

            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.2px' }}>
                {session.serviceAccount}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span>
                  Tracking:{' '}
                  <code style={{ background: 'var(--surface-2)', padding: '1px 6px', borderRadius: 4, fontSize: 11, color: 'var(--text-1)', border: '1px solid var(--border)' }}>
                    {session.trackEmail || session.trackUUID}
                  </code>
                </span>
                <span style={{ color: 'var(--border-strong)' }}>·</span>
                <span>
                  env:{' '}
                  <code style={{ background: 'var(--surface-2)', padding: '1px 6px', borderRadius: 4, fontSize: 11, color: isPPE ? 'var(--amber)' : 'var(--blue)', border: '1px solid var(--border)' }}>
                    {session.env}
                  </code>
                </span>
                <span style={{ color: 'var(--border-strong)' }}>·</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '2px 8px', borderRadius: 20,
                  background: st.bg, color: st.color, fontSize: 11, fontWeight: 600,
                }}>
                  {st.label}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              fontSize: 12, color: 'var(--text-3)',
              background: 'var(--surface-2)', padding: '4px 10px',
              borderRadius: 20, border: '1px solid var(--border)',
            }}>
              {messages.length} messages
            </div>

            {isRunning ? (
              <button onClick={onStop} style={{
                background: 'rgba(239,68,68,0.08)', color: 'var(--red)',
                border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--r)',
                padding: '6px 14px', fontSize: 13, fontWeight: 600,
              }}>
                ■ Stop
              </button>
            ) : (
              <button
                onClick={onStart}
                disabled={isCooldown}
                title={isCooldown ? errorMsg : undefined}
                style={{
                  background: isCooldown ? 'var(--surface-3)' : 'var(--accent)',
                  color: isCooldown ? 'var(--text-3)' : '#fff',
                  border: 'none', borderRadius: 'var(--r)',
                  padding: '7px 16px', fontSize: 13, fontWeight: 600,
                  boxShadow: isCooldown ? 'none' : '0 2px 12px rgba(204,120,92,0.3)',
                  cursor: isCooldown ? 'not-allowed' : 'pointer',
                }}>
                {isCooldown ? '⏳ Cooldown…' : '▶ Start feed'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Error / cooldown banner ────────────────────────────────────── */}
      {errorMsg && (
        <div className="animate-fade-in" style={{
          padding: '12px 16px', borderRadius: 'var(--r)',
          background: isCooldown ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)',
          border: `1px solid ${isCooldown ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <span style={{ fontSize: 18, lineHeight: 1.2 }}>{isCooldown ? '⏳' : '⚠️'}</span>
          <div>
            <div style={{
              fontSize: 12, fontWeight: 700,
              color: isCooldown ? 'var(--amber)' : 'var(--red)',
              marginBottom: 3, letterSpacing: '0.1px',
            }}>
              {isCooldown ? 'Session cooldown active' : 'Connection error'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
              {errorMsg}
              {isCooldown && (
                <span> — LSEG locks the session for 15 minutes after an abrupt disconnect.{' '}
                  <strong style={{ color: 'var(--text-1)' }}>Do not click Start again</strong> until the timer expires.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab panel ─────────────────────────────────────────────────── */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>

        {/* Tab bar */}
        <div style={{
          display: 'flex', alignItems: 'center',
          borderBottom: '1px solid var(--border)',
          padding: '0 4px', background: 'var(--surface)',
          borderRadius: 'var(--r-lg) var(--r-lg) 0 0',
          gap: 2,
        }}>
          {TABS.map(t => {
            const label = t === 'feed'    ? `Feed  ${messages.length > 0 ? `(${messages.length})` : ''}`
                        : t === 'logs'   ? `Logs${logs.length > 0 ? `  (${logs.length})` : ''}`
                        : t === 'json'   ? 'Raw JSON'
                        : 'Command';
            const active = tab === t;
            return (
              <button key={t} onClick={() => setTab(t)} style={{
                border: 'none', borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                background: 'none', padding: '11px 14px',
                fontSize: 12, borderRadius: 0,
                color: active ? 'var(--accent)' : 'var(--text-2)',
                fontWeight: active ? 600 : 400,
                cursor: 'pointer', transition: 'color 0.15s',
                marginBottom: -1,
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-1)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-2)'; }}
              >
                {label}
              </button>
            );
          })}

          {/* Filter (feed tab only) */}
          {tab === 'feed' && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px' }}>
              <input
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Filter messages…"
                style={{ width: 160, padding: '5px 10px', fontSize: 12, borderRadius: 20, border: '1px solid var(--border-strong)' }}
              />
              <label style={{ fontSize: 11, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', cursor: 'pointer' }}>
                <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} style={{ width: 'auto' }} />
                Auto-scroll
              </label>
            </div>
          )}
        </div>

        {/* Content area */}
        <div ref={feedRef} style={{ flex: 1, overflow: 'auto', padding: '14px 16px', maxHeight: 520 }}>

          {/* ── Feed tab ── */}
          {tab === 'feed' && (
            filteredMsgs.length === 0
              ? <EmptyFeed status={session.status} />
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredMsgs.map((m, i) => <MessageCard key={i} msg={m} />)}
                </div>
              )
          )}

          {/* ── Raw JSON tab ── */}
          {tab === 'json' && (
            <pre style={{
              fontSize: 12, background: '#09090f', color: '#e0e0f0',
              padding: 18, borderRadius: 'var(--r)', overflow: 'auto',
              lineHeight: 1.7, border: '1px solid var(--border)',
            }}>
              {lastMsg ? JSON.stringify(lastMsg, null, 2) : '// No messages yet'}
            </pre>
          )}

          {/* ── Logs tab ── */}
          {tab === 'logs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {logs.length === 0
                ? <div style={{ color: 'var(--text-3)', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>No log output yet.</div>
                : logs.map((l, i) => (
                    <div key={i} style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                      color: '#c8c8e0', background: '#09090f',
                      padding: '5px 10px', borderRadius: 6,
                      borderLeft: `3px solid ${l.toLowerCase().includes('error') ? 'var(--red)' : l.toLowerCase().includes('warn') ? 'var(--amber)' : 'var(--text-3)'}`,
                      lineHeight: 1.6,
                    }}>
                      <span style={{ color: 'var(--text-3)', marginRight: 8, userSelect: 'none' }}>{String(i + 1).padStart(3, '0')}</span>
                      {l}
                    </div>
                  ))
              }
            </div>
          )}

          {/* ── Command tab ── */}
          {tab === 'command' && (
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14, lineHeight: 1.7 }}>
                The exact Java command the backend runs when you click <strong style={{ color: 'var(--text-1)' }}>Start feed</strong>.
                The <code style={{ background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 4, border: '1px solid var(--border)' }}>
                  {isPPE ? 'message-feed-ppe.jar' : 'message-feed-prod.jar'}
                </code> JAR is selected automatically based on the <strong style={{ color: isPPE ? 'var(--amber)' : 'var(--blue)' }}>{session.env}</strong> environment.
              </p>
              <CopyBlock code={javaCmd} />
              <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--text-1)' }}>WebSocketPlugin</strong> implements{' '}
                <code style={{ background: 'var(--surface-3)', padding: '1px 5px', borderRadius: 4 }}>ChatroomMessageHandler</code>{' '}
                from the LSEG SDK and writes each received message as a single JSON line to stdout.
                Node.js captures that stream and fans out to all connected browser WebSocket clients.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Copy block ─────────────────────────────────────────────────────────── */
function CopyBlock({ code }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div style={{ position: 'relative' }}>
      <pre style={{
        fontSize: 12, background: '#09090f', color: '#c0c0e0',
        padding: '16px 18px', borderRadius: 'var(--r)', overflow: 'auto',
        lineHeight: 1.8, border: '1px solid var(--border)',
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {code}
      </pre>
      <button onClick={copy} style={{
        position: 'absolute', top: 10, right: 10,
        background: copied ? 'var(--green-bg)' : 'var(--surface-3)',
        color: copied ? 'var(--green)' : 'var(--text-2)',
        border: `1px solid ${copied ? 'var(--green-border)' : 'var(--border-strong)'}`,
        borderRadius: 6, padding: '3px 10px', fontSize: 11, cursor: 'pointer',
      }}>
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );
}

/* ── Message card ────────────────────────────────────────────────────────── */
function MessageCard({ msg }) {
  const [expanded, setExpanded] = useState(false);
  const d        = msg.eventData || msg;
  const time     = d.createAt
    ? new Date(d.createAt).toLocaleTimeString('en-SG', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : new Date(msg._receivedAt || Date.now()).toLocaleTimeString('en-SG', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const roomName = msg.additionalData?.chatRoomName || d.chatRoomId || '—';
  const userId   = msg.additionalData?.userId       || d.userUuid  || '—';
  const text     = d.message || '—';

  return (
    <div
      className="animate-fade-in"
      onClick={() => setExpanded(e => !e)}
      style={{
        border: `1px solid ${expanded ? 'var(--border-accent)' : 'var(--border)'}`,
        borderRadius: 'var(--r)', padding: '12px 14px',
        background: expanded ? 'rgba(204,120,92,0.04)' : 'var(--surface-2)',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!expanded) { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'var(--surface-hover)'; } }}
      onMouseLeave={e => { if (!expanded) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-2)'; } }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.2px' }}>
            # {roomName}
          </span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: "'JetBrains Mono', monospace" }}>
          {time}
        </span>
      </div>

      {/* Sender */}
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--surface-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>👤</span>
        <code style={{ fontSize: 11, color: 'var(--text-2)' }}>{userId}</code>
      </div>

      {/* Message text */}
      <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5 }}>{text}</div>

      {/* Attachments */}
      {d.attachments?.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          📎 {d.attachments.map(a => a.attachmentName).join(', ')}
        </div>
      )}

      {/* Expanded JSON */}
      {expanded && (
        <pre style={{
          marginTop: 12, fontSize: 11, background: '#09090f', color: '#b0b0d0',
          padding: 12, borderRadius: 'var(--r-sm)', overflow: 'auto',
          lineHeight: 1.6, border: '1px solid var(--border)',
        }}>
          {JSON.stringify(msg, null, 2)}
        </pre>
      )}
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
function EmptyFeed({ status }) {
  if (status === 'connecting') {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-3)' }}>
        <div style={{ fontSize: 36, marginBottom: 16,
          display: 'inline-block', animation: 'spin 2s linear infinite' }}>⚙️</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
          Connecting to LSEG Messenger…
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
          Authenticating service account and attaching channels.
        </div>
      </div>
    );
  }
  if (status === 'running') {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-3)' }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>📡</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
          Listening for messages
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
          Messages will appear here as they arrive in real time.
        </div>
      </div>
    );
  }
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-3)' }}>
      <div style={{ fontSize: 36, marginBottom: 16 }}>⏹</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Feed stopped</div>
      <div style={{ fontSize: 12 }}>
        Click <strong style={{ color: 'var(--accent)' }}>Start feed</strong> to begin monitoring.
      </div>
    </div>
  );
}
