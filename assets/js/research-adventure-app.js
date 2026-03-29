import React, { useEffect, useMemo, useState } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import htm from 'https://esm.sh/htm@3.1.1';
import { appPath, authFetch, initialsFromHandle, navigate, RANK_COLORS, usePortalAuth } from './react-portal-utils.js';

const html = htm.bind(React.createElement);

const PATHWAY_THEMES = {
  arcane_blade: 'arcane',
  ruin_artificer: 'ruin',
  shadow_conductor: 'shadow',
};

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

function progressPercent(progress) {
  if (!progress) return 0;
  if (progress.next_min_points == null) return 100;
  const span = progress.next_min_points - progress.current_min_points;
  if (span <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((progress.progress_points / span) * 100)));
}

function dueTomorrowString() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function taskStatusChip(task) {
  if (task.status === 'completed') return 'good';
  if (task.status === 'missed') return 'hot';
  return '';
}

function App() {
  const { user, setUser, ready } = usePortalAuth();
  const [meta, setMeta] = useState(null);
  const [state, setState] = useState(null);
  const [busyAction, setBusyAction] = useState('');
  const [taskForm, setTaskForm] = useState({ title: '', points: 15, due_date: dueTomorrowString() });
  const [error, setError] = useState('');

  async function loadAdventure() {
    const [metaRes, meRes] = await Promise.all([
      authFetch('/api/research-adventure/meta', {}, setUser),
      authFetch('/api/research-adventure/me', {}, setUser),
    ]);
    setMeta(metaRes.ok ? await metaRes.json() : null);
    if (meRes.ok) {
      setState(await meRes.json());
      setError('');
      return;
    }
    const detail = await meRes.json().catch(() => ({}));
    if (meRes.status === 409) {
      setState({ selected: false });
      setError(detail.detail || '');
      return;
    }
    setState(null);
    setError(detail.detail || 'Unable to load Research Adventure.');
  }

  useEffect(() => {
    if (!ready || !user) return;
    loadAdventure();
  }, [ready, user]);

  async function selectPathway(pathwayKey) {
    setBusyAction(`pathway:${pathwayKey}`);
    const res = await authFetch('/api/research-adventure/select-pathway', {
      method: 'POST',
      body: JSON.stringify({ pathway_key: pathwayKey }),
      headers: { 'Content-Type': 'application/json' },
    }, setUser);
    setBusyAction('');
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      setError(detail.detail || 'Could not lock pathway.');
      return;
    }
    navigate('research-adventure.html', { replace: true });
  }

  async function unlockSkill(skillId) {
    setBusyAction(`skill:${skillId}`);
    const res = await authFetch('/api/research-adventure/unlock-skill', {
      method: 'POST',
      body: JSON.stringify({ skill_id: skillId }),
      headers: { 'Content-Type': 'application/json' },
    }, setUser);
    setBusyAction('');
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      setError(detail.detail || 'Could not unlock skill.');
      return;
    }
    await loadAdventure();
  }

  async function createTask() {
    if (!taskForm.title.trim()) {
      setError('Task title is required.');
      return;
    }
    setBusyAction('task:create');
    const res = await authFetch('/api/research-adventure/daily-tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: taskForm.title.trim(),
        points: Number(taskForm.points),
        due_date: taskForm.due_date || undefined,
      }),
      headers: { 'Content-Type': 'application/json' },
    }, setUser);
    setBusyAction('');
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      setError(detail.detail || 'Could not create task.');
      return;
    }
    setTaskForm({ title: '', points: 15, due_date: dueTomorrowString() });
    setState(await res.json());
    setError('');
  }

  async function completeTask(taskId) {
    setBusyAction(`task:complete:${taskId}`);
    const res = await authFetch(`/api/research-adventure/daily-tasks/${taskId}/complete`, {
      method: 'POST',
    }, setUser);
    setBusyAction('');
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      setError(detail.detail || 'Could not complete task.');
      return;
    }
    setState(await res.json());
    setError('');
  }

  async function deleteTask(taskId) {
    setBusyAction(`task:delete:${taskId}`);
    const res = await authFetch(`/api/research-adventure/daily-tasks/${taskId}`, {
      method: 'DELETE',
    }, setUser);
    setBusyAction('');
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      setError(detail.detail || 'Could not delete task.');
      return;
    }
    setState(await res.json());
    setError('');
  }

  const selectedTheme = PATHWAY_THEMES[state?.pathway?.key] || 'arcane';
  const sequenceProgress = state?.sequence_progress;
  const currentSequence = state?.sequence;
  const totalPoints = state?.points?.total || 0;

  return html`
    <div className="workspace-shell">
      <header className="workspace-topbar">
        <a className="portal-brand" href=${appPath('dashboard.html')}>
          <div className="portal-mark"></div>
          <div className="portal-brand-copy">
            <div className="portal-kicker">DEADCATS Research Adventure</div>
            <div className="portal-brand-title">Progression board</div>
          </div>
        </a>
        <div className="workspace-topbar-right">
          <a className="portal-nav-link" href=${appPath('dashboard.html')}>Dashboard</a>
          <a className="portal-nav-link" href=${appPath('members.html')}>Members</a>
          <div className="workspace-user">
            <div className="workspace-avatar">${initialsFromHandle(user?.handle)}</div>
            <div>
              <div className="portal-mini" style=${{ color: '#f4e9eb' }}>${user?.handle || 'unknown'}</div>
              <div className="portal-mini" style=${{ color: RANK_COLORS[user?.rank] || '#8e767d' }}>${user?.rank || 'member'}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="portal-main">
        <div className="adventure-shell" data-theme=${selectedTheme}>
          ${error ? html`<div className="portal-error">${error}</div>` : null}

          ${state && state.selected === false && meta ? html`
            <section className="portal-panel workspace-panel adventure-hero">
              <div className="portal-chip hot">Pathway selection</div>
              <h1 className="workspace-hero-title">Choose a pathway before the progression ladder unlocks.</h1>
              <div className="workspace-hero-copy">The old UI mixed decorative complexity with unclear state changes. This rewrite makes the lock-in step explicit and keeps the three routes readable.</div>
            </section>

            <section className="adventure-pathways">
              ${meta.pathways.map((pathway) => html`
                <article key=${pathway.key} className="portal-panel adventure-pathway">
                  <div className="portal-chip">${pathway.crest} pathway</div>
                  <img className="adventure-pathway-avatar" src=${createPixelAvatar(pathway.key, 9, 128)} alt=${pathway.name} />
                  <div className="adventure-pathway-title">${pathway.name}</div>
                  <div className="adventure-pathway-copy">${pathway.core_concept}</div>
                  <ul className="adventure-pathway-list">
                    ${pathway.sequences.slice(0, 3).map((sequence) => html`<li key=${sequence.sequence}>Sequence ${sequence.sequence} · ${sequence.title}</li>`)}
                  </ul>
                  <button className="portal-button primary" disabled=${busyAction === `pathway:${pathway.key}`} onClick=${() => selectPathway(pathway.key)}>
                    ${busyAction === `pathway:${pathway.key}` ? 'Locking pathway...' : 'Lock pathway'}
                  </button>
                </article>
              `)}
            </section>
          ` : null}

          ${state && state.selected && meta ? html`
            <section className="portal-panel workspace-hero adventure-hero">
              <div className="adventure-grid">
                <div className="adventure-column">
                  <div className="adventure-avatar-wrap">
                    <img className="adventure-avatar" src=${createPixelAvatar(state.pathway.key, currentSequence?.sequence, 196)} alt="Pathway avatar" />
                  </div>
                  <div>
                    <div className="adventure-sequence">${state.pathway.name}</div>
                    <div className="adventure-heading">Sequence ${currentSequence?.sequence} · ${currentSequence?.title}</div>
                    <div className="adventure-summary">${currentSequence?.summary}</div>
                    <div className="adventure-stat-grid">
                      <div className="adventure-stat">
                        <div className="portal-meta">Total points</div>
                        <div className="adventure-stat-value">${totalPoints}</div>
                      </div>
                      <div className="adventure-stat">
                        <div className="portal-meta">Skill points</div>
                        <div className="adventure-stat-value">${state.points.skills}</div>
                      </div>
                      <div className="adventure-stat">
                        <div className="portal-meta">Daily points</div>
                        <div className="adventure-stat-value">${state.points.daily_completed - state.points.daily_penalties}</div>
                      </div>
                    </div>
                    <div className="adventure-progress">
                      <div className="adventure-progress-track">
                        <div className="adventure-progress-bar" style=${{ width: `${progressPercent(sequenceProgress)}%` }}></div>
                      </div>
                      <div className="adventure-progress-meta">
                        ${sequenceProgress?.next_sequence == null
                          ? 'Sequence 0 reached. No further milestone remains.'
                          : `${sequenceProgress?.needed_points || 0} more points needed for Sequence ${sequenceProgress?.next_sequence}`}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="adventure-column">
                  <section className="portal-panel workspace-panel">
                    <div className="workspace-panel-title">Sequence ladder</div>
                    <div className="workspace-panel-copy">Clear milestone order, no broken hover chains, no hidden progression state.</div>
                    <div className="adventure-ladder">
                      ${state.pathway.sequences.map((sequence) => {
                        const unlocked = sequence.sequence >= currentSequence.sequence;
                        const milestone = meta.sequence_milestones.find((item) => item.sequence === sequence.sequence);
                        return html`
                          <div key=${sequence.sequence} className=${`adventure-ladder-row ${unlocked ? '' : 'locked'} ${sequence.sequence === currentSequence.sequence ? 'active' : ''}`}>
                            <img className="adventure-ladder-avatar" src=${createPixelAvatar(state.pathway.key, sequence.sequence, 72)} alt=${`Sequence ${sequence.sequence}`} />
                            <div>
                              <div className="adventure-ladder-title">Sequence ${sequence.sequence} · ${sequence.title}</div>
                              <div className="adventure-ladder-copy">${sequence.summary}</div>
                            </div>
                            <div className="adventure-ladder-points">${milestone ? `${milestone.min_points} pts` : ''}</div>
                          </div>
                        `;
                      })}
                    </div>
                  </section>
                </div>
              </div>
            </section>

            <section className="portal-panel workspace-panel">
              <div className="workspace-panel-title">Destiny board</div>
              <div className="workspace-panel-copy">The original page tried to be ornate and ended up brittle. This version keeps the roadmap structure while making unlockable skills and blocked states obvious.</div>
              <div className="adventure-board">
                ${state.specializations.map((specialization) => html`
                  <article key=${specialization.id} className="portal-panel adventure-spec">
                    <div className="adventure-spec-head">
                      <div>
                        <div className="adventure-spec-title">${specialization.icon} ${specialization.name}</div>
                        <div className="adventure-spec-copy">${specialization.summary}</div>
                      </div>
                      <div className="portal-chip">${specialization.completion.completed}/${specialization.completion.total} skills</div>
                    </div>
                    <div className="adventure-levels">
                      ${specialization.levels.map((level) => html`
                        <section key=${level.id} className="adventure-level">
                          <div className="adventure-level-head">
                            <div>
                              <div className="adventure-level-title">${level.name} · ${level.title}</div>
                              <div className="adventure-level-copy">${level.summary}</div>
                            </div>
                            <div className="portal-chip">${level.completion.completed}/${level.completion.total}</div>
                          </div>
                          <div className="adventure-topics">
                            ${level.topics.map((topic) => html`
                              <div key=${topic.id} className="adventure-topic">
                                <div className="adventure-topic-head">
                                  <div>
                                    <div className="adventure-topic-title">${topic.name}</div>
                                    <div className="adventure-topic-copy">${topic.summary}</div>
                                  </div>
                                  <div className="portal-chip ${topic.available ? '' : 'hot'}">${topic.completion.completed}/${topic.completion.total}</div>
                                </div>
                                <div className="adventure-skills">
                                  ${topic.skills.map((skill) => {
                                    const stateClass = skill.unlocked ? 'unlocked' : skill.available ? 'available' : 'locked';
                                    return html`
                                      <div key=${skill.id} className=${`adventure-skill ${stateClass}`}>
                                        <div className="adventure-skill-title">${skill.name}</div>
                                        <div className="adventure-skill-copy">${skill.summary}</div>
                                        <div className="adventure-skill-actions">
                                          <span className="portal-chip">${skill.points} pts</span>
                                          ${skill.unlocked
                                            ? html`<span className="portal-chip good">Completed</span>`
                                            : skill.available
                                              ? html`<button className="portal-button primary" disabled=${busyAction === `skill:${skill.id}`} onClick=${() => unlockSkill(skill.id)}>${busyAction === `skill:${skill.id}` ? 'Unlocking...' : 'Unlock'}</button>`
                                              : html`<span className="portal-chip hot">Locked</span>`}
                                        </div>
                                      </div>
                                    `;
                                  })}
                                </div>
                              </div>
                            `)}
                          </div>
                        </section>
                      `)}
                    </div>
                  </article>
                `)}
              </div>
            </section>

            <section className="portal-panel workspace-panel">
              <div className="workspace-panel-title">Daily tasks</div>
              <div className="workspace-panel-copy">Task creation, completion, and deletion are now explicit and predictable. The backend still enforces tomorrow-only scheduling and active task limits.</div>
              <div className="adventure-tasks">
                <div className="adventure-task-form">
                  <div className="workspace-form">
                    <div>
                      <label className="portal-label">Task title</label>
                      <input className="portal-input" value=${taskForm.title} onInput=${(event) => setTaskForm((value) => ({ ...value, title: event.target.value }))} placeholder="Plan one concrete task for tomorrow" />
                    </div>
                    <div>
                      <label className="portal-label">Points</label>
                      <select className="portal-select" value=${String(taskForm.points)} onChange=${(event) => setTaskForm((value) => ({ ...value, points: Number(event.target.value) }))}>
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                        <option value="25">25</option>
                        <option value="30">30</option>
                      </select>
                    </div>
                    <div>
                      <label className="portal-label">Due date</label>
                      <input className="portal-input" type="date" value=${taskForm.due_date} onInput=${(event) => setTaskForm((value) => ({ ...value, due_date: event.target.value }))} />
                    </div>
                    <button className="portal-button primary" disabled=${busyAction === 'task:create'} onClick=${createTask}>
                      ${busyAction === 'task:create' ? 'Creating task...' : 'Create task'}
                    </button>
                  </div>
                </div>
                <div className="adventure-task-list">
                  ${state.daily_tasks.length ? state.daily_tasks.map((task) => html`
                    <article key=${task.id} className=${`adventure-task ${task.status}`}>
                      <div className="adventure-task-title">${task.title}</div>
                      <div className="adventure-task-meta">
                        <span className={`portal-chip ${taskStatusChip(task)}`}>${task.status}</span>
                        <span className="portal-chip">${task.points} pts</span>
                        <span className="portal-chip">due ${task.due_date}</span>
                      </div>
                      <div className="adventure-task-copy">
                        ${task.status === 'completed'
                          ? `Completed at ${task.completed_at || 'unknown time'}`
                          : task.status === 'missed'
                            ? 'Missed tasks stay visible so penalties remain explainable.'
                            : 'Pending task ready for tomorrow.'}
                      </div>
                      <div className="adventure-task-actions">
                        ${task.status === 'pending' ? html`
                          <button className="portal-button primary" disabled=${busyAction === `task:complete:${task.id}`} onClick=${() => completeTask(task.id)}>
                            ${busyAction === `task:complete:${task.id}` ? 'Completing...' : 'Complete'}
                          </button>
                          <button className="portal-button ghost" disabled=${busyAction === `task:delete:${task.id}`} onClick=${() => deleteTask(task.id)}>
                            ${busyAction === `task:delete:${task.id}` ? 'Deleting...' : 'Delete'}
                          </button>
                        ` : null}
                      </div>
                    </article>
                  `) : html`<div className="workspace-empty">No daily tasks yet</div>`}
                </div>
              </div>
            </section>
          ` : null}
        </div>
      </main>
    </div>
  `;
}

createRoot(document.getElementById('app-root')).render(html`<${App} />`);
