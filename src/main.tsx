// Ensure window.fetch is writable and has setter to prevent extension/executor errors
if (typeof window !== 'undefined') {
  try {
    let currentFetch = window.fetch;
    const patch = {
      configurable: true,
      enumerable: true,
      get: () => currentFetch,
      set: (fn: any) => {
        currentFetch = fn;
      },
    };
    try {
      Object.defineProperty(window, 'fetch', patch);
    } catch (_) {}
    if (typeof Window !== 'undefined' && Window.prototype) {
      try {
        Object.defineProperty(Window.prototype, 'fetch', patch);
      } catch (_) {}
    }
  } catch (_) {}
}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
