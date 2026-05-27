 import React, { useState, useEffect } from 'react';
 import { X, Download, Smartphone, Share } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Card } from '@/components/ui/card';
 import { cn } from '@/lib/utils';
 
 interface BeforeInstallPromptEvent extends Event {
   prompt: () => Promise<void>;
   userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
 }
 
 interface InstallPromptProps {
   className?: string;
   variant?: 'banner' | 'modal' | 'inline';
   onInstalled?: () => void;
   onDismissed?: () => void;
 }
 
 export function InstallPrompt({ 
   className, 
   variant = 'banner',
   onInstalled,
   onDismissed 
 }: InstallPromptProps) {
   const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
   const [isVisible, setIsVisible] = useState(false);
   const [isIOS, setIsIOS] = useState(false);
   const [isStandalone, setIsStandalone] = useState(false);
   const [dismissed, setDismissed] = useState(false);
 
   useEffect(() => {
     // Check if already installed as PWA
     const standalone = window.matchMedia('(display-mode: standalone)').matches;
     setIsStandalone(standalone);
     
     if (standalone) return;
 
     // Check if already dismissed
     const wasDismissed = localStorage.getItem('pwa-install-dismissed');
     const dismissedDate = wasDismissed ? new Date(wasDismissed) : null;
     const daysSinceDismissed = dismissedDate 
       ? (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24) 
       : Infinity;
     
     // Show again after 7 days
     if (daysSinceDismissed < 7) {
       setDismissed(true);
       return;
     }
 
     // Detect iOS
     const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
     setIsIOS(iOS);
 
     // Show for iOS after delay
     if (iOS) {
       const timer = setTimeout(() => setIsVisible(true), 3000);
       return () => clearTimeout(timer);
     }
 
     // Listen for beforeinstallprompt on Android/Desktop
     const handleBeforeInstall = (e: Event) => {
       e.preventDefault();
       setDeferredPrompt(e as BeforeInstallPromptEvent);
       setTimeout(() => setIsVisible(true), 2000);
     };
 
     window.addEventListener('beforeinstallprompt', handleBeforeInstall);
 
     return () => {
       window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
     };
   }, []);
 
   const handleInstall = async () => {
     if (!deferredPrompt) return;
 
     try {
       await deferredPrompt.prompt();
       const { outcome } = await deferredPrompt.userChoice;
       
       if (outcome === 'accepted') {
         onInstalled?.();
       }
       
       setDeferredPrompt(null);
       setIsVisible(false);
     } catch (error) {
       console.error('Install prompt failed:', error);
     }
   };
 
   const handleDismiss = () => {
     localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
     setIsVisible(false);
     setDismissed(true);
     onDismissed?.();
   };
 
   // Don't render if already installed, dismissed, or not ready
   if (isStandalone || dismissed || !isVisible) return null;
 
   // iOS Instructions
   if (isIOS) {
     return (
       <div className={cn(
         "fixed z-50 animate-slide-in-bottom",
         variant === 'banner' ? "bottom-0 left-0 right-0 p-4 safe-area-bottom" : "",
         variant === 'modal' ? "inset-0 flex items-end justify-center p-4" : "",
         className
       )}>
         {variant === 'modal' && (
           <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleDismiss} />
         )}
         <Card variant="native-elevated" className="relative z-10 p-5 max-w-md mx-auto w-full">
           <button
             onClick={handleDismiss}
             className="absolute right-3 top-3 p-2 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-native"
           >
             <X className="w-4 h-4" />
           </button>
           
           <div className="flex items-start gap-4">
             <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
               <Smartphone className="w-7 h-7 text-primary" />
             </div>
             
             <div className="flex-1 min-w-0">
               <h3 className="text-lg font-semibold text-foreground mb-1">
                 Instale o App XLata
               </h3>
               <p className="text-sm text-muted-foreground mb-4">
                 Acesse direto da sua tela inicial, como um app nativo!
               </p>
               
               <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-xl p-3">
                 <Share className="w-5 h-5 text-primary shrink-0" />
                 <span>
                   Toque em <strong className="text-foreground">Compartilhar</strong> e depois em <strong className="text-foreground">Adicionar à Tela Inicial</strong>
                 </span>
               </div>
             </div>
           </div>
         </Card>
       </div>
     );
   }
 
   // Android/Desktop with install prompt
   if (deferredPrompt) {
     return (
       <div className={cn(
         "fixed z-50 animate-slide-in-bottom",
         variant === 'banner' ? "bottom-0 left-0 right-0 p-4 safe-area-bottom" : "",
         variant === 'modal' ? "inset-0 flex items-end justify-center p-4" : "",
         className
       )}>
         {variant === 'modal' && (
           <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleDismiss} />
         )}
         <Card variant="native-elevated" className="relative z-10 p-5 max-w-md mx-auto w-full">
           <button
             onClick={handleDismiss}
             className="absolute right-3 top-3 p-2 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-native"
           >
             <X className="w-4 h-4" />
           </button>
           
           <div className="flex items-start gap-4">
             <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
               <Download className="w-7 h-7 text-primary" />
             </div>
             
             <div className="flex-1 min-w-0">
               <h3 className="text-lg font-semibold text-foreground mb-1">
                 Instale o App XLata
               </h3>
               <p className="text-sm text-muted-foreground mb-4">
                 Acesso rápido, funciona offline e direto da sua tela inicial!
               </p>
               
               <div className="flex items-center gap-2">
                 <Button 
                   variant="native" 
                   size="native-md"
                   onClick={handleInstall}
                   className="flex-1"
                 >
                   <Download className="w-4 h-4 mr-1.5" />
                   Instalar Agora
                 </Button>
                 <Button 
                   variant="native-ghost" 
                   size="native-md"
                   onClick={handleDismiss}
                 >
                   Depois
                 </Button>
               </div>
             </div>
           </div>
         </Card>
       </div>
     );
   }
 
   return null;
 }
 
 export default InstallPrompt;