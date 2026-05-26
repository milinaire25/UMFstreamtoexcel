import React, { useState, useRef, useEffect } from 'react';

const TABS = ['feed', 'json', 'logs', 'command'];

const STATUS_STYLE = {
  running:     { color: '#34c759', bg: 'rgba(52,199,89,0.10)',  label: 'Running' },
  connecting:  { color: '#ff9500', bg: 'rgba(255,149,0,0.10)',  label: 'Connecting…' },
  stopped:     { color: '#6e6e73', bg: 'rgba(110,110,115,0.08)', label: 'Stopped' },
  error:       { color: '#ff3b30', bg: 'rgba(255,59,48,0.10)',  label: 'Error' },
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
  }, [messages, autoScroll]);

  const filteredMsgs = filter
    ? messages.filter(m => JSON.stringify(m).toLowerCase().includes(filter.toLowerCase()))
    : messages;

  const lastMsg  = messages[messages.length - 1];
  const trackArg = session.trackEmail ? `-DtrackEmail=${session.trackEmail}` : `-DtrackUUID=${session.trackUUID}`;
  const st       = STATUS_STYLE[session.status] || STATUS_STYLE.stopped;

  const javaCmd = `java \\
  "-Djava.system.class.loader=com.refinitiv.collab.platform.msgfeed.keep.DecryptClassLoader" \\
  "-Djavax.net.ssl.trustStore=/path/to/lseg-truststore.jks" \\
  "-Djavax.net.ssl.trustStorePassword=changeit" \\
  -jar message-feed-0.0.42.0.jar \\
  "-Dserviceaccount=${session.serviceAccount}" \\
  "-Dpwd=<your-password>" \\
  "${trackArg}" \\
  "-Denv=${session.env}" \\
  "-Dplugin.dir=/path/to/plugins"`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>

      {/* Session header */}
      <div className="card" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: st.color, flexShrink: 0,
              boxShadow: session.status === 'running' ? `0 0 0 4px ${st.color}30` : 'none',
            }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.2px' }}>
                {session.serviceAccount}
              </div>
              <div style={{ fontSize: 12, color: '#6e6e73', marginTop: 3, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span>Tracking: <code style={{ background: '#f5f5f7', padding: '1px 6px', borderRadius: 5, fontSize: 11, color: '#1d1d1f' }}>{session.trackEmail || session.trackUUID}</code></span>
                <span style={{ color: '#d2d2d7' }}>·</span>
                <span>env: <code style={{ background: '#f5f5f7', padding: '1px 6px', borderRadius: 5, fontSize: 11, color: '#1d1d1f' }}>{session.env}</code></span>
                <span style={{ color: '#d2d2d7' }}>·</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 8px', borderRadius: 20,
                  background: st.bg, color: st.color, fontSize: 11, fontWeight: 600,
                }}>{st.label}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: '#6e6e73', background: '#f5f5f7', padding: '4px 10px', borderRadius: 8 }}>
              {messages.length} messages
            </div>
            {(session.status === 'running' || session.status === 'connecting') ? (
              <button onClick={onStop} style={{
                background: 'rgba(255,59,48,0.08)', color: '#ff3b30',
                border: '1px solid rgba(255,59,48,0.2)', borderRadius: 8,
                padding: '6px 14px', fontSize: 13, fontWeight: 600,
              }}>■ Stop</button>
            ) : (
              <button
                onClick={onStart}
                disabled={!!(errorMsg && errorMsg.includes('cooldown'))}
                title={errorMsg && errorMsg.includes('cooldown') ? errorMsg : undefined}
                style={{
                  background: (errorMsg && errorMsg.includes('cooldown')) ? '#d2d2d7' : '#CC785C',
                  color: '#fff', border: 'none',
                  borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600,
                  cursor: (errorMsg && errorMsg.includes('cooldown')) ? 'not-allowed' : 'pointer',
                  opacity: (errorMsg && errorMsg.includes('cooldown')) ? 0.6 : 1,
                }}>
                {(errorMsg && errorMsg.includes('cooldown')) ? '⏳ Cooldown…' : '▶ Start feed'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error / cooldown banner */}
      {errorMsg && (
        <div style={{
          padding: '12px 18px', borderRadius: 12,
          background: errorMsg.includes('cooldown')
            ? 'rgba(255,149,0,0.08)' : 'rgba(255,59,48,0.08)',
          border: `1px solid ${errorMsg.includes('cooldown')
            ? 'rgba(255,149,0,0.25)' : 'rgba(255,59,48,0.25)'}`,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>
            {errorMsg.includes('cooldown') ? '⏳' : '⚠️'}
          </span>
          <div>
            <div style={{
              fontSize: 13, fontWeight: 600,
              color: errorMsg.includes('cooldown') ? '#b37200' : '#cc2200',
              marginBottom: 3,
            }}>
              {errorMsg.includes('cooldown') ? 'Session cooldown active' : 'Connection error'}
            </div>
            <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>
              {errorMsg}
              {errorMsg.includes('cooldown') && (
                <span> — LSEG locks the session for 15 minutes after an abrupt disconnect.
                  <strong> Do not click Start again</strong> until the timer expires or you will reset the countdown.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs + content */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: 0, borderBottom: '1px solid rgba(0,0,0,0.06)',
          padding: '0 20px', background: '#fafafa', borderRadius: '12px 12px 0 0',
        }}>
          {TABS.map(t => {
            const label = t === 'feed' ? `Live feed (${messages.length})`
              : t === 'logs' ? `Logs (${logs.length})`
              : t.charAt(0).toUpperCase() + t.slice(1);
            const active = tab === t;
            return (
              <button key={t} onClick={() => setTab(t)} style={{
                border: 'none', borderBottom: `2px solid ${active ? '#CC785C' : 'transparent'}`,
                background: 'none', padding: '12px 16px',
                fontSize: 13, borderRadius: 0,
                color: active ? '#CC785C' : '#6e6e73',
                fontWeight: active ? 600 : 400,
                cursor: 'pointer', transition: 'color 0.15s',
              }}>
                {label}
              </button>
            );
          })}

          {tab === 'feed' && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
              <input value={filter} onChange={e => setFilter(e.target.value)}
                placeholder="Filter messages…"
                style={{ width: 170, padding: '5px 10px', fontSize: 12, borderRadius: 8 }} />
              <label style={{ fontSize: 12, color: '#6e6e73', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', cursor: 'pointer' }}>
                <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} style={{ width: 'auto' }} />
                Auto-scroll
              </label>
            </div>
          )}
        </div>

        {/* Content */}
        <div ref={feedRef} style={{ flex: 1, overflow: 'auto', padding: '16px 20px', maxHeight: 500 }}>

          {tab === 'feed' && (
            filteredMsgs.length === 0
              ? <EmptyFeed status={session.status} />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredMsgs.map((m, i) => <MessageCard key={i} msg={m} />)}
                </div>
          )}

          {tab === 'json' && (
            <pre style={{
              fontSize: 12, background: '#1d1d1f', color: '#e8e8ed',
              padding: 18, borderRadius: 10, overflow: 'auto', lineHeight: 1.7,
            }}>
              {lastMsg ? JSON.stringify(lastMsg, null, 2) : '// No messages yet'}
            </pre>
          )}

          {tab === 'logs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {logs.length === 0
                ? <div style={{ color: '#6e6e73', fontSize: 13, padding: '30px 0', textAlign: 'center' }}>No log output yet.</div>
                : logs.map((l, i) => (
                    <div key={i} style={{
                      fontFamily: "'SF Mono', 'Menlo', monospace", fontSize: 11,
                      color: '#1d1d1f', background: '#f5f5f7',
                      padding: '6px 10px', borderRadius: 6,
                      borderLeft: '3px solid #ff9500', lineHeight: 1.5,
                    }}>{l}</div>
                  ))
              }
            </div>
          )}

          {tab === 'command' && (
            <div>
              <p style={{ fontSize: 14, color: '#6e6e73', marginBottom: 14, lineHeight: 1.6 }}>
                This is the exact Java command the server runs when you click <strong>Start feed</strong>:
              </p>
              <pre style={{
                fontSize: 12, background: '#1d1d1f', color: '#e8e8ed',
                padding: 20, borderRadius: 12, overflow: 'auto', lineHeight: 1.8,
              }}>
                {javaCmd}
              </pre>
              <p style={{ fontSize: 13, color: '#6e6e73', marginTop: 14, lineHeight: 1.6 }}>
                The custom <code style={{ background: '#f5f5f7', padding: '1px 5px', borderRadius: 4 }}>WebSocketPlugin.jar</code> in the plugins directory implements <code style={{ background: '#f5f5f7', padding: '1px 5px', borderRadius: 4 }}>ChatroomMessageHandler</code> and writes each received message as a single JSON line to stdout. Node.js captures that stream and pushes it to your browser via WebSocket.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageCard({ msg }) {
  const [expanded, setExpanded] = useState(false);
  const d        = msg.eventData || msg;
  const time     = d.createAt ? new Date(d.createAt).toLocaleTimeString('en-SG', { hour12: false }) : '';
  const roomName = msg.additionalData?.chatRoomName || d.chatRoomId || '—';
  const userId   = msg.additionalData?.userId       || d.userUuid  || '—';
  const text     = d.message || '—';

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12,
        padding: '12px 16px', background: '#fff', cursor: 'pointer',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        boxShadow: expanded ? '0 4px 16px rgba(0,0,0,0.08)' : 'none',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(204,120,92,0.3)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#CC785C', display: 'flex', alignItems: 'center', gap: 5 }}>
          💬 {roomName}
        </span>
        <span style={{ fontSize: 11, color: '#a0a0a0', fontFamily: 'monospace' }}>{time}</span>
      </div>
      <div style={{ fontSize: 11, color: '#6e6e73', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
        👤 <code style={{ fontSize: 11 }}>{userId}</code>
      </div>
      <div style={{ fontSize: 14, color: '#1d1d1f', lineHeight: 1.5 }}>{text}</div>
      {d.attachments?.length > 0 && (
        <div style={{ fontSize: 11, color: '#6e6e73', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          📎 {d.attachments.map(a => a.attachmentName).join(', ')}
        </div>
      )}
      {expanded && (
        <pre style={{
          marginTop: 12, fontSize: 11, background: '#f5f5f7',
          padding: 12, borderRadius: 8, overflow: 'auto', color: '#1d1d1f', lineHeight: 1.6,
        }}>
          {JSON.stringify(msg, null, 2)}
        </pre>
      )}
    </div>
  );
}

function EmptyFeed({ status }) {
  if (status === 'running' || status === 'connecting') {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6e6e73' }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>📡</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#1d1d1f', marginBottom: 6 }}>
          {status === 'connecting' ? 'Connecting to LSEG Messenger…' : 'Waiting for messages'}
        </div>
        <div style={{ fontSize: 13, color: '#6e6e73' }}>
          Messages will appear here as they arrive in real time.
        </div>
      </div>
    );
  }
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6e6e73' }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>⏹</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: '#1d1d1f', marginBottom: 6 }}>Feed stopped</div>
      <div style={{ fontSize: 13 }}>Click <strong>Start feed</strong> to begin monitoring.</div>
    </div>
  );
}
