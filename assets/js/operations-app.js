import React, { useEffect, useMemo, useState } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import htm from 'https://esm.sh/htm@3.1.1';
import { appPath, authFetch, formatDate, initialsFromHandle, label, RANK_COLORS, readCachedUser, timeAgo, truncate, usePortalAuth } from './react-portal-utils.js';

const html = htm.bind(React.createElement);

function OperationsApp() {
  const { user, setUser, ready } = usePortalAuth();
  const [operations, setOperations] = useState([]);
  const [currentOperation, setCurrentOperation] = useState(null);
  const [currentWarRoom, setCurrentWarRoom] = useState(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOperationId, setEditingOperationId] = useState(null);
  const [form, setForm] = useState({ name: '', lead_handle: '', status: 'active', priority: 'medium', summary: '' });

  async function loadOperations(preferredId = null) {
    const res = await authFetch('/api/operations/', {}, setUser);
    const items = res.ok ? await res.json() : [];
    setOperations(items);
    const params = new URLSearchParams(window.location.search);
    const urlId = Number(params.get('id'));
    const targetId = preferredId || urlId || items[0]?.id || null;
    if (targetId) {
      await openOperation(targetId, items);
    } else {
      setCurrentOperation(null);
      setCurrentWarRoom(null);
    }
  }

  async function openOperation(id, currentList = operations) {
    const [detailRes, warRoomRes] = await Promise.all([
      authFetch(`/api/operations/${id}`, {}, setUser),
      authFetch(`/api/operations/${id}/war-room`, {}, setUser),
    ]);
    if (!detailRes.ok) return;
    const detail = await detailRes.json();
    const warRoom = warRoomRes.ok ? await warRoomRes.json() : null;
    setCurrentOperation(detail);
    setCurrentWarRoom(warRoom);
    const known = currentList.find((item) => item.id === detail.id);
    if (!known) {
      setOperations((items) => [...items, detail]);
    }
    window.history.replaceState(null, '', appPath(`operations.html?id=${detail.id}`));
  }

  useEffect(() => {
    if (!ready || !user) return;
    loadOperations();
  }, [ready, user]);

  const filteredOperations = useMemo(
    () => operations.filter((item) => !search.trim() || [item.name, item.summary, item.lead_handle].join(' ').toLowerCase().includes(search.trim().toLowerCase())),
    [operations, search],
  );

  function openModal(operation = null) {
    setEditingOperationId(operation ? operation.id : null);
    setForm({
      name: operation?.name || '',
      lead_handle: operation?.lead_handle || user?.handle || '',
      status: operation?.status || 'active',
      priority: operation?.priority || 'medium',
      summary: operation?.summary || '',
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingOperationId(null);
  }

  async function submitOperation(event) {
    event?.preventDefault();
    if (!form.name.trim()) {
      alert('Operation name required.');
      return;
    }
    const payload = {
      name: form.name.trim(),
      lead_handle: form.lead_handle.trim() || user?.handle,
      status: form.status,
      priority: form.priority,
      summary: form.summary.trim(),
    };
    const url = editingOperationId ? `/api/operations/${editingOperationId}` : '/api/operations/';
    const method = editingOperationId ? 'PATCH' : 'POST';
    const res = await authFetch(url, { method, body: JSON.stringify(payload) }, setUser);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.detail || 'Unable to save operation.');
      return;
    }
    const operation = await res.json();
    closeModal();
    await loadOperations(operation.id);
  }

  async function resetWarRoom() {
    if (!currentOperation) return;
    if (!window.confirm('Reset this operation war room? This will rotate the shared canvas URL.')) return;
    const res = await authFetch(`/api/operations/${currentOperation.id}/war-room/reset`, { method: 'POST' }, setUser);
    if (!res.ok) {
      alert('Unable to reset war room.');
      return;
    }
    setCurrentWarRoom(await res.json());
  }

  const detail = currentOperation;
  const notes = Array.isArray(detail?.notes) ? detail.notes : [];
  const iocs = Array.isArray(detail?.iocs) ? detail.iocs : [];
  const files = Array.isArray(detail?.files) ? detail.files : [];
  const goals = Array.isArray(detail?.goals) ? detail.goals : [];
  const ctfEvents = Array.isArray(detail?.ctf_events) ? detail.ctf_events : [];
  const activity = Array.isArray(detail?.activity) ? detail.activity : [];

  return html`
    <div className="workspace-shell">
      <header className="workspace-topbar">
        <a className="portal-brand" href=${appPath('dashboard.html')}>
          <div className="portal-mark"></div>
          <div className="portal-brand-copy">
            <div className="portal-kicker">DEADCATS Operations</div>
            <div className="portal-brand-title">Case board</div>
          </div>
        </a>
        <div className="workspace-topbar-right">
          <a className="portal-nav-link" href=${appPath('search.html')}>Search</a>
          <a className="portal-nav-link" href=${appPath('library.html')}>Wiki</a>
          <a className="portal-nav-link" href=${appPath('ioc-tracker.html')}>IOC Tracker</a>
          <a className="portal-nav-link" href=${appPath('vault.html')}>Vault</a>
          ${user?.is_admin ? html`<button className="portal-button primary" onClick=${() => openModal()}>Create operation</button>` : null}
          <div className="workspace-user">
            <div className="workspace-avatar">${initialsFromHandle(user?.handle)}</div>
            <div>
              <div className="portal-mini" style=${{ color: '#f4e9eb' }}>${user?.handle || readCachedUser()?.handle || 'unknown'}</div>
              <div className="portal-mini" style=${{ color: RANK_COLORS[user?.rank] || '#8e767d' }}>${user?.rank || 'member'}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="workspace-layout">
        <aside className="portal-panel workspace-sidebar">
          <div className="portal-kicker">Operations</div>
          <div className="workspace-panel-title">Case index</div>
          <div className="workspace-panel-copy">Investigations, priorities, ownership, and cross-tool linkage from a single view.</div>
          <div className="workspace-filter-stack">
            <input className="portal-input" value=${search} onInput=${(event) => setSearch(event.target.value)} placeholder="Search operations..." />
          </div>
          <div className="workspace-list">
            ${filteredOperations.length ? filteredOperations.map((item) => html`
              <div key=${item.id} className=${`workspace-list-item ${detail?.id === item.id ? 'active' : ''}`} onClick=${() => openOperation(item.id)}>
                <div className="workspace-card-title">${item.name}</div>
                <div className="workspace-card-copy">${truncate(item.summary || 'No summary yet.', 120)}</div>
                <div className="workspace-card-meta">
                  <span className="portal-chip">${label(item.status)}</span>
                  <span className="portal-chip ${item.priority === 'critical' || item.priority === 'high' ? 'hot' : ''}">${label(item.priority)}</span>
                </div>
              </div>
            `) : html`<div className="workspace-empty">No matching operations</div>`}
          </div>
        </aside>

        <main className="workspace-main">
          ${detail ? html`
            <section className="portal-panel workspace-hero">
              <div className="portal-chip hot">Operation detail</div>
              <h1 className="workspace-hero-title">${detail.name}</h1>
              <div className="workspace-card-meta">
                <span className="portal-chip">${label(detail.status)}</span>
                <span className="portal-chip ${detail.priority === 'critical' || detail.priority === 'high' ? 'hot' : ''}">${label(detail.priority)}</span>
                <span className="portal-chip">${detail.lead_handle || 'unassigned'}</span>
                <span className="portal-chip">${timeAgo(detail.updated_at || detail.created_at)}</span>
              </div>
              <div className="workspace-hero-copy">${detail.summary || 'No summary yet.'}</div>
              <div className="workspace-actions">
                <a className="portal-button primary" href=${appPath(`library.html?operation_id=${encodeURIComponent(detail.id)}`)}>Open in wiki</a>
                <a className="portal-button ghost" href=${appPath(`ioc-tracker.html?operation_id=${encodeURIComponent(detail.id)}`)}>IOC tracker</a>
                <a className="portal-button ghost" href=${appPath(`vault.html?operation_id=${encodeURIComponent(detail.id)}`)}>Vault</a>
                <a className="portal-button ghost" href=${appPath(`ctf.html?operation_id=${encodeURIComponent(detail.id)}`)}>CTF tracker</a>
                ${currentWarRoom?.room_url ? html`<a className="portal-button ghost" href=${appPath(`whiteboard.html?operation_id=${encodeURIComponent(detail.id)}`)}>War room</a>` : null}
                ${user && (user.is_admin || detail.created_by === user.id) ? html`
                  <button className="portal-button ghost" onClick=${() => openModal(detail)}>Edit operation</button>
                  <button className="portal-button ghost" onClick=${resetWarRoom}>Reset war room</button>
                ` : null}
              </div>
            </section>

            <section className="workspace-stats">
              ${[
                ['Linked notes', detail.note_count || 0],
                ['Linked IOCs', detail.ioc_count || 0],
                ['Linked files', detail.file_count || 0],
                ['Published papers', detail.published_count || 0],
              ].map(([labelText, value]) => html`
                <div key=${labelText} className="portal-panel workspace-stat">
                  <div className="portal-meta">${labelText}</div>
                  <div className="workspace-stat-value">${value}</div>
                </div>
              `)}
            </section>

            <section className="workspace-grid">
              <div className="portal-panel workspace-panel">
                <div className="workspace-panel-head">
                  <div>
                    <div className="workspace-panel-title">Recent notes</div>
                    <div className="workspace-panel-copy">Research output attached to this operation.</div>
                  </div>
                </div>
                <div className="workspace-card-list">
                  ${notes.length ? notes.map((note) => html`
                    <a key=${note.id} className="workspace-card" href=${appPath(`library.html?note_id=${encodeURIComponent(note.id)}`)}>
                      <div className="workspace-card-title">${note.title}</div>
                      <div className="workspace-card-copy">${truncate(note.content || 'No preview', 180)}</div>
                      <div className="workspace-card-meta">
                        <span className="portal-chip">${note.author_handle || 'unknown'}</span>
                        <span className="portal-chip">${label(note.review_status || 'draft')}</span>
                      </div>
                    </a>
                  `) : html`<div className="workspace-empty">No notes linked yet</div>`}
                </div>
              </div>

              <div className="portal-panel workspace-panel">
                <div className="workspace-panel-head">
                  <div>
                    <div className="workspace-panel-title">Evidence and indicators</div>
                    <div className="workspace-panel-copy">IOC and vault material currently attached.</div>
                  </div>
                </div>
                <div className="workspace-card-list">
                  ${iocs.map((ioc) => html`
                    <div key=${`ioc-${ioc.id}`} className="workspace-card">
                      <div className="workspace-card-title">${ioc.value}</div>
                      <div className="workspace-card-copy">${ioc.notes || 'No notes'}</div>
                      <div className="workspace-card-meta">
                        <span className="portal-chip">${ioc.type}</span>
                        <span className="portal-chip">${ioc.severity}</span>
                        <span className="portal-chip">${ioc.author}</span>
                      </div>
                    </div>
                  `)}
                  ${files.map((file) => html`
                    <div key=${`file-${file.id}`} className="workspace-card">
                      <div className="workspace-card-title">${file.original_name}</div>
                      <div className="workspace-card-copy">${file.description || 'Vault evidence file'}</div>
                      <div className="workspace-card-meta">
                        <span className="portal-chip">file</span>
                        <span className="portal-chip">${file.author}</span>
                        <span className="portal-chip">${timeAgo(file.created_at)}</span>
                      </div>
                    </div>
                  `)}
                  ${!iocs.length && !files.length ? html`<div className="workspace-empty">No evidence linked yet</div>` : null}
                </div>
              </div>
            </section>

            <section className="workspace-grid">
              <div className="portal-panel workspace-panel">
                <div className="workspace-panel-head">
                  <div>
                    <div className="workspace-panel-title">Operation goals</div>
                    <div className="workspace-panel-copy">Current objective stack for this case.</div>
                  </div>
                </div>
                <div className="workspace-card-list">
                  ${goals.length ? goals.map((goal, index) => html`
                    <div key=${`goal-${index}-${goal.text}`} className="workspace-card">
                      <div className="workspace-card-title">${goal.completed ? '[Done] ' : '[Open] '}${goal.text}</div>
                      <div className="workspace-card-copy">${goal.completed ? `Completed by ${goal.completed_by || 'unknown'}` : `Added by ${goal.created_by || 'unknown'}`}</div>
                    </div>
                  `) : html`<div className="workspace-empty">No goals yet</div>`}
                </div>
              </div>

              <div className="portal-panel workspace-panel">
                <div className="workspace-panel-head">
                  <div>
                    <div className="workspace-panel-title">Linked CTF events</div>
                    <div className="workspace-panel-copy">Operational CTF work tied to this case.</div>
                  </div>
                </div>
                <div className="workspace-card-list">
                  ${ctfEvents.length ? ctfEvents.map((event) => html`
                    <div key=${event.id} className="workspace-card">
                      <div className="workspace-card-title">${event.title}</div>
                      <div className="workspace-card-copy">${event.description || 'No description'}</div>
                      <div className="workspace-card-meta">
                        <span className="portal-chip">${label(event.status || 'upcoming')}</span>
                        <span className="portal-chip">${event.format || 'mixed'}</span>
                        <span className="portal-chip">${formatDate(event.start_time)}</span>
                      </div>
                    </div>
                  `) : html`<div className="workspace-empty">No linked CTF events</div>`}
                </div>
              </div>
            </section>

            <section className="portal-panel workspace-panel">
              <div className="workspace-panel-head">
                <div>
                  <div className="workspace-panel-title">Activity timeline</div>
                  <div className="workspace-panel-copy">Cross-tool activity for this operation.</div>
                </div>
              </div>
              <div className="workspace-card-list">
                ${activity.length ? activity.map((item, index) => html`
                  <div key=${`${item.kind}-${item.id}-${index}`} className="workspace-card">
                    <div className="workspace-card-title">${item.title || 'Untitled'}</div>
                    <div className="workspace-card-meta">
                      <span className="portal-chip">${label(item.kind)}</span>
                      <span className="portal-chip">${item.author || 'unknown'}</span>
                      <span className="portal-chip">${timeAgo(item.created_at)}</span>
                    </div>
                  </div>
                `) : html`<div className="workspace-empty">No activity yet</div>`}
              </div>
            </section>
          ` : html`<section className="portal-panel workspace-hero"><div className="workspace-empty">Select an operation</div></section>`}
        </main>
      </div>

      ${modalOpen ? html`
        <div className="workspace-modal-backdrop" onClick=${closeModal}>
          <div className="portal-panel workspace-modal" onClick=${(event) => event.stopPropagation()}>
            <div className="portal-kicker">Operations</div>
            <div className="workspace-panel-title">${editingOperationId ? 'Edit operation' : 'Create operation'}</div>
            <form className="workspace-form" onSubmit=${submitOperation}>
              <div>
                <label className="portal-label">Operation name</label>
                <input className="portal-input" value=${form.name} onInput=${(event) => setForm((value) => ({ ...value, name: event.target.value }))} />
              </div>
              <div className="workspace-form-grid">
                <div>
                  <label className="portal-label">Lead handle</label>
                  <input className="portal-input" value=${form.lead_handle} onInput=${(event) => setForm((value) => ({ ...value, lead_handle: event.target.value }))} />
                </div>
                <div>
                  <label className="portal-label">Status</label>
                  <select className="portal-select" value=${form.status} onChange=${(event) => setForm((value) => ({ ...value, status: event.target.value }))}>
                    <option value="active">Active</option>
                    <option value="planning">Planning</option>
                    <option value="on_hold">On Hold</option>
                    <option value="closed">Closed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="workspace-form-grid">
                <div>
                  <label className="portal-label">Priority</label>
                  <select className="portal-select" value=${form.priority} onChange=${(event) => setForm((value) => ({ ...value, priority: event.target.value }))}>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="portal-label">Summary</label>
                <textarea className="portal-textarea" value=${form.summary} onInput=${(event) => setForm((value) => ({ ...value, summary: event.target.value }))}></textarea>
              </div>
              <div className="workspace-actions">
                <button className="portal-button ghost" type="button" onClick=${closeModal}>Cancel</button>
                <button className="portal-button primary" type="submit">${editingOperationId ? 'Save changes' : 'Create operation'}</button>
              </div>
            </form>
          </div>
        </div>
      ` : null}
    </div>
  `;
}

createRoot(document.getElementById('app-root')).render(html`<${OperationsApp} />`);
