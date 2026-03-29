import React from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import htm from 'https://esm.sh/htm@3.1.1';

const html = htm.bind(React.createElement);

function App() {
  const template = document.getElementById('profile-markup');
  const markup = template ? template.innerHTML : '';
  return html`<div dangerouslySetInnerHTML=${{ __html: markup }}></div>`;
}

createRoot(document.getElementById('app-root')).render(html`<${App} />`);
