import { lazy, ComponentType } from 'react';

/**
 * Wrapper de React.lazy que detecta falhas ao buscar chunks dinâmicos
 * (geralmente causadas por novos deploys que invalidam hashes de chunks antigos
 * ainda em cache no navegador / service worker) e força um único reload.
 *
 * Usa sessionStorage para evitar loops infinitos de reload.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const RELOAD_KEY = 'lovable:chunk-reload';
    try {
      return await factory();
    } catch (err: any) {
      const message = String(err?.message || err);
      const isChunkError =
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('Importing a module script failed') ||
        message.includes('error loading dynamically imported module') ||
        message.includes('Loading chunk') ||
        message.includes('Loading CSS chunk');

      if (isChunkError) {
        const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY);
        if (!alreadyReloaded) {
          sessionStorage.setItem(RELOAD_KEY, '1');
          // Tenta limpar SW caches antes de reload
          try {
            if ('caches' in window) {
              const keys = await caches.keys();
              await Promise.all(keys.map((k) => caches.delete(k)));
            }
            if ('serviceWorker' in navigator) {
              const regs = await navigator.serviceWorker.getRegistrations();
              await Promise.all(regs.map((r) => r.unregister()));
            }
          } catch {
            // ignore
          }
          window.location.reload();
          // Retorna uma Promise pendente para suspender enquanto recarrega
          return new Promise<{ default: T }>(() => {});
        }
      }
      throw err;
    }
  });
}

// Limpa flag de reload após carregamento bem-sucedido (chamado uma vez no app)
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    sessionStorage.removeItem('lovable:chunk-reload');
  });
}
