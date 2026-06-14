import React, { useState, useRef } from 'react';

function parseCredFile(text) {
  const result = {};
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) continue;
    const m = line.match(/^([^=:\s]+)\s*[=:]\s*(.+)$/) || line.match(/^(\S+)\s+(.+)$/);
    if (!m) continue;
    const key = m[1].toLowerCase().replace(/[-_]/g, '');
    const val = m[2].trim().replace(/^["']|["']$/g, '');
    if (['serviceaccount', 'uuid', 'serviceuuid'].includes(key))  result.serviceAccount = val;
    if (['password', 'pwd', 'pass'].includes(key))                result.password       = val;
    if (['trackemail', 'email'].includes(key))                     result.trackEmail     = val;
    if (['trackuuid', 'trackid', 'useruuid', 'trackuseruuid'].includes(key)) result.trackUUID = val;
    if (['env', 'environment'].includes(key))                      result.env            = val;
  }
  return result;
}

export default function SessionForm({ onSubmit, onClose }) {
  const [form, setForm] = useState({
    serviceAccount: '', password: '', trackType: 'email',
    trackEmail: '', trackUUID: '', env: 'prod',
  });
  const [error,   setError]   = useState('');
  const [fileMsg, setFileMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCredFile(ev.target.result);
      if (!Object.keys(parsed).length) {
        setFileMsg('⚠️ Could not read any fields from that file.');
        return;
      }
      setForm(f => ({
        ...f,
        serviceAccount: parsed.serviceAccount || f.serviceAccount,
        password:       parsed.password       || f.password,
        trackEmail:     parsed.trackEmail     || f.trackEmail,
        trackUUID:      parsed.trackUUID      || f.trackUUID,
        env:            parsed.env            || f.env,
        trackType: parsed.trackEmail ? 'email' : parsed.trackUUID ? 'uuid' : f.trackType,
      }));
      setFileMsg(`✅ Loaded: ${Object.keys(parsed).join(', ')}`);
      setError('');
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await onSubmit({
        serviceAccount: form.serviceAccount.trim(),
        password:       form.password,
        env:            form.env,
        trackEmail:     form.trackType === 'email' ? form.trackEmail.trim() : '',
        trackUUID:      form.trackType === 'uuid'  ? form.trackUUID.trim()  : '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Overlay */
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, animation: 'fadeIn 0.15s ease',
    }}>
      {/* Modal */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--r-xl)',
        padding: 28,
        width: 460,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>New session</h2>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>Enter your service account credentials</p>
          </div>
          <button onClick={onClose} style={{
            border: 'none', background: 'var(--surface-2)', color: 'var(--text-2)',
            width: 28, height: 28, borderRadius: '50%', fontSize: 14, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Load from file */}
        <div style={{
          marginBottom: 20, padding: '14px 16px', borderRadius: 'var(--r)',
          background: 'var(--surface-2)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Load from file
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10, lineHeight: 1.6 }}>
            Select a{' '}
            <code style={{ background: 'var(--surface-3)', padding: '1px 5px', borderRadius: 4, color: 'var(--text-2)' }}>.txt</code>{' '}or{' '}
            <code style={{ background: 'var(--surface-3)', padding: '1px 5px', borderRadius: 4, color: 'var(--text-2)' }}>.env</code>{' '}
            file — fields will be filled automatically.
          </div>
          <input ref={fileRef} type="file" accept=".txt,.env,.conf,.ini,.cfg" style={{ display: 'none' }} onChange={handleFileChange} />
          <button type="button" onClick={() => fileRef.current?.click()} style={{
            background: 'var(--surface-3)', color: 'var(--text-1)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--r-sm)', padding: '5px 14px', fontSize: 12, fontWeight: 600,
          }}>
            Choose file…
          </button>

          {fileMsg && (
            <div style={{
              marginTop: 8, fontSize: 11, lineHeight: 1.5,
              color: fileMsg.startsWith('✅') ? 'var(--green)' : 'var(--amber)',
            }}>
              {fileMsg}
            </div>
          )}

          <details style={{ marginTop: 10 }}>
            <summary style={{ fontSize: 11, color: 'var(--text-3)', cursor: 'pointer', userSelect: 'none' }}>
              Show expected file format
            </summary>
            <pre style={{
              marginTop: 8, fontSize: 11, background: '#09090f', color: '#88e888',
              padding: '10px 12px', borderRadius: 'var(--r-sm)', lineHeight: 1.7,
              overflowX: 'auto', border: '1px solid var(--border)',
            }}>{`# credentials.txt
serviceaccount = GE-D7WT7HTECM4U
password       = your-password
trackemail     = colleague@company.com
# or: trackuuid = GE-XXXXXXXXXX
env            = prod`}</pre>
          </details>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Field label="Service Account UUID *" hint="e.g. GE-D7WT7HTECM4U">
            <input value={form.serviceAccount} onChange={e => set('serviceAccount', e.target.value)} placeholder="GE-XXXXXXXXXX" required />
          </Field>

          <Field label="Service Account Password *">
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" required />
          </Field>

          <Field label="Track user by">
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              {['email', 'uuid'].map(t => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--text-2)' }}>
                  <input type="radio" name="trackType" value={t} checked={form.trackType === t} onChange={() => set('trackType', t)} style={{ width: 'auto' }} />
                  {t === 'email' ? 'Email address' : 'User UUID'}
                </label>
              ))}
            </div>
            {form.trackType === 'email'
              ? <input value={form.trackEmail} onChange={e => set('trackEmail', e.target.value)} placeholder="user@company.com" required />
              : <input value={form.trackUUID}  onChange={e => set('trackUUID',  e.target.value)} placeholder="GE-XXXXXXXXXX"    required />
            }
          </Field>

          <Field label="Environment">
            <select value={form.env} onChange={e => set('env', e.target.value)}>
              {['prod', 'qa', 'trd', 'beta', 'dev'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-3)' }}>
              {['beta', 'ppe'].includes(form.env) ? '⚠️ Beta/PPE: uses the PPE JAR and connects to api.ppe.refinitiv.com' : '✓ Production: uses the standard JAR and connects to api.refinitiv.com'}
            </div>
          </Field>

          {/* Security note */}
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 14, padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', lineHeight: 1.6 }}>
            🔒 Credentials are stored only in server memory — never written to disk or sent to third parties.
          </div>

          {error && (
            <div style={{ fontSize: 12, color: 'var(--red)', background: 'var(--red-bg)', padding: '7px 10px', borderRadius: 'var(--r-sm)', marginBottom: 12, border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ color: 'var(--text-2)' }}>Cancel</button>
            <button type="submit" className="primary" disabled={loading}>
              {loading ? 'Creating…' : 'Add session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
        {label}
        {hint && <span style={{ fontWeight: 400, color: 'var(--text-3)', marginLeft: 6 }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}
