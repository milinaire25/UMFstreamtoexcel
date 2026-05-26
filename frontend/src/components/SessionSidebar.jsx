import React from 'react';

const STATUS = {
  running:      { color: '#34c759', label: 'Running' },
  connecting:   { color: '#ff9500', label: 'Connecting' },
  stopped:      { color: '#d2d2d7', label: 'Stopped' },
  error:        { color: '#ff3b30', label: 'Error' },
  disconnected: { color: '#d2d2d7', label: 'Disconnected' },
};

export default function SessionSidebar({ sessions, activeId, loading, messages, onSelect, onAdd, onStart, onStop, onDelete }) {
  const totalMsgs = Object.values(messages).reduce((a, m) => a + m.length, 0);
  const running   = sessions.filter(s => s.status === 'running').length;

  return (
    <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Stats */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            ['Sessions', sessions.length, '#0071e3'],
            ['Active',   running,          '#34c759'],
            ['Messages', totalMsgs,        '#CC785C'],
            ['Errors',   sessions.filter(s => s.status === 'error').length, '#ff3b30'],
          ].map(([label, val, color]) => (
            <div key={label} style={{
              background: '#f5f5f7', borderRadius: 10,
              padding: '10px 12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, fontWeight: 600, color, letterSpacing: '-0.5px' }}>{val}</div>
              <div style={{ fontSize: 11, color: '#6e6e73', marginTop: 2, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Session list */}
      <div className="card" style={{ padding: '14px 14px', flex: 1 }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: '#6e6e73',
          marginBottom: 12, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
          letterSpacing: '0.3px', textTransform: 'uppercase',
        }}>
          <span>Sessions</span>
          <button onClick={onAdd} style={{
            fontSize: 12, padding: '3px 10px', borderRadius: 6,
            background: '#CC785C', color: '#fff', border: 'none', fontWeight: 600,
          }}>+ Add</button>
        </div>

        {loading && (
          <div style={{ fontSize: 13, color: '#6e6e73', textAlign: 'center', padding: '20px 0' }}>
            Loading…
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div style={{ fontSize: 13, color: '#6e6e73', textAlign: 'center', padding: '24px 0', lineHeight: 1.6 }}>
            No sessions yet.<br />
            <span style={{ color: '#CC785C', cursor: 'pointer', fontWeight: 500 }} onClick={onAdd}>Add one to begin.</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sessions.map(s => {
            const isActive = s.id === activeId;
            const msgCount = (messages[s.id] || []).length;
            const st = STATUS[s.status] || STATUS.stopped;
            return (
              <div
                key={s.id}
                onClick={() => onSelect(s.id)}
                style={{
                  padding: '10px 12px', borderRadius: 10,
                  border: `1.5px solid ${isActive ? '#CC785C40' : 'rgba(0,0,0,0.06)'}`,
                  background: isActive ? '#fdf8f6' : '#fff',
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: isActive ? '0 2px 10px rgba(204,120,92,0.1)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: st.color, flexShrink: 0,
                    boxShadow: s.status === 'running' ? `0 0 0 3px ${st.color}30` : 'none',
                  }} />
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: '#1d1d1f',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', flex: 1,
                  }}>
                    {s.serviceAccount}
                  </div>
                </div>
                <div style={{
                  fontSize: 11, color: '#6e6e73', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 14,
                }}>
                  {s.trackEmail || s.trackUUID}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', marginTop: 8, paddingLeft: 14,
                }}>
                  <span style={{ fontSize: 10, color: '#a0a0a0', fontWeight: 500 }}>{msgCount} msgs</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(s.status === 'running' || s.status === 'connecting') ? (
                      <button className="sm danger" onClick={e => { e.stopPropagation(); onStop(s.id); }}
                        style={{ fontSize: 10, padding: '2px 7px' }}>Stop</button>
                    ) : (
                      <button className="sm" onClick={e => { e.stopPropagation(); onStart(s.id); }}
                        style={{ fontSize: 10, padding: '2px 7px', background: '#CC785C', color: '#fff', border: 'none' }}>Start</button>
                    )}
                    <button className="sm" onClick={e => { e.stopPropagation(); onDelete(s.id); }}
                      style={{ fontSize: 10, padding: '2px 7px', color: '#ff3b30', borderColor: 'rgba(255,59,48,0.2)' }}>✕</button>
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
