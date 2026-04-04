import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

// Global error handler for mounting failures
window.onerror = (message, source, lineno, colno, error) => {
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `
      <div style="min-height: 100vh; background: #f9fafb; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: sans-serif;">
        <div style="max-width: 400px; width: 100%; background: white; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); padding: 32px; border: 1px solid #f3f4f6; text-align: center;">
          <div style="width: 64px; height: 64px; background: #fee2e2; color: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h2 style="font-size: 24px; font-weight: 800; color: #111827; margin-bottom: 8px;">Critical Error</h2>
          <p style="color: #4b5563; margin-bottom: 24px; font-size: 14px; line-height: 1.5;">The application failed to start. This is usually caused by a missing configuration or an unauthorized domain.</p>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 12px; font-family: monospace; font-size: 12px; color: #ef4444; word-break: break-all; margin-bottom: 24px;">
            ${message}
          </div>
          <button onclick="window.location.reload()" style="width: 100%; background: #059669; color: white; border: none; padding: 12px; border-radius: 12px; font-weight: 700; cursor: pointer;">Reload App</button>
        </div>
      </div>
    `;
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
