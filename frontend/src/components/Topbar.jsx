import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, LogOut, Users, LayoutDashboard } from 'lucide-react';
export default function Topbar({ user, onLogout, isAdmin }) {
  const initials = user?.name?.split(' ').map(word => word[0]).join('').slice(0,2).toUpperCase() || 'U';
  return <header className="workspace-topbar">
    <Link to="/" className="workspace-brand"><div className="brand-mark"><Radio size={21} /></div><span>StreamtoApps<small>LIVE MESSAGE WORKSPACE</small></span></Link>
    <nav aria-label="Workspace navigation"><Link to="/"><LayoutDashboard size={15} /> Workspace</Link>{isAdmin && <Link to="/admin"><Users size={15} /> Admin</Link>}</nav>
    <div className="workspace-account"><span className="account-avatar">{initials}</span><span className="account-name">{user?.name}</span><button className="ghost" onClick={onLogout}><LogOut size={15} /><span>Sign out</span></button></div>
  </header>;
}
