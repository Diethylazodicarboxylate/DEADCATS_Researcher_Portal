import React, { useEffect, useMemo, useState } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import htm from 'https://esm.sh/htm@3.1.1';
import { marked } from 'https://esm.sh/marked@13.0.2';
import { appPath, authFetch, fetchMeWithRetry, initialsFromHandle, label, RANK_COLORS, readCachedUser, timeAgo, truncate, usePortalAuth } from './react-portal-utils.js';

const html = htm.bind(React.createElement);

function Shell({ title, kicker, children, user, nav = [], publicPage = false }) {
  return html`
    <div className="workspace-shell">
      <header className="workspace-topbar">
        <a className="portal-brand" href=${publicPage ? appPath('index.html') : appPath('dashboard.html')}>
          <div className="portal-mark"></div>
          <div className="portal-brand-copy">
            <div className="portal-kicker">${kicker}</div>
            <div className="portal-brand-title">${title}</div>
          </div>
        </a>
        <div className="workspace-topbar-right">
          ${nav.map((item) => html`<a key=${item.href} className="portal-nav-link" href=${item.href}>${item.label}</a>`)}
          ${user ? html`
            <div className="workspace-user">
              <div className="workspace-avatar">${initialsFromHandle(user.handle)}</div>
              <div>
                <div className="portal-mini" style=${{ color: '#f4e9eb' }}>${user.handle}</div>
                <div className="portal-mini" style=${{ color: RANK_COLORS[user.rank] || '#8e767d' }}>${user.rank || 'member'}</div>
              </div>
            </div>
          ` : null}
        </div>
      </header>
      <main className="portal-main">${children}</main>
    </div>
  `;
}

function renderPage(component) {
  createRoot(document.getElementById('app-root')).render(component);
}

export function initPublicFeedPage() {
  function App() {
    const [items, setItems] = useState([]);
    useEffect(() => {
      fetch('/api/notes/public', { cache: 'no-store' }).then((res) => res.ok ? res.json() : []).then(setItems).catch(() => setItems([]));
    }, []);
    return html`
      <${Shell} title="Public research" kicker="DEADCATS Publications" nav=${[{ href: appPath('index.html'), label: 'Home' }, { href: appPath('login.html'), label: 'Login' }]} publicPage=${true}>
        <section className="portal-panel workspace-hero">
          <div className="portal-chip hot">Published research feed</div>
          <h1 className="workspace-hero-title">Public papers exported from the internal wiki.</h1>
          <div className="workspace-hero-copy">Reviewed internal notes that were approved for publication live here as public-facing research.</div>
        </section>
        <section className="workspace-section-grid">
          ${items.length ? items.map((item) => html`
            <a key=${item.id} className="portal-panel workspace-panel" href=${appPath(`paper.html?slug=${encodeURIComponent(item.public_slug)}`)}>
              <div className="workspace-panel-title">${item.title}</div>
              <div className="workspace-card-copy">${item.excerpt || 'No summary available.'}</div>
              <div className="workspace-card-meta">
                <span className="portal-chip">${item.publish_folder_name || 'Unfiled'}</span>
                <span className="portal-chip">${item.published_by || item.author_handle || 'unknown'}</span>
              </div>
            </a>
          `) : html`<div className="portal-panel workspace-panel"><div className="workspace-empty">No public papers published yet</div></div>`}
        </section>
      </${Shell}>
    `;
  }
  renderPage(html`<${App} />`);
}

export function initPaperPage() {
  function App() {
    const [note, setNote] = useState(null);
    useEffect(() => {
      const slug = new URLSearchParams(window.location.search).get('slug') || '';
      fetch(`/api/notes/public/${encodeURIComponent(slug)}`, { cache: 'no-store' }).then((res) => res.ok ? res.json() : null).then(setNote).catch(() => setNote(null));
    }, []);
    return html`
      <${Shell} title="Published paper" kicker="DEADCATS Publications" nav=${[{ href: appPath('research-feed.html'), label: 'Public feed' }, { href: appPath('index.html'), label: 'Home' }]} publicPage=${true}>
        <section className="portal-panel workspace-hero">
          ${note ? html`
            <div className="portal-chip">${note.publish_folder_name || 'Unfiled'}</div>
            <h1 className="workspace-hero-title">${note.title}</h1>
            <div className="workspace-card-meta">
              <span className="portal-chip">${note.published_by || note.author_handle || 'unknown'}</span>
              <span className="portal-chip">${note.note_type || 'paper'}</span>
            </div>
            <div className="workspace-card-copy" dangerouslySetInnerHTML=${{ __html: marked.parse(String(note.content || '')) }}></div>
          ` : html`<div className="workspace-empty">Unable to load paper</div>`}
        </section>
      </${Shell}>
    `;
  }
  renderPage(html`<${App} />`);
}

