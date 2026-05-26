import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import Topbar from '../components/Topbar';

export default function AdminPage() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [users,   setUsers]   = useState([]);
  const [form,    setForm]    = useState({ username: '', password: '', name: '', role: 'user' });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { api.listUsers().then(setUsers).catch(console.error); }, []);

  async function handleCreate(e) {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      const u = await api.register(form);
      setUsers(prev => [...prev, u]);
      setForm({ username: '', password: '', name: '', role: 'user' });
      setSuccess(`User "${u.username}" created successfully.`);
    } catch (err) { setError(err.message); }
  }

  async function handleDelete(username) {
    if (!confirm(`Delete user "${username}"?`)) return;
    await api.deleteUser(username);
    setUsers(prev => prev.filter(u => u.username !== username));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar user={user} onLogout={() => { logout(); nav('/login'); }} isAdmin />

      <div style={{ padding: '28px 24px', maxWidth: 860, margin: '0 auto', width: '100%' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.3px' }}>User Management</h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>{users.length} user{users.length !== 1 ? 's' : ''} registered</p>
          </div>
          <Link to="/" style={{
            fontSize: 12, color: 'var(--text-2)', textDecoration: 'none',
            padding: '7px 14px', border: '1px solid var(--border-strong)',
            borderRadius: 'var(--r)', background: 'var(--surface-2)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            ← Dashboard
          </Link>
        </div>

        {/* Create user */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 18, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Add New User
          </h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Full name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" required />
            </div>
            <div>
              <label style={lbl}>Username</label>
              <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="jsmith" required />
            </div>
            <div>
              <label style={lbl}>Password</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" required />
            </div>
            <div>
              <label style={lbl}>Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {error   && (
              <div style={{ gridColumn: '1/-1', fontSize: 12, color: 'var(--red)', background: 'var(--red-bg)', padding: '8px 12px', borderRadius: 'var(--r-sm)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ gridColumn: '1/-1', fontSize: 12, color: 'var(--green)', background: 'var(--green-bg)', padding: '8px 12px', borderRadius: 'var(--r-sm)', border: '1px solid rgba(34,197,94,0.2)' }}>
                {success}
              </div>
            )}
            <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="primary">Create user</button>
            </div>
          </form>
        </div>

        {/* User list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              All Users
            </h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Name', 'Username', 'Role', 'Created', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontWeight: 600, fontSize: 11, color: 'var(--text-3)', textAlign: 'left', letterSpacing: '0.5px', textTransform: 'uppercase', background: 'var(--surface-2)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.username} style={{ borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', color: 'var(--text-1)', fontWeight: 500 }}>{u.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <code style={{ fontSize: 12, color: 'var(--text-2)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>
                      {u.username}
                    </code>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${u.role === 'admin' ? 'amber' : 'gray'}`}>{u.role}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-3)', fontSize: 12 }}>
                    {u.createdAt?.slice(0, 10)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {u.username !== 'admin' && (
                      <button className="sm danger" onClick={() => handleDelete(u.username)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

const lbl = {
  display: 'block', fontSize: 12, color: 'var(--text-2)',
  marginBottom: 6, fontWeight: 600,
};
