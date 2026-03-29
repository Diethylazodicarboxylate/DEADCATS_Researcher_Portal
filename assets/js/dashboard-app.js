import React, { useEffect } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import htm from 'https://esm.sh/htm@3.1.1';
import { loadLegacyScript } from './legacy-react-loader.js';

const html = htm.bind(React.createElement);

const markup = `
<nav class="topnav">
  <div class="topnav-left">
    <a href="/index.html" class="nav-logo">DEAD<span>CATS</span></a>
    <div class="nav-sep"></div>
    <span class="nav-page">// <span>dashboard</span></span>
  </div>
  <div class="topnav-right">
    <span class="nav-time" id="clock">--:--:-- UTC</span>
    <div class="nav-notif" id="notif-btn">🔔<div class="notif-dot" id="notif-dot"></div>
      <div class="notif-panel hidden" id="notif-panel">
        <div class="notif-panel-header">NOTIFICATIONS</div>
        <div class="notif-panel-body" id="notif-panel-body"></div>
      </div>
    </div>
    <a href="/members/profile.html" class="nav-profile" id="nav-profile-link">
      <div class="nav-ava" id="nav-ava">🐱</div>
      <div>
        <div class="nav-handle" id="nav-handle">r3dh00d</div>
        <div class="nav-rank" id="nav-rank">ARCH DUKE</div>
      </div>
    </a>
  </div>
</nav>

<aside class="sidebar">
  <div class="sidebar-top">
    <div class="sidebar-label">Navigation</div>
    <a href="/dashboard.html" class="nav-item active"><span class="nav-ico">⬡</span> Dashboard</a>
    <a href="/library.html" class="nav-item"><span class="nav-ico">📖</span> Research Library</a>
    <a href="/operations.html" class="nav-item"><span class="nav-ico">🗂️</span> Operations</a>
    <a href="/review-board.html" class="nav-item" id="review-sidebar-link"><span class="nav-ico">✅</span> Review Board</a>
    <a href="/ioc-tracker.html" class="nav-item"><span class="nav-ico">📌</span> IOC Tracker</a>
    <a href="/vault.html" class="nav-item"><span class="nav-ico">📁</span> File Vault</a>
    <a href="/bookmarks.html" class="nav-item"><span class="nav-ico">⭐</span> Bookmarks</a>
    <a href="/whiteboard.html" class="nav-item"><span class="nav-ico">🖊️</span> War Room</a>
    <div class="sidebar-label">Team</div>
    <a href="/members.html" class="nav-item"><span class="nav-ico">👥</span> Members</a>
    <a href="/ctf.html" class="nav-item"><span class="nav-ico">🚩</span> CTF Tracker</a>
    <a href="/pwnbox.html" class="nav-item"><span class="nav-ico">⌨️</span> PwnBox</a>
    <a href="/ai-chat.html" class="nav-item"><span class="nav-ico">🤖</span> CATGPT</a>
    <a href="/research-adventure.html" class="nav-item"><span class="nav-ico">🗺️</span> Research Adventure</a>
    <div class="sidebar-label" id="admin-sidebar-section">Admin</div>
    <a href="/admin.html" class="nav-item" id="admin-sidebar-link"><span class="nav-ico">⚙️</span> Admin Panel</a>
    <a href="/monitor.html" class="nav-item"><span class="nav-ico">📡</span> Monitor</a>
  </div>
  <div class="sidebar-bottom">
    <a href="#" class="btn-logout" id="logout-btn">⏻ &nbsp; Logout</a>
  </div>
</aside>

<div class="modal-overlay hidden" id="postModal">
  <div class="modal">
    <div class="modal-title" id="modalTitle">Post Announcement</div>
    <div class="modal-row"><label class="modal-label">Title</label><input class="modal-input" type="text" id="postTitle" placeholder="Announcement title..."></div>
    <div class="modal-row"><label class="modal-label" id="contentLabel">Content</label><textarea class="modal-textarea" id="postContent" placeholder="Details..."></textarea></div>
    <div class="modal-row"><label class="modal-label">Expires in</label><select class="modal-select" id="postExpires"><option value="1">1 day</option><option value="2" selected>2 days</option><option value="3">3 days</option></select></div>
    <div class="modal-actions"><button class="modal-btn" onclick="closePostModal()">Cancel</button><button class="modal-btn confirm" id="postConfirmBtn" onclick="submitPost()">Post</button></div>
  </div>
</div>

<div class="modal-overlay hidden" id="operationModal">
  <div class="modal">
    <div class="modal-title" id="operationModalTitle">Create Operation</div>
    <div class="modal-row"><label class="modal-label">Operation Name</label><input class="modal-input" type="text" id="operationName" placeholder="Operation Glass Hydra"></div>
    <div class="modal-row"><label class="modal-label">Lead Handle</label><input class="modal-input" type="text" id="operationLead" placeholder="lead researcher"></div>
    <div class="modal-row"><label class="modal-label">Status</label><select class="modal-select" id="operationStatus"><option value="active">Active</option><option value="planning">Planning</option><option value="on_hold">On Hold</option><option value="closed">Closed</option></select></div>
    <div class="modal-row"><label class="modal-label">Priority</label><select class="modal-select" id="operationPriority"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
    <div class="modal-row"><label class="modal-label">Summary</label><textarea class="modal-textarea" id="operationSummary" placeholder="Scope, current direction, and what this operation is trying to prove."></textarea></div>
    <div class="modal-actions"><button class="modal-btn" onclick="closeOperationModal()">Cancel</button><button class="modal-btn confirm" id="operationConfirmBtn" onclick="submitOperation()">Create</button></div>
  </div>
</div>

<main class="main">
  <div class="main-inner">
    <div class="page-header">
      <div>
        <div class="page-title">Dashboard</div>
      </div>
      <div class="page-meta">NODE <span>DC-RESEARCH-01</span> &nbsp;·&nbsp; <span id="dateStr">--</span></div>
    </div>

    <div class="stats-row">
      <div class="stat-card" style="--accent: var(--cyan);"><div class="sc-label"><span class="sc-ico">📌</span> Total IOCs</div><div class="sc-value cyan" id="stat-iocs">—</div><div class="sc-sub">tracked indicators</div></div>
      <div class="stat-card" style="--accent: var(--red2);"><div class="sc-label"><span class="sc-ico">📖</span> Research Notes</div><div class="sc-value red" id="stat-notes">—</div><div class="sc-sub">in library</div></div>
      <div class="stat-card" style="--accent: var(--gold);"><div class="sc-label"><span class="sc-ico">👥</span> Total Members</div><div class="sc-value gold" id="stat-members">—</div><div class="sc-sub">registered</div></div>
      <div class="stat-card" style="--accent: var(--green);"><div class="sc-label"><span class="sc-ico">🟢</span> Members Online</div><div class="sc-value green" id="stat-online">—</div><div class="sc-sub" id="stat-total">active now</div></div>
    </div>

    <div class="boards-row">
      <div class="ann-board">
        <div class="ann-board-head"><span class="ann-board-title">📣 &nbsp; Announcements</span><button class="ann-post-btn" id="noticePostBtn" onclick="openPostModal('notice')">+ Post</button></div>
        <div class="ann-items" id="noticeItems"><div class="ann-empty">No announcements.</div></div>
      </div>
    </div>

    <div class="three-col">
      <div>
        <div class="panel" id="operations-panel">
          <div class="panel-head"><span class="panel-title"><span class="panel-title-ico">🗂️</span> Active Operations</span><div><a class="panel-action" href="/operations.html">Open Board</a><button class="panel-action" id="operationCreateBtn" onclick="openOperationModal()" style="display:none">+ Create</button></div></div>
          <div class="notes-list" id="operations-list"></div>
        </div>
        <div class="panel">
          <div class="panel-head"><span class="panel-title"><span class="panel-title-ico">📖</span> Latest Research Notes</span><a href="/library.html" class="panel-action">View all →</a></div>
          <div class="notes-list" id="recent-notes"></div>
        </div>
        <div class="panel">
          <div class="panel-head"><span class="panel-title"><span class="panel-title-ico">⏱️</span> Activity Timeline</span></div>
          <div class="notes-list" id="activity-timeline"></div>
        </div>
        <div class="panel" id="review-board-panel" style="display:none">
          <div class="panel-head"><span class="panel-title"><span class="panel-title-ico">✅</span> Review Queue</span><a href="/review-board.html" class="panel-action">Open Board</a></div>
          <div class="notes-list" id="review-queue-preview"></div>
        </div>
        <div class="panel">
          <div class="panel-head"><span class="panel-title"><span class="panel-title-ico">⚡</span> Recently Active</span></div>
          <div class="members-list" id="active-members"></div>
        </div>
      </div>

      <div class="panel" id="members-panel">
        <div class="panel-head"><span class="panel-title"><span class="panel-title-ico">👥</span> Members</span><a href="/members.html" class="panel-action">All →</a></div>
        <div class="members-list" id="members-list"></div>
      </div>
    </div>
  </div>
</main>
`;

function App() {
  useEffect(() => {
    loadLegacyScript('/assets/js/dashboard.js', { dispatchPartialsLoaded: true });
  }, []);

  return html`<div dangerouslySetInnerHTML=${{ __html: markup }}></div>`;
}

createRoot(document.getElementById('app-root')).render(html`<${App} />`);
