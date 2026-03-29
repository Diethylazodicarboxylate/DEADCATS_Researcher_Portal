import React, { useEffect, useState } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import htm from 'https://esm.sh/htm@3.1.1';
import { appPath, navigate } from './react-portal-utils.js';

const html = htm.bind(React.createElement);
const API = '';

function LoginApp() {
  const [tab, setTab] = useState('login');
  const [login, setLogin] = useState({ handle: '', password: '' });
  const [register, setRegister] = useState({ handle: '', password: '', confirm: '', token: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/auth/me`, { credentials: 'include', cache: 'no-store' })
      .then((res) => {
        if (res.ok) navigate('dashboard.html', { replace: true });
      })
      .catch(() => {});
  }, []);

  async function submitLogin(event) {
    event?.preventDefault();
    if (!login.handle.trim() || !login.password) {
      setError('Handle and passphrase are required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: login.handle.trim(), password: login.password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || 'Authentication failed.');
        setBusy(false);
        return;
      }
      localStorage.removeItem('dc_token');
      localStorage.setItem('dc_user', JSON.stringify(data.user));
      navigate('dashboard.html');
    } catch (_) {
      setError('Cannot reach server. Check the portal connection and try again.');
      setBusy(false);
    }
  }

  async function submitRegister(event) {
    event?.preventDefault();
    if (!register.handle.trim() || !register.password || !register.confirm || !register.token.trim()) {
      setError('All registration fields are required.');
      return;
    }
    if (register.password !== register.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (register.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle: register.handle.trim(),
          password: register.password,
          access_token: register.token.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || 'Registration failed.');
        setBusy(false);
        return;
      }
      localStorage.setItem('dc_user', JSON.stringify(data.user));
      navigate('dashboard.html');
    } catch (_) {
      setError('Cannot reach server. Registration could not be completed.');
      setBusy(false);
    }
  }

  function switchTab(nextTab) {
    setTab(nextTab);
    setError('');
  }

  const isLogin = tab === 'login';

  return html`
    <div className="portal-shell">
      <header className="portal-topbar">
        <a className="portal-brand" href=${appPath('index.html')}>
          <div className="portal-mark"></div>
          <div className="portal-brand-copy">
            <div className="portal-kicker">DEADCATS Authentication</div>
            <div className="portal-brand-title">Secure entry</div>
          </div>
        </a>
        <nav className="portal-nav">
          <a className="portal-nav-link" href=${appPath('index.html')}>Home</a>
          <a className="portal-nav-link" href=${appPath('research-feed.html')}>Public Wiki</a>
        </nav>
      </header>

      <main className="portal-main">
        <section className="login-shell">
          <div className="portal-panel login-info">
            <div className="portal-chip hot">Restricted access</div>
            <h1 className="login-title">Authenticate into the internal research workspace.</h1>
            <div className="login-copy">
              The old login page was visually abrasive and overloaded with decorative chrome. This rewrite keeps the same security posture, but presents the flow as a cleaner operator entry panel aligned with the new dashboard and landing pages.
            </div>
            <div className="login-points">
              <div className="login-point">
                <div className="login-point-title">Internal-first access</div>
                <div className="login-point-copy">Login drops you into the private research environment. The public wiki remains separately reachable from the landing page.</div>
              </div>
              <div className="login-point">
                <div className="login-point-title">Registration still enforced by token</div>
                <div className="login-point-copy">If self-registration is disabled or the token is invalid, the backend will block the request. The UI stays aligned with that policy instead of pretending otherwise.</div>
              </div>
              <div className="login-point">
                <div className="login-point-title">Unified visual system</div>
                <div className="login-point-copy">Same typography, same button language, same red-dark palette, and the same React stack as the new dashboard entry pages.</div>
              </div>
            </div>
          </div>

          <div className="portal-panel login-card">
            <div className="portal-kicker">Access Control</div>
            <div className="portal-brand-title">${isLogin ? 'Login to portal' : 'Register a researcher account'}</div>
            <div className="portal-mini">Use your internal handle and credentials. Successful auth redirects directly to the dashboard.</div>

            <div className="login-tabs">
              <button className=${`portal-button ${isLogin ? 'primary' : 'ghost'} login-tab`} onClick=${() => switchTab('login')}>Login</button>
              <button className=${`portal-button ${!isLogin ? 'primary' : 'ghost'} login-tab`} onClick=${() => switchTab('register')}>Register</button>
            </div>

            ${error ? html`<div className="portal-error">${error}</div>` : null}

            ${isLogin ? html`
              <form className="login-form" onSubmit=${submitLogin}>
                <div>
                  <label className="portal-label">Handle</label>
                  <input className="portal-input" value=${login.handle} onInput=${(event) => setLogin((value) => ({ ...value, handle: event.target.value }))} placeholder="your_handle" autoComplete="username" />
                </div>
                <div>
                  <label className="portal-label">Passphrase</label>
                  <input className="portal-input" type="password" value=${login.password} onInput=${(event) => setLogin((value) => ({ ...value, password: event.target.value }))} placeholder="••••••••••••••••" autoComplete="current-password" />
                </div>
                <button className="portal-button primary" type="submit" disabled=${busy}>${busy ? 'Authenticating...' : 'Authenticate'}</button>
              </form>
            ` : html`
              <form className="login-form" onSubmit=${submitRegister}>
                <div className="login-form-grid">
                  <div>
                    <label className="portal-label">Handle</label>
                    <input className="portal-input" value=${register.handle} onInput=${(event) => setRegister((value) => ({ ...value, handle: event.target.value }))} placeholder="your_handle" autoComplete="username" />
                  </div>
                  <div>
                    <label className="portal-label">Access token</label>
                    <input className="portal-input" type="password" value=${register.token} onInput=${(event) => setRegister((value) => ({ ...value, token: event.target.value }))} placeholder="provided by admin" />
                  </div>
                </div>
                <div className="login-form-grid">
                  <div>
                    <label className="portal-label">Password</label>
                    <input className="portal-input" type="password" value=${register.password} onInput=${(event) => setRegister((value) => ({ ...value, password: event.target.value }))} placeholder="minimum 8 characters" autoComplete="new-password" />
                  </div>
                  <div>
                    <label className="portal-label">Confirm password</label>
                    <input className="portal-input" type="password" value=${register.confirm} onInput=${(event) => setRegister((value) => ({ ...value, confirm: event.target.value }))} placeholder="repeat password" autoComplete="new-password" />
                  </div>
                </div>
                <button className="portal-button primary" type="submit" disabled=${busy}>${busy ? 'Registering...' : 'Create account'}</button>
              </form>
            `}

            <div className="login-footer">
              <span>Portal route: private workspace</span>
              <span>Public route: research-feed.html</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  `;
}

createRoot(document.getElementById('app-root')).render(html`<${LoginApp} />`);
