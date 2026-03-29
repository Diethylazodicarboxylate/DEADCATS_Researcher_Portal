export function loadLegacyScript(src, { dispatchPartialsLoaded = false } = {}) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-legacy-src="${src}"]`);
    if (existing) {
      if (dispatchPartialsLoaded) {
        window.dispatchEvent(new Event('partials:loaded'));
      }
      resolve(existing);
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.dataset.legacySrc = src;
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
