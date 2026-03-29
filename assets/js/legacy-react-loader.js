const LEGACY_VERSION = 'legacy-react-2';

export function loadLegacyScript(src, { dispatchPartialsLoaded = false } = {}) {
  const normalized = src.includes('?') ? `${src}&v=${LEGACY_VERSION}` : `${src}?v=${LEGACY_VERSION}`;
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-legacy-src="${normalized}"]`);
    if (existing) {
      if (dispatchPartialsLoaded) {
        window.dispatchEvent(new Event('partials:loaded'));
      }
      resolve(existing);
      return;
    }

    const script = document.createElement('script');
    script.src = normalized;
    script.defer = true;
    script.dataset.legacySrc = normalized;
    script.onload = () => {
      if (dispatchPartialsLoaded) {
        window.dispatchEvent(new Event('partials:loaded'));
      }
      resolve(script);
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
}
