import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import Topbar from '../components/Topbar';
import { useNavigate } from 'react-router-dom';

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
      setSuccess(`User "${u.username}" created.`);
    } catch (err) { setError(err.message); }
  }

  async function handleDelete(username) {
    if (!confirm(`Delete user "${username}"?`)) return;
    await api.deleteUser(username);
    setUsers(prev => prev.filter(u => u.username !== username));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Topbar user={user} onLogout={() => { logout(); nav('/login'); }} isAdmin />

      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ fontSize: 18, fontWeight: 500 }}>User management</h1>
          <Link to="/" style={{ fontSize: 13, color: '#003087' }}>← Back to dashboard</Link>
        </div>

        {/* Create user */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>Add new user</h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
            {error   && <div style={{ gridColumn: '1/-1', fontSize: 12, color: '#dc2626', background: '#fee2e2', padding: '6px 10px', borderRadius: 6 }}>{error}</div>}
            {success && <div style={{ gridColumn: '1/-1', fontSize: 12, color: '#16a34a', background: '#dcfce7', padding: '6px 10px', borderRadius: 6 }}>{success}</div>}
            <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="primary">Create user</button>
            </div>
          </form>
        </div>

        {/* User list */}
        <div className="card">
          <h2 style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>All users ({users.length})</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#6b7280', textAlign: 'left' }}>
                <th style={{ padding: '6px 10px', fontWeight: 500 }}>Name</th>
                <th style={{ padding: '6px 10px', fontWeight: 500 }}>Username</th>
                <th style={{ padding: '6px 10px', fontWeight: 500 }}>Role</th>
                <th style={{ padding: '6px 10px', fontWeight: 500 }}>Created</th>
                <th style={{ padding: '6px 10px', fontWeight: 500 }}></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.username} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 10px' }}>{u.name}</td>
                  <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#374151' }}>{u.username}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span className={`badge ${u.role === 'admin' ? 'amber' : 'gray'}`}>{u.role}</span>
                  </td>
                  <td style={{ padding: '8px 10px', color: '#9ca3af' }}>{u.createdAt?.slice(0,10)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                    {u.username !== 'admin' && (
                      <button className="sm danger" onClick={() => handleDelete(u.username)}>Delete</button>
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

const lbl = { display: 'block', fontSize: 12, color: '#374151', marginBottom: 5, fontWeight: 500 };
