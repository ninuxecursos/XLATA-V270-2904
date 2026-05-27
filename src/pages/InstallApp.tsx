import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  Share, 
  Plus, 
  CheckCircle2,
  ArrowRight,
  Zap,
  Wifi,
  Bell,
  LayoutDashboard,
  ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallApp() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const android = /Android/.test(navigator.userAgent);
    setIsIOS(iOS);
    setIsAndroid(android);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Install failed:', error);
    }
  };

  const benefits = [
    { icon: Zap, title: 'Acesso Instantâneo', description: 'Direto da sua tela inicial' },
    { icon: Wifi, title: 'Funciona Offline', description: 'Use mesmo sem internet' },
    { icon: Bell, title: 'Notificações', description: 'Fique sempre atualizado' },
  ];

  // Already installed - show choice between System and Shop
  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Bem-vindo ao XLata
        </h1>
        <p className="text-muted-foreground max-w-sm mb-8">
          Escolha onde deseja ir:
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button 
            size="lg"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-14 text-base"
            onClick={() => navigate('/dashboard')}
          >
            <LayoutDashboard className="w-5 h-5 mr-2" />
            Acessar Sistema
          </Button>
          <Button 
            size="lg"
            variant="outline"
            className="w-full border-primary text-primary hover:bg-primary/10 h-14 text-base"
            onClick={() => navigate('/shop')}
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Acessar Loja
          </Button>
        </div>
      </div>
    );
  }

  // Just installed
  if (installed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Pronto!
        </h1>
        <p className="text-muted-foreground max-w-sm mb-6">
          O XLata foi adicionado à sua tela inicial. Agora é só acessar!
        </p>
        <Button variant="native" size="native-lg" onClick={() => window.close()}>
          Fechar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-native-lg">
          <Smartphone className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Instale o App XLata
        </h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Transforme o XLata em um aplicativo nativo no seu celular
        </p>
      </div>

      {/* Benefits */}
      <div className="grid gap-3 mb-8">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <Card key={index} variant="native" className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Install Instructions */}
      <Card variant="native-elevated" className="p-5 mb-6">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          Como Instalar
        </h2>

        {/* Android with prompt */}
        {deferredPrompt && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Clique no botão abaixo para instalar o aplicativo:
            </p>
            <Button 
              variant="native" 
              size="native-lg" 
              className="w-full"
              onClick={handleInstall}
            >
              <Download className="w-5 h-5 mr-2" />
              Instalar XLata
            </Button>
          </div>
        )}

        {/* iOS Instructions */}
        {isIOS && !deferredPrompt && (
          <ol className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-sm font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Toque no botão Compartilhar</p>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Share className="w-5 h-5" />
                  <span>Na barra inferior do Safari</span>
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-sm font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Adicionar à Tela Inicial</p>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Plus className="w-5 h-5" />
                  <span>Role e toque nesta opção</span>
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-sm font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Confirme a instalação</p>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <ArrowRight className="w-5 h-5" />
                  <span>Toque em "Adicionar" no canto superior</span>
                </div>
              </div>
            </li>
          </ol>
        )}

        {/* Android without prompt */}
        {isAndroid && !deferredPrompt && (
          <ol className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-sm font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Abra o menu do navegador</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Toque nos 3 pontinhos no canto superior
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-sm font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Instalar aplicativo</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ou "Adicionar à tela inicial"
                </p>
              </div>
            </li>
          </ol>
        )}

        {/* Desktop */}
        {!isIOS && !isAndroid && !deferredPrompt && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Para instalar, use o menu do navegador e selecione "Instalar aplicativo" ou visite esta página no seu celular.
            </p>
          </div>
        )}
      </Card>

      {/* Skip link */}
      <div className="text-center">
        <button 
          onClick={() => window.history.back()}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Continuar no navegador
        </button>
      </div>
    </div>
  );
}
