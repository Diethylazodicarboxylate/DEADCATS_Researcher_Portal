const API = '';
const PATHWAY_THEMES = {
  arcane_blade: 'arcane',
  ruin_artificer: 'ruin',
  shadow_conductor: 'shadow',
};

let metaState = null;
let adventureState = null;
let currentUser = readCachedUser();

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
      const res = await fetch(`${API}/api/auth/me`, { credentials: 'include', cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (_) {}
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  return null;
}

async function authFetch(url, opts = {}) {
  let res = await fetch(`${API}${url}`, {
    ...opts,
    credentials: 'include',
    headers: { ...(opts.headers || {}) },
    cache: 'no-store',
  });
  if (res.status !== 401) return res;
  const fresh = await fetchMeWithRetry();
  if (fresh) {
    currentUser = fresh;
    localStorage.setItem('dc_user', JSON.stringify(fresh));
    res = await fetch(`${API}${url}`, {
      ...opts,
      credentials: 'include',
      headers: { ...(opts.headers || {}) },
      cache: 'no-store',
    });
  }
  if (res.status === 401) {
    localStorage.removeItem('dc_token');
    localStorage.removeItem('dc_user');
    window.location.replace('login.html');
  }
  return res;
}

function showToast(message, kind = 'success') {
  const stack = document.getElementById('toastStack');
  if (!stack) return;
  const toast = document.createElement('div');
  toast.className = `toast ${kind}`;
  toast.textContent = message;
  stack.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}

function formatDateTime(value) {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function progressPercent(completion) {
  if (!completion || !completion.total) return 0;
  return Math.round((completion.completed / completion.total) * 100);
}

function pathwayPalette(pathwayKey, sequence) {
  const power = Math.max(0, 9 - Number(sequence || 9));
  const palettes = {
    arcane_blade: {
      skin: '#f0c7a5', cloth: power >= 6 ? '#d7a2ff' : '#7edcff', trim: power >= 4 ? '#f4f0ff' : '#9be0ff',
      glow: power >= 7 ? '#f7f2ff' : '#8be5ff', accent: power >= 6 ? '#8b4fff' : '#00d4ff', weapon: power >= 5 ? '#ffffff' : '#9be0ff',
      shadow: '#25324f', background: power >= 7 ? '#1a1244' : '#0a1a2e',
    },
    ruin_artificer: {
      skin: '#e3bc95', cloth: power >= 6 ? '#ff8859' : '#cf5c42', trim: power >= 4 ? '#ffd27c' : '#ffbb93',
      glow: power >= 7 ? '#ffe591' : '#ffb65c', accent: power >= 6 ? '#ff5d73' : '#ff9964', weapon: power >= 4 ? '#fbd46f' : '#bac5d2',
      shadow: '#35231f', background: power >= 7 ? '#2d1316' : '#26130f',
    },
    shadow_conductor: {
      skin: '#d1b293', cloth: power >= 6 ? '#6a7aff' : '#3d4a78', trim: power >= 4 ? '#d6deff' : '#9db2e1',
      glow: power >= 7 ? '#dfe8ff' : '#8fc6ff', accent: power >= 6 ? '#a7b4ff' : '#7d9ac9', weapon: power >= 5 ? '#e7efff' : '#a5b4d6',
      shadow: '#1d2335', background: power >= 7 ? '#0e1324' : '#111720',
    },
  };
  return palettes[pathwayKey] || palettes.arcane_blade;
}

function rect(x, y, color) {
  return `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`;
}

function createPixelAvatar(pathwayKey, sequence, size = 128) {
  const p = pathwayPalette(pathwayKey, sequence);
  const seq = Number(sequence || 9);
  const auraColor = p.glow;
  const aura = [];
  const figure = [];
  for (let x = 2; x < 14; x += 1) aura.push(rect(x, 1, `${auraColor}20`), rect(x, 14, `${auraColor}20`));
  for (let y = 2; y < 14; y += 1) aura.push(rect(1, y, `${auraColor}20`), rect(14, y, `${auraColor}20`));
  const fill = (coords, color) => coords.map(([x, y]) => rect(x, y, color));
  figure.push(...fill([[6,3],[7,3],[8,3],[9,3],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[6,6],[7,6],[8,6],[9,6]], p.skin));
  figure.push(...fill([[5,3],[10,3],[4,4],[11,4],[4,5],[11,5],[5,6],[10,6]], p.shadow));
  figure.push(...fill([[6,7],[7,7],[8,7],[9,7],[5,8],[6,8],[7,8],[8,8],[9,8],[10,8],[5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[6,10],[7,10],[8,10],[9,10]], p.cloth));
  figure.push(...fill([[4,8],[11,8],[4,9],[11,9]], p.trim));
  figure.push(...fill([[6,11],[7,11],[8,11],[9,11],[6,12],[9,12],[5,13],[6,13],[9,13],[10,13]], p.shadow));
  figure.push(...fill([[4,10],[5,10],[10,10],[11,10]], p.trim));
  if (pathwayKey === 'arcane_blade') {
    figure.push(...fill([[11,5],[12,4],[12,5],[12,6],[13,3],[13,4],[13,5],[13,6],[13,7]], p.weapon));
    figure.push(...fill([[10,5],[11,6],[12,7]], p.accent));
  } else if (pathwayKey === 'ruin_artificer') {
    figure.push(...fill([[11,6],[12,6],[13,6],[12,5],[12,7],[13,5],[13,7]], p.weapon));
    figure.push(...fill([[3,10],[4,10],[4,11],[3,11],[2,10]], p.accent));
  } else {
    figure.push(...fill([[3,5],[4,5],[5,5],[2,6],[3,6],[4,6],[5,6],[3,7],[4,7],[5,7],[4,8]], `${p.shadow}ee`));
    figure.push(...fill([[11,5],[12,5],[12,6],[13,6],[12,7],[13,7]], p.weapon));
  }
  if (seq <= 2) figure.push(...fill([[5,2],[6,2],[9,2],[10,2],[5,14],[10,14]], p.glow));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect width="16" height="16" fill="${p.background}"/>${aura.join('')}${figure.join('')}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function setTheme(pathwayKey) {
  document.body.dataset.pathwayTheme = PATHWAY_THEMES[pathwayKey] || 'arcane';
}

function getBoardColumns() {
  const specs = adventureState?.specializations || [];
  return [specs.slice(0, 3), specs.slice(3, 6)];
}

function getNodeDescription(type, node) {
  if (type === 'skill') {
    return `${node.summary}\n\nStatus: ${node.unlocked ? 'Completed' : node.available ? 'Ready to complete' : 'Locked'}\nReward: ${node.points} points`;
  }
  if (type === 'topic' || type === 'level' || type === 'specialization') {
    return `${node.summary}\n\nCompletion: ${node.completion.completed}/${node.completion.total} skills`;
  }
  return node.summary || '';
}

function tooltipEl() {
  return document.getElementById('hexTooltip');
}

function showTooltip(event) {
  const tip = tooltipEl();
  if (!tip) return;
  const text = event.currentTarget.getAttribute('data-tooltip');
  if (!text) return;
  tip.textContent = text;
  tip.classList.remove('hidden');
  moveTooltip(event);
}

function moveTooltip(event) {
  const tip = tooltipEl();
  if (!tip || tip.classList.contains('hidden')) return;
  tip.style.left = `${event.clientX + 18}px`;
  tip.style.top = `${event.clientY + 18}px`;
}

function hideTooltip() {
  const tip = tooltipEl();
  if (!tip) return;
  tip.classList.add('hidden');
}

function renderPathwayGate() {
  const gate = document.getElementById('pathwayGate');
  const list = document.getElementById('pathwayChoices');
  if (!gate || !list || !metaState) return;
  if (adventureState?.selected) {
    gate.classList.add('hidden');
    return;
  }
  gate.classList.remove('hidden');
  list.innerHTML = metaState.pathways.map((pathway) => `
    <article class="pathway-card ${esc(PATHWAY_THEMES[pathway.key] || 'arcane')}">
      <div class="gate-kicker">${esc(pathway.crest)} pathway</div>
      <h2 class="pathway-title">${esc(pathway.name)}</h2>
      <p>${esc(pathway.core_concept)}</p>
      <img class="pathway-icon" src="${createPixelAvatar(pathway.key, 0, 152)}" alt="${esc(pathway.name)} portrait">
      <div class="pathway-summary"><strong>Acting Method:</strong> ${esc(pathway.acting_method)}</div>
      <ul class="pathway-sequence-preview">
        ${pathway.sequences.slice(0, 3).map((entry) => `<li>Sequence ${entry.sequence} · ${esc(entry.title)}</li>`).join('')}
      </ul>
      <button class="pathway-select-btn" data-pathway="${esc(pathway.key)}">Lock Pathway</button>
    </article>
  `).join('');

  list.querySelectorAll('[data-pathway]').forEach((button) => {
    button.addEventListener('click', async () => {
      const pathway = button.getAttribute('data-pathway');
      button.disabled = true;
      const res = await authFetch('/api/research-adventure/select-pathway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathway_key: pathway }),
      });
      if (!res.ok) {
        button.disabled = false;
        showToast((await safeDetail(res)) || 'Could not lock pathway', 'error');
        return;
      }
      showToast('Pathway locked', 'success');
      await loadAdventure();
    });
  });
}

function renderHero() {
  document.getElementById('heroPathway').textContent = adventureState?.pathway?.name || 'Unchosen';
  document.getElementById('heroSequence').textContent = adventureState?.sequence ? `Sequence ${adventureState.sequence.sequence}` : '9';
  document.getElementById('heroPoints').textContent = String(adventureState?.points?.total ?? 0);
}

function renderJourney() {
  const state = adventureState || {};
  const pathway = state.pathway;
  const sequence = state.sequence;
  const total = Number(state.points?.total || 0);
  const journeyAvatar = document.getElementById('journeyAvatar');
  document.getElementById('skillPoints').textContent = String(state.points?.skills ?? 0);
  document.getElementById('dailyPoints').textContent = String(state.points?.daily_completed ?? 0);
  document.getElementById('penaltyPoints').textContent = String(state.points?.daily_penalties ?? 0);

  if (!pathway || !sequence) {
    journeyAvatar.src = createPixelAvatar('arcane_blade', 9, 128);
    document.getElementById('journeyPathwayName').textContent = 'Awaiting selection';
    document.getElementById('journeySequenceTitle').textContent = 'Sequence 9';
    document.getElementById('journeySequenceSummary').textContent = 'Choose a pathway to start the progression ladder.';
    document.getElementById('journeyLockState').textContent = 'PATHWAY UNSET';
    document.getElementById('sequenceBar').style.width = '0%';
    document.getElementById('sequenceMeta').textContent = 'Need 120 points for Sequence 8';
    return;
  }

  setTheme(pathway.key);
  journeyAvatar.src = createPixelAvatar(pathway.key, sequence.sequence, 128);
  document.getElementById('journeyPathwayName').textContent = pathway.name;
  document.getElementById('journeySequenceTitle').textContent = `Sequence ${sequence.sequence} · ${sequence.title}`;
  document.getElementById('journeySequenceSummary').textContent = sequence.summary;
  document.getElementById('journeyLockState').textContent = 'PATHWAY LOCKED';

  const progress = state.sequence_progress || {};
  const currentFloor = Number(progress.current_min_points || 0);
  const next = progress.next_min_points;
  let barWidth = 100;
  if (typeof next === 'number' && next > currentFloor) {
    barWidth = Math.max(0, Math.min(100, ((Math.max(total, 0) - currentFloor) / (next - currentFloor)) * 100));
  }
  document.getElementById('sequenceBar').style.width = `${barWidth}%`;
  document.getElementById('sequenceMeta').textContent = next == null
    ? 'Sequence 0 reached. No further milestone remains.'
    : `${progress.needed_points} more points needed for Sequence ${progress.next_sequence}`;
}

function renderLadder() {
  const ladder = document.getElementById('sequenceLadder');
  if (!ladder) return;
  if (!adventureState?.pathway) {
    ladder.innerHTML = '<div class="empty-state">Select a pathway to reveal the ladder.</div>';
    return;
  }
  const currentSequence = Number(adventureState.sequence?.sequence ?? 9);
  ladder.innerHTML = adventureState.pathway.sequences.map((entry) => {
    const unlocked = entry.sequence >= currentSequence;
    const milestone = metaState.sequence_milestones.find((item) => item.sequence === entry.sequence);
    return `
      <div class="sequence-row ${unlocked ? '' : 'locked'} ${entry.sequence === currentSequence ? 'active' : ''}">
        <img class="sequence-avatar" src="${createPixelAvatar(adventureState.pathway.key, entry.sequence, 72)}" alt="Sequence ${entry.sequence}">
        <div>
          <small>Sequence ${entry.sequence}</small>
          <strong>${esc(entry.title)}</strong>
          <div>${esc(entry.summary)}</div>
        </div>
        <div class="sequence-score">${milestone ? `${milestone.min_points} pts` : ''}</div>
      </div>
    `;
  }).join('');
}

function renderSkillNode(skill) {
  const stateClass = skill.unlocked ? 'complete' : skill.available ? 'available' : 'locked';
  return `
    <button
      class="road-hex skill-node ${stateClass}"
      data-skill-id="${esc(skill.id)}"
      data-tooltip="${esc(getNodeDescription('skill', skill))}"
      ${skill.available && !skill.unlocked ? '' : 'data-disabled="1"'}
    >
      <div class="road-hex-inner">
        <div class="hex-kicker">${skill.points} pts</div>
        <div class="hex-title">${esc(skill.name)}</div>
        <div class="hex-subtitle">${skill.unlocked ? 'Done' : skill.available ? 'Ready' : 'Locked'}</div>
      </div>
    </button>
  `;
}

function renderTopic(topic) {
  return `
    <div class="topic-cluster">
      <div class="topic-node-wrap">
        <div class="road-hex topic-node ${topic.completion.is_complete ? 'complete' : 'active'}" data-tooltip="${esc(getNodeDescription('topic', topic))}">
          <div class="road-hex-inner">
            <div class="hex-kicker">Topic</div>
            <div class="hex-title">${esc(topic.name)}</div>
            <div class="hex-subtitle">${progressPercent(topic.completion)}%</div>
          </div>
        </div>
      </div>
      <div class="skill-hex-grid">
        ${topic.skills.map(renderSkillNode).join('')}
      </div>
    </div>
  `;
}

function renderLevel(level) {
  return `
    <section class="level-lane">
      <div class="level-node-wrap">
        <div class="road-hex level-node ${level.completion.is_complete ? 'complete' : 'active'}" data-tooltip="${esc(getNodeDescription('level', level))}">
          <div class="road-hex-inner">
            <div class="hex-kicker">${esc(level.name)}</div>
            <div class="hex-title">${esc(level.title)}</div>
            <div class="hex-subtitle">${level.completion.completed}/${level.completion.total}</div>
          </div>
        </div>
      </div>
      <div class="topic-forest">
        ${level.topics.map(renderTopic).join('')}
      </div>
    </section>
  `;
}

function renderSpecialization(spec) {
  return `
    <section class="branch-tree" style="--branch-color:${esc(spec.color)}">
      <div class="branch-root-wrap">
        <div class="road-hex branch-root ${spec.completion.is_complete ? 'complete' : 'active'}" data-tooltip="${esc(getNodeDescription('specialization', spec))}">
          <div class="road-hex-inner">
            <div class="hex-kicker">${esc(spec.icon)} specialization</div>
            <div class="hex-title">${esc(spec.name)}</div>
            <div class="hex-subtitle">${progressPercent(spec.completion)}%</div>
          </div>
        </div>
      </div>
      <div class="level-stack">
        ${spec.levels.map(renderLevel).join('')}
      </div>
    </section>
  `;
}

function renderDestinyBoard() {
  const board = document.getElementById('destinyBoard');
  if (!board) return;
  const columns = getBoardColumns();
  const center = `
    <div class="board-center-wrap">
      <div class="hex-shell center-hex">
        <div class="hex-content">
          <div class="hex-icon"><img src="${createPixelAvatar(adventureState?.pathway?.key || 'arcane_blade', adventureState?.sequence?.sequence || 9, 76)}" alt="Center avatar"></div>
          <div class="hex-title">DEADCATS</div>
          <div class="hex-subtitle">Research Core</div>
        </div>
      </div>
    </div>
  `;
  board.innerHTML = `
    <div class="board-row top-row">${columns[0].map(renderSpecialization).join('')}</div>
    ${center}
    <div class="board-row bottom-row">${columns[1].map(renderSpecialization).join('')}</div>
  `;

  board.querySelectorAll('[data-tooltip]').forEach((node) => {
    node.addEventListener('mouseenter', showTooltip);
    node.addEventListener('mousemove', moveTooltip);
    node.addEventListener('mouseleave', hideTooltip);
  });
  board.querySelectorAll('[data-skill-id]').forEach((node) => {
    const locked = node.getAttribute('data-disabled') === '1';
    if (!locked) {
      node.addEventListener('click', () => unlockSkill(node.getAttribute('data-skill-id')));
    }
  });
}

async function unlockSkill(skillId) {
  const beforeSequence = adventureState?.sequence?.sequence;
  const res = await authFetch('/api/research-adventure/unlock-skill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skill_id: skillId }),
  });
  if (!res.ok) {
    showToast((await safeDetail(res)) || 'Unlock failed', 'error');
    return;
  }
  adventureState = await res.json();
  renderAll();
  showToast('Skill completed', 'success');
  if (beforeSequence !== adventureState?.sequence?.sequence) {
    showToast(`Sequence advanced to ${adventureState.sequence.sequence}`, 'success');
  }
}

function renderTasks() {
  const tasks = adventureState?.daily_tasks || [];
  const list = document.getElementById('tasksList');
  const due = new Date();
  due.setDate(due.getDate() + 1);
  document.getElementById('taskDueInput').value = due.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const pendingCount = tasks.filter((task) => task.status === 'pending').length;
  document.getElementById('taskCountTag').textContent = `${pendingCount} / 5 ACTIVE`;
  if (!tasks.length) {
    list.innerHTML = '<div class="empty-state">No daily tasks queued yet.</div>';
    return;
  }
  list.innerHTML = tasks.map((task) => `
    <article class="task-card ${esc(task.status)}">
      <small>${task.status}</small>
      <h3>${esc(task.title)}</h3>
      <div class="task-meta">
        <span>${Number(task.points)} pts</span>
        <span>Due ${esc(task.due_date)}</span>
        <span>${task.penalty_applied ? 'Penalty applied' : 'Pending review'}</span>
      </div>
      <p>${task.status === 'missed' ? 'Missed task. Points were deducted from total progression.' : task.status === 'completed' ? `Completed ${formatDateTime(task.completed_at)}` : 'Complete it tomorrow to bank the reward.'}</p>
      <div class="task-actions">
        ${task.status === 'pending' ? `<button class="done" data-complete-task="${task.id}">Complete</button><button class="danger" data-delete-task="${task.id}">Delete</button>` : ''}
      </div>
    </article>
  `).join('');
  list.querySelectorAll('[data-complete-task]').forEach((button) => {
    button.addEventListener('click', () => mutateTask(`/api/research-adventure/daily-tasks/${button.getAttribute('data-complete-task')}/complete`, 'POST', 'Task completed'));
  });
  list.querySelectorAll('[data-delete-task]').forEach((button) => {
    button.addEventListener('click', () => mutateTask(`/api/research-adventure/daily-tasks/${button.getAttribute('data-delete-task')}`, 'DELETE', 'Task removed'));
  });
}

async function mutateTask(url, method, successMessage) {
  const res = await authFetch(url, { method });
  if (!res.ok) {
    showToast((await safeDetail(res)) || 'Task update failed', 'error');
    return;
  }
  adventureState = await res.json();
  renderAll();
  showToast(successMessage, 'success');
}

function setNavState() {
  const navPage = document.querySelector('.nav-page span');
  if (navPage) navPage.textContent = 'research adventure';
  const sidebarLinks = Array.from(document.querySelectorAll('.sidebar .nav-item'));
  for (const link of sidebarLinks) {
    const href = link.getAttribute('href') || '';
    link.classList.toggle('active', href === 'research-adventure.html');
  }
}

async function safeDetail(res) {
  try {
    const payload = await res.json();
    return payload?.detail || '';
  } catch (_) {
    return '';
  }
}

async function loadMeta() {
  const res = await authFetch('/api/research-adventure/meta');
  if (!res.ok) throw new Error('meta');
  metaState = await res.json();
}

async function loadAdventure() {
  const res = await authFetch('/api/research-adventure/me');
  if (!res.ok) throw new Error('adventure');
  adventureState = await res.json();
}

function renderAll() {
  renderPathwayGate();
  renderHero();
  renderJourney();
  renderLadder();
  renderDestinyBoard();
  renderTasks();
}

async function init() {
  currentUser = await fetchMeWithRetry();
  if (!currentUser) {
    window.location.replace('login.html');
    return;
  }
  localStorage.setItem('dc_user', JSON.stringify(currentUser));
  await Promise.all([loadMeta(), loadAdventure()]);
  renderAll();
}

window.addEventListener('partials:loaded', () => {
  setNavState();
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn && !logoutBtn.dataset.boundAdventureLogout) {
    logoutBtn.dataset.boundAdventureLogout = '1';
    logoutBtn.addEventListener('click', (event) => {
      event.preventDefault();
      fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include', keepalive: true })
        .finally(() => {
          localStorage.removeItem('dc_token');
          localStorage.removeItem('dc_user');
          window.location.replace('login.html');
        });
    });
  }
});

document.addEventListener('submit', async (event) => {
  if (event.target?.id !== 'taskForm') return;
  event.preventDefault();
  const title = document.getElementById('taskTitleInput').value.trim();
  const points = Number(document.getElementById('taskPointsInput').value);
  if (!title) {
    showToast('Task title required', 'error');
    return;
  }
  const res = await authFetch('/api/research-adventure/daily-tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, points }),
  });
  if (!res.ok) {
    showToast((await safeDetail(res)) || 'Could not create task', 'error');
    return;
  }
  adventureState = await res.json();
  document.getElementById('taskTitleInput').value = '';
  renderAll();
  showToast('Daily task queued', 'success');
});

init().catch(() => {
  showToast('Research Adventure failed to load', 'error');
});
