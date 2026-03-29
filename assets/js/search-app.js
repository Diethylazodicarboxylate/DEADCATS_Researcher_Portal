import React, { useEffect, useMemo, useState } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import htm from 'https://esm.sh/htm@3.1.1';
import { appPath, authFetch, initialsFromHandle, RANK_COLORS, timeAgo, usePortalAuth } from './react-portal-utils.js';

const html = htm.bind(React.createElement);

function SearchApp() {
  const { user, setUser, ready } = usePortalAuth();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);

  function loadRecentSearches() {
    try {
      const items = JSON.parse(localStorage.getItem('dc_recent_searches') || '[]');
      setRecentSearches(Array.isArray(items) ? items : []);
    } catch (_) {
      setRecentSearches([]);
    }
  }

  useEffect(() => {
    loadRecentSearches();
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    const type = params.get('type') || '';
    setQuery(q);
    setTypeFilter(type);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    if (q) {
      runSearch(q, params.get('type') || typeFilter || '');
    }
  }, [ready]);

  function persistRecentSearch(q) {
    if (!q) return;
    let items = [];
    try {
      items = JSON.parse(localStorage.getItem('dc_recent_searches') || '[]');
    } catch (_) {
      items = [];
    }
    const next = [q, ...items.filter((item) => item !== q)].slice(0, 6);
    localStorage.setItem('dc_recent_searches', JSON.stringify(next));
    setRecentSearches(next);
  }

  async function runSearch(forcedQuery = query, forcedType = typeFilter) {
    const q = forcedQuery.trim();
    const nextType = forcedType;
    setTypeFilter(nextType);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (nextType) params.set('type', nextType);
    window.history.replaceState(null, '', params.toString() ? appPath(`search.html?${params.toString()}`) : appPath('search.html'));
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    const res = await authFetch(`/api/search/?q=${encodeURIComponent(q)}`, {}, setUser);
    if (!res.ok) {
      setResults({ error: true });
      setLoading(false);
      return;
    }
    const data = await res.json();
    setResults(data);
    persistRecentSearch(q);
    setLoading(false);
  }

  function clearSearch() {
    setQuery('');
    setTypeFilter('');
    setResults(null);
    window.history.replaceState(null, '', appPath('search.html'));
  }

  const sections = useMemo(() => [
    ['notes', 'Notes', 'No matching notes.', 'note'],
    ['comments', 'Discussion', 'No matching comments.', 'comment'],
    ['operations', 'Operations', 'No matching operations.', 'operation'],
    ['iocs', 'Indicators', 'No matching indicators.', 'ioc'],
    ['files', 'Vault Files', 'No matching files.', 'file'],
    ['ctf_events', 'CTF Events', 'No matching CTF events.', 'ctf'],
  ], []);

  const filteredSections = sections.filter(([key]) => !typeFilter || typeFilter === key);

  return html`
    <div className="workspace-shell">
      <header className="workspace-topbar">
        <a className="portal-brand" href=${appPath('dashboard.html')}>
          <div className="portal-mark"></div>
          <div className="portal-brand-copy">
            <div className="portal-kicker">DEADCATS Search</div>
            <div className="portal-brand-title">Portal search</div>
          </div>
        </a>
        <div className="workspace-topbar-right">
          <a className="portal-nav-link" href=${appPath('dashboard.html')}>Dashboard</a>
          <a className="portal-nav-link" href=${appPath('library.html')}>Wiki</a>
          <a className="portal-nav-link" href=${appPath('operations.html')}>Operations</a>
          <a className="portal-nav-link" href=${appPath('ctf.html')}>CTF</a>
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
          <div className="portal-chip hot">Unified search</div>
          <h1 className="workspace-hero-title">Search the whole portal without bouncing between tools.</h1>
          <div className="workspace-hero-copy">Notes, comments, operations, indicators, vault evidence, and CTF work are surfaced in one shared query view on the same red-dark research shell.</div>
          <div className="workspace-search-bar">
            <input
              className="portal-input"
              value=${query}
              onInput=${(event) => setQuery(event.target.value)}
              onKeyDown=${(event) => { if (event.key === 'Enter') runSearch(); }}
              placeholder="Search notes, comments, operations, IOCs, files, CTF events..."
            />
            <select className="portal-select" value=${typeFilter} onChange=${(event) => { setTypeFilter(event.target.value); if (query.trim().length >= 2) runSearch(query, event.target.value); }}>
              <option value="">All result types</option>
              <option value="notes">Notes</option>
              <option value="comments">Discussion</option>
              <option value="operations">Operations</option>
              <option value="iocs">Indicators</option>
              <option value="files">Vault files</option>
              <option value="ctf_events">CTF events</option>
            </select>
            <div className="workspace-actions" style=${{ marginTop: 0 }}>
              <button className="portal-button primary" onClick=${() => runSearch()}>Search</button>
              <button className="portal-button ghost" onClick=${clearSearch}>Clear</button>
            </div>
          </div>
          <div className="workspace-chip-row">
            ${recentSearches.map((item) => html`
              <button key=${item} className="portal-chip workspace-chip-button" onClick=${() => { setQuery(item); runSearch(item, typeFilter); }}>${item}</button>
            `)}
          </div>
        </section>

        <section className="workspace-section-grid">
          ${loading ? html`<div className="portal-panel workspace-panel" style=${{ gridColumn: '1 / -1' }}><div className="workspace-empty">Searching the portal</div></div>` : null}
          ${!loading && results?.error ? html`<div className="portal-panel workspace-panel" style=${{ gridColumn: '1 / -1' }}><div className="workspace-empty">Unable to search right now</div></div>` : null}
          ${!loading && !results ? html`<div className="portal-panel workspace-panel" style=${{ gridColumn: '1 / -1' }}><div className="workspace-empty">Search across notes, discussions, operations, indicators, evidence files, and CTF work</div></div>` : null}
          ${!loading && results && !results.error ? filteredSections.map(([key, title, emptyText, labelText]) => {
            const items = results[key] || [];
            return html`
              <section key=${key} className="portal-panel workspace-panel">
                <div className="workspace-panel-head">
                  <div>
                    <div className="workspace-panel-title">${title}</div>
                    <div className="workspace-panel-copy">${items.length} results</div>
                  </div>
                </div>
                <div className="workspace-card-list">
                  ${items.length ? items.map((item, index) => html`
                    <a key=${`${key}-${index}-${item.href || item.title}`} className="workspace-card" href=${item.href || '#'}>
                      <div className="workspace-card-title">${item.title || 'Untitled'}</div>
                      <div className="workspace-card-copy">${item.excerpt || ''}</div>
                      <div className="workspace-card-meta">
                        <span className="portal-chip">${labelText}</span>
                        ${item.operation_name ? html`<span className="portal-chip">${item.operation_name}</span>` : null}
                        <span className="portal-chip">${item.author || 'unknown'}</span>
                        <span className="portal-chip">${timeAgo(item.updated_at)}</span>
                      </div>
                    </a>
                  `) : html`<div className="workspace-empty">${emptyText}</div>`}
                </div>
              </section>
            `;
          }) : null}
        </section>
      </main>
    </div>
  `;
}

createRoot(document.getElementById('app-root')).render(html`<${SearchApp} />`);
