import React, { useEffect, useMemo, useState } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import htm from 'https://esm.sh/htm@3.1.1';
import { marked } from 'https://esm.sh/marked@13.0.2';
import { appPath, authFetch, initialsFromHandle, label, RANK_COLORS, timeAgo, truncate, usePortalAuth } from './react-portal-utils.js';

const html = htm.bind(React.createElement);

function App() {
  const { user, setUser, ready } = usePortalAuth();
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [operations, setOperations] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [folderFilter, setFolderFilter] = useState('');
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('preview');
  const [draft, setDraft] = useState({ title: '', content: '', operation_id: '', note_type: 'research-note', research_phase: 'triage', target_name: '', severity: 'info', tags: '', folder_id: '' });
  const [commentInput, setCommentInput] = useState('');

  async function loadBase(targetId = null) {
    const [notesRes, foldersRes, operationsRes] = await Promise.all([
      authFetch('/api/notes/', {}, setUser),
      authFetch('/api/notes/folders', {}, setUser),
      authFetch('/api/operations/', {}, setUser),
    ]);
    const nextNotes = notesRes.ok ? await notesRes.json() : [];
    setNotes(nextNotes);
    setFolders(foldersRes.ok ? await foldersRes.json() : []);
    setOperations(operationsRes.ok ? await operationsRes.json() : []);
    const params = new URLSearchParams(window.location.search);
    const noteId = targetId || Number(params.get('note_id')) || nextNotes[0]?.id || null;
    if (noteId) openNote(noteId, nextNotes);
  }

  async function openNote(id, currentList = notes) {
    const res = await authFetch(`/api/notes/${id}`, {}, setUser);
    if (!res.ok) return;
    const note = await res.json();
    setCurrentNote(note);
    setDraft({
      title: note.title || '',
      content: note.content || '',
      operation_id: note.operation_id ? String(note.operation_id) : '',
      note_type: note.note_type || 'research-note',
      research_phase: note.research_phase || 'triage',
      target_name: note.target_name || '',
      severity: note.severity || 'info',
      tags: Array.isArray(note.tags) ? note.tags.join(', ') : '',
      folder_id: note.folder_id ? String(note.folder_id) : '',
    });
    const [commentsRes, historyRes] = await Promise.all([
      authFetch(`/api/notes/${id}/comments`, {}, setUser),
      authFetch(`/api/notes/${id}/history`, {}, setUser),
    ]);
    setComments(commentsRes.ok ? await commentsRes.json() : []);
    setHistory(historyRes.ok ? await historyRes.json() : []);
    window.history.replaceState(null, '', appPath(`library.html?note_id=${id}`));
    if (!currentList.find((item) => item.id === id)) {
      setNotes((items) => [note, ...items]);
    }
  }

  useEffect(() => {
    if (!ready || !user) return;
    loadBase();
  }, [ready, user]);

  const filteredNotes = useMemo(
    () => notes.filter((note) => (!folderFilter || String(note.folder_id || '') === String(folderFilter)) && (!search.trim() || [note.title, note.content, note.author_handle, note.target_name, ...(note.tags || [])].join(' ').toLowerCase().includes(search.trim().toLowerCase()))),
    [notes, folderFilter, search],
  );

  function newNote() {
    setCurrentNote(null);
    setDraft({ title: '', content: '', operation_id: '', note_type: 'research-note', research_phase: 'triage', target_name: '', severity: 'info', tags: '', folder_id: folderFilter ? String(folderFilter) : '' });
    setComments([]);
    setHistory([]);
    setMode('edit');
  }

  async function saveNote() {
    if (!draft.title.trim()) {
      alert('Title required.');
      return;
    }
    const payload = {
      title: draft.title.trim(),
      content: draft.content,
      operation_id: draft.operation_id ? Number(draft.operation_id) : null,
      note_type: draft.note_type,
      research_phase: draft.research_phase,
      target_name: draft.target_name.trim(),
      severity: draft.severity,
      tags: draft.tags,
      folder_id: draft.folder_id ? Number(draft.folder_id) : null,
      tlp: 'team',
    };
    if (currentNote?.id) payload.base_updated_at = currentNote.updated_at || currentNote.created_at;
    const res = await authFetch(currentNote?.id ? `/api/notes/${currentNote.id}` : '/api/notes/', { method: currentNote?.id ? 'PATCH' : 'POST', body: JSON.stringify(payload) }, setUser);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.detail?.message || err.detail || 'Failed to save note.');
      return;
    }
    const saved = await res.json();
    await loadBase(saved.id);
    setMode('preview');
  }

  async function deleteNote() {
    if (!currentNote?.id) return;
    if (!window.confirm(`Delete "${currentNote.title}"?`)) return;
    const res = await authFetch(`/api/notes/${currentNote.id}`, { method: 'DELETE' }, setUser);
    if (res.ok) {
      setCurrentNote(null);
      setComments([]);
      setHistory([]);
      await loadBase();
    }
  }

  async function addComment() {
    if (!currentNote?.id || !commentInput.trim()) return;
    const res = await authFetch(`/api/notes/${currentNote.id}/comments`, { method: 'POST', body: JSON.stringify({ content: commentInput.trim() }) }, setUser);
    if (res.ok) {
      setCommentInput('');
      openNote(currentNote.id);
    }
  }

  const canEdit = !!(user && (!currentNote || user.is_admin || currentNote.author_id === user.id));

  return html`
    <div className="workspace-shell">
      <header className="workspace-topbar">
        <a className="portal-brand" href=${appPath('dashboard.html')}>
          <div className="portal-mark"></div>
          <div className="portal-brand-copy">
            <div className="portal-kicker">DEADCATS Wiki</div>
            <div className="portal-brand-title">Research library</div>
          </div>
        </a>
        <div className="workspace-topbar-right">
          <a className="portal-nav-link" href=${appPath('dashboard.html')}>Dashboard</a>
          <a className="portal-nav-link" href=${appPath('search.html')}>Search</a>
          <a className="portal-nav-link" href=${appPath('review-board.html')}>Review</a>
          <button className="portal-button primary" onClick=${newNote}>New note</button>
          <div className="workspace-user">
            <div className="workspace-avatar">${initialsFromHandle(user?.handle)}</div>
            <div>
              <div className="portal-mini" style=${{ color: '#f4e9eb' }}>${user?.handle}</div>
              <div className="portal-mini" style=${{ color: RANK_COLORS[user?.rank] || '#8e767d' }}>${user?.rank}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="workspace-layout">
        <aside className="portal-panel workspace-sidebar">
          <div className="workspace-panel-title">Notes</div>
          <div className="workspace-filter-stack">
            <input className="portal-input" value=${search} onInput=${(e) => setSearch(e.target.value)} placeholder="Search notes..." />
            <select className="portal-select" value=${folderFilter} onChange=${(e) => setFolderFilter(e.target.value)}>
              <option value="">All folders</option>
              ${folders.map((folder) => html`<option key=${folder.id} value=${folder.id}>${folder.name}</option>`)}
            </select>
          </div>
          <div className="workspace-list">
            ${filteredNotes.map((note) => html`
              <div key=${note.id} className=${`workspace-list-item ${currentNote?.id === note.id ? 'active' : ''}`} onClick=${() => openNote(note.id)}>
                <div className="workspace-card-title">${note.title}</div>
                <div className="workspace-card-copy">${truncate(note.content || '', 120)}</div>
                <div className="workspace-card-meta">
                  <span className="portal-chip">${note.author_handle || 'unknown'}</span>
                  <span className="portal-chip">${label(note.review_status || 'draft')}</span>
                </div>
              </div>
            `)}
          </div>
        </aside>

        <main className="workspace-main">
          <section className="portal-panel workspace-hero">
            <div className="workspace-actions" style=${{ marginTop: 0 }}>
              <button className=${`portal-button ${mode === 'preview' ? 'primary' : 'ghost'}`} onClick=${() => setMode('preview')}>Preview</button>
              ${canEdit ? html`<button className=${`portal-button ${mode === 'edit' ? 'primary' : 'ghost'}`} onClick=${() => setMode('edit')}>Edit</button>` : null}
            </div>
            ${mode === 'edit' && canEdit ? html`
              <div className="workspace-form">
                <input className="portal-input" value=${draft.title} onInput=${(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Untitled note" />
                <div className="workspace-form-grid">
                  <select className="portal-select" value=${draft.operation_id} onChange=${(e) => setDraft({ ...draft, operation_id: e.target.value })}>
                    <option value="">No operation</option>
                    ${operations.map((operation) => html`<option key=${operation.id} value=${operation.id}>${operation.name}</option>`)}
                  </select>
                  <select className="portal-select" value=${draft.folder_id} onChange=${(e) => setDraft({ ...draft, folder_id: e.target.value })}>
                    <option value="">Root</option>
                    ${folders.map((folder) => html`<option key=${folder.id} value=${folder.id}>${folder.name}</option>`)}
                  </select>
                </div>
                <div className="workspace-form-grid">
                  <input className="portal-input" value=${draft.tags} onInput=${(e) => setDraft({ ...draft, tags: e.target.value })} placeholder="comma,separated,tags" />
                  <input className="portal-input" value=${draft.target_name} onInput=${(e) => setDraft({ ...draft, target_name: e.target.value })} placeholder="target / project" />
                </div>
                <div className="workspace-form-grid">
                  <select className="portal-select" value=${draft.note_type} onChange=${(e) => setDraft({ ...draft, note_type: e.target.value })}>
                    <option value="research-note">Research Note</option>
                    <option value="finding">Finding</option>
                    <option value="playbook">Playbook</option>
                    <option value="paper-draft">Paper Draft</option>
                    <option value="methodology">Methodology</option>
                  </select>
                  <select className="portal-select" value=${draft.research_phase} onChange=${(e) => setDraft({ ...draft, research_phase: e.target.value })}>
                    <option value="triage">Triage</option>
                    <option value="recon">Recon</option>
                    <option value="analysis">Analysis</option>
                    <option value="validation">Validation</option>
                    <option value="drafting">Drafting</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <textarea className="portal-textarea" value=${draft.content} onInput=${(e) => setDraft({ ...draft, content: e.target.value })}></textarea>
                <div className="workspace-actions">
                  <button className="portal-button primary" onClick=${saveNote}>Save</button>
                  ${currentNote?.id ? html`<button className="portal-button ghost" onClick=${deleteNote}>Delete</button>` : null}
                </div>
              </div>
            ` : html`
              <div>
                <div className="portal-chip">${currentNote?.note_type || 'research-note'}</div>
                <h1 className="workspace-hero-title">${draft.title || 'Select or create a note'}</h1>
                <div className="workspace-card-meta">
                  ${currentNote ? html`
                    <span className="portal-chip">${currentNote.author_handle || 'unknown'}</span>
                    <span className="portal-chip">${label(currentNote.review_status || 'draft')}</span>
                    <span className="portal-chip">${timeAgo(currentNote.updated_at || currentNote.created_at)}</span>
                  ` : null}
                </div>
                <div className="workspace-card-copy" dangerouslySetInnerHTML=${{ __html: marked.parse(`# ${draft.title || 'Untitled'}\n\n${draft.content || '*No content yet.*'}`) }}></div>
              </div>
            `}
          </section>

          <section className="workspace-grid">
            <div className="portal-panel workspace-panel">
              <div className="workspace-panel-title">Comments</div>
              <div className="workspace-card-list">
                ${comments.length ? comments.filter((comment) => !comment.parent_id).map((comment) => html`
                  <div key=${comment.id} className="workspace-card">
                    <div className="workspace-card-title">${comment.author_handle || 'unknown'}</div>
                    <div className="workspace-card-copy">${comment.content}</div>
                    <div className="workspace-card-meta"><span className="portal-chip">${timeAgo(comment.updated_at || comment.created_at)}</span></div>
                  </div>
                `) : html`<div className="workspace-empty">No comments yet</div>`}
                ${currentNote?.id ? html`
                  <textarea className="portal-textarea" value=${commentInput} onInput=${(e) => setCommentInput(e.target.value)} placeholder="Leave a comment"></textarea>
                  <div className="workspace-actions"><button className="portal-button primary" onClick=${addComment}>Post comment</button></div>
                ` : null}
              </div>
            </div>

            <div className="portal-panel workspace-panel">
              <div className="workspace-panel-title">History</div>
              <div className="workspace-card-list">
                ${history.length ? history.slice(0, 8).map((revision) => html`
                  <div key=${revision.id} className="workspace-card">
                    <div className="workspace-card-title">${revision.title || 'Untitled'}</div>
                    <div className="workspace-card-meta">
                      <span className="portal-chip">${label(revision.event_type || 'snapshot')}</span>
                      <span className="portal-chip">${revision.actor_handle || 'system'}</span>
                      <span className="portal-chip">${timeAgo(revision.created_at)}</span>
                    </div>
                  </div>
                `) : html`<div className="workspace-empty">No history yet</div>`}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  `;
}

createRoot(document.getElementById('app-root')).render(html`<${App} />`);
