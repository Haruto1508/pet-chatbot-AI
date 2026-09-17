import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './index.css';

// Handle Vite dynamic chunk import preload errors globally (e.g. after a new Vercel deployment)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error detected, reloading to fetch latest bundle...', event);
  const reloaded = sessionStorage.getItem('vite_preload_reloaded');
  if (!reloaded) {
    sessionStorage.setItem('vite_preload_reloaded', 'true');
    window.location.reload();
  }
});

// Clear preload flag on successful entry load
sessionStorage.removeItem('vite_preload_reloaded');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
