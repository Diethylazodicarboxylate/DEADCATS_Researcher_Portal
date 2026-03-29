import React, { useEffect, useMemo, useRef, useState } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import htm from 'https://esm.sh/htm@3.1.1';

const html = htm.bind(React.createElement);
const API = '';
const NOTIF_SEEN_KEY = 'dc_dashboard_seen_notifications_v1';
const RANK_COLORS = {
  DEADCAT: '#6b7280',
  Scholar: '#ff7b54',
  'Lead Researcher': '#ff4d6d',
  'Founding Circle': '#ffb36b',
};

function esc(value) {
  return String(value ?? '');
}

function appPath(path = '') {
  const clean = String(path || '').replace(/^\/+/, '');
  return `/${clean}`;
}

function readSeenNotifications() {
  try {
    const raw = localStorage.getItem(NOTIF_SEEN_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    localStorage.removeItem(NOTIF_SEEN_KEY);
    return [];
  }
}

function writeSeenNotifications(ids) {
  try {
    localStorage.setItem(NOTIF_SEEN_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch (_) {}
}

function readCachedUser() {
  try {
    const raw = localStorage.getItem('dc_user');
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    localStorage.removeItem('dc_user');
    return null;
  }
}

async function fetchMeWithRetry() {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch(`${API}/api/auth/me`, { credentials: 'include', cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (_) {}
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  return null;
}

function timeAgo(value) {
  if (!value) return 'never';
  const seconds = (Date.now() - new Date(value).getTime()) / 1000;
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function timeUntil(value) {
  if (!value) return 'no expiry';
  const seconds = (new Date(value).getTime() - Date.now()) / 1000;
  if (seconds <= 0) return 'expired';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m left`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h left`;
  return `${Math.floor(seconds / 86400)}d left`;
}

function isOnline(value) {
  if (!value) return 'offline';
  const seconds = (Date.now() - new Date(value).getTime()) / 1000;
  if (seconds < 300) return 'online';
  if (seconds < 3600) return 'away';
  return 'offline';
}

function formatClock(now) {
  const date = now || new Date();
  let nepal = '';
  try {
    nepal = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kathmandu',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  } catch (_) {
    const np = new Date(date.getTime() + ((5 * 60 + 45) * 60 * 1000));
    nepal = np.toISOString().slice(11, 19);
  }
  return `${nepal} NPT`;
}

function initialsFromHandle(handle) {
  const clean = String(handle || 'dc').replace(/[^a-z0-9]/gi, '');
  return clean.slice(0, 2).toUpperCase() || 'DC';
}

function statusLabel(status) {
  return String(status || 'active').replace(/_/g, ' ');
}

function priorityLabel(priority) {
  return String(priority || 'medium').replace(/_/g, ' ');
}

function truncate(value, limit = 180) {
  const text = String(value || '');
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}...`;
}

function hrefForActivity(item) {
  if (item.kind === 'note') return appPath(`library.html?note_id=${encodeURIComponent(item.id)}`);
  if (item.kind === 'ioc') return item.meta?.operation_id ? appPath(`ioc-tracker.html?operation_id=${encodeURIComponent(item.meta.operation_id)}`) : appPath('ioc-tracker.html');
  if (item.kind === 'vault_file') return item.meta?.operation_id ? appPath(`operations.html?id=${encodeURIComponent(item.meta.operation_id)}`) : appPath('vault.html');
  if (item.kind === 'goal') return item.meta?.operation_id ? appPath(`whiteboard.html?operation_id=${encodeURIComponent(item.meta.operation_id)}`) : appPath('whiteboard.html');
  if (item.kind === 'ctf_event') return item.meta?.operation_id ? appPath(`ctf.html?operation_id=${encodeURIComponent(item.meta.operation_id)}`) : appPath('ctf.html');
  return appPath('dashboard.html');
}

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

function useAuth() {
  const [user, setUser] = useState(readCachedUser());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const liveUser = await fetchMeWithRetry();
      if (!active) return;
      if (liveUser) {
        localStorage.setItem('dc_user', JSON.stringify(liveUser));
        setUser(liveUser);
        setReady(true);
        return;
      }
      if (!readCachedUser()) {
        localStorage.removeItem('dc_token');
        localStorage.removeItem('dc_user');
        window.location.replace(appPath('login.html'));
        return;
      }
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { user, setUser, ready };
}

function App() {
  const { user, setUser, ready } = useAuth();
  const now = useClock();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    stats: null,
    members: [],
    operations: [],
    notes: [],
    announcements: [],
    activity: [],
    reviewQueue: null,
    notifications: [],
  });
  const [announcementMode, setAnnouncementMode] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', expires: '2' });
  const [operationModal, setOperationModal] = useState({ open: false, editingId: null });
  const [operationForm, setOperationForm] = useState({
    name: '',
    lead_handle: '',
    status: 'active',
    priority: 'medium',
    summary: '',
  });
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const [seenNotificationIds, setSeenNotificationIds] = useState(readSeenNotifications());

  async function authFetch(url, opts = {}) {
    let response = await fetch(`${API}${url}`, {
      ...opts,
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    });
    if (response.status === 401) {
      const refreshed = await fetchMeWithRetry();
      if (refreshed) {
        setUser(refreshed);
        localStorage.setItem('dc_user', JSON.stringify(refreshed));
        response = await fetch(`${API}${url}`, {
          ...opts,
          credentials: 'include',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
        });
      }
      if (response.status === 401) {
        localStorage.removeItem('dc_token');
        localStorage.removeItem('dc_user');
        window.location.replace(appPath('login.html'));
      }
    }
    return response;
  }

  async function loadDashboard({ silent = false } = {}) {
    if (!user) return;
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const requests = await Promise.all([
        authFetch('/api/stats'),
        authFetch('/api/users/'),
        authFetch('/api/operations/'),
        authFetch('/api/notes/'),
        authFetch('/api/announcements/'),
        authFetch('/api/operations/activity'),
        user.is_admin ? authFetch('/api/notes/review-queue') : Promise.resolve(null),
        authFetch('/api/notifications/').catch(() => null),
      ]);

      const [
        statsRes,
        membersRes,
        operationsRes,
        notesRes,
        announcementsRes,
        activityRes,
        reviewQueueRes,
        notificationsRes,
      ] = requests;

      const next = {
        stats: statsRes?.ok ? await statsRes.json() : null,
        members: membersRes?.ok ? await membersRes.json() : [],
        operations: operationsRes?.ok ? await operationsRes.json() : [],
        notes: notesRes?.ok ? await notesRes.json() : [],
        announcements: announcementsRes?.ok ? await announcementsRes.json() : [],
        activity: activityRes?.ok ? await activityRes.json() : [],
        reviewQueue: reviewQueueRes && reviewQueueRes.ok ? await reviewQueueRes.json() : null,
        notifications: notificationsRes?.ok ? await notificationsRes.json() : [],
      };
      setData(next);
    } catch (error) {
      console.error('Dashboard load failed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!ready || !user) return;
    loadDashboard();
  }, [ready, user]);

  useEffect(() => {
    if (!notifOpen) return undefined;
    function onPointerDown(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [notifOpen]);

  const announcements = useMemo(
    () => data.announcements.filter((item) => item.type === 'notice'),
    [data.announcements],
  );

  const operations = useMemo(() => {
    const statusScore = { active: 0, planning: 1, on_hold: 2, closed: 3, archived: 4 };
    const priorityScore = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...data.operations].sort((a, b) =>
      (statusScore[a.status] ?? 9) - (statusScore[b.status] ?? 9)
      || (priorityScore[a.priority] ?? 9) - (priorityScore[b.priority] ?? 9)
      || new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0),
    );
  }, [data.operations]);

  const recentNotes = useMemo(
    () => [...data.notes].sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0)).slice(0, 6),
    [data.notes],
  );

  const members = useMemo(
    () => [...data.members].sort((a, b) => new Date(b.last_seen || 0) - new Date(a.last_seen || 0)),
    [data.members],
  );

  const onlineCount = members.filter((member) => isOnline(member.last_seen) === 'online').length;
  const activeCount = operations.filter((item) => item.status === 'active').length;
  const pendingReviewCount = (data.reviewQueue?.in_review || []).length;
  const publishedNotesCount = data.notes.filter((note) => note.published).length;
  const notificationsUnread = data.notifications.filter((item) => !seenNotificationIds.includes(item.id)).length;

  function navItems() {
    const base = [
      { href: appPath('dashboard.html'), label: 'Dashboard', active: true },
      { href: appPath('library.html'), label: 'Research Library', badge: data.notes.length || null },
      { href: appPath('operations.html'), label: 'Operations', badge: data.operations.length || null },
      { href: appPath('ioc-tracker.html'), label: 'IOC Tracker' },
      { href: appPath('vault.html'), label: 'File Vault' },
      { href: appPath('whiteboard.html'), label: 'War Room' },
    ];
    const team = [
      { href: appPath('members.html'), label: 'Members', badge: data.members.length || null },
      { href: appPath('ctf.html'), label: 'CTF Tracker' },
      { href: appPath('ai-chat.html'), label: 'CATGPT' },
      { href: appPath('pwnbox.html'), label: 'PwnBox' },
    ];
    const admin = user?.is_admin ? [
      { href: appPath('review-board.html'), label: 'Review Board', badge: pendingReviewCount || null },
      { href: appPath('admin.html'), label: 'Admin Panel' },
      { href: appPath('monitor.html'), label: 'Monitor' },
    ] : [];
    return { base, team, admin };
  }

  function openAnnouncementModal(type) {
    setAnnouncementMode(type);
    setAnnouncementForm({ title: '', content: '', expires: '2' });
  }

  function closeAnnouncementModal() {
    setAnnouncementMode(null);
  }

  async function submitAnnouncement() {
    const payload = {
      title: announcementForm.title.trim(),
      content: announcementForm.content.trim(),
      type: announcementMode,
      expires_in: Number(announcementForm.expires || 2),
    };
    if (!payload.title) {
      alert('Title required.');
      return;
    }
    const res = await authFetch('/api/announcements/', { method: 'POST', body: JSON.stringify(payload) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.detail || 'Failed to post announcement.');
      return;
    }
    closeAnnouncementModal();
    await loadDashboard({ silent: true });
  }

  async function deleteAnnouncement(id) {
    if (!window.confirm('Delete this announcement?')) return;
    const res = await authFetch(`/api/announcements/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.detail || 'Failed to delete announcement.');
      return;
    }
    await loadDashboard({ silent: true });
  }

  function openOperationModal(operation = null) {
    setOperationModal({ open: true, editingId: operation ? operation.id : null });
    setOperationForm({
      name: operation?.name || '',
      lead_handle: operation?.lead_handle || user?.handle || '',
      status: operation?.status || 'active',
      priority: operation?.priority || 'medium',
      summary: operation?.summary || '',
    });
  }

  function closeOperationModal() {
    setOperationModal({ open: false, editingId: null });
  }

  async function submitOperation() {
    const payload = {
      name: operationForm.name.trim(),
      lead_handle: operationForm.lead_handle.trim() || user?.handle,
      status: operationForm.status,
      priority: operationForm.priority,
      summary: operationForm.summary.trim(),
    };
    if (!payload.name) {
      alert('Operation name required.');
      return;
    }
    const url = operationModal.editingId ? `/api/operations/${operationModal.editingId}` : '/api/operations/';
    const method = operationModal.editingId ? 'PATCH' : 'POST';
    const res = await authFetch(url, { method, body: JSON.stringify(payload) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.detail || 'Failed to save operation.');
      return;
    }
    closeOperationModal();
    await loadDashboard({ silent: true });
  }

  async function deleteOperation(id) {
    if (!window.confirm('Delete this operation? Attached notes will remain but lose the operation link.')) return;
    const res = await authFetch(`/api/operations/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.detail || 'Failed to delete operation.');
      return;
    }
    await loadDashboard({ silent: true });
  }

  function markNotificationRead(id) {
    const next = Array.from(new Set([...seenNotificationIds, id]));
    setSeenNotificationIds(next);
    writeSeenNotifications(next);
  }

  function logout(event) {
    if (event) event.preventDefault();
    fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include', keepalive: true })
      .finally(() => {
        localStorage.removeItem('dc_token');
        localStorage.removeItem('dc_user');
        window.location.replace(appPath('login.html'));
      });
  }

  if (!ready || loading) {
    return html`
      <div className="dash-loading">
        <div className="dash-loading-card">
          <div className="dash-kicker">Research Console</div>
          <div className="dash-title">Loading dashboard state</div>
          <div className="dash-modal-copy">Pulling notes, operations, team status, and activity from the DEADCATS portal.</div>
          <div className="dash-loading-bar"><span></span></div>
        </div>
      </div>
    `;
  }

  const nav = navItems();

  return html`
    <div className="dash-shell">
      <header className="dash-topbar">
        <div className="dash-brand">
          <div className="dash-mark"></div>
          <div className="dash-brand-copy">
            <div className="dash-kicker">DEADCATS Research Console</div>
            <div className="dash-title">Operations dashboard</div>
          </div>
        </div>
        <div className="dash-top-actions">
          <div className="dash-status-pill">Node DC-RESEARCH-01 · ${formatClock(now)}</div>
          <div style=${{ position: 'relative' }} ref=${notifRef}>
            <button className="dash-button ghost" onClick=${() => setNotifOpen((value) => !value)}>
              Notifications${notificationsUnread ? ` · ${notificationsUnread}` : ''}
            </button>
            ${notifOpen ? html`
              <div className="dash-modal" style=${{ position: 'absolute', right: 0, top: 'calc(100% + 12px)', width: 'min(420px, calc(100vw - 32px))', padding: '18px' }}>
                <div className="dash-eyebrow">Notification Stream</div>
                <div className="dash-list">
                  ${data.notifications.length ? data.notifications.slice(0, 8).map((item) => html`
                    <a
                      key=${item.id}
                      className="dash-card-row dash-card-link"
                        href=${item.href || '#'}
                        onClick=${async (event) => {
                          if (!item.href) event.preventDefault();
                          markNotificationRead(item.id);
                          setNotifOpen(false);
                        }}
                    >
                      <div className="dash-card-title">${item.title}</div>
                      <div className="dash-card-copy">${truncate(item.summary || '', 120) || 'No summary provided.'}</div>
                      <div className="dash-card-meta">
                        <span className="dash-chip">${item.type || 'notice'}</span>
                        <span className="dash-chip">${item.author || 'system'}</span>
                        <span className="dash-chip ${seenNotificationIds.includes(item.id) ? '' : 'hot'}">${seenNotificationIds.includes(item.id) ? 'read' : 'new'}</span>
                      </div>
                    </a>
                  `) : html`<div className="dash-empty">No notifications</div>`}
                </div>
              </div>
            ` : null}
          </div>
          <a className="dash-profile dash-muted-link" href=${appPath(`members/profile.html?user=${encodeURIComponent(user?.handle || '')}`)}>
            <div className="dash-avatar">${initialsFromHandle(user?.handle)}</div>
            <div className="dash-profile-copy">
              <div className="dash-handle">${user?.handle || 'unknown'}</div>
              <div className="dash-rank" style=${{ color: RANK_COLORS[user?.rank] || '#8b7379' }}>${user?.rank || 'member'}</div>
            </div>
          </a>
        </div>
      </header>

      <div className="dash-layout">
        <aside className="dash-sidebar">
          <div className="dash-nav-group">
            <div className="dash-eyebrow">Workspace</div>
            ${nav.base.map((item) => html`
              <a key=${item.href} className=${`dash-nav-link ${item.active ? 'active' : ''}`} href=${item.href}>
                <span>${item.label}</span>
                ${item.badge ? html`<span className="dash-nav-badge">${item.badge}</span>` : null}
              </a>
            `)}
          </div>
          <div className="dash-nav-group">
            <div className="dash-eyebrow">Team</div>
            ${nav.team.map((item) => html`
              <a key=${item.href} className="dash-nav-link" href=${item.href}>
                <span>${item.label}</span>
                ${item.badge ? html`<span className="dash-nav-badge">${item.badge}</span>` : null}
              </a>
            `)}
          </div>
          ${nav.admin.length ? html`
            <div className="dash-nav-group">
              <div className="dash-eyebrow">Admin</div>
              ${nav.admin.map((item) => html`
                <a key=${item.href} className="dash-nav-link" href=${item.href}>
                  <span>${item.label}</span>
                  ${item.badge ? html`<span className="dash-nav-badge">${item.badge}</span>` : null}
                </a>
              `)}
            </div>
          ` : null}
          <div className="dash-nav-group dash-sidebar-footer">
            <button className="dash-button ghost" style=${{ width: '100%' }} onClick=${logout}>Logout</button>
          </div>
        </aside>

        <main className="dash-main">
          <section className="dash-hero">
            <div className="dash-hero-grid">
              <div>
                <div className="dash-kicker">Daily Research Brief</div>
                <h1 className="dash-hero-title">Track investigations, surface weak signals, and keep the team aligned.</h1>
                <div className="dash-hero-copy">
                  This dashboard is rebuilt as a tighter research console: operational load at the top, active intelligence in the middle, and team state on the right. The theme stays dark and aggressive, but the hierarchy is cleaner and the controls are finally usable.
                </div>
                <div className="dash-meta-line">Last refresh ${timeAgo(now.toISOString())} · ${refreshing ? 'syncing live data' : 'data stable'}</div>
                <div className="dash-hero-actions">
                  <a className="dash-button primary dash-muted-link" href=${appPath('library.html')}>Open research library</a>
                  <a className="dash-button ghost dash-muted-link" href=${appPath('operations.html')}>Open operations board</a>
                  <button className="dash-button warning" onClick=${() => loadDashboard({ silent: true })}>Refresh snapshot</button>
                  <button className="dash-button ghost" onClick=${() => openOperationModal()}>Create operation</button>
                </div>
              </div>
              <div className="dash-pulse-box">
                <div className="dash-eyebrow">Research pulse</div>
                <div className="dash-pulse-grid">
                  <div className="dash-pulse-item">
                    <div className="dash-pulse-label">Pending review</div>
                    <div className="dash-pulse-value">${pendingReviewCount}</div>
                  </div>
                  <div className="dash-pulse-item">
                    <div className="dash-pulse-label">Published notes</div>
                    <div className="dash-pulse-value">${publishedNotesCount}</div>
                  </div>
                  <div className="dash-pulse-item">
                    <div className="dash-pulse-label">Active operations</div>
                    <div className="dash-pulse-value">${activeCount}</div>
                  </div>
                  <div className="dash-pulse-item">
                    <div className="dash-pulse-label">Members online</div>
                    <div className="dash-pulse-value">${onlineCount}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="dash-stat-grid">
              <div className="dash-stat-card" style=${{ '--card-glow': 'rgba(255,77,109,0.28)' }}>
                <div className="dash-kicker">Research Notes</div>
                <div className="dash-stat-value">${data.stats?.total_notes ?? data.notes.length}</div>
                <div className="dash-stat-sub">Internal knowledge objects preserved in the shared library.</div>
              </div>
              <div className="dash-stat-card" style=${{ '--card-glow': 'rgba(255,123,84,0.24)' }}>
                <div className="dash-kicker">Tracked IOCs</div>
                <div className="dash-stat-value">${data.stats?.total_iocs ?? 0}</div>
                <div className="dash-stat-sub">Indicators gathered across ongoing operations and published cases.</div>
              </div>
              <div className="dash-stat-card" style=${{ '--card-glow': 'rgba(255,179,107,0.24)' }}>
                <div className="dash-kicker">Team Members</div>
                <div className="dash-stat-value">${data.members.length}</div>
                <div className="dash-stat-sub">Registered researchers with tracked presence and profile access.</div>
              </div>
              <div className="dash-stat-card" style=${{ '--card-glow': 'rgba(114,224,167,0.22)' }}>
                <div className="dash-kicker">Unread Alerts</div>
                <div className="dash-stat-value">${notificationsUnread}</div>
                <div className="dash-stat-sub">Notification events waiting for review or action.</div>
              </div>
            </div>
          </section>

          <div className="dash-content-grid">
            <div className="dash-stack">
              <section className="dash-panel">
                <div className="dash-panel-head">
                  <div>
                    <div className="dash-panel-title">Signal board</div>
                    <div className="dash-panel-subtitle">Announcements and operator notices pulled to the top without the old visual noise.</div>
                  </div>
                  <div className="dash-panel-actions">
                    ${user?.is_admin ? html`<button className="dash-button primary" onClick=${() => openAnnouncementModal('notice')}>Post notice</button>` : null}
                  </div>
                </div>
                <div className="dash-panel-body">
                  <div className="dash-list">
                    ${announcements.length ? announcements.slice(0, 5).map((item) => html`
                      <div key=${item.id} className="dash-card-row">
                        <div className="dash-card-top">
                          <div className="dash-card-title">${item.title}</div>
                          <span className="dash-chip warn">${timeUntil(item.expires_at)}</span>
                        </div>
                        <div className="dash-card-copy">${truncate(item.content || 'No details attached.', 220)}</div>
                        <div className="dash-card-meta">
                          <span className="dash-chip">${item.author || 'unknown'}</span>
                          <span className="dash-chip">${timeAgo(item.created_at)}</span>
                        </div>
                        ${user?.is_admin ? html`
                          <div className="dash-card-actions">
                            <button className="dash-inline-action delete" onClick=${() => deleteAnnouncement(item.id)}>Delete</button>
                          </div>
                        ` : null}
                      </div>
                    `) : html`<div className="dash-empty">No notices posted</div>`}
                  </div>
                </div>
              </section>

              <section className="dash-panel">
                <div className="dash-panel-head">
                  <div>
                    <div className="dash-panel-title">Operations pressure map</div>
                    <div className="dash-panel-subtitle">Priority-ordered operations with live note, file, IOC, and publication counts.</div>
                  </div>
                  <div className="dash-panel-actions">
                    <a className="dash-inline-action" href=${appPath('operations.html')}>Open board</a>
                    <button className="dash-button ghost" onClick=${() => openOperationModal()}>New operation</button>
                  </div>
                </div>
                <div className="dash-panel-body">
                  <div className="dash-list">
                    ${operations.length ? operations.slice(0, 6).map((operation) => {
                      const canEdit = user?.is_admin || operation.created_by === user?.id;
                      return html`
                        <div key=${operation.id} className="dash-card-row">
                          <a className="dash-card-link" href=${appPath(`operations.html?id=${encodeURIComponent(operation.id)}`)}>
                            <div className="dash-card-top">
                              <div className="dash-card-title">${operation.name}</div>
                              <span className=${`dash-chip ${operation.priority === 'critical' || operation.priority === 'high' ? 'hot' : ''}`}>${priorityLabel(operation.priority)}</span>
                            </div>
                            <div className="dash-card-copy">${truncate(operation.summary || 'No summary yet.', 190)}</div>
                            <div className="dash-card-meta">
                              <span className="dash-chip">${statusLabel(operation.status)}</span>
                              <span className="dash-chip">${operation.lead_handle || 'unassigned'}</span>
                              <span className="dash-chip">${operation.note_count || 0} notes</span>
                              <span className="dash-chip">${operation.ioc_count || 0} iocs</span>
                              <span className="dash-chip">${operation.file_count || 0} files</span>
                              <span className="dash-chip">${operation.goal_count || 0} goals</span>
                              <span className="dash-chip">${operation.published_count || 0} public</span>
                            </div>
                          </a>
                          ${canEdit ? html`
                            <div className="dash-card-actions">
                              <button className="dash-inline-action" onClick=${() => openOperationModal(operation)}>Edit</button>
                              <button className="dash-inline-action delete" onClick=${() => deleteOperation(operation.id)}>Delete</button>
                            </div>
                          ` : null}
                        </div>
                      `;
                    }) : html`<div className="dash-empty">No operations yet</div>`}
                  </div>
                </div>
              </section>

              <section className="dash-panel">
                <div className="dash-panel-head">
                  <div>
                    <div className="dash-panel-title">Research stream</div>
                    <div className="dash-panel-subtitle">Latest notes with cleaner metadata and direct links into the library.</div>
                  </div>
                  <div className="dash-panel-actions">
                    <a className="dash-inline-action" href=${appPath('library.html')}>View all notes</a>
                  </div>
                </div>
                <div className="dash-panel-body">
                  <div className="dash-list">
                    ${recentNotes.length ? recentNotes.map((note) => html`
                      <a key=${note.id} className="dash-card-row dash-card-link" href=${appPath(`library.html?note_id=${encodeURIComponent(note.id)}`)}>
                        <div className="dash-card-top">
                          <div className="dash-card-title">${note.title}</div>
                          <span className=${`dash-chip ${note.published ? 'good' : note.review_status === 'in_review' ? 'warn' : ''}`}>${note.published ? 'published' : (note.review_status || 'draft')}</span>
                        </div>
                        <div className="dash-card-copy">${truncate(note.content || 'No preview', 200)}</div>
                        <div className="dash-card-meta">
                          <span className="dash-chip">${note.author_handle || 'unknown'}</span>
                          <span className="dash-chip">${timeAgo(note.updated_at || note.created_at)}</span>
                          ${note.operation_name ? html`<span className="dash-chip">${note.operation_name}</span>` : null}
                          ${Array.isArray(note.tags) ? note.tags.filter(Boolean).slice(0, 3).map((tag) => html`<span key=${tag} className="dash-chip">${tag}</span>`) : null}
                        </div>
                      </a>
                    `) : html`<div className="dash-empty">No notes yet</div>`}
                  </div>
                </div>
              </section>
            </div>

            <div className="dash-stack">
              <section className="dash-panel">
                <div className="dash-panel-head">
                  <div>
                    <div className="dash-panel-title">Activity timeline</div>
                    <div className="dash-panel-subtitle">Cross-workspace changes in a proper event stream instead of a generic card list.</div>
                  </div>
                </div>
                <div className="dash-panel-body">
                  <div className="dash-timeline">
                    ${data.activity.length ? data.activity.slice(0, 10).map((item) => html`
                      <div key=${`${item.kind}-${item.id}-${item.created_at}`} className="dash-timeline-item">
                        <div className="dash-timeline-dot"></div>
                        <a className="dash-card-row dash-card-link" href=${hrefForActivity(item)}>
                          <div className="dash-card-title">${item.title || 'Untitled activity'}</div>
                          <div className="dash-card-copy">${item.operation_name || 'Research event'} · ${item.author || 'unknown'} · ${timeAgo(item.created_at)}</div>
                          <div className="dash-card-meta">
                            <span className="dash-chip">${item.kind?.replace('_', ' ') || 'event'}</span>
                          </div>
                        </a>
                      </div>
                    `) : html`<div className="dash-empty">No recent activity</div>`}
                  </div>
                </div>
              </section>

              ${user?.is_admin ? html`
                <section className="dash-panel">
                  <div className="dash-panel-head">
                    <div>
                      <div className="dash-panel-title">Review queue</div>
                      <div className="dash-panel-subtitle">Admin-facing approvals surfaced directly in the dashboard.</div>
                    </div>
                    <div className="dash-panel-actions">
                      <a className="dash-inline-action" href=${appPath('review-board.html')}>Open queue</a>
                    </div>
                  </div>
                  <div className="dash-panel-body">
                    <div className="dash-list">
                      ${pendingReviewCount || (data.reviewQueue?.approved || []).length ? [...(data.reviewQueue?.in_review || []).slice(0, 4), ...(data.reviewQueue?.approved || []).slice(0, 2)].map((item) => html`
                        <a key=${item.id} className="dash-card-row dash-card-link" href=${appPath(`library.html?note_id=${encodeURIComponent(item.id)}`)}>
                          <div className="dash-card-top">
                            <div className="dash-card-title">${item.title}</div>
                            <span className=${`dash-chip ${item.review_status === 'approved' ? 'good' : 'warn'}`}>${item.review_status}</span>
                          </div>
                          <div className="dash-card-copy">${item.operation_name || 'No linked operation'} · ${item.author_handle || 'unknown'}</div>
                          <div className="dash-card-meta">
                            <span className="dash-chip">${timeAgo(item.updated_at || item.created_at)}</span>
                          </div>
                        </a>
                      `) : html`<div className="dash-empty">No items waiting</div>`}
                    </div>
                  </div>
                </section>
              ` : null}

              <section className="dash-panel">
                <div className="dash-panel-head">
                  <div>
                    <div className="dash-panel-title">Team presence</div>
                    <div className="dash-panel-subtitle">Presence state without decorative emoji, using initials and status indicators instead.</div>
                  </div>
                  <div className="dash-panel-actions">
                    <a className="dash-inline-action" href=${appPath('members.html')}>Open members</a>
                  </div>
                </div>
                <div className="dash-panel-body">
                  ${members.length ? members.slice(0, 10).map((member) => {
                    const status = isOnline(member.last_seen);
                    return html`
                      <div key=${member.id} className="dash-member-row">
                        <div className="dash-member-avatar">
                          <div className="dash-avatar">${initialsFromHandle(member.handle)}</div>
                          <div className=${`dash-member-status ${status}`}></div>
                        </div>
                        <div className="dash-member-copy">
                          <div className="dash-member-handle"><a className="dash-muted-link" href=${appPath(`members/profile.html?user=${encodeURIComponent(member.handle)}`)}>${member.handle}</a></div>
                          <div className="dash-member-rank" style=${{ color: RANK_COLORS[member.rank] || '#8b7379' }}>${member.rank || 'member'} · ${status}</div>
                        </div>
                        <div className="dash-member-last">${timeAgo(member.last_seen)}</div>
                      </div>
                    `;
                  }) : html`<div className="dash-empty">No members found</div>`}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      ${announcementMode ? html`
        <div className="dash-modal-backdrop" onClick=${closeAnnouncementModal}>
          <div className="dash-modal" onClick=${(event) => event.stopPropagation()}>
            <div className="dash-kicker">Broadcast</div>
            <div className="dash-modal-title">Post dashboard notice</div>
            <div className="dash-modal-copy">Push a short research notice into the signal board. Keep it operational, brief, and time-bounded.</div>
            <div className="dash-form">
              <div>
                <label className="dash-label">Title</label>
                <input className="dash-input" value=${announcementForm.title} onInput=${(event) => setAnnouncementForm((form) => ({ ...form, title: event.target.value }))} />
              </div>
              <div>
                <label className="dash-label">Content</label>
                <textarea className="dash-textarea" value=${announcementForm.content} onInput=${(event) => setAnnouncementForm((form) => ({ ...form, content: event.target.value }))}></textarea>
              </div>
              <div>
                <label className="dash-label">Expires in</label>
                <select className="dash-select" value=${announcementForm.expires} onChange=${(event) => setAnnouncementForm((form) => ({ ...form, expires: event.target.value }))}>
                  <option value="1">1 day</option>
                  <option value="2">2 days</option>
                  <option value="3">3 days</option>
                </select>
              </div>
              <div className="dash-modal-actions">
                <button className="dash-button ghost" onClick=${closeAnnouncementModal}>Cancel</button>
                <button className="dash-button primary" onClick=${submitAnnouncement}>Post notice</button>
              </div>
            </div>
          </div>
        </div>
      ` : null}

      ${operationModal.open ? html`
        <div className="dash-modal-backdrop" onClick=${closeOperationModal}>
          <div className="dash-modal" onClick=${(event) => event.stopPropagation()}>
            <div className="dash-kicker">Operations</div>
            <div className="dash-modal-title">${operationModal.editingId ? 'Edit operation' : 'Create operation'}</div>
            <div className="dash-modal-copy">Define the investigation frame, set the lead, then keep notes and evidence attached to a real operation.</div>
            <div className="dash-form">
              <div>
                <label className="dash-label">Operation name</label>
                <input className="dash-input" value=${operationForm.name} onInput=${(event) => setOperationForm((form) => ({ ...form, name: event.target.value }))} />
              </div>
              <div className="dash-form-grid">
                <div>
                  <label className="dash-label">Lead handle</label>
                  <input className="dash-input" value=${operationForm.lead_handle} onInput=${(event) => setOperationForm((form) => ({ ...form, lead_handle: event.target.value }))} />
                </div>
                <div>
                  <label className="dash-label">Status</label>
                  <select className="dash-select" value=${operationForm.status} onChange=${(event) => setOperationForm((form) => ({ ...form, status: event.target.value }))}>
                    <option value="active">Active</option>
                    <option value="planning">Planning</option>
                    <option value="on_hold">On Hold</option>
                    <option value="closed">Closed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="dash-form-grid">
                <div>
                  <label className="dash-label">Priority</label>
                  <select className="dash-select" value=${operationForm.priority} onChange=${(event) => setOperationForm((form) => ({ ...form, priority: event.target.value }))}>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="dash-label">Summary</label>
                <textarea className="dash-textarea" value=${operationForm.summary} onInput=${(event) => setOperationForm((form) => ({ ...form, summary: event.target.value }))}></textarea>
              </div>
              <div className="dash-modal-actions">
                <button className="dash-button ghost" onClick=${closeOperationModal}>Cancel</button>
                <button className="dash-button primary" onClick=${submitOperation}>${operationModal.editingId ? 'Save changes' : 'Create operation'}</button>
              </div>
            </div>
          </div>
        </div>
      ` : null}
    </div>
  `;
}

createRoot(document.getElementById('app-root')).render(html`<${App} />`);
