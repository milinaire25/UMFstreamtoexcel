import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BadgeDollarSign,
  Cable,
  CheckCircle2,
  FileSpreadsheet,
  LockKeyhole,
  RadioTower,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const marketRows = [
  ['US91282CJN20', 'UST 4.375 05/34', '100-14+', '100-15', '4.281', '+1.8', 'NY 09:42:18'],
  ['GB00BQC4R999', 'UKT 4.250 12/40', '98.612', '98.668', '4.392', '+2.4', 'LDN 14:42:17'],
  ['DE000BU2Z031', 'DBR 2.600 08/33', '101.284', '101.316', '2.517', '-0.6', 'FRA 15:42:16'],
  ['XS2555220940', 'HSBC 5.250 03/28', '103.420', '103.510', '4.021', '+3.2', 'LDN 14:42:15'],
  ['US594918CJ17', 'MSFT 3.300 02/27', '99.846', '99.904', '3.382', '+0.9', 'NY 09:42:14'],
  ['US037833ET33', 'AAPL 4.850 05/53', '106.118', '106.226', '4.487', '+1.1', 'NY 09:42:13'],
];

function BrandMark({ size = 36 }) {
  return (
    <div className="brand-mark" style={{ width: size, height: size }}>
      <FileSpreadsheet size={Math.round(size * 0.5)} strokeWidth={2.2} />
    </div>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
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
    <form className="login-panel" onSubmit={handleSubmit}>
      <div className="login-panel__header">
        <BrandMark />
        <div>
          <h1>StreamtoExcel</h1>
          <p>UMF WebSocket feed to Excel</p>
        </div>
      </div>

      <div className="security-strip">
        <ShieldCheck size={16} />
        <span>JWT-secured dashboard access. Service passwords stay server-side only.</span>
      </div>

      <label className="field">
        <span>Username</span>
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="admin"
          autoComplete="username"
          autoFocus
          required
        />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Dashboard password"
          autoComplete="current-password"
          required
        />
      </label>

      {error && <div className="login-error">{error}</div>}

      <button type="submit" disabled={loading} className="primary login-submit">
        {loading ? 'Signing in' : 'Open live feed'}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}

function ExcelPreview() {
  const [tick, setTick] = useState(0);
  const visibleRows = useMemo(() => {
    const rotated = [...marketRows.slice(tick % marketRows.length), ...marketRows.slice(0, tick % marketRows.length)];
    return rotated.slice(0, 5);
  }, [tick]);

  useEffect(() => {
    const interval = window.setInterval(() => setTick((value) => value + 1), 1800);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="excel-stage" aria-label="Excel rows filling with live bond bid ask data">
      <div className="stream-line">
        <div className="stream-node source">
          <RadioTower size={18} />
          <span>UMF Feed</span>
        </div>
        <div className="stream-pulse" />
        <div className="stream-node target">
          <FileSpreadsheet size={18} />
          <span>Excel</span>
        </div>
      </div>

      <div className="workbook">
        <div className="workbook__top">
          <div className="workbook__tabs">
            <span className="tab active">UMF Feed</span>
            <span className="tab">Audit</span>
            <span className="tab">Raw JSON</span>
          </div>
          <div className="connected-pill">
            <span />
            Live socket
          </div>
        </div>

        <div className="formula-bar">=STREAMTOEXCEL("ws://localhost:3001/ws", session_id)</div>

        <div className="excel-grid">
          <div className="grid-row grid-head">
            {['ISIN', 'Bond', 'Bid', 'Ask', 'Yield', 'Sprd', 'Time'].map((header) => (
              <div key={header}>{header}</div>
            ))}
          </div>
          {visibleRows.map((row, index) => (
            <div className={`grid-row ${index === 0 ? 'new-row' : ''}`} key={`${row[0]}-${tick}-${index}`}>
              {row.map((cell, cellIndex) => (
                <div key={cellIndex} className={cellIndex >= 2 && cellIndex <= 5 ? 'num' : ''}>
                  {cell}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="hero-metric">
      <Icon size={17} />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="login-shell">
      <section className="login-hero">
        <div className="login-copy">
          <nav className="public-nav">
            <div className="public-brand">
              <BrandMark size={34} />
              <span>StreamtoExcel</span>
            </div>
            <div className="public-status">
              <span />
              UMF bridge ready
            </div>
          </nav>

          <div className="copy-block">
            <h2>Stream message feed data straight into Excel.</h2>
            <p>
              Monitor UMF WebSocket sessions, inspect raw messages, and fill a workbook with
              live bond bid/ask rows as new events arrive.
            </p>
          </div>

          <div className="metric-strip">
            <Metric icon={Cable} value="WS / JWT" label="Existing backend contract" />
            <Metric icon={BadgeDollarSign} value="Bond data" label="Bid, ask, yield, spread" />
            <Metric icon={LockKeyhole} value="Memory only" label="Service credentials" />
          </div>

          <div className="assurance-list">
            <div><CheckCircle2 size={16} /> Existing React dashboard remains available.</div>
            <div><CheckCircle2 size={16} /> Excel rows insert latest message first.</div>
            <div><CheckCircle2 size={16} /> No backend route or WebSocket breaking changes.</div>
          </div>
        </div>

        <div className="hero-product">
          <ExcelPreview />
          <div className="signal-card">
            <Activity size={16} />
            <span>6 messages buffered</span>
            <TrendingUp size={16} />
            <strong>24 ms</strong>
          </div>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}
