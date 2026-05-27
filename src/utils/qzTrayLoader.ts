/**
 * Utilitário para carregar QZ-Tray dinamicamente
 * Evita carregar o script na landing page, melhorando performance
 */

declare global {
  interface Window {
    qz: any;
  }
}

let qzLoadPromise: Promise<void> | null = null;

export const loadQzTray = async (): Promise<void> => {
  // Se já está carregado, retorna
  if (window.qz) {
    return;
  }

  // Se já está carregando, aguarda
  if (qzLoadPromise) {
    return qzLoadPromise;
  }

  // Carrega o script dinamicamente
  qzLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qz-tray/qz-tray.js';
    script.async = true;
    
    script.onload = () => {
      console.log('✅ QZ-Tray carregado com sucesso');
      resolve();
    };
    
    script.onerror = () => {
      console.error('❌ Erro ao carregar QZ-Tray');
      qzLoadPromise = null;
      reject(new Error('Falha ao carregar QZ-Tray'));
    };

    document.head.appendChild(script);
  });

  return qzLoadPromise;
};

export const isQzTrayLoaded = (): boolean => {
  return !!window.qz;
};
