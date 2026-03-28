const API = '';

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
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
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const meRes = await fetch(`${API}/api/auth/me`, { credentials: 'include', cache: 'no-store' });
      if (meRes.ok) return await meRes.json();
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 120));
  }
  return null;
}

async function initDashboard() {
  let user = readCachedUser();
  let operations = [];
  let editingOperationId = null;
  const liveUser = await fetchMeWithRetry();
  if (liveUser) {
    user = liveUser;
    localStorage.setItem('dc_user', JSON.stringify(user));
  } else if (!user) {
    localStorage.removeItem('dc_token');
    localStorage.removeItem('dc_user');
    window.location.href = 'login.html';
    return;
  }

  const RANK_COLORS = {
    DEADCAT: '#445060', Scholar: '#00d4ff', 'Lead Researcher': '#00d4ff',
    'Founding Circle': '#f0a500',
  };

  async function authFetch(url, opts = {}) {
    let res = await fetch(`${API}${url}`, {
      ...opts,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      cache: 'no-store',
    });
    if (res.status === 401) {
      const refreshed = await fetchMeWithRetry();
      if (refreshed) {
        user = refreshed;
        localStorage.setItem('dc_user', JSON.stringify(user));
        res = await fetch(`${API}${url}`, {
          ...opts,
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
          cache: 'no-store',
        });
      }
      if (res.status === 401) {
        localStorage.removeItem('dc_token');
        localStorage.removeItem('dc_user');
        window.location.href = 'login.html';
      }
    }
    return res;
  }

  function timeAgo(dateStr) {
    if (!dateStr) return 'never';
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function timeUntil(dateStr) {
    if (!dateStr) return '';
    const diff = (new Date(dateStr) - Date.now()) / 1000;
    if (diff <= 0) return 'expired';
    if (diff < 3600)  return `expires in ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `expires in ${Math.floor(diff / 3600)}h`;
    return `expires in ${Math.floor(diff / 86400)}d`;
  }

  function isOnline(dateStr) {
    if (!dateStr) return 'offline';
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 300) return 'online';
    if (diff < 3600) return 'away';
    return 'offline';
  }

  function populateNav() {
    const ava = document.getElementById('nav-ava');
    const handleEl = document.getElementById('nav-handle');
    const rankEl = document.getElementById('nav-rank');
    const profileLink = document.getElementById('nav-profile-link');
    if (profileLink) {
      const myProfileUrl = `members/profile.html?user=${encodeURIComponent(user.handle)}`;
      profileLink.href = myProfileUrl;
      if (!profileLink.dataset.navBound) {
        profileLink.dataset.navBound = '1';
        profileLink.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.assign(myProfileUrl);
        });
      }
    }
    if (!ava || !handleEl || !rankEl || !profileLink) return;
    ava.textContent = user.emoji || '🐱';
    handleEl.textContent = user.handle;
    rankEl.textContent = String(user.rank || '').toUpperCase();
    rankEl.style.color = RANK_COLORS[user.rank] || '#445060';
    profileLink.href = `members/profile.html?user=${encodeURIComponent(user.handle)}`;
  }

  async function loadMembers() {
    try {
      const res = await authFetch('/api/users/');
      if (!res.ok) return;
      const members = await res.json();
      const list = document.getElementById('members-list');
      if (!list) return;

      const onlineCount = members.filter((m) => isOnline(m.last_seen) === 'online').length;
      const statOnline = document.getElementById('stat-online');
      if (statOnline) statOnline.textContent = String(onlineCount);

      const statMembers = document.getElementById('stat-members');
      if (statMembers) statMembers.textContent = members.length;

      list.innerHTML = members.map((m) => {
        const status = isOnline(m.last_seen);
        const color  = RANK_COLORS[m.rank] || '#445060';
        return `<div class="member-row">
          <div class="m-ava">${esc(m.emoji)}<div class="m-status ${status}"></div></div>
          <div class="m-info">
            <div class="m-handle"><a href="members/profile.html?user=${encodeURIComponent(m.handle)}" style="color:inherit;text-decoration:none;">${esc(m.handle)}</a></div>
            <div class="m-rank" style="color:${esc(color)};">${esc(String(m.rank || '').toUpperCase())}</div>
          </div>
          <span class="m-last">${timeAgo(m.last_seen)}</span>
        </div>`;
      }).join('');

      const sorted   = [...members].sort((a, b) => new Date(b.last_seen || 0) - new Date(a.last_seen || 0));
      const activeEl = document.getElementById('active-members');
      if (activeEl) {
        activeEl.innerHTML = sorted.slice(0, 5).map(m => {
          const color = RANK_COLORS[m.rank] || '#445060';
          return `<div class="member-row">
            <div class="m-ava">${esc(m.emoji)}<div class="m-status ${isOnline(m.last_seen)}"></div></div>
            <div class="m-info">
              <div class="m-handle"><a href="members/profile.html?user=${encodeURIComponent(m.handle)}" style="color:inherit;text-decoration:none;">${esc(m.handle)}</a></div>
              <div class="m-rank" style="color:${esc(color)};">${esc(String(m.rank || '').toUpperCase())}</div>
            </div>
            <span class="m-last">${timeAgo(m.last_seen)}</span>
          </div>`;
        }).join('');
      }
    } catch (e) { console.error('Failed to load members:', e); }
  }

  async function loadStats() {
    try {
      const res  = await authFetch('/api/stats');
      if (!res.ok) return;
      const data = await res.json();
      const notesEl = document.getElementById('stat-notes');
      const iocsEl  = document.getElementById('stat-iocs');
      if (notesEl) notesEl.textContent = data.total_notes ?? '0';
      if (iocsEl)  iocsEl.textContent  = data.total_iocs  ?? '0';
    } catch (e) { console.error('Stats error:', e); }
  }

  function priorityLabel(priority) {
    return String(priority || 'medium').replace(/_/g, ' ');
  }

  function statusLabel(status) {
    return String(status || 'active').replace(/_/g, ' ');
  }

  function openOperationModal(operation = null) {
    editingOperationId = operation ? operation.id : null;
    document.getElementById('operationModalTitle').textContent = operation ? 'Edit Operation' : 'Create Operation';
    document.getElementById('operationConfirmBtn').textContent = operation ? 'Save' : 'Create';
    document.getElementById('operationName').value = operation?.name || '';
    document.getElementById('operationLead').value = operation?.lead_handle || user.handle || '';
    document.getElementById('operationStatus').value = operation?.status || 'active';
    document.getElementById('operationPriority').value = operation?.priority || 'medium';
    document.getElementById('operationSummary').value = operation?.summary || '';
    document.getElementById('operationModal').classList.remove('hidden');
  }

  function closeOperationModal() {
    editingOperationId = null;
    document.getElementById('operationModal').classList.add('hidden');
  }

  async function submitOperation() {
    const payload = {
      name: document.getElementById('operationName').value.trim(),
      lead_handle: document.getElementById('operationLead').value.trim() || user.handle,
      status: document.getElementById('operationStatus').value,
      priority: document.getElementById('operationPriority').value,
      summary: document.getElementById('operationSummary').value.trim(),
    };
    if (!payload.name) {
      alert('Operation name required.');
      return;
    }
    const url = editingOperationId ? `/api/operations/${editingOperationId}` : '/api/operations/';
    const method = editingOperationId ? 'PATCH' : 'POST';
    const res = await authFetch(url, { method, body: JSON.stringify(payload) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.detail || 'Failed to save operation.');
      return;
    }
    closeOperationModal();
    await loadOperations();
  }

  async function deleteOperation(operationId) {
    if (!confirm('Delete this operation? Attached notes will remain but lose the operation link.')) return;
    const res = await authFetch(`/api/operations/${operationId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.detail || 'Failed to delete operation.');
      return;
    }
    await loadOperations();
  }

  async function loadOperations() {
    try {
      const res = await authFetch('/api/operations/');
      if (!res.ok) return;
      operations = await res.json();
      const el = document.getElementById('operations-list');
      if (!el) return;
      if (!operations.length) {
        el.innerHTML = '<div style="padding:16px 18px;font-family:var(--mono);font-size:10px;color:var(--text-dim);">No operations yet. Create one to tie notes into shared investigations.</div>';
        return;
      }
      const statusScore = { active: 0, planning: 1, on_hold: 2, closed: 3, archived: 4 };
      const priorityScore = { critical: 0, high: 1, medium: 2, low: 3 };
      const ordered = [...operations].sort((a, b) =>
        (statusScore[a.status] ?? 9) - (statusScore[b.status] ?? 9)
        || (priorityScore[a.priority] ?? 9) - (priorityScore[b.priority] ?? 9)
      );
      el.innerHTML = ordered.slice(0, 6).map((operation) => {
        const canEdit = user.is_admin || operation.created_by === user.id;
        return `<div class="note-item">
          <div class="note-title"><a href="operations.html?id=${encodeURIComponent(operation.id)}" style="color:inherit;text-decoration:none;">${esc(operation.name)}</a></div>
          <div class="note-preview">${esc(operation.summary || 'No summary yet.')}</div>
          <div class="note-meta">
            <span>${esc(statusLabel(operation.status))}</span>
            <span>${esc(priorityLabel(operation.priority))}</span>
            <span>${esc(operation.lead_handle || 'unassigned')}</span>
            <span>${esc(String(operation.note_count || 0))} notes</span>
            <span>${esc(String(operation.published_count || 0))} public</span>
            <span>${esc(String(operation.ioc_count || 0))} iocs</span>
            <span>${esc(String(operation.file_count || 0))} files</span>
          </div>
          ${canEdit ? `<div class="note-meta" style="margin-top:10px;gap:8px">
            <a href="#" onclick="event.preventDefault();window.__openOperationModal(${operation.id})" class="panel-action">Edit</a>
            <a href="#" onclick="event.preventDefault();window.__deleteOperation(${operation.id})" class="panel-action" style="color:var(--red2)">Delete</a>
          </div>` : ''}
        </div>`;
      }).join('');
    } catch (e) { console.error('Operations error:', e); }
  }

  async function loadActivityTimeline() {
    try {
      const res = await authFetch('/api/operations/activity');
      if (!res.ok) return;
      const items = await res.json();
      const el = document.getElementById('activity-timeline');
      if (!el) return;
      if (!items.length) {
        el.innerHTML = '<div style="padding:16px 18px;font-family:var(--mono);font-size:10px;color:var(--text-dim);">No activity yet.</div>';
        return;
      }
      const iconMap = { note: '📖', ioc: '📌', vault_file: '📁' };
      const hrefFor = (item) => {
        if (item.kind === 'note') return `library.html?note_id=${encodeURIComponent(item.id)}`;
        if (item.kind === 'ioc') return item.meta && item.meta.operation_id ? `ioc-tracker.html?operation_id=${encodeURIComponent(item.meta.operation_id)}` : 'ioc-tracker.html';
        if (item.kind === 'vault_file') return item.meta && item.meta.operation_id ? `operations.html?id=${encodeURIComponent(item.meta.operation_id)}` : 'vault.html';
        return 'dashboard.html';
      };
      el.innerHTML = items.slice(0, 10).map((item) => `
        <div class="note-item" onclick="window.location='${hrefFor(item)}'" style="cursor:crosshair;">
          <div class="note-title">${iconMap[item.kind] || '•'} ${esc(item.title || 'Untitled')}</div>
          <div class="note-preview">${esc(item.operation_name || (item.kind === 'vault_file' ? 'Vault evidence update' : item.kind === 'ioc' ? 'Indicator activity' : 'Research note activity'))}</div>
          <div class="note-meta">
            <span>${esc(item.kind.replace('_', ' '))}</span>
            <span>${esc(item.author || 'unknown')}</span>
            <span>${timeAgo(item.created_at)}</span>
          </div>
        </div>
      `).join('');
    } catch (e) { console.error('Activity timeline error:', e); }
  }

  async function loadReviewQueuePreview() {
    try {
      const panel = document.getElementById('review-board-panel');
      const root = document.getElementById('review-queue-preview');
      if (!panel || !root || !user.is_admin) return;
      panel.style.display = 'block';
      const res = await authFetch('/api/notes/review-queue');
      if (!res.ok) {
        root.innerHTML = '<div style="padding:16px 18px;font-family:var(--mono);font-size:10px;color:var(--text-dim);">Unable to load review queue.</div>';
        return;
      }
      const data = await res.json();
      const pending = (data.in_review || []).slice(0, 4);
      const approved = (data.approved || []).slice(0, 2);
      const items = pending.concat(approved);
      if (!items.length) {
        root.innerHTML = '<div style="padding:16px 18px;font-family:var(--mono);font-size:10px;color:var(--text-dim);">No items waiting.</div>';
        return;
      }
      root.innerHTML = items.map((item) => `
        <div class="note-item" onclick="window.location='library.html?note_id=${encodeURIComponent(item.id)}'" style="cursor:crosshair;">
          <div class="note-title">${esc(item.title)}</div>
          <div class="note-preview">${esc(item.operation_name || 'No operation')} · ${esc(item.review_status || 'draft')}</div>
          <div class="note-meta">
            <span>${esc(item.author_handle || 'unknown')}</span>
            <span>${timeAgo(item.updated_at || item.created_at)}</span>
          </div>
        </div>
      `).join('');
    } catch (e) { console.error('Review queue preview error:', e); }
  }

  async function loadAnnouncements() {
    try {
      const res     = await authFetch('/api/announcements/');
      if (!res.ok) return;
      const all     = await res.json();
      const notices = all.filter(a => a.type === 'notice');
      const creds   = all.filter(a => a.type === 'creds');
      renderAnnouncements('noticeItems', notices, false);
      renderAnnouncements('credsItems',  creds,   true);
    } catch (e) { console.error('Announcements error:', e); }
  }

  function renderAnnouncements(elId, items, isCreds) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (!items.length) {
      el.innerHTML = `<div class="ann-empty">${isCreds ? 'No credentials posted.' : 'No announcements.'}</div>`;
      return;
    }
    el.innerHTML = items.map(a => `
      <div class="ann-item ${isCreds ? 'creds-item' : ''}">
        ${user.is_admin ? `<button class="ann-del-btn" onclick="deleteAnnouncement(${a.id})" style="display:block;">✕</button>` : ''}
        <div class="ann-item-title">${esc(a.title)}</div>
        ${a.content ? `<div class="ann-item-content">${esc(a.content)}</div>` : ''}
        <div class="ann-item-meta">
          <span>${esc(a.author)}</span>
          <span>${timeAgo(a.created_at)}</span>
          <span class="ann-expires">${timeUntil(a.expires_at)}</span>
        </div>
      </div>`).join('');
  }

  async function loadRecentNotes() {
    try {
      const res   = await authFetch('/api/notes/');
      if (!res.ok) return;
      const notes = await res.json();
      const el    = document.getElementById('recent-notes');
      if (!el) return;
      if (!notes.length) {
        el.innerHTML = '<div style="padding:16px 18px;font-family:var(--mono);font-size:10px;color:var(--text-dim);">No notes yet.</div>';
        return;
      }
      el.innerHTML = notes.slice(0, 5).map(n => `
        <div class="note-item" onclick="window.location='library.html?note_id=${encodeURIComponent(n.id)}'" style="cursor:crosshair;">
          <div class="note-title">${esc(n.title)}</div>
          <div class="note-preview">${esc(n.content || 'No preview')}</div>
          <div class="note-meta">
            <span>${esc(n.author_handle)}</span>
            <span>${timeAgo(n.updated_at || n.created_at)}</span>
            ${n.operation_name ? `<span class="note-tag">${esc(n.operation_name)}</span>` : ''}
            ${(Array.isArray(n.tags) ? n.tags : []).filter(Boolean).map(t => `<span class="note-tag">${esc(String(t).trim())}</span>`).join('')}
          </div>
        </div>`).join('');
    } catch (e) { console.error('Notes error:', e); }
  }

  function logout(e) {
    if (e) e.preventDefault();
    fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include', keepalive: true })
      .finally(() => {
        localStorage.removeItem('dc_token');
        localStorage.removeItem('dc_user');
        window.location.replace('login.html');
      });
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  function updateClock() {
    const now    = new Date();
    const utc    = now.toUTCString().split(' ')[4];
    let nepal = '';
    try {
      nepal = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kathmandu',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);
    } catch (_) {
      // Fallback: Nepal is UTC+05:45
      const np = new Date(now.getTime() + ((5 * 60 + 45) * 60 * 1000));
      nepal = np.toISOString().slice(11, 19);
    }
    const clock  = document.getElementById('clock');
    const dateEl = document.getElementById('dateStr');
    if (clock)  clock.textContent  = `${nepal} NPT · ${utc} UTC`;
    if (dateEl) dateEl.textContent = now.toISOString().split('T')[0];
  }
  updateClock();
  setInterval(updateClock, 1000);

  if (user.is_admin) {
    const noticeBtn = document.getElementById('noticePostBtn');
    const credsBtn  = document.getElementById('credsPostBtn');
    const operationBtn = document.getElementById('operationCreateBtn');
    if (noticeBtn) noticeBtn.style.display = 'block';
    if (credsBtn)  credsBtn.style.display  = 'block';
    if (operationBtn) operationBtn.style.display = 'inline-flex';
  } else {
    const operationBtn = document.getElementById('operationCreateBtn');
    if (operationBtn) operationBtn.style.display = 'inline-flex';
  }

  if (!user.is_admin) {
    setTimeout(() => {
      const label = document.getElementById('admin-sidebar-section');
      const link  = document.getElementById('admin-sidebar-link');
      const reviewLink = document.getElementById('review-sidebar-link');
      if (label) label.style.display = 'none';
      if (link)  link.style.display  = 'none';
      if (reviewLink) reviewLink.style.display = 'none';
    }, 500);
  }

  // ── Notifications ──────────────────────────────────────────────
  let _notifAll = [];
  let _notifKnownIds = new Set();
  let _notifSoundArmed = false;
  let _notifAudioCtx = null;

  function armNotificationSound() {
    if (_notifSoundArmed) return;
    _notifSoundArmed = true;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) _notifAudioCtx = new Ctx();
      if (_notifAudioCtx && _notifAudioCtx.state === 'suspended') {
        _notifAudioCtx.resume().catch(() => {});
      }
    } catch (_) {}
  }

  function playNotificationSound() {
    if (!_notifSoundArmed) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!_notifAudioCtx) _notifAudioCtx = new Ctx();
      const ctx = _notifAudioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.065, now + 0.01);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      master.connect(ctx.destination);

      const o1 = ctx.createOscillator();
      o1.type = 'triangle';
      o1.frequency.setValueAtTime(880, now);
      o1.frequency.exponentialRampToValueAtTime(1174, now + 0.12);
      o1.connect(master);
      o1.start(now);
      o1.stop(now + 0.14);

      const o2 = ctx.createOscillator();
      o2.type = 'sine';
      o2.frequency.setValueAtTime(1318, now + 0.08);
      o2.connect(master);
      o2.start(now + 0.09);
      o2.stop(now + 0.24);
    } catch (_) {}
  }

  document.addEventListener('pointerdown', armNotificationSound, { once: true, passive: true });
  document.addEventListener('keydown', armNotificationSound, { once: true });

  function renderNotifDot() {
    const seen = JSON.parse(localStorage.getItem('dc_seen_notifs') || '[]');
    const dismissed = JSON.parse(localStorage.getItem('dc_dismissed_notifs') || '[]');
    const dot = document.getElementById('notif-dot');
    const hasUnread = _notifAll.some(a => !seen.includes(a.id) && !dismissed.includes(a.id));
    if (dot) dot.style.display = hasUnread ? 'block' : 'none';
  }

  function renderNotifPanel() {
    const body = document.getElementById('notif-panel-body');
    if (!body) return;
    const seen = JSON.parse(localStorage.getItem('dc_seen_notifs') || '[]');
    const dismissed = JSON.parse(localStorage.getItem('dc_dismissed_notifs') || '[]');
    const visibleNotifs = _notifAll.filter((a) => !dismissed.includes(a.id));
    if (!visibleNotifs.length) {
      body.innerHTML = '<div class="notif-empty">No notifications.</div>';
      return;
    }
    body.innerHTML = visibleNotifs.map(a => {
      const isUnread = !seen.includes(a.id);
      return `<div class="notif-item${isUnread ? ' unread' : ''}">
        <div class="notif-item-top">
          <div class="notif-item-title">${esc(a.title)}</div>
          <button class="notif-close-btn" data-notif-id="${a.id}" title="Dismiss">✕</button>
        </div>
        <div class="notif-item-meta">
          <span class="notif-item-type-${esc(a.type)}">[${esc(a.type)}]</span>
          <span>${esc(a.author)}</span>
          <span>${timeAgo(a.created_at)}</span>
        </div>
      </div>`;
    }).join('');
    body.querySelectorAll('.notif-close-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(btn.getAttribute('data-notif-id'));
        if (!Number.isFinite(id)) return;
        const dismissedNow = new Set(JSON.parse(localStorage.getItem('dc_dismissed_notifs') || '[]'));
        dismissedNow.add(id);
        localStorage.setItem('dc_dismissed_notifs', JSON.stringify(Array.from(dismissedNow)));
        renderNotifPanel();
        renderNotifDot();
      });
    });
  }

  async function maybeRequestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      try { await Notification.requestPermission(); } catch (_) {}
    }
  }

  function pushDesktopNotification(ann) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    const body = `${ann.type.toUpperCase()} • ${ann.author}`;
    try {
      const n = new Notification(`DEADCATS: ${ann.title}`, { body, tag: `dc-ann-${ann.id}` });
      n.onclick = () => {
        window.focus();
      };
    } catch (_) {}
  }

  // ── CTF reminders (24h / 1h) for "I Will Play" ────────────────
  const CTF_REMINDER_STORE_KEY = 'dc_ctf_reminders_sent_v1';

  function readCtfReminderStore() {
    try {
      const raw = localStorage.getItem(CTF_REMINDER_STORE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      localStorage.removeItem(CTF_REMINDER_STORE_KEY);
      return {};
    }
  }

  function writeCtfReminderStore(store) {
    try {
      localStorage.setItem(CTF_REMINDER_STORE_KEY, JSON.stringify(store));
    } catch (_) {}
  }

  function cleanupCtfReminderStore(store) {
    const cutoff = Date.now() - (14 * 24 * 60 * 60 * 1000);
    let changed = false;
    Object.keys(store).forEach((k) => {
      const ts = Number(store[k] || 0);
      if (!Number.isFinite(ts) || ts < cutoff) {
        delete store[k];
        changed = true;
      }
    });
    return changed;
  }

  function userWillPlayCtf(ev) {
    const markers = Array.isArray(ev.participation_markers) ? ev.participation_markers : [];
    return markers.some((m) => {
      const handle = String(m.handle || '').toLowerCase();
      return handle === String(user.handle || '').toLowerCase() && m.will_play === true;
    });
  }

  function pushCtfReminderNotification(ev, slotLabel, slotId) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    const start = new Date(ev.start_time);
    const when = Number.isFinite(start.getTime())
      ? start.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'soon';
    try {
      const n = new Notification(`CTF Reminder: ${ev.title}`, {
        body: `Starts in ~${slotLabel}. You marked "I Will Play". (${when})`,
        tag: `dc-ctf-${ev.id}-${slotId}`,
      });
      n.onclick = () => {
        window.focus();
        window.location.href = 'ctf.html';
      };
    } catch (_) {}
  }

  async function checkCtfReminders() {
    try {
      const res = await authFetch('/api/ctf/events');
      if (!res.ok) return;
      const events = await res.json();
      const now = Date.now();
      const slots = [
        { id: '24h', ms: 24 * 60 * 60 * 1000, label: '24h' },
        { id: '1h',  ms: 1 * 60 * 60 * 1000,  label: '1h'  },
      ];

      const store = readCtfReminderStore();
      let changed = cleanupCtfReminderStore(store);

      (Array.isArray(events) ? events : []).forEach((ev) => {
        if (ev.status !== 'upcoming') return;
        if (!userWillPlayCtf(ev)) return;
        const startMs = new Date(ev.start_time || '').getTime();
        if (!Number.isFinite(startMs) || startMs <= now) return;

        const eventKey = `${ev.id}:${ev.start_time || ''}`;
        slots.forEach((slot) => {
          const key = `${eventKey}:${slot.id}`;
          if (store[key]) return;
          // If user is within the reminder window and has not been notified yet, notify once.
          if (now >= (startMs - slot.ms)) {
            pushCtfReminderNotification(ev, slot.label, slot.id);
            store[key] = Date.now();
            changed = true;
          }
        });
      });

      if (changed) writeCtfReminderStore(store);
    } catch (e) {
      console.error('CTF reminder check failed:', e);
    }
  }

  async function loadNotifications() {
    try {
      const res = await authFetch('/api/announcements/');
      if (!res.ok) return;
      _notifAll = await res.json();
      const dismissed = new Set(JSON.parse(localStorage.getItem('dc_dismissed_notifs') || '[]'));
      const visible = _notifAll.filter((a) => !dismissed.has(a.id));
      let hasNewNotification = false;
      if (_notifKnownIds.size === 0) {
        visible.forEach((a) => _notifKnownIds.add(a.id));
      } else {
        visible.forEach((a) => {
          if (!_notifKnownIds.has(a.id)) {
            hasNewNotification = true;
            pushDesktopNotification(a);
            _notifKnownIds.add(a.id);
          }
        });
      }
      if (hasNewNotification) playNotificationSound();
      renderNotifPanel();
      renderNotifDot();
    } catch (e) { console.error('Notifications error:', e); }
  }

  const notifBtn   = document.getElementById('notif-btn');
  const notifPanel = document.getElementById('notif-panel');

  if (notifBtn && notifPanel) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = notifPanel.classList.contains('hidden');
      if (isHidden) {
        renderNotifPanel();
        notifPanel.classList.remove('hidden');
        const dismissed = new Set(JSON.parse(localStorage.getItem('dc_dismissed_notifs') || '[]'));
        const ids = _notifAll.filter((a) => !dismissed.has(a.id)).map(a => a.id);
        localStorage.setItem('dc_seen_notifs', JSON.stringify(ids));
        renderNotifDot();
      } else {
        notifPanel.classList.add('hidden');
      }
    });

    document.addEventListener('click', () => {
      notifPanel.classList.add('hidden');
    });
  }

  window.__openOperationModal = (operationId) => {
    if (typeof operationId === 'number') {
      const operation = operations.find((item) => item.id === operationId);
      openOperationModal(operation || null);
      return;
    }
    openOperationModal(null);
  };
  window.__closeOperationModal = closeOperationModal;
  window.__submitOperation = submitOperation;
  window.__deleteOperation = deleteOperation;

  populateNav();
  loadMembers();
  loadStats();
  loadOperations();
  loadActivityTimeline();
  loadReviewQueuePreview();
  loadAnnouncements();
  loadRecentNotes();
  loadNotifications();
  checkCtfReminders();
  maybeRequestNotificationPermission();
  setInterval(loadNotifications, 30000);
  setInterval(checkCtfReminders, 60000);
}

