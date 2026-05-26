import React from 'react';
import { Link } from 'react-router-dom';

function ChatIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 38 38" fill="none">
      <rect x="1" y="1" width="30" height="24" rx="7" fill="#CC785C" />
      <path d="M8 25 L5 32 L15 27" fill="#CC785C" />
      <rect x="10" y="14" width="27" height="20" rx="6" fill="#fff" stroke="#e5e5e5" strokeWidth="1.2" />
      <rect x="15" y="20" width="14" height="1.8" rx="0.9" fill="#d0cac7" />
      <rect x="15" y="24" width="10" height="1.8" rx="0.9" fill="#d0cac7" />
      <circle cx="9"  cy="13" r="1.8" fill="white" opacity="0.9" />
      <circle cx="16" cy="13" r="1.8" fill="white" opacity="0.9" />
      <circle cx="23" cy="13" r="1.8" fill="white" opacity="0.9" />
    </svg>
  );
}

export default function Topbar({ user, onLogout, isAdmin }) {
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 56,
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'saturate(180%) blur(20px)',
      borderBottom: '1px solid rgba(0,0,0,0.07)',
      flexShrink: 0, position: 'sticky', top: 0, zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ChatIcon />
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', lineHeight: 1.2, letterSpacing: '-0.2px' }}>
            LSEG Messenger Feed
          </div>
          <div style={{ fontSize: 11, color: '#a37060', fontWeight: 500 }}>Test Sandbox</div>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {isAdmin && (
          <Link to="/admin" style={{
            fontSize: 13, color: '#CC785C', textDecoration: 'none',
            padding: '5px 12px', border: '1px solid rgba(204,120,92,0.25)',
            borderRadius: 8, background: 'rgba(204,120,92,0.06)',
            fontWeight: 500,
          }}>
            Admin
          </Link>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #CC785C, #b8694f)',
            color: '#fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 12, fontWeight: 600,
          }}>
            {initials}
          </div>
          <span style={{ fontSize: 13, color: '#1d1d1f', fontWeight: 500 }}>{user?.name}</span>
        </div>
        <button onClick={onLogout} style={{ fontSize: 13, padding: '5px 12px', borderRadius: 8, color: '#6e6e73' }}>
          Sign out
        </button>
      </div>
    </div>
  );
}
