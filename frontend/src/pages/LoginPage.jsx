import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Radio, ShieldCheck, MessageSquare, Table2, FileSpreadsheet, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function BrandMark() { return <div className="brand-mark"><Radio size={22} strokeWidth={1.8} /></div>; }

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
    <form id="sign-in" className="login-panel" onSubmit={handleSubmit}>
      <div className="login-panel__header">
        <BrandMark />
        <div>
          <h2>Welcome back.</h2>
          <p>Sign in to your live workspace</p>
        </div>
      </div>

      <div className="security-strip">
        <ShieldCheck size={16} />
        <span>Your workspace. Your conversations. Securely connected.</span>
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

      {error && <div className="login-error" role="alert">{error}</div>}

      <button type="submit" disabled={loading} className="primary login-submit">
        {loading ? 'Signing in…' : 'Open your workspace'}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}

export default function LoginPage() {
  return <main className="landing">
    <nav className="landing-nav" aria-label="Main navigation">
      <Link className="landing-brand" to="/login"><BrandMark /><span>StreamtoExcel<span className="brand-caption">THE LIVE MESSAGE WORKSPACE</span></span></Link>
      <div className="landing-nav-links"><a href="#how-it-works">How it works</a><a href="#sign-in" className="nav-signin">Sign in <ArrowUpRight size={15} /></a></div>
    </nav>
    <section className="landing-hero">
      <div className="landing-intro">
        <div className="eyebrow"><span className="design-dot" /> FROM CONVERSATION TO CLARITY</div>
        <h1>Stream Messages<br /><em>Live</em> into your apps.</h1>
        <p className="landing-description">Keep the conversation moving.<br />Turn your message feed into a clear view of markets, broker quotes, and the numbers that matter.</p>
        <div className="landing-capabilities"><span><MessageSquare size={15} /> Live messages</span><span><Table2 size={15} /> Structured markets</span><span><FileSpreadsheet size={15} /> Excel connected</span></div>
        {import.meta.env.DEV && <Link to="/design-preview" className="preview-entry">Explore the local workspace preview <ArrowRight size={16} /></Link>}
      </div>
      <LoginForm />
    </section>
    <section id="how-it-works" className="landing-product">
      <div className="product-section-heading"><div><span className="eyebrow">LESS COPYING. MORE CONTEXT.</span><h2>A conversation, organized.</h2></div><span className="sample-label">ILLUSTRATIVE DATA</span></div>
      <div className="product-demo">
        <div className="demo-conversation"><div className="demo-label"><MessageSquare size={16} /> THE MESSAGE</div><div className="demo-sender"><span className="demo-avatar">AB</span><div>Alex · Broker<span>broker@example.com</span></div><small>09:42</small></div><div className="demo-message">TTF<br />Nov 32.38/47<br />Dec 33.12/22<br />Q1 34.25/35<br /><span>20mw</span></div><div className="demo-flow"><span /> Into your workspace <ArrowRight size={16} /></div></div>
        <div className="demo-market"><div className="demo-market-bar"><span><span className="design-dot" /> Gas Bulletin board</span><small>SAMPLE VIEW</small></div><table><thead><tr><th>TTF</th><th>BID</th><th>ASK</th><th>SIZE</th></tr></thead><tbody>{[['Nov-26','32.38','32.47'],['Dec-26','33.12','33.22'],['Q1-27','34.25','34.35']].map(row => <tr key={row[0]}><th>{row[0]}</th><td>{row[1]}</td><td>{row[2]}</td><td>20 MW</td></tr>)}</tbody></table><div className="demo-market-foot"><ShieldCheck size={14} /> Source and sender stay with every quote.</div></div>
      </div>
      <div className="landing-features">{[["01", "Listen", "Bring your UMF conversations into one live feed."],["02", "Structure", "Read bond details and compare gas quotes across brokers."],["03", "Work", "Follow the market in your dashboard or stream messages to Excel."]].map(([number,title,copy])=><div key={number}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div></div>)}</div>
    </section>
    <footer className="landing-footer"><span>StreamtoExcel</span><span>Built for the flow of your working day.</span><a href="#sign-in">Open workspace <ArrowUpRight size={14} /></a></footer>
  </main>;
}
