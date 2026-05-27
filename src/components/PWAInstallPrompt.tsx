import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const PWA_PROMPT_DISMISSED_KEY = 'pwa_install_prompt_dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const { user, loading } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Só mostra prompt para usuários logados
    if (loading || !user) {
      setShowPrompt(false);
      return;
    }

    // Verificar se usuário já dispensou permanentemente
    const wasPermanentlyDismissed = localStorage.getItem(PWA_PROMPT_DISMISSED_KEY) === 'true';
    if (wasPermanentlyDismissed) {
      setDismissed(true);
      return;
    }

    // Verifica se já está instalado como PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return; // Já está instalado, não mostra nada
    }

    // Detecta iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Detecta se é mobile ou tablet
    const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 1024;

    if (!isMobileOrTablet) {
      return; // Só mostra em mobile/tablet
    }

    // Para Android - captura o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Para iOS - mostra instruções após delay
    if (isIOSDevice) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [user, loading]);

  // Se não estiver logado, não renderiza nada
  if (!user) {
    return null;
  }

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android - usa o prompt nativo
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowPrompt(false);
        setDeferredPrompt(null);
      }
    }
  };

  const handleDismiss = (permanent: boolean = false) => {
    if (permanent) {
      localStorage.setItem(PWA_PROMPT_DISMISSED_KEY, 'true');
    }
    setDismissed(true);
    setShowPrompt(false);
  };

  if (!showPrompt || dismissed) {
    return null;
  }

  // Banner inline (não fixed) - empurra conteúdo para baixo
  return (
    <div className="w-full bg-emerald-900/90 border-b border-emerald-700/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-3 py-2">
        {isIOS ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Download className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span className="text-xs text-gray-200 truncate">
                <strong className="text-white">Compartilhar</strong> → <strong className="text-white">Adicionar à Tela</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button 
                onClick={() => handleDismiss(true)}
                className="text-[10px] text-emerald-300/70 hover:text-emerald-200 underline whitespace-nowrap"
              >
                Não mostrar
              </button>
              <button 
                onClick={() => handleDismiss(false)} 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Fechar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Download className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span className="text-xs text-gray-200">Instale o app para acesso rápido</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={handleInstall}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1 h-7"
              >
                Instalar
              </Button>
              <button 
                onClick={() => handleDismiss(true)}
                className="text-[10px] text-emerald-300/70 hover:text-emerald-200 underline whitespace-nowrap"
              >
                Não mostrar
              </button>
              <button 
                onClick={() => handleDismiss(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Fechar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook para usar em outros componentes
export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setCanInstall(false);
      return;
    }

    const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 1024;

    if (!isMobileOrTablet) {
      setCanInstall(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setCanInstall(false);
        setDeferredPrompt(null);
      }
      return outcome === 'accepted';
    }
    return false;
  };

  return { canInstall, promptInstall };
}