// ── Global modal functions ────────────────────────────────────────
let _postType = 'notice';

function openPostModal(type) {
  _postType = type;
  document.getElementById('modalTitle').textContent     = type === 'creds' ? 'Drop CTF Credentials' : 'Post Announcement';
  document.getElementById('contentLabel').textContent   = type === 'creds' ? 'Credentials (user / pass / URL)' : 'Content';
  document.getElementById('postContent').placeholder    = type === 'creds' ? 'user: admin\npass: hunter2\nurl: https://ctf.example.com' : 'Details...';
  document.getElementById('postConfirmBtn').textContent = type === 'creds' ? 'Drop Creds' : 'Post';
  document.getElementById('postTitle').value   = '';
  document.getElementById('postContent').value = '';
  document.getElementById('postModal').classList.remove('hidden');
  document.getElementById('postTitle').focus();
}

function closePostModal() {
  document.getElementById('postModal').classList.add('hidden');
}

async function submitPost() {
  const title      = document.getElementById('postTitle').value.trim();
  const content    = document.getElementById('postContent').value.trim();
  const expires_in = parseInt(document.getElementById('postExpires').value);
  if (!title) { alert('Title required.'); return; }
  const res = await fetch(`${API}/api/announcements/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, type: _postType, expires_in }),
  });
  if (res.ok) { closePostModal(); location.reload(); }
  else { const err = await res.json(); alert(err.detail || 'Failed to post.'); }
}

async function deleteAnnouncement(id) {
  if (!confirm('Delete this?')) return;
  await fetch(`${API}/api/announcements/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  location.reload();
}

function openOperationModal() {
  if (window.__openOperationModal) window.__openOperationModal();
}

function closeOperationModal() {
  if (window.__closeOperationModal) window.__closeOperationModal();
}

function submitOperation() {
  if (window.__submitOperation) return window.__submitOperation();
}

// ── Boot ──────────────────────────────────────────────────────────
let _dashboardInitialized = false;
function tryInit() {
  if (_dashboardInitialized) return;
  if (document.getElementById('members-list') && document.getElementById('notif-btn')) {
    _dashboardInitialized = true;
    initDashboard();
  } else {
    setTimeout(tryInit, 50);
  }
}
window.addEventListener('partials:loaded', tryInit, { once: true });
setTimeout(tryInit, 300);
