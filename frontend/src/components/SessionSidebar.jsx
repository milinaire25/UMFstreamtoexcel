import React from 'react';

const STATUS = {
  running:      { color: 'var(--green)',  label: 'Running',      pulse: 'pulse-green' },
  connecting:   { color: 'var(--amber)',  label: 'Connecting',   pulse: 'pulse-amber' },
  stopped:      { color: 'var(--text-3)', label: 'Stopped',      pulse: null },
  error:        { color: 'var(--red)',    label: 'Error',        pulse: null },
  disconnected: { color: 'var(--text-3)', label: 'Disconnected', pulse: null },
};

export default function SessionSidebar({ sessions, activeId, loading, messages, onSelect, onAdd, onStart, onStop, onDelete }) {
  const totalMsgs = Object.values(messages).reduce((a, m) => a + m.length, 0);
  const running   = sessions.filter(s => s.status === 'running').length;
  const errors    = sessions.filter(s => s.status === 'error').length;

  return (
    <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Sessions', value: sessions.length, color: 'var(--blue)' },
          { label: 'Active',   value: running,         color: 'var(--green)' },
          { label: 'Messages', value: totalMsgs,       color: 'var(--accent)' },
          { label: 'Errors',   value: errors,          color: errors > 0 ? 'var(--red)' : 'var(--text-3)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r)', padding: '10px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4, fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Session list */}
      <div className="card" style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 10, padding: '0 2px',
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            Sessions
          </span>
          <button onClick={onAdd} style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 20,
            background: 'var(--accent)', color: '#fff',
            border: 'none', fontWeight: 600,
            boxShadow: '0 2px 8px rgba(204,120,92,0.3)',
          }}>
            + Add
          </button>
        </div>

        {loading && (
          <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '24px 0' }}>
            Loading…
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '28px 8px', lineHeight: 1.7 }}>
            No sessions yet.{' '}
            <span style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }} onClick={onAdd}>
              Add one to begin.
            </span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sessions.map(s => {
            const isActive = s.id === activeId;
            const msgCount = (messages[s.id] || []).length;
            const st = STATUS[s.status] || STATUS.stopped;

            return (
              <div
                key={s.id}
                onClick={() => onSelect(s.id)}
                style={{
                  padding: '10px 11px', borderRadius: 'var(--r)',
                  border: `1px solid ${isActive ? 'var(--border-accent)' : 'var(--border)'}`,
                  background: isActive ? 'rgba(204,120,92,0.07)' : 'var(--surface-2)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-hover)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-2)'; }}
              >
                {/* Account + status dot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: st.color,
                    animation: st.pulse ? `${st.pulse} 2s infinite` : 'none',
                  }} />
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: 'var(--text-1)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                  }}>
                    {s.serviceAccount}
                  </div>
                </div>

                {/* Track target */}
                <div style={{
                  fontSize: 11, color: 'var(--text-3)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  paddingLeft: 14,
                }}>
                  {s.trackEmail || s.trackUUID}
                </div>

                {/* Bottom row */}
                <div style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', marginTop: 8, paddingLeft: 14,
                }}>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>
                    {msgCount} msgs · <span style={{ color: 'var(--text-3)' }}>{s.env}</span>
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(s.status === 'running' || s.status === 'connecting') ? (
                      <button className="sm danger" onClick={e => { e.stopPropagation(); onStop(s.id); }}
                        style={{ fontSize: 10, padding: '2px 8px' }}>
                        Stop
                      </button>
                    ) : (
                      <button className="sm" onClick={e => { e.stopPropagation(); onStart(s.id); }}
                        style={{ fontSize: 10, padding: '2px 8px', background: 'var(--accent)', color: '#fff', border: 'none' }}>
                        Start
                      </button>
                    )}
                    <button className="sm" onClick={e => { e.stopPropagation(); onDelete(s.id); }}
                      style={{ fontSize: 10, padding: '2px 7px', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
