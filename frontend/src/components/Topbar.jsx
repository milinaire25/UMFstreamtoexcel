import React from 'react';
import { Link } from 'react-router-dom';
import { FileSpreadsheet, ShieldCheck } from 'lucide-react';

function Logo() {
  return (
    <div className="brand-mark" style={{ width: 30, height: 30, borderRadius: 7 }}>
      <FileSpreadsheet size={16} strokeWidth={2.2} />
    </div>
  );
}

export default function Topbar({ user, onLogout, isAdmin }) {
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', height: 58,
      background: 'rgba(255,255,255,0.94)',
      backdropFilter: 'blur(18px)',
      borderBottom: '1px solid var(--border)',
      boxShadow: 'var(--shadow-xs)',
      flexShrink: 0, position: 'sticky', top: 0, zIndex: 40,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <Logo />
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)', letterSpacing: 0, lineHeight: 1.2 }}>
            StreamtoExcel
          </div>
          <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 800, letterSpacing: 0 }}>
            LSEG UMF WebSocket bridge
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          border: '1px solid var(--accent-border)', background: 'var(--accent-light)',
          color: 'var(--accent-dk)', borderRadius: 999, padding: '5px 10px',
          fontSize: 11, fontWeight: 800,
        }}>
          <ShieldCheck size={13} />
          Secure session
        </div>

        {isAdmin && (
          <Link to="/admin" style={{
            fontSize: 12, color: 'var(--text-2)', textDecoration: 'none',
            padding: '7px 12px', border: '1px solid var(--border-strong)',
            borderRadius: 'var(--r)', background: 'var(--surface-2)',
            fontWeight: 700, transition: 'all 0.15s',
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            Admin
          </Link>
        )}

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 12px 4px 4px',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 24,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dk))',
            color: '#fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 10, fontWeight: 800,
          }}>
            {initials}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 700 }}>{user?.name}</span>
        </div>

        <button onClick={onLogout} className="ghost" style={{ fontSize: 12, padding: '7px 12px', fontWeight: 700 }}>
          Sign out
        </button>
      </div>
    </div>
  );
}
