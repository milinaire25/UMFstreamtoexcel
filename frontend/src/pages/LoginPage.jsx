import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ── Logo ─────────────────────────────────────────────────────────────────── */
function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 38 38" fill="none">
      <rect x="1" y="1" width="30" height="24" rx="7" fill="#CC785C" />
      <path d="M8 25 L5 32 L15 27" fill="#CC785C" />
      <rect x="10" y="14" width="27" height="20" rx="6" fill="#1a1a26" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <rect x="15" y="20" width="14" height="1.8" rx="0.9" fill="rgba(255,255,255,0.3)" />
      <rect x="15" y="24" width="10" height="1.8" rx="0.9" fill="rgba(255,255,255,0.15)" />
      <circle cx="9"  cy="13" r="1.8" fill="white" opacity="0.9" />
      <circle cx="16" cy="13" r="1.8" fill="white" opacity="0.9" />
      <circle cx="23" cy="13" r="1.8" fill="white" opacity="0.9" />
    </svg>
  );
}

/* ── Copy block ───────────────────────────────────────────────────────────── */
function CopyBlock({ id, code, copied, onCopy }) {
  return (
    <div style={{ position: 'relative', marginTop: 10, marginBottom: 20 }}>
      <pre style={{
        background: '#07070e', color: '#c0c0e0',
        padding: '14px 18px', borderRadius: 10,
        fontSize: 12, lineHeight: 1.8, overflowX: 'auto',
        fontFamily: "'JetBrains Mono', monospace",
        border: '1px solid rgba(255,255,255,0.07)',
      }}>{code}</pre>
      <button onClick={() => onCopy(code, id)} style={{
        position: 'absolute', top: 10, right: 10,
        background: copied === id ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
        color: copied === id ? '#22c55e' : 'rgba(255,255,255,0.4)',
        border: `1px solid ${copied === id ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 6, padding: '3px 10px', fontSize: 11, cursor: 'pointer',
      }}>
        {copied === id ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );
}

/* ── FAQ ──────────────────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: 'What is this sandbox?',
    a: 'A test environment that lets you connect a LSEG Service Account to a real-time message feed and watch messages stream live in your browser. No production systems are affected.',
  },
  {
    q: 'What credentials do I need?',
    a: 'A LSEG Service Account UUID (e.g. GE-XXXXXXXXXX), its password, and the UUID or email of the user whose messages you want to track. Provided by your LSEG administrator.',
  },
  {
    q: 'Is my password stored anywhere?',
    a: 'No. Credentials are held in server memory only for the duration of your session. They are never written to disk, logged, or sent to any third party.',
  },
  {
    q: 'Why does the feed stop or show a cooldown?',
    a: 'LSEG enforces a 15–20 minute server-side cooldown after an abrupt session disconnect. Wait and try again — clicking Start during the cooldown resets the timer.',
  },
  {
    q: 'Which environments are supported?',
    a: 'prod, qa, trd, dev — use the production JAR. beta / PPE — uses a separate PPE JAR (message-feed-ppe.jar) and connects to api.ppe.refinitiv.com. The app selects the correct JAR automatically.',
  },
  {
    q: 'Can I deploy my own instance?',
    a: 'Yes — click the "Deploy to Render" button in the GitHub README. You supply your LSEG JARs as download URLs. The Docker container downloads them at startup.',
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 0' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', textAlign: 'left', background: 'none', border: 'none',
        padding: 0, cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
        color: 'var(--text-1)',
      }}>
        <span style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.4 }}>{q}</span>
        <span style={{
          fontSize: 20, color: '#CC785C', flexShrink: 0,
          transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s',
          lineHeight: 1,
        }}>+</span>
      </button>
      {open && <p style={{ marginTop: 10, fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{a}</p>}
    </div>
  );
}

/* ── Setup guide ──────────────────────────────────────────────────────────── */
function SetupGuide() {
  const [copied, setCopied] = useState('');
  function copy(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  const cb = (id, code) => <CopyBlock id={id} code={code} copied={copied} onCopy={copy} />;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px 80px' }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8, letterSpacing: '-0.5px' }}>
        Full Setup Guide
      </h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', marginBottom: 44, lineHeight: 1.6 }}>
        Clone and run the entire stack locally in under 10 minutes, or deploy to Render with one click.
      </p>

      {/* Architecture */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px 28px', marginBottom: 44 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 20 }}>Architecture</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', rowGap: 12 }}>
          {[
            { label: 'Browser', sub: 'React + WebSocket', color: '#6366f1', icon: '🌐' },
            null,
            { label: 'Node.js', sub: 'Express + WS :3001', color: '#CC785C', icon: '⚙️' },
            null,
            { label: 'Java Process', sub: 'message-feed-*.jar', color: '#22c55e', icon: '☕' },
            null,
            { label: 'LSEG Cloud', sub: 'api.refinitiv.com', color: 'rgba(255,255,255,0.3)', icon: '☁️' },
          ].map((item, i) =>
            item === null ? (
              <div key={i} style={{ flex: '0 0 auto', color: 'rgba(255,255,255,0.2)', fontSize: 18, padding: '0 6px' }}>→</div>
            ) : (
              <div key={i} style={{
                flex: '1 1 110px', minWidth: 100,
                background: `rgba(255,255,255,0.03)`,
                border: `1px solid rgba(255,255,255,0.08)`,
                borderRadius: 10, padding: '14px 12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: item.color }}>{item.label}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{item.sub}</div>
              </div>
            )
          )}
        </div>
        <div style={{ marginTop: 18, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[
            ['WebSocketPlugin', 'Implements ChatroomMessageHandler — writes each LSEG message as one JSON line to stdout'],
            ['ProcessManager', 'Spawns the Java process, pipes stdout → WebSocket. Handles auto-restart with exponential backoff'],
            ['Dual-JAR support', 'prod/qa/dev → message-feed-prod.jar  ·  beta/PPE → message-feed-ppe.jar (auto-selected)'],
          ].map(([title, desc]) => (
            <div key={title} style={{ flex: '1 1 200px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#CC785C', marginBottom: 4, letterSpacing: '0.3px' }}>{title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <Step n="1" title="Prerequisites">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 8 }}>
          {[['Node.js', '≥ 18'], ['Java', 'SE 17+'], ['LSEG JARs', 'from LSEG portal']].map(([name, ver]) => (
            <div key={name} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{ver}</div>
            </div>
          ))}
        </div>
      </Step>

      <Step n="2" title="Place the LSEG JARs">
        {cb('jars', `java-plugin/dist/
├── message-feed-0.0.42.0.jar        ← production JAR (prod / qa / trd / dev)
├── message-feed-ppe-0.0.41.0.jar    ← PPE/beta JAR  (env = beta)
├── message-feed-handler-0.5.0.jar   ← build-time dep (not shipped in this repo)
└── plugins/
    └── lseg-websocket-plugin-1.0.0.jar   ← our custom plugin (in repo)`)}
      </Step>

      <Step n="3" title="Environment config (.env)">
        {cb('env', `# Copy .env.example to .env and edit:
JWT_SECRET=<openssl rand -hex 32>
ADMIN_PASSWORD=changeme123
FRONTEND_ORIGIN=http://localhost:5173

# Local paths (Windows / Linux / macOS)
MSG_FEED_JAR_PROD=./java-plugin/dist/message-feed-0.0.42.0.jar
MSG_FEED_JAR_PPE=./java-plugin/dist/message-feed-ppe-0.0.41.0.jar
PLUGIN_DIR=./java-plugin/dist/plugins

# Cloud / Docker: use download URLs instead of paths
# MSG_FEED_JAR_URL_PROD=https://...
# MSG_FEED_JAR_URL_PPE=https://...`)}
      </Step>

      <Step n="4" title="Install dependencies">
        {cb('deps', `cd backend  && npm install
cd ../frontend && npm install`)}
      </Step>

      <Step n="5" title="Build the WebSocket plugin (one-time)">
        {cb('plugin', `cd java-plugin
mkdir libs
cp /path/to/message-feed-handler-*.jar libs/

# Build the fat jar (Gradle 8+ required)
./gradlew shadowJar

# Copy to plugins/
cp build/libs/lseg-websocket-plugin-1.0.0.jar dist/plugins/`)}
      </Step>

      <Step n="6" title="Run">
        {cb('run', `# Windows — double-click start.bat, or:
# Terminal 1
cd backend  && node server.js      # → http://localhost:3001

# Terminal 2
cd frontend && npm run dev         # → http://localhost:5173`)}
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
          Or deploy to the cloud — see the{' '}
          <a href="https://github.com/milinaire25/LSEGMSGFEED" target="_blank" rel="noreferrer"
            style={{ color: '#CC785C' }}>GitHub README</a>{' '}
          for the one-click Render deploy guide.
        </p>
      </Step>
    </div>
  );
}

function Step({ n, title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: '#CC785C', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, flexShrink: 0,
        }}>{n}</div>
        <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-1)' }}>{title}</h3>
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
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await login(username, password);
      nav('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 20,
      padding: '32px 28px',
      width: '100%', maxWidth: 380,
      boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
    }}>
      {/* Icon */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
        <div style={{
          width: 60, height: 60, background: 'rgba(204,120,92,0.12)',
          border: '1px solid rgba(204,120,92,0.25)', borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          boxShadow: '0 4px 24px rgba(204,120,92,0.2)',
        }}>
          <Logo size={34} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.3px', marginBottom: 4 }}>
          Sign in
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          Use your sandbox credentials
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
            Username
          </label>
          <input
            value={username} onChange={e => setUsername(e.target.value)}
            placeholder="your username" autoFocus required
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-1)', padding: '10px 13px', borderRadius: 10, fontSize: 14 }}
            onFocus={e => { e.target.style.borderColor = '#CC785C'; e.target.style.boxShadow = '0 0 0 3px rgba(204,120,92,0.15)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
            Password
          </label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" required
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-1)', padding: '10px 13px', borderRadius: 10, fontSize: 14 }}
            onFocus={e => { e.target.style.borderColor = '#CC785C'; e.target.style.boxShadow = '0 0 0 3px rgba(204,120,92,0.15)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {error && (
          <div style={{ fontSize: 12, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '8px 12px', borderRadius: 8, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '12px', fontSize: 14, fontWeight: 600,
          color: '#fff', background: loading ? 'rgba(204,120,92,0.4)' : '#CC785C',
          border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s', boxShadow: loading ? 'none' : '0 4px 20px rgba(204,120,92,0.35)',
        }}
          onMouseEnter={e => { if (!loading) e.target.style.background = '#b8694f'; }}
          onMouseLeave={e => { if (!loading) e.target.style.background = '#CC785C'; }}
        >
          {loading ? 'Signing in…' : 'Sign in →'}
        </button>
      </form>
    </div>
  );
}

/* ── Feature card ─────────────────────────────────────────────────────────── */
function FeatureCard({ icon, title, desc, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '22px 20px',
      transition: 'border-color 0.2s, background 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>
        {icon}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function LoginPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text-1)' }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(12,12,18,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 32px', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={26} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.2px' }}>
            LSEG Messenger Feed
          </span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(204,120,92,0.08)', border: '1px solid rgba(204,120,92,0.2)', borderRadius: 20, padding: '4px 12px' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#CC785C', display: 'inline-block', animation: 'pulse-amber 2s infinite' }} />
          <span style={{ fontSize: 11, color: '#CC785C', fontWeight: 600, letterSpacing: '0.3px' }}>TEST SANDBOX</span>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(204,120,92,0.12) 0%, transparent 70%)',
        padding: '88px 24px 80px', textAlign: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '6px 16px', marginBottom: 28 }}>
          <span style={{ fontSize: 13 }}>📡</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>User Message Feed · Programmatic Access</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 60px)',
          fontWeight: 700, letterSpacing: '-1.5px',
          color: 'var(--text-1)', lineHeight: 1.1, marginBottom: 20,
        }}>
          LSEG Messenger Feed<br />
          <span style={{
            background: 'linear-gradient(135deg, #CC785C, #e8a882)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Test Sandbox
          </span>
        </h1>

        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', maxWidth: 540, margin: '0 auto 16px', lineHeight: 1.7 }}>
          Connect your LSEG Service Account and watch real-time messages stream to your browser. Test programmatic access to LSEG Messenger with your own credentials.
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginBottom: 56, fontWeight: 500 }}>
          Test sandbox — not for production use
        </p>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 60 }}>
          {[
            ['⚡', 'Real-time WebSocket'],
            ['🔒', 'Credentials never stored'],
            ['☕', 'Java message-feed JAR'],
            ['🌐', 'Multi-user sessions'],
            ['🔄', 'Auto-reconnect'],
          ].map(([icon, label]) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 20, padding: '7px 14px',
              fontSize: 12, color: 'rgba(255,255,255,0.6)',
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
      <section style={{ padding: '72px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h2 style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-1)', textAlign: 'center', marginBottom: 8, letterSpacing: '-0.5px' }}>
            How it works
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginBottom: 44, lineHeight: 1.6 }}>
            A four-layer stack that bridges LSEG Messenger to your browser in real time.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16 }}>
            <FeatureCard icon="☕" title="Java Process" color="#22c55e"
              desc="The official LSEG message-feed JAR authenticates with your service account and receives messages via Ably." />
            <FeatureCard icon="🔌" title="WebSocket Plugin" color="#CC785C"
              desc="Our custom ChatroomMessageHandler writes each message as a single JSON line to stdout, captured by Node.js." />
            <FeatureCard icon="⚙️" title="Node.js Backend" color="#6366f1"
              desc="Spawns the Java process, pipes stdout into WebSocket clients, and exposes a JWT-secured REST API." />
            <FeatureCard icon="🌐" title="React Frontend" color="#f59e0b"
              desc="Connects via WebSocket and renders messages in real time with session management, live logs, and filters." />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '72px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 660, margin: '0 auto' }}>
          <h2 style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-1)', textAlign: 'center', marginBottom: 8, letterSpacing: '-0.5px' }}>
            FAQ
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginBottom: 44 }}>
            Common questions about the sandbox.
          </p>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {FAQS.map(f => <FAQItem key={f.q} {...f} />)}
          </div>
        </div>
      </section>

      {/* Setup guide */}
      <section style={{ padding: '72px 0 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <SetupGuide />
      </section>

      {/* Footer */}
      <footer style={{ padding: '28px 24px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <Logo size={20} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>LSEG Messenger Feed</span>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          Test sandbox · Not for production use · Credentials never persisted
        </p>
      </footer>
    </div>
  );
}
