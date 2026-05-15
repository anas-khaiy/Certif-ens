import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Polyfill for crypto.randomUUID in non-secure (HTTP) contexts
if (typeof window !== 'undefined' && window.crypto && !window.crypto.randomUUID) {
  (window.crypto as any).randomUUID = function() {
    return (([1e7] as any) + -1e3 + -4e3 + -8e3 + -11e11).toString().replace(/[018]/g, (c: any) =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  };
}
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