export function initAuditPage() {
  function App() {
    const { user, setUser, ready } = usePortalAuth();
    const [items, setItems] = useState([]);
    useEffect(() => {
      if (!ready || !user) return;
      authFetch('/api/audit/', {}, setUser).then((res) => res.ok ? res.json() : []).then(setItems);
    }, [ready, user]);
    return html`<${Shell} title="Audit log" kicker="DEADCATS Audit" user=${user} nav=${[{ href:appPath('dashboard.html'),label:'Dashboard' }]}>
      <section className="portal-panel workspace-panel"><div className="workspace-card-list">${items.map((item)=>html`<div key=${item.id} className="workspace-card"><div className="workspace-card-title">${item.title}</div><div className="workspace-card-copy">${item.summary||''}</div><div className="workspace-card-meta"><span className="portal-chip">${item.kind}</span><span className="portal-chip">${item.actor_handle||'system'}</span><span className="portal-chip">${timeAgo(item.created_at)}</span></div></div>`)}</div></section>
    </${Shell}>`;
  }
  renderPage(html`<${App} />`);
}

export function initBookmarksPage() {
  function App() {
    const { user, setUser, ready } = usePortalAuth();
    const [items, setItems] = useState([]);
    useEffect(() => { if (ready && user) authFetch('/api/bookmarks/', {}, setUser).then((r)=>r.ok?r.json():[]).then(setItems); }, [ready,user]);
    return html`<${Shell} title="Bookmarks" kicker="DEADCATS Saved Items" user=${user} nav=${[{href:appPath('dashboard.html'),label:'Dashboard'},{href:appPath('library.html'),label:'Wiki'}]}>
      <section className="workspace-section-grid">${items.length ? items.map((bm)=> {
        const data = bm.data || {};
        const href = bm.item_type === 'note' ? appPath(`library.html?note_id=${encodeURIComponent(bm.item_id)}`) : appPath('ioc-tracker.html');
        return html`<a key=${bm.id} className="portal-panel workspace-panel" href=${href}><div className="workspace-panel-title">${data.title || data.value || 'Bookmark'}</div><div className="workspace-card-copy">${truncate(data.content || data.notes || '', 180)}</div><div className="workspace-card-meta"><span className="portal-chip">${bm.item_type}</span><span className="portal-chip">${timeAgo(bm.created_at)}</span></div></a>`;
      }) : html`<div className="portal-panel workspace-panel"><div className="workspace-empty">No bookmarks yet</div></div>`}</section>
    </${Shell}>`;
  }
  renderPage(html`<${App} />`);
}

export function initMonitorPage() {
  function App() {
    const { user, setUser, ready } = usePortalAuth();
    const [data, setData] = useState(null);
    useEffect(() => { if (ready && user) authFetch('/api/monitor', {}, setUser).then((r)=>r.ok?r.json():null).then(setData); }, [ready,user]);
    return html`<${Shell} title="Monitor" kicker="DEADCATS Admin" user=${user} nav=${[{href:appPath('dashboard.html'),label:'Dashboard'},{href:appPath('admin.html'),label:'Admin'}]}>
      <section className="workspace-stats">${data ? Object.entries(data.system || {}).slice(0,4).map(([k,v])=>html`<div key=${k} className="portal-panel workspace-stat"><div className="portal-meta">${k}</div><div className="workspace-stat-value">${String(v)}</div></div>`) : html`<div className="portal-panel workspace-stat"><div className="workspace-empty">Loading monitor</div></div>`}</section>
      <section className="workspace-section-grid">${data ? Object.entries(data.stats || {}).map(([k,v])=>html`<div key=${k} className="portal-panel workspace-panel"><div className="workspace-panel-title">${k}</div><div className="workspace-stat-value">${String(v)}</div></div>`) : null}</section>
    </${Shell}>`;
  }
  renderPage(html`<${App} />`);
}

