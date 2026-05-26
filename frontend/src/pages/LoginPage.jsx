import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ── Logo ─────────────────────────────────────────────────────────────────── */
function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 38 38" fill="none">
      <rect x="1" y="1" width="30" height="24" rx="7" fill="#c96d4e" />
      <path d="M8 25 L5 32 L15 27" fill="#c96d4e" />
      <circle cx="9"  cy="13" r="1.8" fill="white" opacity="0.9" />
      <circle cx="16" cy="13" r="1.8" fill="white" opacity="0.9" />
      <circle cx="23" cy="13" r="1.8" fill="white" opacity="0.9" />
      <rect x="10" y="14" width="27" height="20" rx="6" fill="#ffffff" stroke="#c8c8d2" strokeWidth="1.5" />
      <rect x="15" y="20" width="14" height="1.8" rx="0.9" fill="#c8c8d2" />
      <rect x="15" y="24" width="10" height="1.8" rx="0.9" fill="#e4e4e9" />
    </svg>
  );
}

/* ── Copy block ───────────────────────────────────────────────────────────── */
function CopyBlock({ id, code, copied, onCopy }) {
  return (
    <div style={{ position: 'relative', marginTop: 10, marginBottom: 20 }}>
      <pre style={{
        background: '#0d0d14', color: '#c8c8e8',
        padding: '14px 18px', borderRadius: 'var(--r)',
        fontSize: 12, lineHeight: 1.8, overflowX: 'auto',
        fontFamily: "'JetBrains Mono', monospace",
        border: '1px solid rgba(255,255,255,0.08)',
      }}>{code}</pre>
      <button onClick={() => onCopy(code, id)} style={{
        position: 'absolute', top: 10, right: 10,
        background: copied === id ? 'var(--green-bg)' : 'var(--surface-3)',
        color: copied === id ? 'var(--green)' : 'var(--text-2)',
        border: `1px solid ${copied === id ? 'var(--green-border)' : 'var(--border-strong)'}`,
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
    <div style={{ borderBottom: '1px solid var(--border)', padding: '18px 0' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', textAlign: 'left', background: 'none', border: 'none',
        padding: 0, cursor: 'pointer', boxShadow: 'none',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
      }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', lineHeight: 1.5 }}>{q}</span>
        <span style={{
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          background: open ? 'var(--accent-light)' : 'var(--surface-2)',
          border: `1px solid ${open ? 'var(--border-accent)' : 'var(--border)'}`,
          color: open ? 'var(--accent)' : 'var(--text-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 400, lineHeight: 1,
          transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s, background 0.15s',
        }}>+</span>
      </button>
      {open && (
        <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>{a}</p>
      )}
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
      <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8, letterSpacing: '-0.4px' }}>
        Full Setup Guide
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 40, lineHeight: 1.7 }}>
        Clone and run the entire stack locally in under 10 minutes, or deploy to Render with one click.
      </p>

      {/* Architecture */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', padding: '24px 28px', marginBottom: 40,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-2)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Architecture</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', rowGap: 12 }}>
          {[
            { label: 'Browser', sub: 'React + WebSocket', color: 'var(--blue)', icon: '🌐' },
            null,
            { label: 'Node.js', sub: 'Express + WS :3001', color: 'var(--accent)', icon: '⚙️' },
            null,
            { label: 'Java Process', sub: 'message-feed-*.jar', color: 'var(--green)', icon: '☕' },
            null,
            { label: 'LSEG Cloud', sub: 'api.refinitiv.com', color: 'var(--text-3)', icon: '☁️' },
          ].map((item, i) =>
            item === null ? (
              <div key={i} style={{ flex: '0 0 auto', color: 'var(--border-strong)', fontSize: 16, padding: '0 6px' }}>→</div>
            ) : (
              <div key={i} style={{
                flex: '1 1 110px', minWidth: 100,
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 'var(--r)', padding: '14px 12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: item.color }}>{item.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{item.sub}</div>
              </div>
            )
          )}
        </div>
        <div style={{ marginTop: 20, display: 'flex', gap: 20, flexWrap: 'wrap', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          {[
            ['WebSocketPlugin', 'Implements ChatroomMessageHandler — writes each LSEG message as one JSON line to stdout'],
            ['ProcessManager', 'Spawns the Java process, pipes stdout → WebSocket. Handles auto-restart with exponential backoff'],
            ['Dual-JAR support', 'prod/qa/dev → message-feed-prod.jar  ·  beta/PPE → message-feed-ppe.jar (auto-selected)'],
          ].map(([title, desc]) => (
            <div key={title} style={{ flex: '1 1 200px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 4, letterSpacing: '0.3px' }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <Step n="1" title="Prerequisites">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 8 }}>
          {[['Node.js', '≥ 18'], ['Java', 'SE 17+'], ['LSEG JARs', 'from LSEG portal']].map(([name, ver]) => (
            <div key={name} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r)', padding: '12px 14px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{ver}</div>
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
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, lineHeight: 1.6 }}>
          Or deploy to the cloud — see the{' '}
          <a href="https://github.com/milinaire25/LSEGMSGFEED" target="_blank" rel="noreferrer"
            style={{ color: 'var(--accent)', fontWeight: 500 }}>GitHub README</a>{' '}
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
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          background: 'var(--accent)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700,
        }}>{n}</div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)' }}>{title}</h3>
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
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-xl)',
      padding: '32px 28px',
      width: '100%', maxWidth: 380,
      boxShadow: 'var(--shadow-lg)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
        <div style={{
          width: 56, height: 56,
          background: 'var(--accent-light)', border: '1px solid var(--accent-border)',
          borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16, boxShadow: 'var(--shadow-accent)',
        }}>
          <Logo size={32} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.3px', marginBottom: 4 }}>
          Sign in
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>
          Use your sandbox credentials to continue
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Username
          </label>
          <input
            value={username} onChange={e => setUsername(e.target.value)}
            placeholder="your username" autoFocus required
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Password
          </label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" required
          />
        </div>

        {error && (
          <div style={{
            fontSize: 12, color: 'var(--red)', background: 'var(--red-bg)',
            border: '1px solid var(--red-border)',
            padding: '8px 12px', borderRadius: 'var(--r-sm)', marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14 }}>
          {loading ? 'Signing in…' : 'Sign in →'}
        </button>
      </form>
    </div>
  );
}

/* ── Feature card ─────────────────────────────────────────────────────────── */
function FeatureCard({ icon, title, desc }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', padding: '22px 20px',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxShadow: 'var(--shadow-sm)',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-accent)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: 'var(--accent-light)', border: '1px solid var(--accent-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, marginBottom: 14,
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}

/* ── Pill ─────────────────────────────────────────────────────────────────── */
function Pill({ icon, label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 20, padding: '7px 14px',
      fontSize: 12, color: 'var(--text-2)',
      boxShadow: 'var(--shadow-xs)',
    }}>
      <span>{icon}</span>{label}
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function LoginPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text-1)' }}>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 32px', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: 'var(--shadow-xs)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={24} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.2px' }}>
            LSEG Messenger Feed
          </span>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'var(--accent-light)', border: '1px solid var(--accent-border)',
          borderRadius: 20, padding: '4px 12px',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse-amber 2s infinite' }} />
          <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.3px' }}>TEST SANDBOX</span>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section style={{
        background: `radial-gradient(ellipse 80% 50% at 50% -5%, rgba(201,109,78,0.08) 0%, transparent 65%), var(--bg)`,
        padding: '80px 24px 72px', textAlign: 'center',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '6px 16px', marginBottom: 28,
          boxShadow: 'var(--shadow-xs)',
        }}>
          <span style={{ fontSize: 12 }}>📡</span>
          <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>User Message Feed · Programmatic Access</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 52px)',
          fontWeight: 700, letterSpacing: '-1.5px',
          color: 'var(--text-1)', lineHeight: 1.12, marginBottom: 20,
        }}>
          LSEG Messenger Feed<br />
          <span style={{
            background: 'linear-gradient(135deg, var(--accent), #e8a070)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Test Sandbox
          </span>
        </h1>

        <p style={{ fontSize: 16, color: 'var(--text-2)', maxWidth: 520, margin: '0 auto 14px', lineHeight: 1.7 }}>
          Connect your LSEG Service Account and watch real-time messages stream to your browser. Test programmatic access to LSEG Messenger with your own credentials.
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 48, fontWeight: 500 }}>
          Test sandbox — not for production use
        </p>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
          <Pill icon="⚡" label="Real-time WebSocket" />
          <Pill icon="🔒" label="Credentials never stored" />
          <Pill icon="☕" label="Java message-feed JAR" />
          <Pill icon="🌐" label="Multi-user sessions" />
          <Pill icon="🔄" label="Auto-reconnect" />
        </div>

        {/* Login form */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <LoginForm />
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section style={{ padding: '72px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-1)', marginBottom: 10, letterSpacing: '-0.5px' }}>
              How it works
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.7, maxWidth: 500, margin: '0 auto' }}>
              A four-layer stack that bridges LSEG Messenger to your browser in real time.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16 }}>
            <FeatureCard icon="☕" title="Java Process"
              desc="The official LSEG message-feed JAR authenticates with your service account and receives messages via Ably." />
            <FeatureCard icon="🔌" title="WebSocket Plugin"
              desc="Our custom ChatroomMessageHandler writes each message as a single JSON line to stdout, captured by Node.js." />
            <FeatureCard icon="⚙️" title="Node.js Backend"
              desc="Spawns the Java process, pipes stdout into WebSocket clients, and exposes a JWT-secured REST API." />
            <FeatureCard icon="🌐" title="React Frontend"
              desc="Connects via WebSocket and renders messages in real time with session management, live logs, and filters." />
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: '72px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 660, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-1)', marginBottom: 10, letterSpacing: '-0.5px' }}>
              FAQ
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-3)' }}>
              Common questions about the sandbox.
            </p>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '0 24px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ borderTop: '1px solid var(--border)', marginTop: -1 }}>
              {FAQS.map(f => <FAQItem key={f.q} {...f} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ── Setup guide ──────────────────────────────────────────────────── */}
      <section style={{ padding: '72px 0 0', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <SetupGuide />
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ padding: '28px 24px', textAlign: 'center', background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
          <Logo size={18} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>LSEG Messenger Feed</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
          Test sandbox · Not for production use · Credentials never persisted
        </p>
      </footer>
    </div>
  );
}
