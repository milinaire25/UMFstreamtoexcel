import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, openFeedSocket } from '../api';
import SessionForm    from '../components/SessionForm';
import MessageFeed    from '../components/MessageFeed';
import SessionSidebar from '../components/SessionSidebar';
import Topbar         from '../components/Topbar';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const [sessions,        setSessions]        = useState([]);
  const [activeId,        setActiveId]        = useState(null);
  const [messages,        setMessages]        = useState({});
  const [logs,            setLogs]            = useState({});
  const [errors,          setErrors]          = useState({});
  const [showForm,        setShowForm]        = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const sockets = useRef({});

  useEffect(() => {
    api.listSessions()
      .then(data => {
        setSessions(data);
        const msgMap = {};
        data.forEach(s => { msgMap[s.id] = s.messages || []; });
        setMessages(msgMap);
        if (data.length > 0) setActiveId(data[0].id);
      })
      .catch(console.error)
      .finally(() => setLoadingSessions(false));
  }, []);

  useEffect(() => {
    sessions.forEach(s => {
      if (s.status === 'running' && !sockets.current[s.id]) connectSocket(s.id);
    });
  }, [sessions]);

  const connectSocket = useCallback((sessionId) => {
    if (sockets.current[sessionId]) return;
    const ws = openFeedSocket(sessionId, {
      onMessage: (msg) => {
        setMessages(prev => ({
          ...prev,
          [sessionId]: [...(prev[sessionId] || []), msg].slice(-500),
        }));
      },
      onStatus: ({ status, error }) => {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status } : s));
        if (error) {
          setErrors(prev => ({ ...prev, [sessionId]: error }));
        } else if (status === 'running') {
          setErrors(prev => { const c = { ...prev }; delete c[sessionId]; return c; });
        }
        if (['stopped', 'error', 'disconnected'].includes(status)) {
          delete sockets.current[sessionId];
        }
      },
      onLog: (text) => {
        setLogs(prev => ({
          ...prev,
          [sessionId]: [...(prev[sessionId] || []).slice(-99), text],
        }));
      },
    });
    sockets.current[sessionId] = ws;
  }, []);

  async function handleCreate(formData) {
    const s = await api.createSession(formData);
    setSessions(prev => [...prev, s]);
    setMessages(prev => ({ ...prev, [s.id]: [] }));
    setActiveId(s.id);
    setShowForm(false);
  }

  async function handleStart(id) {
    try {
      setErrors(prev => { const c = { ...prev }; delete c[id]; return c; });
      const s = await api.startSession(id);
      setSessions(prev => prev.map(x => x.id === id ? { ...x, status: s.status } : x));
      connectSocket(id);
    } catch (e) {
      setErrors(prev => ({ ...prev, [id]: e.message }));
    }
  }

  async function handleStop(id) {
    await api.stopSession(id);
    setSessions(prev => prev.map(x => x.id === id ? { ...x, status: 'stopped' } : x));
    setErrors(prev => { const c = { ...prev }; delete c[id]; return c; });
    sockets.current[id]?.close();
    delete sockets.current[id];
  }

  async function handleDelete(id) {
    await api.deleteSession(id);
    setSessions(prev => prev.filter(x => x.id !== id));
    setMessages(prev => { const c = { ...prev }; delete c[id]; return c; });
    sockets.current[id]?.close();
    delete sockets.current[id];
    if (activeId === id) setActiveId(null);
  }

  const activeSession = sessions.find(s => s.id === activeId);
  const activeMsgs    = messages[activeId] || [];
  const activeLogs    = logs[activeId]     || [];
  const activeError   = errors[activeId]   || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar user={user} onLogout={() => { logout(); nav('/login'); }} isAdmin={user?.role === 'admin'} />

      <div style={{ display: 'flex', flex: 1, gap: 14, padding: '16px 20px', minHeight: 0 }}>
        <SessionSidebar
          sessions={sessions}
          activeId={activeId}
          loading={loadingSessions}
          messages={messages}
          onSelect={setActiveId}
          onAdd={() => setShowForm(true)}
          onStart={handleStart}
          onStop={handleStop}
          onDelete={handleDelete}
        />

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {activeSession ? (
            <MessageFeed
              session={activeSession}
              messages={activeMsgs}
              logs={activeLogs}
              errorMsg={activeError}
              onStart={() => handleStart(activeSession.id)}
              onStop={()  => handleStop(activeSession.id)}
            />
          ) : (
            <EmptyState onAdd={() => setShowForm(true)} loading={loadingSessions} />
          )}
        </div>
      </div>

      {showForm && <SessionForm onSubmit={handleCreate} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function EmptyState({ onAdd, loading }) {
  if (loading) return (
    <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12, animation: 'spin 2s linear infinite', display: 'inline-block' }}>⚙️</div>
        <div style={{ fontSize: 13 }}>Loading sessions…</div>
      </div>
    </div>
  );

  return (
    <div className="card" style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      background: 'var(--surface)',
    }}>
      {/* Icon */}
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'var(--accent-light)', border: '1px solid var(--border-accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
      }}>
        📡
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
          No session selected
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 340, lineHeight: 1.7 }}>
          Add a session with your service account credentials to start monitoring messages in real time.
        </p>
      </div>

      <button className="primary" onClick={onAdd} style={{ marginTop: 4 }}>
        + Add first session
      </button>
    </div>
  );
}