export function initMembersPage() {
  function App() {
    const { user, setUser, ready } = usePortalAuth();
    const [members, setMembers] = useState([]);
    useEffect(() => { if (ready && user) authFetch('/api/users/', {}, setUser).then((r)=>r.ok?r.json():[]).then(setMembers); }, [ready,user]);
    return html`<${Shell} title="Members" kicker="DEADCATS Team" user=${user} nav=${[{href:appPath('dashboard.html'),label:'Dashboard'}]}>
      <section className="workspace-section-grid">${members.map((member)=>html`<a key=${member.id} className="portal-panel workspace-panel" href=${appPath(`members/profile.html?user=${encodeURIComponent(member.handle)}`)}><div className="workspace-card-meta"><span className="portal-chip">${member.rank || 'member'}</span><span className="portal-chip">${member.profile_status || 'available'}</span></div><div className="workspace-panel-title">${member.handle}</div><div className="workspace-card-copy">${member.bio || 'No profile bio yet.'}</div></a>`)}</section>
    </${Shell}>`;
  }
  renderPage(html`<${App} />`);
}

export function initProfilePage(defaultHandle = '') {
  function App() {
    const { user, setUser, ready } = usePortalAuth();
    const [profile, setProfile] = useState(null);
    useEffect(() => {
      if (!ready || !user) return;
      const handle = defaultHandle || new URLSearchParams(window.location.search).get('user') || user.handle;
      authFetch(`/api/users/${encodeURIComponent(handle)}`, {}, setUser).then((r)=>r.ok?r.json():null).then(setProfile);
    }, [ready,user]);
    return html`<${Shell} title="Profile" kicker="DEADCATS Member" user=${user} nav=${[{href:appPath('members.html'),label:'Members'},{href:appPath('dashboard.html'),label:'Dashboard'}]}>
      <section className="portal-panel workspace-hero">${profile ? html`<div className="portal-chip">${profile.rank || 'member'}</div><h1 className="workspace-hero-title">${profile.handle}</h1><div className="workspace-hero-copy">${profile.bio || 'No bio yet.'}</div><div className="workspace-card-meta"><span className="portal-chip">${profile.profile_status || 'available'}</span><span className="portal-chip">CTF points ${profile.ctf_stats?.points || 0}</span></div>`:html`<div className="workspace-empty">Loading profile</div>`}</section>
    </${Shell}>`;
  }
  renderPage(html`<${App} />`);
}

export function initAIChatPage() {
  function App() {
    const { user, setUser, ready } = usePortalAuth();
    const [history, setHistory] = useState([]);
    const [message, setMessage] = useState('');
    async function loadHistory(){ const res=await authFetch('/api/ai_chat/history',{},setUser); setHistory(res.ok?await res.json():[]); }
    useEffect(()=>{ if(ready&&user) loadHistory(); },[ready,user]);
    async function send(){ if(!message.trim()) return; const res=await authFetch('/api/ai_chat/message',{method:'POST',body:JSON.stringify({message})},setUser); if(res.ok){ setMessage(''); await loadHistory(); } }
    return html`<${Shell} title="AI Chat" kicker="DEADCATS Assistant" user=${user} nav=${[{href:appPath('dashboard.html'),label:'Dashboard'}]}>
      <section className="portal-panel workspace-panel"><div className="workspace-card-list">${history.map((m)=>html`<div key=${m.id} className="workspace-card"><div className="workspace-card-meta"><span className="portal-chip">${m.role}</span></div><div className="workspace-card-copy">${m.content}</div></div>`)}</div><div className="workspace-search-bar"><textarea className="portal-textarea" value=${message} onInput=${(e)=>setMessage(e.target.value)}></textarea><div></div><button className="portal-button primary" onClick=${send}>Send</button></div></section>
    </${Shell}>`;
  }
  renderPage(html`<${App} />`);
}

export function initPwnboxPage() {
  function App() {
    const { user, setUser, ready } = usePortalAuth();
    const [status, setStatus] = useState(null);
    async function load(){ const res=await authFetch('/api/pwnbox/status',{},setUser); setStatus(res.ok?await res.json():null);}
    useEffect(()=>{ if(ready&&user) load(); },[ready,user]);
    async function start(){ await authFetch('/api/pwnbox/start',{method:'POST'},setUser); load(); }
    async function stop(){ await authFetch('/api/pwnbox/stop',{method:'DELETE'},setUser); load(); }
    return html`<${Shell} title="PwnBox" kicker="DEADCATS Runtime" user=${user} nav=${[{href:appPath('dashboard.html'),label:'Dashboard'}]}>
      <section className="workspace-stats"><div className="portal-panel workspace-stat"><div className="portal-meta">Status</div><div className="workspace-stat-value">${status?.active ? 'Active' : 'Idle'}</div></div></section>
      <section className="portal-panel workspace-panel"><div className="workspace-actions"><button className="portal-button primary" onClick=${start}>Start session</button><button className="portal-button ghost" onClick=${stop}>Stop session</button></div><div className="workspace-card-copy">${status?.session ? `Owner ${status.session.owner_handle}` : 'No active session.'}</div></section>
    </${Shell}>`;
  }
  renderPage(html`<${App} />`);
}

