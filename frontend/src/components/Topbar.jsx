import React from 'react';
import { Link } from 'react-router-dom';

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 38 38" fill="none">
      {/* Primary speech bubble — brand accent */}
      <rect x="1" y="1" width="30" height="24" rx="7" fill="#c96d4e" />
      <path d="M8 25 L5 32 L15 27" fill="#c96d4e" />
      {/* Dots in primary bubble */}
      <circle cx="9"  cy="13" r="1.8" fill="white" opacity="0.9" />
      <circle cx="16" cy="13" r="1.8" fill="white" opacity="0.9" />
      <circle cx="23" cy="13" r="1.8" fill="white" opacity="0.9" />
      {/* Secondary speech bubble — white with border */}
      <rect x="10" y="14" width="27" height="20" rx="6" fill="#ffffff" stroke="#c8c8d2" strokeWidth="1.5" />
      <rect x="15" y="20" width="14" height="1.8" rx="0.9" fill="#c8c8d2" />
      <rect x="15" y="24" width="10" height="1.8" rx="0.9" fill="#e4e4e9" />
    </svg>
  );
}

export default function Topbar({ user, onLogout, isAdmin }) {
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', height: 52,
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      boxShadow: 'var(--shadow-xs)',
      flexShrink: 0, position: 'sticky', top: 0, zIndex: 40,
    }}>
      {/* Logo + wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Logo />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.2px', lineHeight: 1.2 }}>
            LSEG Messenger Feed
          </div>
          <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Test Sandbox
          </div>
        </div>
      </div>

      {/* Right-hand controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isAdmin && (
          <Link to="/admin" style={{
            fontSize: 12, color: 'var(--text-2)', textDecoration: 'none',
            padding: '5px 12px', border: '1px solid var(--border-strong)',
            borderRadius: 'var(--r)', background: 'var(--surface-2)',
            fontWeight: 500, transition: 'all 0.15s',
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.background = 'var(--surface-3)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.background = 'var(--surface-2)'; }}
          >
            Admin
          </Link>
        )}

        {/* Avatar pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 12px 4px 4px',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 24,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dk))',
            color: '#fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 10, fontWeight: 700,
          }}>
            {initials}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{user?.name}</span>
        </div>

        <button onClick={onLogout} className="ghost" style={{ fontSize: 12, padding: '5px 12px' }}>
          Sign out
        </button>
      </div>
    </div>
  );
}
