import React from 'react';
import { Link } from 'react-router-dom';

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 38 38" fill="none">
      <rect x="1" y="1" width="30" height="24" rx="7" fill="#CC785C" />
      <path d="M8 25 L5 32 L15 27" fill="#CC785C" />
      <rect x="10" y="14" width="27" height="20" rx="6" fill="#1a1a26" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <rect x="15" y="20" width="14" height="1.8" rx="0.9" fill="rgba(255,255,255,0.25)" />
      <rect x="15" y="24" width="10" height="1.8" rx="0.9" fill="rgba(255,255,255,0.15)" />
      <circle cx="9"  cy="13" r="1.8" fill="white" opacity="0.85" />
      <circle cx="16" cy="13" r="1.8" fill="white" opacity="0.85" />
      <circle cx="23" cy="13" r="1.8" fill="white" opacity="0.85" />
    </svg>
  );
}

export default function Topbar({ user, onLogout, isAdmin }) {
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', height: 52,
      background: 'rgba(13,13,20,0.85)',
      backdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      flexShrink: 0, position: 'sticky', top: 0, zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Logo />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.2px', lineHeight: 1.2 }}>
            LSEG Messenger Feed
          </div>
          <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 500, letterSpacing: '0.3px' }}>
            TEST SANDBOX
          </div>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isAdmin && (
          <Link to="/admin" style={{
            fontSize: 12, color: 'var(--text-2)', textDecoration: 'none',
            padding: '5px 12px', border: '1px solid var(--border-strong)',
            borderRadius: 'var(--r)', background: 'var(--surface-2)',
            fontWeight: 500, transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.borderColor = 'var(--border-accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
          >
            Admin
          </Link>
        )}

        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 10px 4px 4px',
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 24,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'linear-gradient(135deg, #CC785C, #8b4a32)',
            color: '#fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 10, fontWeight: 700,
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{user?.name}</span>
        </div>

        <button onClick={onLogout} style={{
          fontSize: 12, padding: '5px 12px', borderRadius: 'var(--r)',
          color: 'var(--text-2)', background: 'transparent',
          border: '1px solid transparent',
        }}>
          Sign out
        </button>
      </div>
    </div>
  );
}
