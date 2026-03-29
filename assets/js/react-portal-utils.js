import React, { useEffect, useState } from 'https://esm.sh/react@18.3.1';

export const API = '';
export const RANK_COLORS = {
  DEADCAT: '#6b7280',
  Scholar: '#ff7b54',
  'Lead Researcher': '#ff4d6d',
  'Founding Circle': '#ffb36b',
};

export function appPath(path = '') {
  const clean = String(path || '').replace(/^\/+/, '');
  return `/${clean}`;
}

export function navigate(path, { replace = false } = {}) {
  const target = appPath(path);
  if (replace) {
    window.location.replace(target);
    return;
  }
  window.location.assign(target);
}

export function readCachedUser() {
  try {
    const raw = localStorage.getItem('dc_user');
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    localStorage.removeItem('dc_user');
    return null;
  }
}

export async function fetchMeWithRetry() {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch(`${API}/api/auth/me`, { credentials: 'include', cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (_) {}
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  return null;
}

export function usePortalAuth() {
  const [user, setUser] = useState(readCachedUser());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const liveUser = await fetchMeWithRetry();
      if (!active) return;
      if (liveUser) {
        localStorage.setItem('dc_user', JSON.stringify(liveUser));
        setUser(liveUser);
        setReady(true);
        return;
      }
      if (!readCachedUser()) {
        localStorage.removeItem('dc_token');
        localStorage.removeItem('dc_user');
        navigate('login.html', { replace: true });
        return;
      }
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { user, setUser, ready };
}

export async function authFetch(url, opts = {}, setUser = null) {
  let response = await fetch(`${API}${url}`, {
    ...opts,
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  if (response.status === 401) {
    const refreshed = await fetchMeWithRetry();
    if (refreshed) {
      if (setUser) setUser(refreshed);
      localStorage.setItem('dc_user', JSON.stringify(refreshed));
      response = await fetch(`${API}${url}`, {
        ...opts,
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      });
    }
    if (response.status === 401) {
      localStorage.removeItem('dc_token');
      localStorage.removeItem('dc_user');
      navigate('login.html', { replace: true });
    }
  }
  return response;
}

export function timeAgo(value) {
  if (!value) return 'just now';
  const seconds = (Date.now() - new Date(value).getTime()) / 1000;
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function label(value) {
  return String(value || '').replace(/_/g, ' ');
}

export function initialsFromHandle(handle) {
  const clean = String(handle || 'dc').replace(/[^a-z0-9]/gi, '');
  return clean.slice(0, 2).toUpperCase() || 'DC';
}

export function truncate(value, limit = 180) {
  const text = String(value || '');
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}...`;
}

export function formatDate(value) {
  if (!value) return 'schedule tba';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}
