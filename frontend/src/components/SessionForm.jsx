import React, { useState, useRef } from 'react';

// ── File parser ────────────────────────────────────────────────────────────────
// Accepts a plain-text file in any of these formats:
//
//   key=value          (INI / .env style)
//   key: value         (YAML-ish)
//   key value          (space-separated)
//
// Recognised keys (case-insensitive, underscores/hyphens interchangeable):
//   serviceaccount / service_account / uuid
//   password / pwd / pass
//   trackemail / track_email / email
//   trackuuid / track_uuid / trackid / user_uuid
//   env / environment
//
function parseCredFile(text) {
  const result = {};
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) continue;

    // Split on first = or : or whitespace
    const m = line.match(/^([^=:\s]+)\s*[=:]\s*(.+)$/) || line.match(/^(\S+)\s+(.+)$/);
    if (!m) continue;

    const key = m[1].toLowerCase().replace(/[-_]/g, '');
    const val = m[2].trim().replace(/^["']|["']$/g, ''); // strip surrounding quotes

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
  const [error,    setError]    = useState('');
  const [fileMsg,  setFileMsg]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const fileRef = useRef(null);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  // ── File loader ──────────────────────────────────────────────────────────────
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCredFile(ev.target.result);
      if (!Object.keys(parsed).length) {
        setFileMsg('⚠️ Could not read any fields from that file. See the format hint below.');
        return;
      }
      setForm(f => ({
        ...f,
        serviceAccount: parsed.serviceAccount || f.serviceAccount,
        password:       parsed.password       || f.password,
        trackEmail:     parsed.trackEmail     || f.trackEmail,
        trackUUID:      parsed.trackUUID      || f.trackUUID,
        env:            parsed.env            || f.env,
        // auto-select track type based on what was found
        trackType: parsed.trackEmail ? 'email' : parsed.trackUUID ? 'uuid' : f.trackType,
      }));
      const loaded = Object.keys(parsed).join(', ');
      setFileMsg(`✅ Loaded: ${loaded}`);
      setError('');
    };
    reader.readAsText(file);
    // reset so the same file can be re-loaded
    e.target.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload = {
        serviceAccount: form.serviceAccount.trim(),
        password:       form.password,
        env:            form.env,
        trackEmail:     form.trackType === 'email' ? form.trackEmail.trim() : '',
        trackUUID:      form.trackType === 'uuid'  ? form.trackUUID.trim()  : '',
      };
      await onSubmit(payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div className="card" style={{ width: 460, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 500 }}>New message feed session</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 18, color: '#9ca3af', cursor: 'pointer', padding: 0 }}>✕</button>
        </div>

        {/* ── Load from file ── */}
        <div style={{
          marginBottom: 20, padding: '14px 16px', borderRadius: 10,
          background: '#f5f5f7', border: '1px solid rgba(0,0,0,0.07)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#1d1d1f', marginBottom: 6 }}>
            📂 Load credentials from file
          </div>
          <div style={{ fontSize: 11, color: '#6e6e73', marginBottom: 10, lineHeight: 1.6 }}>
            Select a <code style={{ background: '#e8e8ed', padding: '1px 4px', borderRadius: 3 }}>.txt</code> or{' '}
            <code style={{ background: '#e8e8ed', padding: '1px 4px', borderRadius: 3 }}>.env</code> file
            with your credentials — the fields below will be filled automatically.
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".txt,.env,.conf,.ini,.cfg"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              background: '#CC785C', color: '#fff', border: 'none',
              borderRadius: 7, padding: '6px 14px', fontSize: 12,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Choose file…
          </button>

          {fileMsg && (
            <div style={{
              marginTop: 8, fontSize: 11, lineHeight: 1.5,
              color: fileMsg.startsWith('✅') ? '#1a7f37' : '#9a5700',
            }}>
              {fileMsg}
            </div>
          )}

          {/* Format hint */}
          <details style={{ marginTop: 10 }}>
            <summary style={{ fontSize: 11, color: '#6e6e73', cursor: 'pointer', userSelect: 'none' }}>
              Show expected file format
            </summary>
            <pre style={{
              marginTop: 8, fontSize: 10, background: '#1d1d1f', color: '#a8e6a3',
              padding: '10px 12px', borderRadius: 7, lineHeight: 1.7, overflowX: 'auto',
            }}>{`# credentials.txt — any key=value format
serviceaccount = GE-D7WT7HTECM4U
password       = your-password-here
trackemail     = colleague@company.com
# -- OR use UUID instead of email --
# trackuuid    = GE-XXXXXXXXXX
env            = prod`}</pre>
          </details>
        </div>

        <form onSubmit={handleSubmit}>
          <Field label="Service Account UUID *" hint="e.g. GE-D7WT7HTECM4U">
            <input
              value={form.serviceAccount}
              onChange={e => set('serviceAccount', e.target.value)}
              placeholder="GE-XXXXXXXXXX"
              required
            />
          </Field>

          <Field label="Service Account Password *">
            <input
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="••••••••"
              required
            />
          </Field>

          <Field label="Track user by">
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              {['email', 'uuid'].map(t => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="radio" name="trackType" value={t}
                    checked={form.trackType === t}
                    onChange={() => set('trackType', t)}
                    style={{ width: 'auto' }}
                  />
                  {t === 'email' ? 'Email address' : 'User UUID'}
                </label>
              ))}
            </div>
            {form.trackType === 'email'
              ? <input value={form.trackEmail} onChange={e => set('trackEmail', e.target.value)} placeholder="user@company.com" required />
              : <input value={form.trackUUID}  onChange={e => set('trackUUID',  e.target.value)} placeholder="GE-XXXXXXXXXX" required />
            }
          </Field>

          <Field label="Environment">
            <select value={form.env} onChange={e => set('env', e.target.value)}>
              {['prod', 'qa', 'trd', 'beta', 'dev'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>

          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 14, padding: '8px 10px', background: '#f9fafb', borderRadius: 6 }}>
            🔒 Credentials are stored only in server memory and are never persisted to disk or sent to third parties.
          </div>

          {error && (
            <div style={{ fontSize: 12, color: '#dc2626', background: '#fee2e2', padding: '6px 10px', borderRadius: 6, marginBottom: 12 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose}>Cancel</button>
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
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 5 }}>
        {label}
        {hint && <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}
