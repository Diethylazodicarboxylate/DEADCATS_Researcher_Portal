import React, { useEffect } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import htm from 'https://esm.sh/htm@3.1.1';
import { loadLegacyScript } from './legacy-react-loader.js';

const html = htm.bind(React.createElement);

const markup = `
<div class="bg"></div>
<div class="jp-bg">死猫</div>

<div class="corner tl"></div>
<div class="corner tr"></div>
<div class="corner bl"></div>
<div class="corner br"></div>

<div class="strip top">DEADCATS RESEARCH NETWORK // RESTRICTED ACCESS // TAILSCALE MESH ONLY</div>
<div class="strip bottom">
  <span>NODE <span>DC-RESEARCH-01</span></span>
  <span>ENC <span>WIREGUARD/E2E</span></span>
  <span>STATUS <span>OPERATIONAL</span></span>
</div>

<div class="card">
  <div class="card-header">
    <div class="logo-mark">
      <svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="10" height="10" fill="#e8001e" opacity="0.8"></rect>
        <rect x="15" y="1" width="10" height="10" stroke="#e8001e" stroke-width="1" opacity="0.35"></rect>
        <rect x="1" y="15" width="10" height="10" stroke="#e8001e" stroke-width="1" opacity="0.35"></rect>
        <rect x="15" y="15" width="10" height="10" fill="#e8001e" opacity="0.15"></rect>
        <line x1="0" y1="13" x2="26" y2="13" stroke="#1a2030" stroke-width="0.5"></line>
        <line x1="13" y1="0" x2="13" y2="26" stroke="#1a2030" stroke-width="0.5"></line>
      </svg>
    </div>
    <div class="card-title">DEAD<span>CATS</span></div>
    <div class="card-subtitle">Researcher Portal // Authentication</div>
    <div class="auth-status">
      <div class="status-dot"></div>
      SECURE CHANNEL ACTIVE
    </div>
  </div>

  <div class="auth-tabs">
    <button class="auth-tab active" id="tab-login" onclick="switchTab('login')">Login</button>
    <button class="auth-tab" id="tab-register" onclick="switchTab('register')">Register</button>
  </div>

  <div class="card-body" id="form-login">
    <div class="error-msg" id="errMsg">⚠ Invalid credentials. Access denied.</div>
    <div class="form-group">
      <label class="form-label">Handle <span>*</span></label>
      <div class="input-wrap">
        <span class="input-ico">❯</span>
        <input class="form-input" type="text" id="handle" placeholder="your_handle" autocomplete="off" spellcheck="false">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Passphrase <span>*</span></label>
      <div class="input-wrap">
        <span class="input-ico">◈</span>
        <input class="form-input" type="password" id="pass" placeholder="••••••••••••••••">
      </div>
    </div>
    <button class="btn-submit" id="submitBtn" onclick="handleLogin()">Authenticate →</button>
  </div>

  <div class="card-body hidden" id="form-register">
    <div class="error-msg" id="regErrMsg">⚠ Registration failed.</div>
    <div class="form-group">
      <label class="form-label">Handle <span>*</span></label>
      <div class="input-wrap">
        <span class="input-ico">❯</span>
        <input class="form-input" type="text" id="reg-handle" placeholder="your_handle" autocomplete="off" spellcheck="false">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Password <span>*</span></label>
      <div class="input-wrap">
        <span class="input-ico">◈</span>
        <input class="form-input" type="password" id="reg-pass" placeholder="••••••••••••••••">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Confirm Password <span>*</span></label>
      <div class="input-wrap">
        <span class="input-ico">◈</span>
        <input class="form-input" type="password" id="reg-pass2" placeholder="••••••••••••••••">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Access Token <span>*</span></label>
      <div class="input-wrap">
        <span class="input-ico">🔑</span>
        <input class="form-input" type="password" id="reg-token" placeholder="provided by admin">
      </div>
    </div>
    <button class="btn-submit" id="regBtn" onclick="handleRegister()">Request Access →</button>
  </div>

  <div class="card-footer">
    <span class="footer-note">No token? <a href="#">Contact admin</a></span>
    <span class="footer-version">v1.0.0</span>
  </div>
</div>
`;

function App() {
  useEffect(() => {
    loadLegacyScript('/assets/js/login.js');
  }, []);

  return html`<div dangerouslySetInnerHTML=${{ __html: markup }}></div>`;
}

createRoot(document.getElementById('app-root')).render(html`<${App} />`);
