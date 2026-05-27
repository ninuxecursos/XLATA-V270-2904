import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const cleanupPreviewServiceWorkers = () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const isPreviewHost =
    window.location.hostname.includes('id-preview--') ||
    window.location.hostname.includes('lovableproject.com');

  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  if (!isPreviewHost && !isInIframe) return;

  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
};

const clearBrowserCaches = async () => {
  if (typeof window === 'undefined') return;

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  } catch {
    // ignore cleanup failures; the app should still attempt to render
  }
};

const importAppWithRecovery = async () => {
  const RELOAD_KEY = 'lovable:bootstrap-reload';

  try {
    return await import('./App.tsx');
  } catch (error: any) {
    const message = String(error?.message || error);
    const isImportError =
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Importing a module script failed') ||
      message.includes('error loading dynamically imported module') ||
      message.includes('Loading chunk');

    if (isImportError && sessionStorage.getItem(RELOAD_KEY) !== '1') {
      sessionStorage.setItem(RELOAD_KEY, '1');
      await clearBrowserCaches();
      window.location.reload();
      return new Promise<typeof import('./App.tsx')>(() => {});
    }

    throw error;
  }
};

const isOfflineBuild = (import.meta as any).env?.VITE_OFFLINE_BUILD === 'true';

const initializeApp = async () => {
  cleanupPreviewServiceWorkers();

  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Root container not found');
  }

  const root = createRoot(container);

  if (isOfflineBuild) {
    // Build offline standalone: gate de licenca + roteador enxuto (sem login, sem landing)
    const { OfflineLicenseProvider } = await import('./contexts/OfflineLicenseContext');
    const { OfflineLicenseGate } = await import('./components/OfflineLicenseGate');
    const { default: AppOffline } = await import('./AppOffline');
    root.render(
      <OfflineLicenseProvider>
        <OfflineLicenseGate>
          <AppOffline />
        </OfflineLicenseGate>
      </OfflineLicenseProvider>
    );
  } else {
    const { default: App } = await importAppWithRecovery();
    root.render(<App />);
  }

  if (import.meta.env.DEV) {
    console.log('✅ App initialized successfully', isOfflineBuild ? '(OFFLINE BUILD)' : '');
  }
  sessionStorage.removeItem('lovable:bootstrap-reload');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
