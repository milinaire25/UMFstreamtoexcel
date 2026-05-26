import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ── Chat icon ────────────────────────────────────────────────────────────── */
function ChatIcon({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 38 38" fill="none">
      <rect x="1" y="1" width="30" height="24" rx="7" fill="#CC785C" />
      <path d="M8 25 L5 32 L15 27" fill="#CC785C" />
      <rect x="10" y="14" width="27" height="20" rx="6" fill="#fff" stroke="#e5e5e5" strokeWidth="1.2" />
      <rect x="15" y="20" width="14" height="1.8" rx="0.9" fill="#d0cac7" />
      <rect x="15" y="24" width="10" height="1.8" rx="0.9" fill="#d0cac7" />
      <circle cx="9"  cy="13" r="1.8" fill="white" opacity="0.9" />
      <circle cx="16" cy="13" r="1.8" fill="white" opacity="0.9" />
      <circle cx="23" cy="13" r="1.8" fill="white" opacity="0.9" />
    </svg>
  );
}

/* ── FAQ accordion ────────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: 'What is this sandbox?',
    a: 'This is a test environment that lets you connect a LSEG Service Account to a real-time message feed and watch messages stream live in your browser. No production systems are affected.',
  },
  {
    q: 'What credentials do I need?',
    a: 'You need a LSEG Service Account UUID (e.g. GE-XXXXXXXXXX), its password, and the UUID or email of the user whose messages you want to track. These are provided by your LSEG administrator.',
  },
  {
    q: 'Is my password stored?',
    a: 'No. Credentials are held in server memory only for the duration of your session. They are never written to disk, logged, or sent to any third party.',
  },
  {
    q: 'Why does the feed stop after starting?',
    a: 'LSEG enforces a 15-minute cooldown after an abrupt session disconnect. Wait 15 minutes and try again. This is a known LSEG platform behaviour.',
  },
  {
    q: 'Which environments are supported?',
    a: 'prod, beta, qa, trd and dev. Use beta for testing with beta credentials. Use prod only with production service accounts.',
  },
  {
    q: 'Can I run this myself?',
    a: 'Yes — the full setup guide below explains how to clone and run the entire stack locally with Node.js, React and the LSEG Java JAR.',
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: '1px solid #f0f0f0',
      padding: '18px 0',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', background: 'none',
          border: 'none', padding: 0, cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: 16,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 500, color: '#1d1d1f', lineHeight: 1.4 }}>{q}</span>
        <span style={{
          fontSize: 22, color: '#CC785C', flexShrink: 0,
          transform: open ? 'rotate(45deg)' : 'none',
          transition: 'transform 0.2s',
          lineHeight: 1,
        }}>+</span>
      </button>
      {open && (
        <p style={{ marginTop: 12, fontSize: 15, color: '#6e6e73', lineHeight: 1.7 }}>{a}</p>
      )}
    </div>
  );
}

/* ── Architecture / clone section ─────────────────────────────────────────── */
function SetupGuide() {
  const [copied, setCopied] = useState('');
  function copy(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  const codeBlock = (id, code) => (
    <div style={{ position: 'relative', marginTop: 12, marginBottom: 20 }}>
      <pre style={{
        background: '#1d1d1f', color: '#e8e8ed',
        padding: '16px 20px', borderRadius: 12,
        fontSize: 13, lineHeight: 1.7, overflowX: 'auto',
        fontFamily: "'SF Mono', 'Menlo', monospace",
      }}>{code}</pre>
      <button
        onClick={() => copy(code, id)}
        style={{
          position: 'absolute', top: 10, right: 10,
          background: copied === id ? '#34c759' : 'rgba(255,255,255,0.12)',
          color: '#fff', border: 'none', borderRadius: 6,
          padding: '4px 10px', fontSize: 11, cursor: 'pointer',
        }}
      >
        {copied === id ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px 80px' }}>
      <h2 style={{ fontSize: 32, fontWeight: 700, color: '#1d1d1f', marginBottom: 10, letterSpacing: '-0.5px' }}>
        Full Setup Guide
      </h2>
      <p style={{ fontSize: 17, color: '#6e6e73', marginBottom: 48, lineHeight: 1.6 }}>
        Clone and run the entire stack locally in under 10 minutes.
      </p>

      {/* Architecture diagram */}
      <div style={{ background: '#fff', borderRadius: 18, padding: '32px 36px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', marginBottom: 48 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1d1d1f', marginBottom: 24 }}>Architecture</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', rowGap: 16 }}>
          {[
            { label: 'Browser', sub: 'React + WebSocket', color: '#0071e3', icon: '🌐' },
            null,
            { label: 'Node.js Backend', sub: 'Express + WS (port 3001)', color: '#CC785C', icon: '⚙️' },
            null,
            { label: 'Java Process', sub: 'message-feed-0.0.42.0.jar', color: '#34c759', icon: '☕' },
            null,
            { label: 'LSEG Messenger', sub: 'Cloud API', color: '#6e6e73', icon: '☁️' },
          ].map((item, i) =>
            item === null ? (
              <div key={i} style={{ flex: '0 0 auto', color: '#d2d2d7', fontSize: 20, padding: '0 8px' }}>→</div>
            ) : (
              <div key={i} style={{
                flex: '1 1 130px', minWidth: 120,
                background: `${item.color}0f`,
                border: `1px solid ${item.color}30`,
                borderRadius: 12, padding: '16px 14px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: '#6e6e73', marginTop: 3 }}>{item.sub}</div>
              </div>
            )
          )}
        </div>
        <div style={{ marginTop: 20, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            ['WebSocketPlugin', 'Custom Java plugin that writes each LSEG message as a JSON line to stdout'],
            ['ProcessManager', 'Node.js service that spawns the Java process and streams stdout → WebSocket'],
            ['JWT Auth', 'Tokens expire after 12 h · Passwords never persisted to disk'],
          ].map(([title, desc]) => (
            <div key={title} style={{ flex: '1 1 200px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#CC785C', marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 12, color: '#6e6e73', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1 */}
      <Step n="1" title="Prerequisites">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 8 }}>
          {[['Node.js', '≥ 18'], ['Java', 'SE 17+'], ['LSEG JARs', 'from LSEG portal']].map(([name, ver]) => (
            <div key={name} style={{ background: '#f5f5f7', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f' }}>{name}</div>
              <div style={{ fontSize: 12, color: '#6e6e73', marginTop: 2 }}>{ver}</div>
            </div>
          ))}
        </div>
      </Step>

      {/* Step 2 */}
      <Step n="2" title="Project structure">
        {codeBlock('structure', `lseg-messenger-feed/
├── backend/
│   ├── server.js                  # Express + WebSocket server
│   ├── middleware/auth.js         # JWT verification
│   ├── routes/auth.js             # Login / user management
│   ├── routes/sessions.js         # Session CRUD + start/stop
│   ├── services/processManager.js # Spawns Java, streams stdout → WS
│   ├── store/sessions.js          # In-memory session store
│   └── store/users.js             # In-memory user store
├── frontend/
│   └── src/
│       ├── pages/LoginPage.jsx    # Landing + login
│       ├── pages/DashboardPage.jsx
│       ├── pages/AdminPage.jsx
│       └── components/
│           ├── MessageFeed.jsx    # Live message stream
│           ├── SessionSidebar.jsx
│           └── SessionForm.jsx
├── java-plugin/
│   ├── src/.../WebSocketPlugin.java  # Implements ChatroomMessageHandler
│   ├── build.gradle
│   └── dist/
│       ├── message-feed-0.0.42.0.jar # LSEG main JAR (download from LSEG)
│       ├── lseg-truststore.jks        # Java SSL truststore
│       └── plugins/
│           └── lseg-websocket-plugin-1.0.0.jar  # Built from WebSocketPlugin.java
├── .env                           # Environment config (copy from .env.example)
└── start.bat                      # One-click launcher`)}
      </Step>

      {/* Step 3 */}
      <Step n="3" title="Environment config (.env)">
        {codeBlock('env', `JWT_SECRET=your-long-random-secret    # openssl rand -hex 32
ADMIN_PASSWORD=changeme123
FRONTEND_ORIGIN=http://localhost:5173
MSG_FEED_JAR=./java-plugin/dist/message-feed-0.0.42.0.jar
PLUGIN_DIR=./java-plugin/dist/plugins
JAVA_BIN=java`)}
      </Step>

      {/* Step 4 */}
      <Step n="4" title="Install dependencies">
        {codeBlock('deps', `# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install`)}
      </Step>

      {/* Step 5 */}
      <Step n="5" title="Build the WebSocket plugin (Java)">
        {codeBlock('plugin', `cd java-plugin

# Copy message-feed-handler-0.5.0.jar into libs/
mkdir libs
cp /path/to/message-feed-handler-0.5.0.jar libs/

# Copy production JARs into dist/
mkdir -p dist/plugins
cp /path/to/message-feed-0.0.42.0.jar dist/

# Build the fat jar (requires Gradle 8+ or use the gradlew wrapper)
./gradlew shadowJar

# Output: build/libs/lseg-websocket-plugin-1.0.0.jar
cp build/libs/lseg-websocket-plugin-1.0.0.jar dist/plugins/`)}
      </Step>

      {/* Step 6 */}
      <Step n="6" title="Start the application">
        {codeBlock('start', `# Windows — double-click or run:
.\\start.bat

# Or manually:
# Terminal 1 — backend
cd backend && node server.js

# Terminal 2 — frontend
cd frontend && npm run dev`)}
        <p style={{ fontSize: 14, color: '#6e6e73', marginTop: 4 }}>
          Then open <span style={{ fontFamily: 'monospace', color: '#CC785C' }}>http://localhost:5173</span> in your browser.
        </p>
      </Step>
    </div>
  );
}

function Step({ n, title, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: '#CC785C', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, flexShrink: 0,
        }}>{n}</div>
        <h3 style={{ fontSize: 19, fontWeight: 600, color: '#1d1d1f' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ── Login form ───────────────────────────────────────────────────────────── */
function LoginForm() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(username, password);
      nav('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    background: '#fafafa', border: '1px solid #e0e0e0',
    borderRadius: 10, color: '#1d1d1f', fontSize: 15,
    outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  return (
    <div style={{
      background: '#fff',
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: 20,
      padding: '36px 32px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
      width: '100%', maxWidth: 400,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
        <div style={{
          width: 64, height: 64, background: '#fdf8f6',
          border: '1px solid #ede8e5', borderRadius: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 18, boxShadow: '0 4px 20px rgba(204,120,92,0.15)',
        }}>
          <ChatIcon size={36} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.3px', marginBottom: 6 }}>
          Sign in
        </h2>
        <p style={{ fontSize: 14, color: '#6e6e73', textAlign: 'center' }}>
          Use your sandbox credentials to access the feed
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6e6e73', marginBottom: 6, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Username
          </label>
          <input value={username} onChange={e => setUsername(e.target.value)}
            placeholder="your username" autoFocus required style={inputStyle}
            onFocus={e => { e.target.style.borderColor = '#CC785C'; e.target.style.boxShadow = '0 0 0 3px rgba(204,120,92,0.12)'; }}
            onBlur={e => { e.target.style.borderColor = '#e0e0e0'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        <div style={{ marginBottom: 22 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6e6e73', marginBottom: 6, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Password
          </label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" required style={inputStyle}
            onFocus={e => { e.target.style.borderColor = '#CC785C'; e.target.style.boxShadow = '0 0 0 3px rgba(204,120,92,0.12)'; }}
            onBlur={e => { e.target.style.borderColor = '#e0e0e0'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {error && (
          <div style={{ fontSize: 13, color: '#ff3b30', background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.18)', padding: '9px 13px', borderRadius: 8, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '13px', fontSize: 15, fontWeight: 600,
          color: '#fff', background: loading ? '#e0d8d4' : '#CC785C',
          border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => { if (!loading) e.target.style.background = '#b8694f'; }}
          onMouseLeave={e => { if (!loading) e.target.style.background = '#CC785C'; }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function LoginPage() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        padding: '0 32px', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ChatIcon size={28} />
          <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f', letterSpacing: '-0.2px' }}>
            LSEG Messenger Feed
          </span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fef9f6', border: '1px solid #ede8e4', borderRadius: 20, padding: '4px 12px' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706', display: 'inline-block' }} />
          <span style={{ fontSize: 12, color: '#a37060', fontWeight: 500 }}>Test Sandbox</span>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(180deg, #fdf8f6 0%, #ffffff 100%)',
        padding: '80px 24px 72px',
        textAlign: 'center',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #ede8e4', borderRadius: 20, padding: '6px 16px', marginBottom: 28 }}>
          <span style={{ fontSize: 14 }}>📡</span>
          <span style={{ fontSize: 13, color: '#a37060', fontWeight: 500 }}>User Message Feed · Programmatic Access</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: 700, letterSpacing: '-1.5px',
          color: '#1d1d1f', lineHeight: 1.1, marginBottom: 22,
        }}>
          LSEG Messenger Feed<br />
          <span style={{ color: '#CC785C' }}>Test Sandbox</span>
        </h1>

        <p style={{ fontSize: 19, color: '#6e6e73', maxWidth: 580, margin: '0 auto 16px', lineHeight: 1.6 }}>
          Test how you can access messenger programmatically on LSEG Messenger.
          You can test with your own credentials on this site.
        </p>
        <p style={{ fontSize: 15, color: '#a37060', marginBottom: 52, fontWeight: 500 }}>
          This is a test sandbox build — not for production use.
        </p>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
          {[
            ['⚡', 'Real-time WebSocket stream'],
            ['🔒', 'Credentials never stored'],
            ['☕', 'Java message-feed JAR'],
            ['🌐', 'Multi-user sessions'],
          ].map(([icon, label]) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#fff', border: '1px solid #e5e5e5',
              borderRadius: 20, padding: '8px 16px',
              fontSize: 13, color: '#1d1d1f',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              <span>{icon}</span>{label}
            </div>
          ))}
        </div>

        {/* Login form */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <LoginForm />
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: '#f5f5f7', padding: '72px 24px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: '#1d1d1f', textAlign: 'center', marginBottom: 10, letterSpacing: '-0.5px' }}>
            How it works
          </h2>
          <p style={{ fontSize: 17, color: '#6e6e73', textAlign: 'center', marginBottom: 48, lineHeight: 1.6 }}>
            A three-layer stack that bridges LSEG Messenger to your browser in real time.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {[
              { icon: '☕', title: 'Java Process', desc: 'The official LSEG message-feed JAR authenticates with your service account and receives messages via Ably.', color: '#CC785C' },
              { icon: '🔌', title: 'WebSocket Plugin', desc: 'A custom ChatroomMessageHandler writes each message as a JSON line to stdout, captured by Node.js.', color: '#0071e3' },
              { icon: '⚙️', title: 'Node.js Backend', desc: 'Spawns the Java process, pipes stdout into a WebSocket, and exposes a JWT-secured REST API.', color: '#34c759' },
              { icon: '🌐', title: 'React Frontend', desc: 'Connects via WebSocket and renders messages in real time with session management and live logs.', color: '#ff9500' },
            ].map(({ icon, title, desc, color }) => (
              <div key={title} style={{ background: '#fff', borderRadius: 16, padding: '24px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: `${color}18`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 22, marginBottom: 16,
                }}>{icon}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f', marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: '#fff', padding: '72px 24px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: '#1d1d1f', textAlign: 'center', marginBottom: 10, letterSpacing: '-0.5px' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ fontSize: 17, color: '#6e6e73', textAlign: 'center', marginBottom: 48 }}>
            Everything you need to know about the sandbox.
          </p>
          <div style={{ borderTop: '1px solid #f0f0f0' }}>
            {FAQS.map(faq => <FAQItem key={faq.q} {...faq} />)}
          </div>
        </div>
      </section>

      {/* Setup guide */}
      <section style={{ background: '#f5f5f7', padding: '72px 0 0' }}>
        <SetupGuide />
      </section>

      {/* Footer */}
      <footer style={{ background: '#fff', borderTop: '1px solid #f0f0f0', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
          <ChatIcon size={22} />
          <span style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f' }}>LSEG Messenger Feed</span>
        </div>
        <p style={{ fontSize: 13, color: '#9ca3af' }}>
          Test sandbox · Not for production use · Credentials never persisted
        </p>
      </footer>
    </div>
  );
}
