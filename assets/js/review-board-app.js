import React, { useEffect, useMemo, useState } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import htm from 'https://esm.sh/htm@3.1.1';
import { appPath, authFetch, initialsFromHandle, navigate, RANK_COLORS, timeAgo, truncate, usePortalAuth } from './react-portal-utils.js';

const html = htm.bind(React.createElement);

function ReviewBoardApp() {
  const { user, setUser, ready } = usePortalAuth();
  const [queueData, setQueueData] = useState({ in_review: [], approved: [], recently_published: [] });
  const [publishFolders, setPublishFolders] = useState([]);
  const [search, setSearch] = useState('');
  const [folderFilter, setFolderFilter] = useState('');
  const [blocked, setBlocked] = useState(false);

  async function loadQueue() {
    const [meRes, queueRes, folderRes] = await Promise.all([
      authFetch('/api/auth/me', {}, setUser),
      authFetch('/api/notes/review-queue', {}, setUser),
      authFetch('/api/notes/publish-folders', {}, setUser),
    ]);
    if (!meRes.ok) return;
    const me = await meRes.json();
    if (!me.is_admin) {
      setBlocked(true);
      navigate('dashboard.html', { replace: true });
      return;
    }
    setBlocked(false);
    setQueueData(queueRes.ok ? await queueRes.json() : { in_review: [], approved: [], recently_published: [] });
    setPublishFolders(folderRes.ok ? await folderRes.json() : []);
  }

  useEffect(() => {
    if (!ready || !user) return;
    loadQueue();
  }, [ready, user]);

  const matchesFilters = (item) => {
    const hay = [item.title, item.author_handle, item.operation_name, item.public_title, item.publish_folder_name].join(' ').toLowerCase();
    if (search.trim() && !hay.includes(search.trim().toLowerCase())) return false;
    if (folderFilter && String(item.publish_folder_name || '') !== folderFilter) return false;
    return true;
  };

  const columns = useMemo(() => [
    ['in_review', 'Needs review', 'Open note', 'library.html?note_id=', 'warn'],
    ['approved', 'Approved drafts', 'Open note', 'library.html?note_id=', 'good'],
    ['recently_published', 'Recently published', 'Open note', 'library.html?note_id=', ''],
  ], []);

  return html`
    <div className="workspace-shell">
      <header className="workspace-topbar">
        <a className="portal-brand" href=${appPath('dashboard.html')}>
          <div className="portal-mark"></div>
          <div className="portal-brand-copy">
            <div className="portal-kicker">DEADCATS Review Board</div>
            <div className="portal-brand-title">Publication control</div>
          </div>
        </a>
        <div className="workspace-topbar-right">
          <a className="portal-nav-link" href=${appPath('dashboard.html')}>Dashboard</a>
          <a className="portal-nav-link" href=${appPath('search.html')}>Search</a>
          <a className="portal-nav-link" href=${appPath('library.html')}>Wiki</a>
          <a className="portal-nav-link" href=${appPath('research-feed.html')}>Public feed</a>
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
        <section className="portal-panel workspace-hero">
          <div className="portal-chip hot">Admin workflow</div>
          <h1 className="workspace-hero-title">Review board for approvals, exports, and public publication state.</h1>
          <div className="workspace-hero-copy">This page now matches the portal shell instead of living as a separate visual island. Queue triage, approvals, and recent publications stay visible in one board.</div>
          <div className="workspace-search-bar">
            <input className="portal-input" value=${search} onInput=${(event) => setSearch(event.target.value)} placeholder="Filter by title, author, operation..." />
            <select className="portal-select" value=${folderFilter} onChange=${(event) => setFolderFilter(event.target.value)}>
              <option value="">All publish folders</option>
              ${publishFolders.map((folder) => html`<option key=${folder.id} value=${folder.name}>${folder.name}</option>`)}
            </select>
            <div className="workspace-actions" style=${{ marginTop: 0 }}>
              <a className="portal-button primary" href=${appPath('research-feed.html')}>Open public feed</a>
            </div>
          </div>
        </section>

        ${blocked ? null : html`
          <section className="workspace-stats">
            ${[
              ['Needs review', (queueData.in_review || []).length],
              ['Approved', (queueData.approved || []).length],
              ['Published', (queueData.recently_published || []).length],
              ['Publish folders', publishFolders.length],
            ].map(([labelText, value]) => html`
              <div key=${labelText} className="portal-panel workspace-stat">
                <div className="portal-meta">${labelText}</div>
                <div className="workspace-stat-value">${value}</div>
              </div>
            `)}
          </section>

          <section className="workspace-columns">
            ${columns.map(([key, title, actionLabel, hrefBase, accent]) => {
              const items = (queueData[key] || []).filter(matchesFilters);
              return html`
                <section key=${key} className="portal-panel workspace-column">
                  <div className="workspace-panel-head">
                    <div>
                      <div className="workspace-panel-title">${title}</div>
                      <div className="workspace-panel-copy">${items.length} items</div>
                    </div>
                  </div>
                  <div className="workspace-column-list">
                    ${items.length ? items.map((item) => html`
                      <div key=${item.id} className="workspace-card">
                        <div className="workspace-card-title">${item.title}</div>
                        <div className="workspace-card-copy">${truncate(item.content || '', 180) || 'No preview'}</div>
                        <div className="workspace-card-meta">
                          <span className="portal-chip">${item.author_handle || 'unknown'}</span>
                          <span className="portal-chip">${item.operation_name || 'no operation'}</span>
                          ${item.publish_folder_name ? html`<span className="portal-chip">${item.publish_folder_name}</span>` : null}
                          <span className=${`portal-chip ${accent}`}>${timeAgo(item.updated_at || item.created_at)}</span>
                        </div>
                        <div className="workspace-actions">
                          <a className="portal-button ghost" href=${appPath(`${hrefBase}${encodeURIComponent(item.id)}`)}>${actionLabel}</a>
                          ${key === 'approved' ? html`<a className="portal-button primary" href=${appPath(`library.html?note_id=${encodeURIComponent(item.id)}`)}>Export</a>` : null}
                          ${key === 'recently_published' && item.public_slug ? html`<a className="portal-button primary" href=${appPath(`paper.html?slug=${encodeURIComponent(item.public_slug)}`)}>Public page</a>` : null}
                        </div>
                      </div>
                    `) : html`<div className="workspace-empty">Nothing here</div>`}
                  </div>
                </section>
              `;
            })}
          </section>
        `}
      </main>
    </div>
  `;
}

createRoot(document.getElementById('app-root')).render(html`<${ReviewBoardApp} />`);
