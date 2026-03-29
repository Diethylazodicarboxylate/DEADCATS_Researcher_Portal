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
    <a href="/dashboard.html" class="nav-item"><span class="nav-ico">⬡</span> Dashboard</a>
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
    <a href="/research-adventure.html" class="nav-item active"><span class="nav-ico">🗺️</span> Research Adventure</a>
    <div class="sidebar-label" id="admin-sidebar-section">Admin</div>
    <a href="/admin.html" class="nav-item" id="admin-sidebar-link"><span class="nav-ico">⚙️</span> Admin Panel</a>
    <a href="/monitor.html" class="nav-item"><span class="nav-ico">📡</span> Monitor</a>
  </div>
  <div class="sidebar-bottom">
    <a href="#" class="btn-logout" id="logout-btn">⏻ &nbsp; Logout</a>
  </div>
</aside>

<div class="pathway-gate hidden" id="pathwayGate">
  <div class="gate-shell">
    <div class="gate-header">
      <div class="gate-kicker">Research Adventure</div>
      <h1>Choose Your Pathway</h1>
      <p>Your first choice locks your progression track. You begin at Sequence 9 and rise by completing leaf skills across the roadmap.</p>
    </div>
    <div class="pathway-grid" id="pathwayChoices"></div>
  </div>
</div>

<main class="main adventure-main">
  <div class="main-inner adventure-inner">
    <section class="adventure-hero">
      <div class="hero-copy">
        <div class="eyebrow">Research Adventure</div>
        <h1>Specialize through a real roadmap, not a vague checklist.</h1>
        <p>Start at the center, branch into a specialization, clear each level, and complete leaf skills to bubble progress up through topics, levels, and the full specialization.</p>
      </div>
      <div class="hero-meta">
        <div class="hero-chip"><span>Pathway</span><strong id="heroPathway">Unchosen</strong></div>
        <div class="hero-chip"><span>Sequence</span><strong id="heroSequence">9</strong></div>
        <div class="hero-chip"><span>Total Points</span><strong id="heroPoints">0</strong></div>
      </div>
    </section>

    <section class="adventure-grid">
      <div class="left-column">
        <article class="panel journey-panel">
          <div class="panel-head"><span class="panel-title">Current Journey</span><span class="panel-tag" id="journeyLockState">PATHWAY LOCKED</span></div>
          <div class="journey-body">
            <div class="journey-avatar-wrap"><img id="journeyAvatar" class="journey-avatar" alt="Current pathway avatar"></div>
            <div class="journey-info">
              <h2 id="journeyPathwayName">Awaiting selection</h2>
              <div class="journey-sequence" id="journeySequenceTitle">Sequence 9</div>
              <p id="journeySequenceSummary">Choose a pathway to start the progression ladder.</p>
              <div class="journey-stats">
                <div class="journey-stat"><span>Skill Points</span><strong id="skillPoints">0</strong></div>
                <div class="journey-stat"><span>Daily Bonus</span><strong id="dailyPoints">0</strong></div>
                <div class="journey-stat penalty"><span>Penalty Debt</span><strong id="penaltyPoints">0</strong></div>
              </div>
              <div class="progress-wrap">
                <div class="progress-track"><div class="progress-bar" id="sequenceBar"></div></div>
                <div class="progress-meta" id="sequenceMeta">Need 120 points for Sequence 8</div>
              </div>
            </div>
          </div>
        </article>

        <article class="panel ladder-panel">
          <div class="panel-head"><span class="panel-title">Sequence Ladder</span><span class="panel-tag">PIXEL RELICS</span></div>
          <div class="sequence-ladder" id="sequenceLadder"></div>
        </article>

        <article class="panel tasks-panel">
          <div class="panel-head"><span class="panel-title">Daily Task Ledger</span><span class="panel-tag" id="taskCountTag">0 / 5 ACTIVE</span></div>
          <div class="tasks-shell">
            <form class="task-form" id="taskForm">
              <div class="task-form-copy">
                <h3>Plan tomorrow’s work</h3>
                <p>You can preload up to 5 tasks for the next day. Missed tasks subtract the same points they would have awarded.</p>
              </div>
              <div class="task-form-grid">
                <label><span>Task</span><input id="taskTitleInput" type="text" maxlength="140" placeholder="Example: Review event loop notes"></label>
                <label><span>Reward</span><select id="taskPointsInput"><option value="10">10 pts</option><option value="15" selected>15 pts</option><option value="20">20 pts</option><option value="25">25 pts</option><option value="30">30 pts</option></select></label>
                <label><span>Due</span><input id="taskDueInput" type="text" readonly></label>
              </div>
              <button type="submit" class="task-submit">Queue Daily Task</button>
            </form>
            <div class="tasks-list" id="tasksList"></div>
          </div>
        </article>
      </div>

      <div class="right-column">
        <article class="panel roadmap-panel">
          <div class="panel-head"><span class="panel-title">Research Roadmap</span><span class="panel-tag">HEX CHART</span></div>
          <div class="destiny-board-wrap"><div class="destiny-board" id="destinyBoard"></div></div>
        </article>
      </div>
    </section>
  </div>
</main>

<div class="toast-stack" id="toastStack"></div>
<div class="hex-tooltip hidden" id="hexTooltip"></div>
`;

function App() {
  useEffect(() => {
    loadLegacyScript('/assets/js/research-adventure.js', { dispatchPartialsLoaded: true });
  }, []);

  return html`<div dangerouslySetInnerHTML=${{ __html: markup }}></div>`;
}

createRoot(document.getElementById('app-root')).render(html`<${App} />`);
