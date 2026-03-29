import React from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import htm from 'https://esm.sh/htm@3.1.1';
import { appPath } from './react-portal-utils.js';

const html = htm.bind(React.createElement);

function LandingApp() {
  const modules = [
    {
      title: 'Research library',
      copy: 'Shared notes, revision history, review workflow, and publication control in one internal workspace.',
      href: appPath('library.html'),
      cta: 'Open internal wiki',
    },
    {
      title: 'Operations tracking',
      copy: 'Tie notes, indicators, vault evidence, goals, and CTF work into actual investigations.',
      href: appPath('operations.html'),
      cta: 'Open operations',
    },
    {
      title: 'Public research',
      copy: 'Keep a clear separation between the internal wiki and the outward-facing published research feed.',
      href: appPath('research-feed.html'),
      cta: 'Open public wiki',
    },
  ];

  const pillars = [
    {
      title: 'Private by default',
      copy: 'The portal is built for internal research flow first. Public output is a deliberate export step, not a leak-prone side effect.',
    },
    {
      title: 'Research-first workflow',
      copy: 'Notes, IOCs, vault files, whiteboard items, and review state are treated as one operational graph instead of disconnected tools.',
    },
    {
      title: 'Cleaner operator UI',
      copy: 'The old landing page was loud. This version keeps the hacker tone, but uses real hierarchy, spacing, and contrast instead of eye strain.',
    },
  ];

  return html`
    <div className="portal-shell">
      <header className="portal-topbar">
        <a className="portal-brand" href=${appPath('index.html')}>
          <div className="portal-mark"></div>
          <div className="portal-brand-copy">
            <div className="portal-kicker">DEADCATS Research Portal</div>
            <div className="portal-brand-title">Entry node</div>
          </div>
        </a>
        <nav className="portal-nav">
          <a className="portal-nav-link" href=${appPath('research-feed.html')}>Public Wiki</a>
          <a className="portal-nav-link" href=${appPath('login.html')}>Login</a>
          <a className="portal-nav-link" href=${appPath('dashboard.html')}>Dashboard</a>
        </nav>
      </header>

      <main className="portal-main">
        <section className="landing-hero">
          <div className="portal-panel landing-panel">
            <div className="portal-chip hot">Internal research environment</div>
            <h1 className="landing-title">A tighter front door for the DEADCATS portal.</h1>
            <div className="landing-copy">
              The landing page now follows the same darker red research-console direction as the dashboard. It is less noisy, easier to scan, and keeps the separation between internal collaboration and public publishing explicit.
            </div>
            <div className="landing-actions">
              <a className="portal-button primary" href=${appPath('login.html')}>Access portal</a>
              <a className="portal-button ghost" href=${appPath('research-feed.html')}>Public wiki</a>
              <a className="portal-button ghost" href=${appPath('dashboard.html')}>Dashboard</a>
            </div>
            <div className="landing-stats">
              <div className="landing-stat">
                <div className="portal-meta">Environment</div>
                <div className="landing-stat-value">Private</div>
                <div className="portal-mini">Internal collaboration workspace</div>
              </div>
              <div className="landing-stat">
                <div className="portal-meta">Publishing</div>
                <div className="landing-stat-value">Curated</div>
                <div className="portal-mini">Public research is exported intentionally</div>
              </div>
              <div className="landing-stat">
                <div className="portal-meta">Primary flow</div>
                <div className="landing-stat-value">Research</div>
                <div className="portal-mini">Notes, operations, evidence, review</div>
              </div>
              <div className="landing-stat">
                <div className="portal-meta">Theme</div>
                <div className="landing-stat-value">Unified</div>
                <div className="portal-mini">React entry pages with shared styling</div>
              </div>
            </div>
          </div>

          <div className="portal-panel landing-terminal">
            <div className="landing-terminal-head">
              <div className="landing-leds">
                <span className="landing-led hot"></span>
                <span className="landing-led warn"></span>
                <span className="landing-led good"></span>
              </div>
              <div className="portal-mini">node / research-gateway / status</div>
            </div>
            <div className="landing-terminal-body">
              <div className="landing-terminal-line"><strong>status</strong> operational</div>
              <div className="landing-terminal-line"><strong>workspace</strong> internal wiki, operations, vault, review, search</div>
              <div className="landing-terminal-line"><strong>publication</strong> public wiki exposed through reviewed exports only</div>
              <div className="landing-terminal-line"><strong>design</strong> unified red-dark research console replacing the old mixed visual language</div>
              <div className="landing-terminal-line"><strong>entrypoints</strong> login for internal portal, research feed for public readers</div>
            </div>
          </div>
        </section>

        <section className="landing-grid">
          ${modules.map((item) => html`
            <article key=${item.title} className="portal-panel landing-card">
              <div className="portal-kicker">Primary route</div>
              <div className="landing-card-title">${item.title}</div>
              <div className="landing-card-copy">${item.copy}</div>
              <div className="landing-card-actions">
                <a className="portal-button primary" href=${item.href}>${item.cta}</a>
              </div>
            </article>
          `)}
        </section>

        <section className="landing-bands">
          ${pillars.map((item) => html`
            <article key=${item.title} className="portal-panel landing-band">
              <div className="portal-chip">${item.title}</div>
              <div className="landing-band-copy">${item.copy}</div>
            </article>
          `)}
        </section>
      </main>
    </div>
  `;
}

createRoot(document.getElementById('app-root')).render(html`<${LandingApp} />`);
