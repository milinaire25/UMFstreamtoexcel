import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Topbar from '../components/Topbar';
import SessionSidebar from '../components/SessionSidebar';
import MessageFeed from '../components/MessageFeed';
import SessionForm from '../components/SessionForm';

export default function DesignPreview() {
  const [status, setStatus] = useState('running');
  const [showForm, setShowForm] = useState(false);
  const [messages, setMessages] = useState(() => {
    const base = Date.now();
    return [
      ['alex@broker.example', 'TTF\nNov 32.35/50\nDec 33.10/25\nQ1 34.20/40\nSum27 29.80/30.10\n20mw', 250000],
      ['sam@broker.example', 'TTF\nNov 32.38/47\nDec 33.12/22\nQ1 34.25/35\n20mw', 12000],
      ['alex@broker.example', '7.63% NCD Google bond MD 20/08/2028 8.60 offer', 8000],
      ['sam@broker.example', '5.20% NCD Microsoft bond MD 15/06/2029 5.45 offer', 4000],
    ].map(([sender, message, age]) => ({ eventData: { message, createAt: new Date(base-age).toISOString(), chatRoomId: 'sample-room' }, additionalData: { userId: sender, chatRoomName: 'Market conversations' } }));
  });
  const session = { id: 'preview', serviceAccount: 'Market desk · Preview', status, env: 'prod', trackEmail: 'trader@example.com' };
  return <>
    <div className="preview-banner"><strong>LOCAL DESIGN PREVIEW</strong><span>Sample data · No LSEG connection</span><Link to="/login">View sign-in page ↗</Link><button className="sm" onClick={() => setMessages(old => [...old, { eventData: {message:'TTF Nov 26 32.40/48 20mw',createAt:new Date().toISOString()}, additionalData:{userId:'sam@broker.example',chatRoomName:'Market conversations'} }])}>Simulate a message</button></div>
    <Topbar user={{name:'Milind'}} onLogout={() => { window.location.href='/login'; }} />
    <div className="workspace-heading"><div><span className="eyebrow">YOUR MARKET, IN CONTEXT</span><h1>Message workspace<span>.</span></h1></div><p>Conversations. Quotes. One clear view.</p></div>
    <div className="workspace-layout">
      <SessionSidebar sessions={[session]} activeId="preview" loading={false} messages={{preview:messages}} onSelect={()=>{}} onAdd={()=>setShowForm(true)} onStart={()=>setStatus('running')} onStop={()=>setStatus('stopped')} onDelete={()=>setMessages([])} />
      <div style={{flex:1,minWidth:0}}><MessageFeed session={session} messages={messages} logs={['Preview ready. Sample messages loaded.']} onStart={()=>setStatus('running')} onStop={()=>setStatus('stopped')} /></div>
    </div>
    {showForm && <SessionForm onClose={()=>setShowForm(false)} onSubmit={async ()=>setShowForm(false)} />}
  </>;
}
