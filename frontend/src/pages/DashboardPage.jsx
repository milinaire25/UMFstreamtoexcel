import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, openFeedSocket } from '../api';
import SessionForm   from '../components/SessionForm';
import MessageFeed   from '../components/MessageFeed';
import SessionSidebar from '../components/SessionSidebar';
import Topbar        from '../components/Topbar';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const [sessions,       setSessions]       = useState([]);
  const [activeId,       setActiveId]       = useState(null);
  const [messages,       setMessages]       = useState({});   // sessionId → msg[]
  const [logs,           setLogs]           = useState({});   // sessionId → string[]
  const [errors,         setErrors]         = useState({});   // sessionId → error string
  const [showForm,       setShowForm]       = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const sockets = useRef({});  // sessionId → WebSocket

  // ── Load sessions on mount ─────────────────────────────────────────────────
  useEffect(() => {
    api.listSessions()
      .then(data => {
        setSessions(data);
        // Pre-fill message cache from server buffer
        const msgMap = {};
        data.forEach(s => { msgMap[s.id] = s.messages || []; });
        setMessages(msgMap);
        // Auto-select first session
        if (data.length > 0) setActiveId(data[0].id);
      })
      .catch(console.error)
      .finally(() => setLoadingSessions(false));
  }, []);

  // ── Open WebSocket for running sessions ────────────────────────────────────
  useEffect(() => {
    sessions.forEach(s => {
      if (s.status === 'running' && !sockets.current[s.id]) {
        connectSocket(s.id);
      }
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
        setSessions(prev =>
          prev.map(s => s.id === sessionId ? { ...s, status } : s)
        );
        if (error) {
          setErrors(prev => ({ ...prev, [sessionId]: error }));
        } else if (status === 'running') {
          setErrors(prev => { const c = { ...prev }; delete c[sessionId]; return c; });
        }
        if (status === 'stopped' || status === 'error' || status === 'disconnected') {
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

  // ── Session actions ────────────────────────────────────────────────────────
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

  function handleLogout() { logout(); nav('/login'); }

  const activeSession  = sessions.find(s => s.id === activeId);
  const activeMsgs     = messages[activeId] || [];
  const activeLogs     = logs[activeId]     || [];
  const activeError    = errors[activeId]   || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Topbar user={user} onLogout={handleLogout} isAdmin={user?.role === 'admin'} />

      <div style={{ display: 'flex', flex: 1, gap: 16, padding: 20, minHeight: 0 }}>
        {/* Sidebar */}
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

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
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

      {/* Add session modal */}
      {showForm && (
        <SessionForm onSubmit={handleCreate} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

function EmptyState({ onAdd, loading }) {
  if (loading) return (
    <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
      Loading sessions…
    </div>
  );
  return (
    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ fontSize: 40 }}>📡</div>
      <h2 style={{ fontSize: 16, fontWeight: 500, color: '#374151' }}>No session selected</h2>
      <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', maxWidth: 320 }}>
        Add a session with your LSEG Service Account credentials to start monitoring messages in real time.
      </p>
      <button className="primary" onClick={onAdd}>+ Add first session</button>
    </div>
  );
}