export function initResearchAdventurePage() {
  function App() {
    const { user, setUser, ready } = usePortalAuth();
    const [meta, setMeta] = useState(null);
    const [me, setMe] = useState(null);
    useEffect(()=>{ if(!ready||!user) return; Promise.all([authFetch('/api/research_adventure/meta',{},setUser),authFetch('/api/research_adventure/me',{},setUser)]).then(async([a,b])=>{setMeta(a.ok?await a.json():null); setMe(b.ok?await b.json():null);}); },[ready,user]);
    return html`<${Shell} title="Research Adventure" kicker="DEADCATS Progression" user=${user} nav=${[{href:appPath('dashboard.html'),label:'Dashboard'}]}>
      <section className="workspace-stats">${me ? html`<div className="portal-panel workspace-stat"><div className="portal-meta">Level</div><div className="workspace-stat-value">${me.level || 0}</div></div><div className="portal-panel workspace-stat"><div className="portal-meta">Points</div><div className="workspace-stat-value">${me.points || 0}</div></div>` : null}</section>
      <section className="workspace-section-grid"><div className="portal-panel workspace-panel"><div className="workspace-panel-title">Pathways</div><div className="workspace-card-list">${(meta?.pathways||[]).map((p)=>html`<div key=${p.key||p.name} className="workspace-card"><div className="workspace-card-title">${p.name||p.title}</div><div className="workspace-card-copy">${p.description||''}</div></div>`)}</div></div><div className="portal-panel workspace-panel"><div className="workspace-panel-title">Daily tasks</div><div className="workspace-card-list">${(me?.daily_tasks||[]).map((t)=>html`<div key=${t.id} className="workspace-card"><div className="workspace-card-title">${t.title}</div></div>`)}</div></div></section>
    </${Shell}>`;
  }
  renderPage(html`<${App} />`);
}

export function initCTFPage() {
  function App() {
    const { user, setUser, ready } = usePortalAuth();
    const [events, setEvents] = useState([]);
    useEffect(()=>{ if(ready&&user) authFetch('/api/ctf/events',{},setUser).then((r)=>r.ok?r.json():[]).then(setEvents); },[ready,user]);
    return html`<${Shell} title="CTF Tracker" kicker="DEADCATS CTF" user=${user} nav=${[{href:appPath('dashboard.html'),label:'Dashboard'}]}>
      <section className="workspace-section-grid">${events.map((ev)=>html`<div key=${ev.id} className="portal-panel workspace-panel"><div className="workspace-panel-title">${ev.title}</div><div className="workspace-card-copy">${ev.description||''}</div><div className="workspace-card-meta"><span className="portal-chip">${ev.status}</span><span className="portal-chip">${ev.format||'mixed'}</span></div></div>`)}</section>
    </${Shell}>`;
  }
  renderPage(html`<${App} />`);
}

export function initAdminPage() {
  function App() {
    const { user, setUser, ready } = usePortalAuth();
    const [users, setUsers] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    useEffect(()=>{ if(ready&&user) Promise.all([authFetch('/api/users/',{},setUser),authFetch('/api/announcements/',{},setUser)]).then(async([a,b])=>{setUsers(a.ok?await a.json():[]); setAnnouncements(b.ok?await b.json():[]);}); },[ready,user]);
    return html`<${Shell} title="Admin" kicker="DEADCATS Admin" user=${user} nav=${[{href:appPath('dashboard.html'),label:'Dashboard'},{href:appPath('monitor.html'),label:'Monitor'}]}>
      <section className="workspace-section-grid"><div className="portal-panel workspace-panel"><div className="workspace-panel-title">Members</div><div className="workspace-card-list">${users.map((u)=>html`<div key=${u.id} className="workspace-card"><div className="workspace-card-title">${u.handle}</div><div className="workspace-card-meta"><span className="portal-chip">${u.rank}</span><span className="portal-chip">${u.is_admin?'admin':'member'}</span></div></div>`)}</div></div><div className="portal-panel workspace-panel"><div className="workspace-panel-title">Announcements</div><div className="workspace-card-list">${announcements.map((a)=>html`<div key=${a.id} className="workspace-card"><div className="workspace-card-title">${a.title}</div><div className="workspace-card-copy">${a.content||''}</div></div>`)}</div></div></section>
    </${Shell}>`;
  }
  renderPage(html`<${App} />`);
}
